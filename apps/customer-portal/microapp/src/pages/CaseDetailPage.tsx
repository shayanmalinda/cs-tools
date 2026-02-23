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

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useLayoutEffect, useState } from "react";
import { User, Users } from "@wso2/oxygen-ui-icons-react";
import { Grid, Skeleton, Stack } from "@wso2/oxygen-ui";
import {
  ActivityTimelineEntrySkeleton,
  InfoField,
  OverlineSlot,
  StickyCommentBar,
  TimelineEntry,
} from "@components/features/detail";
import { PriorityChip, StatusChip } from "@components/features/support";
import { SectionCard } from "@components/shared";
import { Timeline } from "@components/ui";
import { useLayout } from "@context/layout";
import { cases } from "@src/services/cases";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { useProject } from "@context/project";

dayjs.extend(relativeTime);

export default function CaseDetailPage() {
  const layout = useLayout();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState("");

  const { id } = useParams();
  const { projectId } = useProject();
  const { data, isLoading } = useQuery(cases.get(id!));
  const { data: filters, isLoading: isFiltersLoading } = useQuery(cases.filters(projectId!));
  const { data: comments, isFetching: isCommentsRefetching } = useQuery({
    ...cases.comments(id!),
    select: (data) => [...data].sort((a, b) => a.createdOn.getTime() - b.createdOn.getTime()),
  });

  const issueType = filters?.issueTypes.find((issueType) => issueType.id === data?.issueTypeId)?.label;
  const severity = filters?.severities.find((severity) => severity.id === data?.severityId)?.label;

  const AppBarSlot = () =>
    data ? (
      <Stack direction="row" gap={1.5} mt={1}>
        <StatusChip id={data.statusId} size="small" />
        <PriorityChip id={data.severityId} size="small" />
      </Stack>
    ) : (
      <Stack direction="row" gap={1.5} mt={1}>
        <Skeleton variant="rounded" width={70} height={24} sx={{ borderRadius: "16px" }} />
        <Skeleton variant="rounded" width={70} height={24} sx={{ borderRadius: "16px" }} />
      </Stack>
    );

  useLayoutEffect(() => {
    layout.setTitleOverride(data?.title ?? <Skeleton variant="text" width="100%" height={35} />);
    layout.setOverlineSlotOverride(<OverlineSlot type="case" id={data?.number} />);
    layout.setAppBarSlotsOverride(<AppBarSlot />);

    return () => {
      layout.setTitleOverride(undefined);
      layout.setOverlineSlotOverride(undefined);
      layout.setAppBarSlotsOverride(undefined);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const mutation = useMutation({
    ...cases.createComment(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", id] });
      setComment("");
    },
  });

  const isSendingComment = mutation.status !== "idle" && mutation.isPending && isCommentsRefetching;

  const handleSend = () => {
    if (!comment.trim()) return;

    mutation.mutate({
      content: comment,
      type: "comments",
    });
  };

  return (
    <>
      <Stack gap={2} mb={10}>
        <SectionCard title="Case Information">
          <Grid spacing={1.5} container>
            <Grid size={12}>
              <InfoField label="Description" value={data?.description} />
            </Grid>
            <Grid size={6}>
              <InfoField label="Assignee" value={isLoading ? undefined : (data?.assigned ?? "N/A")} icon={Users} />
            </Grid>
            <Grid size={6}>
              <InfoField label="Reporter" value={isLoading ? undefined : (data?.reporter ?? "N/A")} icon={User} />
            </Grid>
            <Grid size={6}>
              <InfoField label="Category" value={isLoading || isFiltersLoading ? undefined : (issueType ?? "N/A")} />
            </Grid>
            <Grid size={6}>
              <InfoField label="Severity" value={isLoading || isFiltersLoading ? undefined : (severity ?? "N/A")} />
            </Grid>
            <Grid size={12}>
              <InfoField label="Affected Service" value={isLoading ? undefined : data?.product || "N/A"} />
            </Grid>
            <Grid size={6}>
              <InfoField
                label="Created"
                value={data?.createdOn
                  ?.toLocaleString("en-US", {
                    month: "short",
                    day: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })
                  .replace("at", " ")}
              />
            </Grid>
            <Grid size={6}>
              <InfoField label="Last Updated" value={data?.updatedOn && dayjs(data.updatedOn).fromNow()} />
            </Grid>
          </Grid>
        </SectionCard>
        <SectionCard title="Activity Timeline">
          <Timeline>
            {comments ? (
              comments.map((props, index) => (
                <TimelineEntry
                  key={index}
                  variant="activity"
                  title={props.content}
                  author={props.createdBy}
                  timestamp={dayjs(props.createdOn).fromNow()}
                  last={index === comments.length - 1}
                />
              ))
            ) : (
              <>
                {Array.from({ length: 10 }).map((_, index) => (
                  <ActivityTimelineEntrySkeleton key={index} />
                ))}
              </>
            )}
          </Timeline>
        </SectionCard>
      </Stack>
      <StickyCommentBar
        placeholder="Add Comment"
        value={comment}
        onChange={setComment}
        onSend={handleSend}
        loading={isSendingComment}
      />
    </>
  );
}
