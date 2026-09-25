// Copyright (c) 2026 WSO2 LLC. (https://www.wso2.com).
//
// WSO2 LLC. licenses this file to you under the Apache License,
// Version 2.0 (the "License"); you may not use this file except
// in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied.  See the License for the
// specific language governing permissions and limitations
// under the License.

package handler

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"reflect"
	"strings"
	"testing"

	"github.com/wso2-open-operations/cs-tools/apps/customer-portal/backend-v2/internal/apierror"
	"github.com/wso2-open-operations/cs-tools/apps/customer-portal/backend-v2/internal/dto"
	"github.com/wso2-open-operations/cs-tools/apps/customer-portal/backend-v2/internal/entity"
	"github.com/wso2-open-operations/cs-tools/apps/customer-portal/backend-v2/internal/middleware"
	"github.com/wso2-open-operations/cs-tools/apps/customer-portal/backend-v2/internal/usermanagement"
)

const (
	testProjectUUID = "11111111-2222-3333-4444-555555555555"
	testProjectSfID = "a0Pxx0000000001"
	testInvitee     = "shayan+e2e1@wso2.com"
)

// fakeProjectResolver records whether the pre-cutover path looked up the
// project's Salesforce Id. The entity-service path must never need it.
type fakeProjectResolver struct{ calls int }

func (f *fakeProjectResolver) GetProject(context.Context, string) (entity.ProjectDetailsView, error) {
	f.calls++
	return entity.ProjectDetailsView{ID: testProjectUUID, SfID: testProjectSfID}, nil
}

// fakeLegacyContacts is the pre-cutover onboarding service. It records every
// write so a test can assert the flag kept traffic away from it.
type fakeLegacyContacts struct {
	calls     []string
	projectID string
}

func (f *fakeLegacyContacts) GetProjectContacts(context.Context, string) ([]usermanagement.Contact, error) {
	return nil, nil
}

func (f *fakeLegacyContacts) CreateProjectContact(_ context.Context, projectID string, _ usermanagement.OnBoardContactPayload) (usermanagement.Membership, error) {
	f.calls = append(f.calls, "create")
	f.projectID = projectID
	return usermanagement.Membership{}, nil
}

func (f *fakeLegacyContacts) RemoveProjectContact(_ context.Context, projectID, _, _ string) (usermanagement.Membership, error) {
	f.calls = append(f.calls, "remove")
	f.projectID = projectID
	return usermanagement.Membership{}, nil
}

func (f *fakeLegacyContacts) UpdateMembershipRole(_ context.Context, projectID, _ string, _ usermanagement.MembershipRolePayload) (usermanagement.Membership, error) {
	f.calls = append(f.calls, "update")
	f.projectID = projectID
	return usermanagement.Membership{}, nil
}

func (f *fakeLegacyContacts) ValidateProjectContact(context.Context, usermanagement.ValidationPayload) (*usermanagement.Contact, bool, error) {
	return nil, false, nil
}

// fakeMemberships is entity-service's side. err, when set, is returned from
// every call so the upstream-error mapping can be exercised.
type fakeMemberships struct {
	calls     []string
	projectID string
	email     string
	create    entity.CreateProjectMembershipRequest
	update    entity.UpdateProjectMembershipRolesRequest
	result    entity.ProjectMembership
	err       error
}

func (f *fakeMemberships) CreateProjectMembership(_ context.Context, projectID string, req entity.CreateProjectMembershipRequest) (entity.ProjectMembership, error) {
	f.calls = append(f.calls, "create")
	f.projectID, f.create = projectID, req
	return f.result, f.err
}

func (f *fakeMemberships) UpdateProjectMembershipRoles(_ context.Context, projectID, email string, req entity.UpdateProjectMembershipRolesRequest) (entity.ProjectMembership, error) {
	f.calls = append(f.calls, "update")
	f.projectID, f.email, f.update = projectID, email, req
	return f.result, f.err
}

func (f *fakeMemberships) DeactivateProjectMembership(_ context.Context, projectID, email string) error {
	f.calls = append(f.calls, "deactivate")
	f.projectID, f.email = projectID, email
	return f.err
}

