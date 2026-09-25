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

package entity

import (
	"context"
	"fmt"
	"net/http"
	"net/url"
)

// The four membership write endpoints entity-service owns. Each one updates
// Postgres and Salesforce together or neither: the Postgres transaction stays
// open across the Salesforce call and commits last, so a Salesforce failure
// rolls the database back and surfaces here as an error. That is why the
// portal no longer writes Salesforce itself through a second service.
//
// NOTE: entity-service registers these routes only when it is deployed with
// CSM_MIGRATION_PORTAL_WRITES_ENABLED=true, DATA_SOURCE=postgres, a database
// and a complete SALES_ENTITY_* connection. Any other deployment 404s, which
// is deliberate: a portal built against them fails loudly rather than writing
// one system and not the other. The caller keeps the pre-cutover path behind
// its own flag for exactly that reason.

// CreateProjectMembershipRequest is the body of POST /projects/{id}/contacts.
// Roles are the raw Salesforce Role__c labels ("Portal user", "Admin", ...),
// not the portal's own booleans — see dto.RolesFromOnboardRequest for the
// mapping and why it lives there.
type CreateProjectMembershipRequest struct {
	Email     string   `json:"email"`
	FirstName string   `json:"firstName"`
	LastName  string   `json:"lastName"`
	Roles     []string `json:"roles"`
	// IsCsIntegrationUser marks a machine account: it gets its database row
	// and its Salesforce records like anyone else, but no Asgardeo identity
	// and no invitation e-mail, because nobody ever signs in as it.
	IsCsIntegrationUser bool `json:"isCsIntegrationUser,omitempty"`
}

// UpdateProjectMembershipRolesRequest is the body of
// PATCH /projects/{id}/contacts/{email}. The role set is replaced wholesale,
// never merged, so the caller sends the complete picklist it wants.
type UpdateProjectMembershipRolesRequest struct {
	Roles []string `json:"roles"`
}

// ProjectMembership is what the invite and role-update endpoints return.
type ProjectMembership struct {
	ProjectID        string `json:"projectId"`
	ProjectContactID string `json:"projectContactId"`
	MembershipSfID   string `json:"membershipSfId"`
	ContactSfID      string `json:"contactSfId"`
	UserID           string `json:"userId"`
	Email            string `json:"email"`
	// State is INVITED / REGISTERED / RE-INVITED / DEACTIVATED.
	State string `json:"state"`
	// Roles are the raw Salesforce labels the membership now carries, exactly
	// as they were written to Salesforce.
	Roles []string `json:"roles"`
}

// membershipPath builds /projects/{id}/contacts/{email}. The address is
// path-escaped because it is a path segment, not a query value: an unescaped
// "+" in shayan+test@wso2.com would otherwise be ambiguous, and entity-service
// relies on net/http's own decoding of the segment.
func membershipPath(projectID, email string) string {
	return fmt.Sprintf("/projects/%s/contacts/%s", url.PathEscape(projectID), url.PathEscape(email))
}

// CreateProjectMembership calls POST /projects/{id}/contacts, inviting email
// to the project. projectID is this platform's project UUID, not the
// project's Salesforce Id.
func (c *Client) CreateProjectMembership(ctx context.Context, projectID string, req CreateProjectMembershipRequest) (ProjectMembership, error) {
	var out ProjectMembership
	err := c.postJSON(ctx, fmt.Sprintf("/projects/%s/contacts", url.PathEscape(projectID)), req, &out)
	return out, err
}

// UpdateProjectMembershipRoles calls PATCH /projects/{id}/contacts/{email},
// replacing the membership's whole role set.
func (c *Client) UpdateProjectMembershipRoles(ctx context.Context, projectID, email string, req UpdateProjectMembershipRolesRequest) (ProjectMembership, error) {
	var out ProjectMembership
	err := c.patchJSON(ctx, membershipPath(projectID, email), req, &out)
	return out, err
}

// DeactivateProjectMembership calls DELETE /projects/{id}/contacts/{email}.
// The membership is deactivated, never deleted, so the history of who had
// access survives. Returns 204 with no body.
func (c *Client) DeactivateProjectMembership(ctx context.Context, projectID, email string) error {
	_, err := c.do(ctx, http.MethodDelete, membershipPath(projectID, email), nil)
	return err
}

// ResendProjectMembershipInvitation calls
// POST /projects/{id}/contacts/{email}/resend-invitation. entity-service
// republishes the same invitation event with a resend marker, which makes
// csm-notification-service bypass its duplicate-invitation guard and send a
// short reminder instead of the first-time wording. Returns 204 with no body.
func (c *Client) ResendProjectMembershipInvitation(ctx context.Context, projectID, email string) error {
	_, err := c.do(ctx, http.MethodPost, membershipPath(projectID, email)+"/resend-invitation", nil)
	return err
}
