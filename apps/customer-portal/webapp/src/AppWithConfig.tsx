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

import type { JSX } from "react";
import { BrowserRouter } from "react-router";
import { OxygenUIThemeProvider } from "@wso2/oxygen-ui";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import App from "./App";
import { AsgardeoProvider } from "@asgardeo/react";
import { themeConfig } from "@config/themeConfig";
import { loggerConfig } from "@config/loggerConfig";
import LoggerProvider from "@context/logger/LoggerProvider";
import { authConfig } from "@config/authConfig";
import { AUTH_NOT_READY_ERROR_MESSAGE } from "@constants/apiConstants";

const AUTH_TOKEN_ERROR_MESSAGES = [
  AUTH_NOT_READY_ERROR_MESSAGE,
  "Unable to retrieve ID token",
];

/**
 * Custom retry function for React Query.
 * Retries on auth-not-ready token errors (up to 3 times) and on 502/503.
 *
 * @param {number} failureCount - The number of times the request has failed.
 * @param {Error} error - The error that occurred.
 * @returns {boolean} True if the request should be retried, false otherwise.
 */
function shouldRetry(failureCount: number, error: Error): boolean {
  if (failureCount >= 3) {
    return false;
  }

  // Retry transient auth-token errors — token may not be ready right after sign-in
  if (
    error instanceof Error &&
    AUTH_TOKEN_ERROR_MESSAGES.some((msg) => error.message.includes(msg))
  ) {
    return failureCount < 3;
  }

  // Check if error has a status code property
  const statusCode = (error as any)?.response?.status || (error as any)?.status;

  // Only retry on 502 (Bad Gateway) and 503 (Service Unavailable)
  return statusCode === 502 || statusCode === 503;
}

function retryDelay(_attemptIndex: number, error: unknown): number {
  // Short backoff for token-not-ready errors: 500ms, 1s, 2s
  if (
    error instanceof Error &&
    AUTH_TOKEN_ERROR_MESSAGES.some((msg) => error.message.includes(msg))
  ) {
    return Math.min(500 * 2 ** _attemptIndex, 2000);
  }
  return Math.min(1000 * 2 ** _attemptIndex, 30000);
}

const queryClient: QueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: shouldRetry,
      retryDelay,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: shouldRetry,
      retryDelay,
    },
  },
});

export default function AppWithConfig(): JSX.Element {
  return (
    <AsgardeoProvider
      baseUrl={authConfig.baseUrl}
      clientId={authConfig.clientId}
      afterSignInUrl={authConfig.signInRedirectURL}
      afterSignOutUrl={authConfig.signOutRedirectURL}
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      periodicTokenRefresh
      storage="localStorage"
      scopes={["openid", "email", "groups"]}
      preferences={{
        theme: {
          inheritFromBranding: false,
        },
        user: {
          fetchUserProfile: false,
          fetchOrganizations: false,
        },
      }}
    >
      <BrowserRouter>
        <LoggerProvider config={loggerConfig}>
          <OxygenUIThemeProvider theme={themeConfig}>
            <QueryClientProvider client={queryClient}>
              <App />
              <ReactQueryDevtools initialIsOpen={false} />
            </QueryClientProvider>
          </OxygenUIThemeProvider>
        </LoggerProvider>
      </BrowserRouter>
    </AsgardeoProvider>
  );
}
