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

package dto

import (
	"strings"

	"github.com/wso2-open-operations/cs-tools/apps/customer-portal/backend-v2/internal/entity"
)

// The portal's own wire contract describes a membership's roles as four
// booleans, because that is what the webapp's checkboxes are. entity-service
// speaks the raw Salesforce Role__c picklist instead, since those labels are
// what it writes to Salesforce and reads back. This file is the only place
// the two vocabularies meet.
//
// The labels must match entity-service's own constants exactly
// (internal/service/salesforce_membership_mapping.go): Salesforce matches the
// picklist by literal string, so "Portal User" would silently fail to grant
// portal access rather than being rejected.
const (
	sfRolePortalUser      = "Portal user"
	sfRoleSecurityContact = "Security Contact"
	sfRoleLead            = "Lead"
	sfRoleAdmin           = "Admin"
)

// membershipRoleFlags is the four-boolean view both portal request bodies
// share, so the two directions below have one mapping table rather than two.
type membershipRoleFlags struct {
	IsPortalUser      bool
	IsSecurityContact bool
	IsLead            bool
	IsCsAdmin         bool
}

// rolesFromFlags turns the portal's booleans into the Salesforce picklist.
// Always returns a non-nil slice: entity-service replaces the role set
// wholesale, so an empty list is a meaningful instruction ("hold no roles")
// and must serialise as [] rather than null.
func rolesFromFlags(f membershipRoleFlags) []string {
	roles := make([]string, 0, 4)
	if f.IsPortalUser {
		roles = append(roles, sfRolePortalUser)
	}
	if f.IsSecurityContact {
		roles = append(roles, sfRoleSecurityContact)
	}
	if f.IsLead {
		roles = append(roles, sfRoleLead)
	}
	if f.IsCsAdmin {
		roles = append(roles, sfRoleAdmin)
	}
	return roles
}

// flagsFromRoles is the inverse, used to render a membership entity-service
// returned back into the portal's own shape. Comparison is
// case-insensitive and whitespace-trimmed: these labels round-trip through
// Salesforce, which is not guaranteed to preserve the exact casing this
// service sent, and a role silently read as absent would show a user as
// having lost access they still have. Unrecognised labels are ignored
// rather than failing the response -- the portal has no checkbox for them,
// and entity-service already logs them on its own side.
func flagsFromRoles(roles []string) membershipRoleFlags {
	var f membershipRoleFlags
	for _, r := range roles {
		switch strings.ToLower(strings.TrimSpace(r)) {
		case strings.ToLower(sfRolePortalUser):
			f.IsPortalUser = true
		case strings.ToLower(sfRoleSecurityContact):
			f.IsSecurityContact = true
		case strings.ToLower(sfRoleLead):
			f.IsLead = true
		case strings.ToLower(sfRoleAdmin):
			f.IsCsAdmin = true
		}
	}
	return f
}

// RolesFromOnboardRequest builds the Salesforce picklist for a new invitation.
func RolesFromOnboardRequest(req ContactOnboardRequest) []string {
	return rolesFromFlags(membershipRoleFlags{
		IsPortalUser:      req.IsPortalUser,
		IsSecurityContact: req.IsSecurityContact,
		IsLead:            req.IsLead,
		IsCsAdmin:         req.IsCsAdmin,
	})
}

// RolesFromRoleUpdateRequest builds the replacement picklist for a role edit.
func RolesFromRoleUpdateRequest(req MembershipRoleUpdateRequest) []string {
	return rolesFromFlags(membershipRoleFlags{
		IsPortalUser:      req.IsPortalUser,
		IsSecurityContact: req.IsSecurityContact,
		IsLead:            req.IsLead,
		IsCsAdmin:         req.IsCsAdmin,
	})
}

// BuildCreateProjectMembershipRequest builds entity-service's invite body
// from the portal's own request. Unlike the pre-cutover path there is no
// AdminEmail field: entity-service attributes the write from the caller's
// validated token, so the acting admin can no longer be spoofed by the body.
func BuildCreateProjectMembershipRequest(req ContactOnboardRequest) entity.CreateProjectMembershipRequest {
	return entity.CreateProjectMembershipRequest{
		Email:               strings.TrimSpace(req.ContactEmail),
		FirstName:           strings.TrimSpace(req.ContactFirstName),
		LastName:            strings.TrimSpace(req.ContactLastName),
		Roles:               RolesFromOnboardRequest(req),
		IsCsIntegrationUser: req.IsCsIntegrationUser,
	}
}

// MapEntityMembership renders an entity-service membership in the portal's
// own Membership shape, so switching the write path does not change what the
// webapp receives.
//
// ID is the project_contact row id rather than the pre-cutover service's own
// membership id. Both are opaque identifiers the webapp only echoes back, and
// this one is the id every other new endpoint is keyed on.
func MapEntityMembership(m entity.ProjectMembership) Membership {
	f := flagsFromRoles(m.Roles)
	out := Membership{
		ID:                m.ProjectContactID,
		State:             m.State,
		IsCsAdmin:         f.IsCsAdmin,
		IsLead:            f.IsLead,
		IsPortalUser:      f.IsPortalUser,
		IsSecurityContact: f.IsSecurityContact,
	}
	if m.Email != "" {
		email := m.Email
		out.Contact = &ContactRef{Email: &email}
		if m.ContactSfID != "" {
			id := m.ContactSfID
			out.Contact.ID = &id
		}
	}
	return out
}
