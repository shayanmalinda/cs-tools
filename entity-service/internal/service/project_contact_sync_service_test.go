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
	"errors"
	"testing"

	"github.com/wso2-open-operations/cs-tools/entity-service/internal/apierror"
	"github.com/wso2-open-operations/cs-tools/entity-service/internal/domain"
)

// recordingEventService stands in for the membership-ingest-capable
// SalesforceEventService: the sync endpoint's whole job is to hand it the
// envelope an ASB event would have carried, so what it was called with is
// the assertion.
type recordingEventService struct {
	calls []domain.SalesforceEventRequest
	err   error
}

func (s *recordingEventService) HandleEvent(_ context.Context, req domain.SalesforceEventRequest) error {
	s.calls = append(s.calls, req)
	return s.err
}

// TestProjectContactSyncService_IngestsAsAnUpdatedEnvelope pins the seam: a
// valid Salesforce Id reaches HandleEvent as an UPDATED / Project_Contact__c
// envelope, so the ingest, its duplicate guard and its error mapping are
// literally the same code the event endpoint runs.
func TestProjectContactSyncService_IngestsAsAnUpdatedEnvelope(t *testing.T) {
	events := &recordingEventService{}
	svc := NewProjectContactSyncService(events, alwaysUnrestrictedAccess{})

	if err := svc.Sync(context.Background(), " a0e1x000000ABCDAA2 "); err != nil {
		t.Fatalf("Sync: %v", err)
	}
	if len(events.calls) != 1 {
		t.Fatalf("HandleEvent calls = %d, want 1", len(events.calls))
	}
	got := events.calls[0]
	want := domain.SalesforceEventRequest{
		EventType:   domain.SalesforceEventUpdated,
		Entity:      domain.SalesforceEntityProjectContact,
		ReferenceID: "a0e1x000000ABCDAA2",
	}
	if got != want {
		t.Errorf("envelope = %+v, want %+v", got, want)
	}
}

// TestProjectContactSyncService_RejectsMalformedIDs asserts a bad Id is a 400
// raised here, before the ingest (and therefore sales-entity-service) is
// touched at all.
func TestProjectContactSyncService_RejectsMalformedIDs(t *testing.T) {
	tests := []struct {
		name string
		sfID string
	}{
		{"empty", ""},
		{"blank", "   "},
		{"too short", "a0e1x000000ABC"},
		{"between the two valid lengths", "a0e1x000000ABCDA"},
		{"too long", "a0e1x000000ABCDAA2X"},
		{"non alphanumeric", "a0e1x000000-ABCDA"},
		{"multi-byte", "a0e1x000000ABCDé"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			events := &recordingEventService{}
			svc := NewProjectContactSyncService(events, alwaysUnrestrictedAccess{})

			err := svc.Sync(context.Background(), tt.sfID)

			var ve *apierror.ValidationError
			if !errors.As(err, &ve) {
				t.Fatalf("err = %v, want ValidationError", err)
			}
			if len(events.calls) != 0 {
				t.Error("the ingest must not be reached for a malformed id")
			}
		})
	}
}

// TestProjectContactSyncService_RejectsExternalCallers pins the internal-only
// gate: this endpoint drives onboarding (Asgardeo account + invitation
// e-mail), so a portal end user must never reach the ingest through it.
func TestProjectContactSyncService_RejectsExternalCallers(t *testing.T) {
	events := &recordingEventService{}
	svc := NewProjectContactSyncService(events, stubAccess{scope: AccessScope{ProjectIDs: []string{"2f1e8d6a-3b4c-4d5e-8f90-123456789abc"}}})

	err := svc.Sync(context.Background(), "a0e1x000000ABCDAA2")

	var fe *apierror.ForbiddenError
	if !errors.As(err, &fe) {
		t.Fatalf("err = %v, want ForbiddenError", err)
	}
	if len(events.calls) != 0 {
		t.Error("the ingest must not be reached for a non-internal caller")
	}
}

// TestProjectContactSyncService_PropagatesIngestErrors asserts the ingest's
// own errors come back untouched, so each keeps the status writeServiceError
// already maps it to on POST /salesforce/events.
func TestProjectContactSyncService_PropagatesIngestErrors(t *testing.T) {
	tests := []struct {
		name string
		err  error
		as   func(error) bool
	}{
		{"not found", &apierror.NotFoundError{Msg: "project not found"}, func(err error) bool {
			var e *apierror.NotFoundError
			return errors.As(err, &e)
		}},
		{"conflict", &apierror.ConflictError{Msg: "more than one user matches"}, func(err error) bool {
			var e *apierror.ConflictError
			return errors.As(err, &e)
		}},
		{"service unavailable", &apierror.ServiceUnavailableError{Msg: "salesentity down"}, func(err error) bool {
			var e *apierror.ServiceUnavailableError
			return errors.As(err, &e)
		}},
		{"validation", &apierror.ValidationError{Msg: "unknown membership state"}, func(err error) bool {
			var e *apierror.ValidationError
			return errors.As(err, &e)
		}},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			events := &recordingEventService{err: tt.err}
			svc := NewProjectContactSyncService(events, alwaysUnrestrictedAccess{})

			err := svc.Sync(context.Background(), "a0e1x000000ABCDAA2")

			if !tt.as(err) {
				t.Fatalf("err = %v, want the ingest's own %T", err, tt.err)
			}
		})
	}
}

// TestProjectContactSyncService_PropagatesScopeErrors asserts an
// AccessService failure (no verified identity, no user token) is returned
// as-is rather than collapsed into a 403.
func TestProjectContactSyncService_PropagatesScopeErrors(t *testing.T) {
	events := &recordingEventService{}
	svc := NewProjectContactSyncService(events, stubAccess{err: &apierror.UnauthorizedError{Msg: "a user token is required"}})

	err := svc.Sync(context.Background(), "a0e1x000000ABCDAA2")

	var ue *apierror.UnauthorizedError
	if !errors.As(err, &ue) {
		t.Fatalf("err = %v, want UnauthorizedError", err)
	}
	if len(events.calls) != 0 {
		t.Error("the ingest must not be reached when the scope cannot be resolved")
	}
}