func (f *fakeMemberships) ResendProjectMembershipInvitation(_ context.Context, projectID, email string) error {
	f.calls = append(f.calls, "resend")
	f.projectID, f.email = projectID, email
	return f.err
}

type contactFakes struct {
	resolver    *fakeProjectResolver
	legacy      *fakeLegacyContacts
	memberships *fakeMemberships
}

// newContactMux wires the handler into the same routes main.go registers, so
// the tests exercise real path-value decoding (the "+" in the invitee).
// memberships is passed as a nil interface when withClient is false, which
// is the pre-cutover wiring.
func newContactMux(portalWrites, withClient bool) (*http.ServeMux, contactFakes) {
	f := contactFakes{resolver: &fakeProjectResolver{}, legacy: &fakeLegacyContacts{}, memberships: &fakeMemberships{}}
	var mc membershipsClient
	if withClient {
		mc = f.memberships
	}
	h := NewContactHandler(f.resolver, f.legacy, mc, portalWrites)

	mux := http.NewServeMux()
	mux.HandleFunc("POST /projects/{id}/contacts", h.CreateProjectContact)
	mux.HandleFunc("DELETE /projects/{id}/contacts/{email}", h.RemoveProjectContact)
	mux.HandleFunc("PATCH /projects/{id}/contacts/{email}", h.UpdateProjectContactRole)
	mux.HandleFunc("POST /projects/{id}/contacts/{email}/resend-invitation", h.ResendProjectContactInvitation)
	return mux, f
}

func serveContact(mux *http.ServeMux, method, path, body string) *httptest.ResponseRecorder {
	req := httptest.NewRequest(method, path, strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req = req.WithContext(middleware.WithUserInfo(req.Context(), &middleware.UserInfo{UserID: "u-1", Email: "admin@acme.com"}))
	rec := httptest.NewRecorder()
	mux.ServeHTTP(rec, req)
	return rec
}

const inviteBody = `{"contactEmail":"shayan+e2e1@wso2.com","contactFirstName":"E2E","contactLastName":"One","isPortalUser":true,"isSecurityContact":true}`

func contactsPath() string { return "/projects/" + testProjectUUID + "/contacts" }

// escapedInviteePath is how the webapp sends the address: path-escaped, so
// the handler must see the decoded "shayan+e2e1@wso2.com".
func escapedInviteePath() string { return contactsPath() + "/shayan%2Be2e1@wso2.com" }

func TestCreateProjectContact_PortalWritesOnUsesEntityService(t *testing.T) {
	mux, f := newContactMux(true, true)
	f.memberships.result = entity.ProjectMembership{
		ProjectContactID: "pc-1", ContactSfID: "003xx", Email: testInvitee,
		State: "INVITED", Roles: []string{"Portal user", "Security Contact"},
	}

	rec := serveContact(mux, http.MethodPost, contactsPath(), inviteBody)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200; body %s", rec.Code, rec.Body)
	}
	if !reflect.DeepEqual(f.memberships.calls, []string{"create"}) {
		t.Fatalf("entity calls = %v, want [create]", f.memberships.calls)
	}
	if f.memberships.projectID != testProjectUUID {
		t.Errorf("projectID = %q, want the project UUID %q", f.memberships.projectID, testProjectUUID)
	}
	want := entity.CreateProjectMembershipRequest{
		Email: testInvitee, FirstName: "E2E", LastName: "One",
		Roles: []string{"Portal user", "Security Contact"},
	}
	if !reflect.DeepEqual(f.memberships.create, want) {
		t.Errorf("create body = %+v, want %+v", f.memberships.create, want)
	}
	if len(f.legacy.calls) != 0 || f.resolver.calls != 0 {
		t.Errorf("legacy calls = %v, GetProject calls = %d; want none", f.legacy.calls, f.resolver.calls)
	}

	var got dto.Membership
	if err := json.Unmarshal(rec.Body.Bytes(), &got); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if got.ID != "pc-1" || got.State != "INVITED" || !got.IsPortalUser || !got.IsSecurityContact || got.IsLead || got.IsCsAdmin {
		t.Errorf("response = %+v", got)
	}
}

