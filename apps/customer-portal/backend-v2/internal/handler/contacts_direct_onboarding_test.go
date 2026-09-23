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
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/wso2-open-operations/cs-tools/apps/customer-portal/backend-v2/internal/entity"
	"github.com/wso2-open-operations/cs-tools/apps/customer-portal/backend-v2/internal/middleware"
	"github.com/wso2-open-operations/cs-tools/apps/customer-portal/backend-v2/internal/usermanagement"
)

const (
	onboardingProjectID = "11111111-1111-1111-1111-111111111111"
	onboardingProjectSf = "a0dE200000CMR4HIAE"
	onboardingMembersSf = "a0eE2000001AbCdIAM"
)

// fakeSyncEntityClient is an entityProjectResolver that records every
// membership the handler asked entity-service to sync.
type fakeSyncEntityClient struct {
	err    error
	synced []string
}

func (f *fakeSyncEntityClient) GetProject(context.Context, string) (entity.ProjectDetailsView, error) {
	return entity.ProjectDetailsView{SfID: onboardingProjectSf}, nil
}

func (f *fakeSyncEntityClient) SyncProjectContact(_ context.Context, membershipSfID string) error {
	f.synced = append(f.synced, membershipSfID)
	return f.err
}

// fakeOnboardingContactsClient is a contactsClient whose three mutating
// operations all succeed and return the same membership.
type fakeOnboardingContactsClient struct{}

func (fakeOnboardingContactsClient) GetProjectContacts(context.Context, string) ([]usermanagement.Contact, error) {
	return nil, nil
}

func (fakeOnboardingContactsClient) CreateProjectContact(context.Context, string, usermanagement.OnBoardContactPayload) (usermanagement.Membership, error) {
	return usermanagement.Membership{ID: onboardingMembersSf, State: "INVITED"}, nil
}

func (fakeOnboardingContactsClient) RemoveProjectContact(context.Context, string, string, string) (usermanagement.Membership, error) {
	return usermanagement.Membership{ID: onboardingMembersSf, State: "DEACTIVATED"}, nil
}

func (fakeOnboardingContactsClient) UpdateMembershipRole(context.Context, string, string, usermanagement.MembershipRolePayload) (usermanagement.Membership, error) {
	return usermanagement.Membership{ID: onboardingMembersSf, State: "INVITED"}, nil
}

func (fakeOnboardingContactsClient) ValidateProjectContact(context.Context, usermanagement.ValidationPayload) (*usermanagement.Contact, bool, error) {
	return nil, false, nil
}

func contactRequest(method, target, body string) *http.Request {
	req := httptest.NewRequest(method, target, strings.NewReader(body))
	req.SetPathValue("id", onboardingProjectID)
	req.SetPathValue("email", "jane@acme.com")
	return req.WithContext(middleware.WithUserInfo(req.Context(), &middleware.UserInfo{UserID: "u-1", Email: "admin@acme.com"}))
}

// exerciseAll runs the three mutating contact handlers once each.
func exerciseAll(t *testing.T, h *ContactHandler) {
	t.Helper()
	for _, c := range []struct {
		name string
		run  func(http.ResponseWriter, *http.Request)
		req  *http.Request
	}{
		{"create", h.CreateProjectContact, contactRequest(http.MethodPost, "/projects/"+onboardingProjectID+"/contacts", `{"contactEmail":"jane@acme.com"}`)},
		{"remove", h.RemoveProjectContact, contactRequest(http.MethodDelete, "/projects/"+onboardingProjectID+"/contacts/jane@acme.com", "")},
		{"update", h.UpdateProjectContactRole, contactRequest(http.MethodPatch, "/projects/"+onboardingProjectID+"/contacts/jane@acme.com", `{"isPortalUser":true}`)},
	} {
		rec := httptest.NewRecorder()
		c.run(rec, c.req)
		if rec.Code != http.StatusOK {
			t.Fatalf("%s: status = %d, want 200 (body %s)", c.name, rec.Code, rec.Body.String())
		}
	}
}

// TestContactHandlers_DirectOnboardingDisabledMakesNoCall is the guarantee
// that matters before cutover: with CSM_MIGRATION_DIRECT_ONBOARDING_ENABLED
// unset, the contact handlers behave exactly as they always have and never
// reach entity-service's sync route.
func TestContactHandlers_DirectOnboardingDisabledMakesNoCall(t *testing.T) {
	ec := &fakeSyncEntityClient{}
	exerciseAll(t, NewContactHandler(ec, fakeOnboardingContactsClient{}, false))

	if len(ec.synced) != 0 {
		t.Errorf("synced %v with the flag off, want none", ec.synced)
	}
}

// TestContactHandlers_DirectOnboardingSyncsEachChange: with the flag on,
// every mutating operation syncs the membership it just changed, so the CSM
// database is correct without waiting for the Salesforce event.
func TestContactHandlers_DirectOnboardingSyncsEachChange(t *testing.T) {
	ec := &fakeSyncEntityClient{}
	exerciseAll(t, NewContactHandler(ec, fakeOnboardingContactsClient{}, true))

	want := []string{onboardingMembersSf, onboardingMembersSf, onboardingMembersSf}
	if len(ec.synced) != len(want) {
		t.Fatalf("synced %v, want one sync per operation", ec.synced)
	}
	for i, got := range ec.synced {
		if got != want[i] {
			t.Errorf("sync %d = %q, want %q", i, got, want[i])
		}
	}
}

// TestContactHandlers_DirectOnboardingFailureIsNotTheAdminsProblem: the
// Salesforce write has already succeeded and its event will reach
// entity-service by the old path anyway, so a failed sync costs freshness,
// not the onboarding. The admin must still see success.
func TestContactHandlers_DirectOnboardingFailureIsNotTheAdminsProblem(t *testing.T) {
	ec := &fakeSyncEntityClient{err: errors.New("entity-service unavailable")}
	exerciseAll(t, NewContactHandler(ec, fakeOnboardingContactsClient{}, true))

	if len(ec.synced) != 3 {
		t.Errorf("synced %v, want all three attempted despite the failures", ec.synced)
	}
}
