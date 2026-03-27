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

/** Returns true if date string is empty or invalid. */
export function isChangeRequestDateAvailable(
  dateStr: string | null | undefined,
): boolean {
  if (!dateStr?.trim()) return false;
  const d = new Date(dateStr.replace(" ", "T"));
  return !Number.isNaN(d.getTime());
}

/**
 * Format API date string for display (weekday, long date, time).
 *
 * @param dateStr - API date e.g. "2026-02-28 15:30:50".
 * @returns Formatted string or "Not available".
 */
export function formatChangeRequestDisplayDate(
  dateStr: string | null | undefined,
): string {
  if (!isChangeRequestDateAvailable(dateStr)) return "Not available";
  try {
    const d = new Date((dateStr ?? "").replace(" ", "T"));
    return d.toLocaleString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "Not available";
  }
}

/**
 * Format minutes as "X hours Y minutes".
 *
 * @param minutes - Total minutes.
 * @returns Human-readable duration.
 */
export function formatChangeRequestDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours} hour${hours === 1 ? "" : "s"}`);
  parts.push(`${mins} minute${mins === 1 ? "" : "s"}`);
  return parts.join(" ");
}

/**
 * Convert datetime-local input value to API format "YYYY-MM-DD HH:mm:ss".
 *
 * @param datetimeLocal - From input type="datetime-local".
 * @returns API format string.
 */
export function changeRequestToApiDatetime(datetimeLocal: string): string {
  if (!datetimeLocal) return "";
  const d = new Date(datetimeLocal);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  const s = String(d.getSeconds()).padStart(2, "0");
  return `${y}-${m}-${day} ${h}:${min}:${s}`;
}

/**
 * Convert API datetime to datetime-local input value.
 *
 * @param apiDatetime - "YYYY-MM-DD HH:mm:ss".
 * @returns Value for input type="datetime-local".
 */
export function changeRequestToDatetimeLocal(apiDatetime: string): string {
  try {
    const d = new Date(apiDatetime.replace(" ", "T"));
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const h = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${y}-${m}-${day}T${h}:${min}`;
  } catch {
    return "";
  }
}