func TestCreateProjectContact_PortalWritesOffUsesLegacyService(t *testing.T) {
	mux, f := newContactMux(false, true)

	rec := serveContact(mux, http.MethodPost, contactsPath(), inviteBody)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200; body %s", rec.Code, rec.Body)
	}
	if len(f.memberships.calls) != 0 {
		t.Errorf("entity calls = %v with the flag off, want none", f.memberships.calls)
	}
	if !reflect.DeepEqual(f.legacy.calls, []string{"create"}) || f.legacy.projectID != testProjectSfID {
		t.Errorf("legacy calls = %v on %q, want [create] on %q", f.legacy.calls, f.legacy.projectID, testProjectSfID)
	}
}

// TestNewContactHandler_FlagWithoutClientStaysOnLegacy covers the
// misconfiguration guard: the flag on with no entity client behind it must
// not select a path that would nil-dereference.
func TestNewContactHandler_FlagWithoutClientStaysOnLegacy(t *testing.T) {
	mux, f := newContactMux(true, false)

	rec := serveContact(mux, http.MethodPost, contactsPath(), inviteBody)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200; body %s", rec.Code, rec.Body)
	}
	if !reflect.DeepEqual(f.legacy.calls, []string{"create"}) {
		t.Errorf("legacy calls = %v, want [create]", f.legacy.calls)
	}
}

func TestCreateProjectContact_PortalWritesOnPassesUpstreamError(t *testing.T) {
	mux, f := newContactMux(true, true)
	f.memberships.err = apierror.NewUpstreamError(http.StatusConflict, []byte(`{"message":"Contact is already a member of this project."}`))

	rec := serveContact(mux, http.MethodPost, contactsPath(), inviteBody)

	if rec.Code != http.StatusConflict {
		t.Fatalf("status = %d, want 409", rec.Code)
	}
	if !strings.Contains(rec.Body.String(), "already a member") {
		t.Errorf("body = %s, want entity-service's message", rec.Body)
	}
}

func TestUpdateProjectContactRole_PortalWritesOnUsesEntityService(t *testing.T) {
	mux, f := newContactMux(true, true)
	f.memberships.result = entity.ProjectMembership{ProjectContactID: "pc-1", State: "INVITED", Roles: []string{"Lead"}}

	rec := serveContact(mux, http.MethodPatch, escapedInviteePath(), `{"isLead":true}`)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200; body %s", rec.Code, rec.Body)
	}
	if !reflect.DeepEqual(f.memberships.calls, []string{"update"}) {
		t.Fatalf("entity calls = %v, want [update]", f.memberships.calls)
	}
	if f.memberships.projectID != testProjectUUID || f.memberships.email != testInvitee {
		t.Errorf("target = %q/%q, want %q/%q", f.memberships.projectID, f.memberships.email, testProjectUUID, testInvitee)
	}
	if !reflect.DeepEqual(f.memberships.update.Roles, []string{"Lead"}) {
		t.Errorf("roles = %q, want [Lead]", f.memberships.update.Roles)
	}
	if len(f.legacy.calls) != 0 || f.resolver.calls != 0 {
		t.Errorf("legacy calls = %v, GetProject calls = %d; want none", f.legacy.calls, f.resolver.calls)
	}
}

func TestUpdateProjectContactRole_PortalWritesOffUsesLegacyService(t *testing.T) {
	mux, f := newContactMux(false, true)

	rec := serveContact(mux, http.MethodPatch, escapedInviteePath(), `{"isLead":true}`)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200; body %s", rec.Code, rec.Body)
	}
	if len(f.memberships.calls) != 0 || !reflect.DeepEqual(f.legacy.calls, []string{"update"}) {
		t.Errorf("entity calls = %v, legacy calls = %v; want none and [update]", f.memberships.calls, f.legacy.calls)
	}
}

