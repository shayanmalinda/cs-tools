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

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { CallRequest } from "@models/responses";
import CallRequestList from "@case-details-calls/CallRequestList";

const mockRequests: CallRequest[] = [
  {
    id: "call-1",
    case: { id: "case-1", label: "CS0438719" },
    reason: "Note 1",
    preferredTimes: ["2024-10-29 14:00:00"],
    durationMin: 60,
    scheduleTime: "2024-11-05 14:00:00",
    createdOn: "2024-10-29 10:00:00",
    updatedOn: "2024-10-29 10:00:00",
    state: { id: "1", label: "Pending on WSO2" },
  },
  {
    id: "call-2",
    case: { id: "case-1", label: "CS0438719" },
    reason: "Note 2",
    preferredTimes: ["2024-11-01 10:00:00"],
    durationMin: 30,
    scheduleTime: "2024-11-06 10:00:00",
    createdOn: "2024-11-01 09:30:00",
    updatedOn: "2024-11-01 09:30:00",
    state: { id: "2", label: "Scheduled" },
  },
];

describe("CallRequestList", () => {
  it("should render all call requests in the list", () => {
    render(<CallRequestList requests={mockRequests} />);

    expect(screen.getAllByText(/Call Request/i)).toHaveLength(2);
    expect(screen.getByText(/Note 1/i)).toBeInTheDocument();
    expect(screen.getByText(/Note 2/i)).toBeInTheDocument();
    expect(screen.getByText(/Pending on WSO2/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Scheduled/i).length).toBeGreaterThan(0);
  });

  it("should call onEditClick with the request when Reschedule button is clicked", () => {
    const onEditClick = vi.fn();
    render(
      <CallRequestList requests={mockRequests} onEditClick={onEditClick} />,
    );
    const rescheduleButtons = screen.getAllByRole("button", {
      name: /Reschedule/i,
    });
    fireEvent.click(rescheduleButtons[0]);
    expect(onEditClick).toHaveBeenCalledTimes(1);
    expect(onEditClick).toHaveBeenCalledWith(mockRequests[0]);
  });
});
