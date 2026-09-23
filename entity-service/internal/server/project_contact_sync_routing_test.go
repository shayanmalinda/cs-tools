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

package server

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/wso2-open-operations/cs-tools/entity-service/internal/config"
)

const syncRoutePath = "/project-contacts/a0e1x000000ABCDAA2/sync"

// unconnectedPool builds a real, non-nil *pgxpool.Pool that never connects to
// anything: pgxpool only dials on first use, and nothing in NewRouter issues
// a query. A pool is needed here (unlike every other test in this package,
// which passes nil) precisely because the route under test is gated on
// db != nil as well as on the ingest flag — with a nil pool the flag's own
// effect would be invisible.
func unconnectedPool(t *testing.T) *pgxpool.Pool {
	t.Helper()
	pool, err := pgxpool.New(context.Background(), "postgres://entity:entity@127.0.0.1:1/entity?sslmode=disable")
	if err != nil {
		t.Fatalf("build pool: %v", err)
	}
	t.Cleanup(pool.Close)
	return pool
}

// salesforceIngestConfig is a DATA_SOURCE=postgres config with the REST
// sales-entity-service credentials the Salesforce routes are gated on.
func salesforceIngestConfig(t *testing.T, ingestEnabled bool) *config.Config {
	t.Helper()
	cfg := &config.Config{
		DataSource:                        config.DataSourcePostgres,
		SalesEntityBaseURL:                "https://example.invalid",
		SalesEntityTokenURL:               "https://example.invalid/oauth2/token",
		SalesEntityClientID:               "test-client",
		SalesEntityClientSecret:           "test-secret",
		SalesforceMembershipIngestEnabled: ingestEnabled,
	}
	withTestAuth(t, cfg)
	return cfg
}

// TestProjectContactSyncRoute_AbsentWhenMembershipIngestDisabled is the point
// of the gate: with the ingest off, HandleEvent silently skips the
// Project_Contact__c branch, so a sync call would answer 204 having ingested
// nothing. The route must not exist at all instead.
func TestProjectContactSyncRoute_AbsentWhenMembershipIngestDisabled(t *testing.T) {
	router, _ := NewRouter(unconnectedPool(t), salesforceIngestConfig(t, false))

	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, httptest.NewRequest(http.MethodPost, syncRoutePath, nil))

	if rec.Code != http.StatusNotFound {
		t.Fatalf("POST %s = %d, want 404 — the route must not be registered with the ingest disabled: %s",
			syncRoutePath, rec.Code, rec.Body.String())
	}
}

// TestProjectContactSyncRoute_RegisteredWhenMembershipIngestEnabled is the
// control case for the test above: with the same config and the ingest on,
// the route exists. The request carries no token, so it stops at the
// internal-caller gate (AccessService refuses an unresolvable caller) rather
// than reaching a query against the unconnected pool — any answer other than
// 404 proves the handler is registered.
func TestProjectContactSyncRoute_RegisteredWhenMembershipIngestEnabled(t *testing.T) {
	router, _ := NewRouter(unconnectedPool(t), salesforceIngestConfig(t, true))

	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, httptest.NewRequest(http.MethodPost, syncRoutePath, nil))

	if rec.Code == http.StatusNotFound {
		t.Fatalf("POST %s = 404 — the route should be registered with the ingest enabled", syncRoutePath)
	}
	if rec.Code != http.StatusUnauthorized && rec.Code != http.StatusForbidden {
		t.Errorf("POST %s = %d, want the caller to be refused (401/403) before any ingest work: %s",
			syncRoutePath, rec.Code, rec.Body.String())
	}
}
