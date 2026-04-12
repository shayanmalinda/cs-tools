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

// User profile information.
export type UserProfile = {
  name: string;
  email: string;
  avatar: string;
}

// User details response from API.
export type UserDetails = {
  id: string;
  email: string;
  lastName: string;
  firstName: string;
  timeZone: string;
  phoneNumber?: string | null;
  avatar?: string | null;
  roles?: string[];
  lastPasswordUpdateTime?: string;
}

// Project user (invited/registered) for project users list.
export type ProjectUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: "Invited" | "Registered";
}

// Response from POST /projects/:projectId/contacts/validate.
export type ValidateContactResponse = {
  isContactValid: boolean;
  message: string;
  contactDetails?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    isCsAdmin: boolean;
    isCsIntegrationUser: boolean;
    account?: {
      id: string;
      domainList: string | null;
      classification: string;
      isPartner: boolean;
    };
  };
}

// Project contact from GET /projects/:projectId/contacts.
export type ProjectContact = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isCsAdmin: boolean;
  isCsIntegrationUser: boolean;
  isSecurityContact: boolean;
  membershipStatus: string;
  account?: {
    id: string;
    domainList?: string[] | null;
    classification: string;
    isPartner: boolean;
  };
}

// Integration user from GET /projects/projectId/integration-users.
export type IntegrationUser = {
  id: string;
  email: string;
}

// Request body for PATCH /users/me (partial update, only changed fields).
export type PatchUserMeRequest = {
  phoneNumber?: string;
  timeZone?: string;
  firstName?: string;
  lastName?: string;
}

// Request body for creating a project contact (POST /projects/:projectId/contacts).
export type CreateProjectContactRequest = {
  contactEmail: string;
  contactFirstName: string;
  contactLastName: string;
  isCsIntegrationUser: boolean;
  isSecurityContact: boolean;
}

// Request body for validating a project contact (POST /projects/:projectId/contacts/validate).
export type ValidateContactRequest = {
  contactEmail: string;
}
