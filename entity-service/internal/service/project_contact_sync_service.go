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
// KIND, either express or implied. See the License for the
// specific language governing permissions and limitations
// under the License.

package service

import (
	"context"
	"strings"

	"github.com/wso2-open-operations/cs-tools/entity-service/internal/apierror"
	"github.com/wso2-open-operations/cs-tools/entity-service/internal/domain"
)

// A Salesforce record Id is alphanumeric and either 15 characters (the
// case-sensitive form) or 18 (the case-insensitive form) — the same shape
// sales-entity-service accepts, and the only shape the ingest can look up.
const (
	salesforceIDShortLen = 15
	salesforceIDLongLen  = 18
)

type projectContactSyncService struct {
	events SalesforceEventService
	access AccessService
}

// NewProjectContactSyncService constructs a ProjectContactSyncService on top
// of the membership-ingest-capable SalesforceEventService, so a portal-driven
// sync runs exactly the code an ASB envelope for the same membership would.
// access gates the endpoint to internal callers (AUTH_INTERNAL_CLIENT_IDS):
// this drives onboarding (Asgardeo account + invitation e-mail) for an
// arbitrary membership id, which is never an end user's call to make.
func NewProjectContactSyncService(events SalesforceEventService, access AccessService) ProjectContactSyncService {
	return &projectContactSyncService{events: events, access: access}
}

// Sync implements ProjectContactSyncService. It builds the exact envelope the
// Service Bus subscriber would POST to /salesforce/events for this membership
// and hands it to the same HandleEvent entry point: the Sales Entity fetch,
// the duplicate guard, the row upsert, the DATABASE onboarding step and the
// project_contact.invited publish are literally the same code, error mapping
// included. Nothing about the ingest is duplicated here.
func (s *projectContactSyncService) Sync(ctx context.Context, sfID string) error {
	if err := s.requireInternalCaller(ctx); err != nil {
		return err
	}
	sfID = strings.TrimSpace(sfID)
	if err := validateSalesforceRecordID("sfId", sfID); err != nil {
		return err
	}
	return s.events.HandleEvent(ctx, domain.SalesforceEventRequest{
		EventType:   domain.SalesforceEventUpdated,
		Entity:      domain.SalesforceEntityProjectContact,
		ReferenceID: sfID,
	})
}

// requireInternalCaller rejects anyone whose AccessScope is not Unrestricted,
// i.e. every caller that is not an allow-listed internal service — the same
// gate onboardingStepService applies to the onboarding-step endpoints.
func (s *projectContactSyncService) requireInternalCaller(ctx context.Context) error {
	scope, err := s.access.ResolveScope(ctx)
	if err != nil {
		return err
	}
	if !scope.Unrestricted {
		return &apierror.ForbiddenError{Msg: "project contact sync is only available to internal services"}
	}
	return nil
}

// validateSalesforceRecordID rejects anything that is not a syntactically
// valid Salesforce Id before the ingest reaches sales-entity-service with it.
func validateSalesforceRecordID(field, id string) error {
	if id == "" {
		return &apierror.ValidationError{Msg: field + " is required"}
	}
	if len(id) != salesforceIDShortLen && len(id) != salesforceIDLongLen {
		return &apierror.ValidationError{Msg: field + " must be a 15 or 18 character Salesforce Id"}
	}
	for _, r := range id {
		if (r < '0' || r > '9') && (r < 'a' || r > 'z') && (r < 'A' || r > 'Z') {
			return &apierror.ValidationError{Msg: field + " must be alphanumeric"}
		}
	}
	return nil
}
