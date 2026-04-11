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
import { Outlet, useParams } from "react-router";
import useGetProjectDetails from "@api/useGetProjectDetails";
import {
  isForbiddenError,
  isUnauthorizedError,
  isNotFoundError,
  getApiErrorMessage,
} from "@api/ApiError";
import {
  Error401Page,
  Error403Page,
  Error404Page,
} from "@components/common/error";

/**
 * ProjectGuard wraps all routes under `projects/:projectId`.
 *
 * It fetches project details once at the layout boundary. If the API
 * returns a 401, 403, or 404 error the guard renders the matching error
 * page with the API-provided message instead of the child route, so no
 * individual page needs to duplicate this logic.
 *
 * @returns {JSX.Element} The child outlet or an error page.
 */
export default function ProjectGuard(): JSX.Element {
  const { projectId } = useParams<{ projectId: string }>();

  const { error } = useGetProjectDetails(projectId ?? "");

  if (isUnauthorizedError(error)) {
    return <Error401Page message={getApiErrorMessage(error)} />;
  }

  if (isForbiddenError(error)) {
    return <Error403Page message={getApiErrorMessage(error)} />;
  }

  if (isNotFoundError(error)) {
    return <Error404Page message={getApiErrorMessage(error)} />;
  }

  return <Outlet />;
}

