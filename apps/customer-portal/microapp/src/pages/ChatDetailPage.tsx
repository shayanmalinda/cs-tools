import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useEffect, useLayoutEffect, useState } from "react";
import { Box, Grid, Skeleton, Stack, Typography, pxToRem } from "@wso2/oxygen-ui";
import { BookOpen, MessageSquare } from "@wso2/oxygen-ui-icons-react";
import { StatusChip } from "@components/features/support";
import { InfoField, OverlineSlot, StickyCommentBar } from "@components/features/detail";
import {
  ConversationFeedback,
  MessageBubble,
  MessageBubbleSkeleton,
  type ChatMessage,
} from "@components/features/chat";
import { useLayout } from "@context/layout";
import { SectionCard } from "@components/shared";
import { useParams } from "react-router-dom";
import { useMutation, useQueries, useQuery } from "@tanstack/react-query";
import { chats } from "@src/services/chats";
import { useProject } from "../context/project";
import type { MessageDispatchDTO } from "../types/chat.dto";
import { projects } from "../services/projects";

dayjs.extend(relativeTime);

export default function ChatDetailPage() {
  const layout = useLayout();
  const [comment, setComment] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const { id } = useParams();
  const { projectId } = useProject();
  const { data } = useQuery(chats.get(id!));
  const { data: comments, isLoading: isCommentsLoading } = useQuery(chats.comments(id!));

  const { mutate: createMessage, isPending: isCreatingMessage } = useMutation({
    ...chats.send(projectId!, id!),
    onSuccess: (response) => {
      setMessages((prev) => [
        ...prev,
        {
          author: "assistant",
          blocks: [{ type: "text", value: response.content }],
          timestamp: dayjs(response.timestamp).fromNow(),
        },
      ]);
    },
  });

  const { data: deployments = [] } = useQuery(projects.deployments(projectId!));

  const productQueries = useQueries({
    queries: deployments.map((deployment) => ({
      ...projects.products(deployment.id),
      enabled: !!deployment.id,
    })),
  });

  const envProducts = deployments.reduce((acc, deployment, index) => {
    const products = productQueries[index]?.data ?? [];
    const productNames = products.map((p) => p.name);

    return {
      ...acc,
      [deployment.name]: productNames,
    };
  }, {});

  const handleSend = () => {
    if (!comment.trim()) return;

    setMessages((prev) => [
      ...prev,
      {
        author: "you",
        blocks: [{ type: "text", value: comment }],
        timestamp: dayjs().fromNow(),
      },
    ]);

    const payload: Omit<MessageDispatchDTO, "region" | "tier"> = { message: comment, envProducts: envProducts };
    createMessage(payload);
    setComment("");
  };

  useEffect(() => {
    setMessages(
      comments?.map((comment) => ({
        author: comment.createdBy === "Novera" ? "assistant" : "you",
        blocks: [{ type: "text", value: comment.content || "" }],
        timestamp: dayjs(comment.createdOn).fromNow(),
      })) || [],
    );
  }, [comments]);

  const AppBarSlot = () => (
    <Stack direction="row" justifyContent="space-between" gap={1.5} mt={1}>
      {data ? (
        <>
          <StatusChip id={data.statusId} size="small" />

          <Stack direction="row" gap={3}>
            <Stack direction="row" alignItems="center" gap={1}>
              <Box color="text.secondary">
                <MessageSquare size={pxToRem(14)} />
              </Box>
              <Typography variant="body2" color="text.secondary">
                {data.count} messages
              </Typography>
            </Stack>

            <Stack direction="row" alignItems="center" gap={1}>
              <Box color="text.secondary">
                <BookOpen size={pxToRem(14)} />
              </Box>
              <Typography variant="body2" color="text.secondary">
                0 KB articles
              </Typography>
            </Stack>
          </Stack>
        </>
      ) : (
        <>
          <Skeleton variant="text" width={50} height={35} />

          <Stack direction="row" gap={3}>
            <Stack direction="row" alignItems="center" gap={1}>
              <Box color="text.secondary">
                <MessageSquare size={pxToRem(14)} />
              </Box>
              <Skeleton variant="text" width={100} height={35} />
            </Stack>

            <Stack direction="row" alignItems="center" gap={1}>
              <Box color="text.secondary">
                <BookOpen size={pxToRem(14)} />
              </Box>
              <Skeleton variant="text" width={100} height={35} />
            </Stack>
          </Stack>
        </>
      )}
    </Stack>
  );

  useLayoutEffect(() => {
    layout.setTitleOverride(data?.description ?? <Skeleton variant="text" width="100%" height={35} />);
    layout.setOverlineSlotOverride(<OverlineSlot type="chat" id={data?.number} />);
    layout.setAppBarSlotsOverride(<AppBarSlot />);

    return () => {
      layout.setTitleOverride(undefined);
      layout.setOverlineSlotOverride(undefined);
      layout.setAppBarSlotsOverride(undefined);
    };
  }, [data]);

  return (
    <>
      <Stack gap={2} mb={10}>
        <SectionCard title="Chat Information">
          <Grid spacing={1.5} container>
            <Grid size={6}>
              <InfoField label="Started" value={dayjs(data?.createdOn).format("MMM D, YYYY h:mm A")} />
            </Grid>
            <Grid size={6}>
              <InfoField label="Resolved" value={undefined} />
            </Grid>
            <Grid size={6}>
              <InfoField label="Duration" value={undefined} />
            </Grid>
            <Grid size={6}>
              <InfoField
                label="Status"
                value={
                  data?.statusId ? (
                    <StatusChip id={data.statusId} size="small" />
                  ) : (
                    <Skeleton variant="text" width={50} height={30} />
                  )
                }
              />
            </Grid>
          </Grid>
        </SectionCard>
        <SectionCard title="Conversation">
          {isCommentsLoading ? (
            <MessagesListContentSkeleton />
          ) : (
            <Stack gap={2} mt={1}>
              {messages.map((message, index) => (
                <MessageBubble key={index} {...message} sx={{ bgcolor: "background.default" }} />
              ))}
            </Stack>
          )}
        </SectionCard>
        <ConversationFeedback />
      </Stack>
      <StickyCommentBar
        loading={isCreatingMessage}
        placeholder="Continue with the chat"
        value={comment}
        onChange={setComment}
        onSend={handleSend}
      />
    </>
  );
}

function MessagesListContentSkeleton({ count = 6 }: { count?: number }) {
  return (
    <Stack gap={2} p={2} width="100%">
      {Array.from({ length: count }).map((_, index) => {
        const author = index % 2 === 0 ? "assistant" : "you";

        return <MessageBubbleSkeleton key={index} author={author} />;
      })}
    </Stack>
  );
}
