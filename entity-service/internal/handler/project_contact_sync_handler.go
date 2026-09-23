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
	"net/http"

	"github.com/wso2-open-operations/cs-tools/entity-service/internal/service"
)

// ProjectContactSyncHandler handles POST /project-contacts/{sfId}/sync — the
// customer portal's synchronous ingest of one Salesforce membership it has
// just written (see service.ProjectContactSyncService).
type ProjectContactSyncHandler struct {
	svc service.ProjectContactSyncService
}

// NewProjectContactSyncHandler constructs a ProjectContactSyncHandler.
func NewProjectContactSyncHandler(svc service.ProjectContactSyncService) *ProjectContactSyncHandler {
	return &ProjectContactSyncHandler{svc: svc}
}

// SyncProjectContact handles POST /project-contacts/{sfId}/sync. There is no
// request body — the membership Id in the path is the whole request — and
// success is 204, matching POST /salesforce/events, whose ingest this runs.
func (h *ProjectContactSyncHandler) SyncProjectContact(w http.ResponseWriter, r *http.Request) {
	if err := h.svc.Sync(r.Context(), r.PathValue("sfId")); err != nil {
		writeServiceError(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
