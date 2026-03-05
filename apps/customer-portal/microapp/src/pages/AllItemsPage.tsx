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

import {
  FilterSlotBuilder,
  ItemCardExtended,
  ItemCardExtendedSkeleton,
  type ItemCardProps,
} from "@components/features/support";
import { Stack } from "@wso2/oxygen-ui";
import { useSearchParams } from "react-router-dom";
import { useLayout } from "@context/layout";
import { Suspense, useLayoutEffect } from "react";

import { useSuspenseQuery } from "@tanstack/react-query";
import { cases } from "@src/services/cases";
import { useProject } from "@context/project";
import { ErrorBoundary } from "@components/core";
import { chats } from "../services/chats";
import { ITEM_DETAIL_PATHS } from "./SupportPage";

export default function AllItemsPage({ type }: { type: ItemCardProps["type"] }) {
  const [searchParams] = useSearchParams();
  const filter = searchParams.get("filter") ?? "all";
  const search = (searchParams.get("search") ?? "").toLowerCase();

  return (
    <Stack gap={2}>
      <ErrorBoundary fallback={<ItemsListContentSkeleton />}>
        <Suspense fallback={<ItemsListContentSkeleton />}>
          <ItemsListContent type={type} filter={filter} search={search} />
        </Suspense>
      </ErrorBoundary>
    </Stack>
  );
}

export function FilterAppBarSlot({ type }: { type: ItemCardProps["type"] | "notifications" }) {
  const { projectId } = useProject();
  const { data: filters } = useSuspenseQuery(cases.filters(projectId!));

  const SEARCH_PLACEHOLDER_CONFIG: Record<typeof type, string> = {
    case: "Search cases by ID, title, or description...",
    chat: "Search chats by ID, title, or message...",
    service: "",
    change: "",
    notifications: "Search Notifications",
  };

  return (
    <FilterSlotBuilder
      searchPlaceholder={SEARCH_PLACEHOLDER_CONFIG[type]}
      tabs={filters.caseStates.map((filter) => ({ label: filter.label, value: filter.id }))}
    />
  );
}

function ItemsListContent({ type, filter, search }: { type: ItemCardProps["type"]; filter: string; search: string }) {
  const layout = useLayout();
  const { projectId } = useProject();

  const caseQuery =
    type === "case"
      ? useSuspenseQuery(cases.all(projectId!, filter !== "all" ? { filters: { statusIds: [Number(filter)] } } : {}))
      : null;

  const chatQuery =
    type === "chat"
      ? useSuspenseQuery(chats.all(projectId!, filter !== "all" ? { filters: { stateKeys: [Number(filter)] } } : {}))
      : null;

  const items = type === "case" ? (caseQuery?.data ?? []) : type === "chat" ? (chatQuery?.data ?? []) : [];

  useLayoutEffect(() => {
    layout.setSubtitleSlotOverride(`${items.length} of ${items.length}`);

    return () => {
      layout.setSubtitleSlotOverride(null);
    };
  });

  return (
    <>
      {items.map((item) => (
        <ItemCardExtended key={item.id} type={type} to={ITEM_DETAIL_PATHS[type](item.id)} {...item} />
      ))}
    </>
  );
}

function ItemsListContentSkeleton() {
  return (
    <>
      {Array.from({ length: 10 }).map((_, index) => (
        <ItemCardExtendedSkeleton key={index} />
      ))}
    </>
  );
}
