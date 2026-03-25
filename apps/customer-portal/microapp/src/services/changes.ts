import apiClient from "@src/services/apiClient";
import type {
  PaginatedArray,
  GetChangeRequestsRquestDTO,
  ChangeRequestSummary,
  ChangeRequestsDTO,
  ChangeRequestDTO,
  ChangeRequest,
  ChangeRequestsStatsDTO,
} from "@src/types";
import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";

import {
  CHANGE_REQUEST_DETAILS_ENDPOINT,
  CHANGE_REQUEST_STATS_ENDPOINT,
  PROJECT_CHANGE_REQUESTS_ENDPOINT,
} from "@src/config/endpoints";

const getAllChangeRequests = async (
  id: string,
  body: GetChangeRequestsRquestDTO = {},
): Promise<PaginatedArray<ChangeRequestSummary>> => {
  const response = (await apiClient.post<ChangeRequestsDTO>(PROJECT_CHANGE_REQUESTS_ENDPOINT(id), body)).data;
  const result = response.changeRequests.map(toChangeRequestSummary) as PaginatedArray<ChangeRequestSummary>;
  result.pagination = {
    totalRecords: response.totalRecords,
    offset: response.offset,
    limit: response.limit,
  };

  return result;
};

const getChangeRequest = async (id: string): Promise<ChangeRequest> => {
  const response = (await apiClient.get<ChangeRequestDTO>(CHANGE_REQUEST_DETAILS_ENDPOINT(id))).data;
  return toChangeRequest(response);
};

const getChangeRequestsStats = async (id: string): Promise<ChangeRequestsStatsDTO> => {
  return (await apiClient.get<ChangeRequestsStatsDTO>(CHANGE_REQUEST_STATS_ENDPOINT(id))).data;
};

/* Mappers */
function toChangeRequestSummary(dto: ChangeRequestsDTO["changeRequests"][number]): ChangeRequestSummary {
  return {
    id: dto.id,
    number: dto.number,
    title: dto.title,
    description: dto.case?.label ?? "",
    requestType: dto.type?.label,
    impactId: dto.impact?.id,
    statusId: dto.state?.id,
    assignedTeam: dto.assignedTeam?.label,
    endDate: dto.endDate ? new Date(dto.endDate.replace(" ", "T")) : undefined,
    createdOn: new Date(dto.createdOn.replace(" ", "T")),
    updatedOn: new Date(dto.updatedOn.replace(" ", "T")),
  };
}

function toChangeRequest(dto: ChangeRequestDTO): ChangeRequest {
  return {
    id: dto.id,
    number: dto.number,
    title: dto.title,
    description: dto.case?.label ?? "",
    requestType: dto.type?.label,
    impactId: dto.impact?.id,
    statusId: dto.state?.id,
    endDate: dto.endDate ? new Date(dto.endDate.replace(" ", "T")) : undefined,
    createdOn: new Date(dto.createdOn.replace(" ", "T")),
    updatedOn: new Date(dto.updatedOn.replace(" ", "T")),
    createdBy: dto.createdBy,
    approvedOn: dto.approvedOn ? new Date(dto.approvedOn.replace(" ", "T")) : undefined,
    approvedBy: dto.approvedBy ?? undefined,
    duration: dto.duration ?? undefined,
    hasCustomerApproved: dto.hasCustomerApproved,
    hasCustomerReviewed: dto.hasCustomerReviewed,
    assignedTeam: dto.assignedTeam?.label,
    serviceOutage: dto.serviceOutage ?? undefined,
    rollbackPlan: dto.rollbackPlan ?? undefined,
    communicationPlan: dto.communicationPlan ?? undefined,
    testPlan: dto.testPlan ?? undefined,
    deployment: dto.deployment?.label,
  };
}

/* Query Options */
export const changeRequests = {
  get: (id: string) => queryOptions({ queryKey: ["change-request", id], queryFn: () => getChangeRequest(id) }),

  all: (id: string, body: GetChangeRequestsRquestDTO = {}) =>
    queryOptions({
      queryKey: ["change-requests", id, body],
      queryFn: () => getAllChangeRequests(id, body),
    }),

  paginated: (id: string, body: GetChangeRequestsRquestDTO = {}) =>
    infiniteQueryOptions({
      queryKey: ["change-requests", "paginated", id, body],
      queryFn: ({ pageParam }) =>
        getAllChangeRequests(id, { ...body, pagination: { ...body.pagination, offset: pageParam } }),
      initialPageParam: 0,
      getNextPageParam: (lastPage) => {
        const { offset, limit, totalRecords } = lastPage.pagination;
        const nextOffset = offset + 1;
        const totalPages = Math.ceil(totalRecords / limit);
        return nextOffset >= totalPages ? undefined : nextOffset;
      },
    }),

  stats: (id: string) =>
    queryOptions({
      queryKey: ["change-requests-stats", id],
      queryFn: () => getChangeRequestsStats(id),
      staleTime: 0,
      gcTime: 0,
    }),
};