func TestRemoveProjectContact_PortalWritesOnDeactivates(t *testing.T) {
	mux, f := newContactMux(true, true)

	rec := serveContact(mux, http.MethodDelete, escapedInviteePath(), "")

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200; body %s", rec.Code, rec.Body)
	}
	if !reflect.DeepEqual(f.memberships.calls, []string{"deactivate"}) {
		t.Fatalf("entity calls = %v, want [deactivate]", f.memberships.calls)
	}
	if f.memberships.projectID != testProjectUUID || f.memberships.email != testInvitee {
		t.Errorf("target = %q/%q, want %q/%q", f.memberships.projectID, f.memberships.email, testProjectUUID, testInvitee)
	}
	if len(f.legacy.calls) != 0 || f.resolver.calls != 0 {
		t.Errorf("legacy calls = %v, GetProject calls = %d; want none", f.legacy.calls, f.resolver.calls)
	}
}

func TestRemoveProjectContact_PortalWritesOffUsesLegacyService(t *testing.T) {
	mux, f := newContactMux(false, true)

	rec := serveContact(mux, http.MethodDelete, escapedInviteePath(), "")

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200; body %s", rec.Code, rec.Body)
	}
	if len(f.memberships.calls) != 0 || !reflect.DeepEqual(f.legacy.calls, []string{"remove"}) {
		t.Errorf("entity calls = %v, legacy calls = %v; want none and [remove]", f.memberships.calls, f.legacy.calls)
	}
}

// TestResendProjectContactInvitation_FlagOff404s: resend has no pre-cutover
// equivalent, so with the flag off (or no client behind it) it must answer
// 404 and reach neither service.
func TestResendProjectContactInvitation_FlagOff404s(t *testing.T) {
	for _, tc := range []struct {
		name                     string
		portalWrites, withClient bool
	}{
		{"flag off", false, true},
		{"flag on without client", true, false},
	} {
		t.Run(tc.name, func(t *testing.T) {
			mux, f := newContactMux(tc.portalWrites, tc.withClient)

			rec := serveContact(mux, http.MethodPost, escapedInviteePath()+"/resend-invitation", "")

			if rec.Code != http.StatusNotFound {
				t.Fatalf("status = %d, want 404", rec.Code)
			}
			if len(f.memberships.calls) != 0 || len(f.legacy.calls) != 0 {
				t.Errorf("entity calls = %v, legacy calls = %v; want none", f.memberships.calls, f.legacy.calls)
			}
		})
	}
}

func TestResendProjectContactInvitation_PortalWritesOn(t *testing.T) {
	mux, f := newContactMux(true, true)

	rec := serveContact(mux, http.MethodPost, escapedInviteePath()+"/resend-invitation", "")

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200; body %s", rec.Code, rec.Body)
	}
	if !reflect.DeepEqual(f.memberships.calls, []string{"resend"}) {
		t.Fatalf("entity calls = %v, want [resend]", f.memberships.calls)
	}
	if f.memberships.projectID != testProjectUUID || f.memberships.email != testInvitee {
		t.Errorf("target = %q/%q, want %q/%q", f.memberships.projectID, f.memberships.email, testProjectUUID, testInvitee)
	}
}

func TestResendProjectContactInvitation_InvalidProjectID(t *testing.T) {
	mux, f := newContactMux(true, true)

	rec := serveContact(mux, http.MethodPost, "/projects/not-a-uuid/contacts/"+testInvitee+"/resend-invitation", "")

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want 400", rec.Code)
	}
	if len(f.memberships.calls) != 0 {
		t.Errorf("entity calls = %v, want none", f.memberships.calls)
	}
}

func TestResendProjectContactInvitation_PassesUpstreamNotFound(t *testing.T) {
	mux, f := newContactMux(true, true)
	f.memberships.err = apierror.NewUpstreamError(http.StatusNotFound, []byte(`{"message":"Membership not found."}`))

	rec := serveContact(mux, http.MethodPost, escapedInviteePath()+"/resend-invitation", "")

	if rec.Code != http.StatusNotFound {
		t.Fatalf("status = %d, want 404", rec.Code)
	}
}

func TestResendProjectContactInvitation_Unauthenticated(t *testing.T) {
	mux, f := newContactMux(true, true)
	req := httptest.NewRequest(http.MethodPost, escapedInviteePath()+"/resend-invitation", nil)
	rec := httptest.NewRecorder()

	mux.ServeHTTP(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("status = %d, want 401", rec.Code)
	}
	if len(f.memberships.calls) != 0 {
		t.Errorf("entity calls = %v, want none", f.memberships.calls)
	}
}
