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

import type { CasesStatsDTO, EntityReference, Pagination } from "@src/types";

export interface ChangeRequestsDTO extends Pagination {
  changeRequests: ChangeRequestSummaryDTO[];
}

interface ChangeRequestSummaryDTO {
  id: string;
  number: string;
  title: string;
  case: (EntityReference & { number: string }) | null;
  endDate: string | null;
  impact: EntityReference | null;
  state: EntityReference | null;
  type: EntityReference | null;
  assignedTeam: EntityReference | null;
  createdOn: string;
  updatedOn: string;
}

export interface ChangeRequestDTO {
  id: string;
  number: string;
  title: string;
  description: string;
  createdBy: string;
  case: (EntityReference & { number: string }) | null;
  deployment: EntityReference | null;
  endDate: string | null;
  approvedBy: string | null;
  approvedOn: string | null;
  duration: string | null;
  hasCustomerApproved: boolean;
  hasCustomerReviewed: boolean;
  impact: EntityReference | null;
  state: EntityReference | null;
  type: EntityReference | null;
  assignedTeam: EntityReference | null;
  serviceOutage: string | null;
  rollbackPlan: string | null;
  communicationPlan: string | null;
  testPlan: null | string;
  createdOn: string;
  updatedOn: string;
}

export interface GetChangeRequestsRquestDTO {
  filters?: {
    impactKey?: number;
    searchQuery?: string;
    stateKeys?: number[];
  };
  pagination?: {
    limit?: number;
    offset?: number;
  };
}

export type ChangeRequestsStatsDTO = Pick<
  CasesStatsDTO,
  "totalCount" | "activeCount" | "outstandingCount" | "stateCount"
>;
