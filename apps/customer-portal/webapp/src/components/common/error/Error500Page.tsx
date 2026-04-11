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

import type { ImgHTMLAttributes, JSX } from "react";
import illustration from "@assets/error/error-500.svg";

/**
 * Error500Page component for displaying a full-page error state.
 * Used when data fails to load (e.g. projects in Project Hub).
 */
const Error500Page = (
  props: ImgHTMLAttributes<HTMLImageElement>,
): JSX.Element => (
  <img
    src={illustration}
    alt=""
    aria-hidden="true"
    width={268}
    height={191}
    {...props}
  />
);

export default Error500Page;
