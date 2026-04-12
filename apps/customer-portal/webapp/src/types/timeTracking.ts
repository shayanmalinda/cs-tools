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

import { type TimeTrackingBadgeType } from "@constants/projectDetailsConstants";
import type { IdLabelRef } from "./common";

// Project time tracking statistics.
export type ProjectTimeTrackingStats = {
  totalHours: number;
  billableHours: number;
  nonBillableHours: number;
}

// Interface for items in the time tracking logs.
export type TimeTrackingLogBadge = {
  text: string;
  type: TimeTrackingBadgeType;
}

export type TimeTrackingLog = {
  id: string;
  badges: TimeTrackingLogBadge[];
  description: string | null;
  user: string | null;
  role: string | null;
  date: string | null;
  hours: number | null;
}

// Response for project time tracking details.
export type TimeTrackingDetailsResponse = {
  timeLogs: TimeTrackingLog[];
}

// Time card from projects/:projectId/time-cards/search.
// Backend: modules/types/types.bal `TimeCard` — `state`, `approvedBy`, and
// `project` are all `ReferenceItem?` (nullable). `case` is non-null and
// carries a required `number` in addition to the base ref shape.
export type TimeCard = {
  id: string;
  totalTime: number;
  createdOn: string;
  hasBillable: boolean;
  state: IdLabelRef | null;
  approvedBy: IdLabelRef | null;
  project: IdLabelRef | null;
  case: IdLabelRef & { number: string };
};

// Response for project time cards search.
export type TimeCardSearchResponse = {
  timeCards: TimeCard[];
  totalRecords: number;
  offset: number;
  limit: number;
}

// Request body for project time cards search (POST /projects/:projectId/time-cards/search).
export type TimeCardSearchRequest = {
  filters?: {
    startDate?: string;
    endDate?: string;
    states?: string[];
  };
  pagination?: {
    limit?: number;
    offset?: number;
  };
}
