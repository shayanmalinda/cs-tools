import type { EntityReference, Pagination } from "@src/types";

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
