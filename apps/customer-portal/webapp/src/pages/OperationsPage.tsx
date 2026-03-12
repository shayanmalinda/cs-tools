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

import { type JSX } from "react";
import { Box, Grid, Stack } from "@wso2/oxygen-ui";
import { useParams } from "react-router";
import SupportStatGrid from "@components/common/stat-grid/SupportStatGrid";
import ServiceRequestCard from "@components/support/request-cards/ServiceRequestCard";
import ChangeRequestCard from "@components/support/request-cards/ChangeRequestCard";
import {
  OPERATIONS_STAT_CONFIGS,
  type OperationsStatKey,
} from "@constants/supportConstants";
import useGetProjectDetails from "@api/useGetProjectDetails";
import { PROJECT_TYPE_LABELS } from "@constants/projectDetailsConstants";

/**
 * OperationsPage component. Displays operations statistics and
 * Service Request / Change Request cards.
 *
 * @returns {JSX.Element} The rendered Operations page.
 */
export default function OperationsPage(): JSX.Element {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: project } = useGetProjectDetails(projectId || "");
  const isManagedCloudSubscription =
    project?.type?.label === PROJECT_TYPE_LABELS.MANAGED_CLOUD_SUBSCRIPTION;

  const stats: Partial<Record<OperationsStatKey, number>> | undefined =
    undefined;
  const isError = false;

  return (
    <Stack spacing={3}>
      <Box>
        <SupportStatGrid<OperationsStatKey>
          isLoading={stats === undefined}
          isError={isError}
          entityName="operations"
          stats={stats}
          configs={OPERATIONS_STAT_CONFIGS}
        />
      </Box>
      {isManagedCloudSubscription && (
        <Box sx={{ mt: 3 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, lg: 6 }}>
              <ServiceRequestCard />
            </Grid>
            <Grid size={{ xs: 12, lg: 6 }}>
              <ChangeRequestCard />
            </Grid>
          </Grid>
        </Box>
      )}
    </Stack>
  );
}
