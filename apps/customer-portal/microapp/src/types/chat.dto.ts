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

import type { EntityReference } from "./case.dto";
import type { Pagination } from "./pagination.types";

export interface MessageDispatchDTO {
  message: string;
  envProducts: Record<string, string[]>;
  region: string;
  tier: string;
}

export interface MessageResponseDTO {
  message: string;
  sessionId: string;
  conversationId: string;
  resolved: boolean | null;
  // TODO: Add recommendations: { query: string; recommendations: { title: string; articleId: string; score: number }[] } | null;
}

export interface ChatsDTO extends Pagination {
  conversations: ChatDTO[];
}

export interface ChatDTO {
  id: string;
  number: string;
  initialMessage: string;
  messageCount: number;
  createdOn: string;
  createdBy: string;
  state: EntityReference | null;
}

export interface GetChatsRequestDTO {
  filters?: {
    stateKeys?: number[];
    searchQuery?: string;
  };
  pagination?: {
    limit?: number;
    offset?: number;
  };
  sortBy?: {
    field?: string;
    order?: "asc" | "desc";
  };
}
