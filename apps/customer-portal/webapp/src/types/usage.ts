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

import type { PaginationRequest } from "./common";

// Response for GET /projects/:projectId/stats/usage.
export type UsageStatsResponse = {
  deploymentCount: number;
  deployedProductCount: number;
  instanceCount: number;
}

// Reference item used in instance responses.
export type InstanceReferenceItem = {
  id: string;
  label: string;
}

// Deployment metadata within instance metadata.
export type InstanceDeploymentMetadata = {
  os?: string;
  osVersion?: string;
  osArchitecture?: string;
  jdkVersion?: string;
  jdkVendor?: string;
  updateLevel?: string;
  numberOfCores?: string;
}

// Instance metadata nested inside an InstanceItem.
export type InstanceMetadata = {
  id: string;
  coreCount: number | null;
  updates: number | null;
  jdkVersion: string | null;
  deploymentMetadata: InstanceDeploymentMetadata | null;
  createdOn: string;
  updatedOn: string;
  customCreatedOn: string | null;
  customUpdatedOn: string | null;
}

// Single instance object from POST .../instances/search.
export type InstanceItem = {
  id: string;
  key: string;
  project: InstanceReferenceItem | null;
  deployment: InstanceReferenceItem | null;
  product: InstanceReferenceItem | null;
  deployedProduct: InstanceReferenceItem | null;
  createdOn: string;
  updatedOn: string;
  metadata: InstanceMetadata | null;
}

// Response for POST .../instances/search.
export type InstancesResponse = {
  instances: InstanceItem[];
  totalRecords: number;
  offset: number;
  limit: number;
}

// Single period summary entry within an instance usage.
export type InstancePeriodSummary = {
  period: string;
  counts: Record<string, number>;
}

// Per-instance entry in an instance usage response.
export type InstanceUsageEntry = {
  instanceId: string;
  instanceKey: string;
  project: InstanceReferenceItem | null;
  deployment: InstanceReferenceItem | null;
  product: InstanceReferenceItem | null;
  deployedProduct: InstanceReferenceItem | null;
  periodSummaries: InstancePeriodSummary[];
}

// Response for POST .../instances/usages/search.
export type InstanceUsageResponse = {
  usages: InstanceUsageEntry[];
  totalInstances: number;
  startDate: string;
  endDate: string;
}

// Single data point within an instance metric entry.
export type InstanceMetricDataPoint = {
  date: string;
  createdOn: string;
  coreCount: number | null;
  jdkVersion: string | null;
  updates: number | null;
  deploymentMetadata: InstanceDeploymentMetadata | null;
}

// Per-instance entry in an instance metrics response.
export type InstanceMetricEntry = {
  instanceId: string;
  instanceKey: string;
  project: InstanceReferenceItem | null;
  deployment: InstanceReferenceItem | null;
  product: InstanceReferenceItem | null;
  deployedProduct: InstanceReferenceItem | null;
  dataPoints: InstanceMetricDataPoint[];
}

// Response for POST .../instances/metrics/search.
export type InstanceMetricsResponse = {
  metrics: InstanceMetricEntry[];
  totalInstances: number;
  startDate: string;
  endDate: string;
}

// Request body for POST .../instances/search.
export type InstanceSearchRequest = {
  filters?: {
    startDate?: string;
    endDate?: string;
  };
  pagination?: PaginationRequest;
}

// Request body for POST .../instances/usages/search and POST .../instances/metrics/search.
export type InstanceMetricsRequest = {
  filters: {
    startDate: string;
    endDate: string;
  };
}

// --- Usage metrics UI view-model types (from former usageMetrics.types.ts) ---

/** Preset time range for usage charts (placeholder until API exists). */
export type UsageTimeRangePreset = "3m" | "6m" | "12m" | "custom";

/** Environment bucket identifier — the deployment type.id from the API (e.g. "1", "2", "5"). */
export type UsageEnvironmentKind = string;

/** Single point for Recharts / LineChart x-axis rows. */
export type UsageTrendRow = {
  name: string;
  value?: number;
  current?: number;
  average?: number;
}

/** Summary counts on the overview tab. */
export type UsageOverviewSummary = {
  environments: number;
  products: number;
  instances: number;
}

/** Product row inside an expanded environment on the overview tab. */
export type UsageOverviewProductCard = {
  id: string;
  name: string;
  version: string;
  instances: number;
  cores: number;
  transactionsLabel: string;
}

/** Collapsible environment row on the overview tab. */
export type UsageEnvironmentBreakdownRow = {
  id: string;
  kind: UsageEnvironmentKind;
  title: string;
  subtitle: string;
  totalCores: number;
  transactionsLabel: string;
  products: UsageOverviewProductCard[];
}

export type UsageAggregatedMetricDefinition = {
  id: string;
  title: string;
  caption: string;
  headlineValue: string;
  deltaLabel: string;
  stroke: string;
  data: UsageTrendRow[];
  secondaryStroke?: string;
  secondaryName?: string;
}

/** Mini line chart shown when an instance row is expanded. */
export type UsageInstanceChartBlock = {
  title: string;
  caption: string;
  headlineValue: string;
  deltaLabel: string;
  deltaPositive: boolean;
  stroke: string;
  data: UsageTrendRow[];
}

/** Per-instance row when a product is expanded (header + optional drill-down charts). */
export type UsageProductInstanceRow = {
  id: string;
  hostName: string;
  javaVersion: string;
  u2Level: string;
  transactionsLabel: string;
  coreCount: number;
  charts: {
    transactions: UsageInstanceChartBlock;
    cores: UsageInstanceChartBlock;
  };
}

/** Core metric pill labels on the environment product row. */
export type UsageCoreMetricStat = {
  label: string;
  value: string;
}

/** Expandable product within Production / Test / Development tabs. */
export type UsageEnvironmentProduct = {
  id: string;
  name: string;
  version: string;
  runningInstances: number;
  transactionsLabel: string;
  thirdMetricLabel: string;
  thirdMetricValue: string;
  coreMetrics: UsageCoreMetricStat[];
  transactionTrend: UsageTrendRow[];
  coreUsageTrend: UsageTrendRow[];
  instances: UsageProductInstanceRow[];
}
