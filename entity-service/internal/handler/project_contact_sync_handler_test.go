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

package handler

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/wso2-open-operations/cs-tools/entity-service/internal/apierror"
)

type stubProjectContactSyncService struct {
	err    error
	called bool
	sfID   string
}

func (s *stubProjectContactSyncService) Sync(_ context.Context, sfID string) error {
	s.called = true
	s.sfID = sfID
	return s.err
}

// syncRequest builds a POST /project-contacts/{sfId}/sync request with the
// path value the router would have set.
func syncRequest(sfID string) *http.Request {
	req := httptest.NewRequest(http.MethodPost, "/project-contacts/"+sfID+"/sync", nil)
	req.SetPathValue("sfId", sfID)
	return req
}

func TestSyncProjectContact_NoContent(t *testing.T) {
	svc := &stubProjectContactSyncService{}
	h := NewProjectContactSyncHandler(svc)
	rec := httptest.NewRecorder()

	h.SyncProjectContact(rec, syncRequest("a0e1x000000ABCDAA2"))

	if rec.Code != http.StatusNoContent {
		t.Fatalf("status = %d, want 204: %s", rec.Code, rec.Body.String())
	}
	if !svc.called || svc.sfID != "a0e1x000000ABCDAA2" {
		t.Errorf("service called = %v with sfId %q", svc.called, svc.sfID)
	}
	if rec.Body.Len() != 0 {
		t.Errorf("204 must have no body, got %q", rec.Body.String())
	}
}

// TestSyncProjectContact_ErrorStatuses pins that every error the ingest (or
// the internal-caller gate) raises keeps its own status through
// writeServiceError, with no mapping of this handler's own.
func TestSyncProjectContact_ErrorStatuses(t *testing.T) {
	tests := []struct {
		name string
		err  error
		want int
	}{
		{"malformed id", &apierror.ValidationError{Msg: "sfId must be a 15 or 18 character Salesforce Id"}, http.StatusBadRequest},
		{"non-internal caller", &apierror.ForbiddenError{Msg: "internal services only"}, http.StatusForbidden},
		{"unknown project", &apierror.NotFoundError{Msg: "project not found"}, http.StatusNotFound},
		{"ambiguous user", &apierror.ConflictError{Msg: "more than one user matches"}, http.StatusConflict},
		{"salesforce down", &apierror.ServiceUnavailableError{Msg: "salesentity down"}, http.StatusServiceUnavailable},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			h := NewProjectContactSyncHandler(&stubProjectContactSyncService{err: tt.err})
			rec := httptest.NewRecorder()

			h.SyncProjectContact(rec, syncRequest("a0e1x000000ABCDAA2"))

			if rec.Code != tt.want {
				t.Fatalf("status = %d, want %d: %s", rec.Code, tt.want, rec.Body.String())
			}
		})
	}
}
