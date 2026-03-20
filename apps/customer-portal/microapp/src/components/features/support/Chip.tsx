import { alpha, Chip, type ChipProps } from "@wso2/oxygen-ui";

import {
  CASE_STATUS_CHIP_COLOR_CONFIG,
  CHANGE_REQUEST_STATUS_CHIP_COLOR_CONFIG,
  CONVERSATION_STATUS_CHIP_COLOR_CONFIG,
  IMPACT_CHIP_COLOR_CONFIG,
  PRIORITY_CHIP_COLOR_CONFIG,
} from "./config";
import { useProject } from "@root/src/context/project";
import { useSuspenseQuery } from "@tanstack/react-query";
import { cases } from "@src/services/cases";
import type { ItemCardProps } from ".";
import { overrideOrDefault } from "@root/src/utils/others";

interface PriorityChipProps extends Omit<ChipProps, "label"> {
  prefix?: string;
  id?: string;
  type?: ItemCardProps["type"];
}

export function PriorityChip({ prefix, id, type = "case", ...props }: PriorityChipProps) {
  const { projectId } = useProject();
  const { data } = useSuspenseQuery(cases.filters(projectId!));

  const label =
    (() => {
      switch (type) {
        case "change":
          return data.changeRequestImpacts;
        default:
          return data.severities;
      }
    })()
      .find((s) => s.id === id)
      ?.label.replace(/^\d+ - /, "") ?? "N/A";

  const color =
    (() => {
      switch (type) {
        case "change":
          return IMPACT_CHIP_COLOR_CONFIG;
        default:
          return PRIORITY_CHIP_COLOR_CONFIG;
      }
    })()?.[id ?? ""] ?? "default";

  return (
    <Chip
      label={`${prefix ? `${prefix}: ` : ""}${overrideOrDefault(label)}`}
      {...props}
      sx={(theme) => {
        if (color === "default") {
          return {
            bgcolor: alpha(theme.palette.text.primary, 0.08),
            color: theme.palette.text.secondary,
          };
        }

        return {
          bgcolor: alpha(theme.palette[color].light, 0.1),
          color: theme.palette[color].light,
        };
      }}
    />
  );
}

interface StatusChipProps extends Omit<ChipProps, "label"> {
  id?: string;
  type?: ItemCardProps["type"];
}

export function StatusChip({ id, type = "case", ...props }: StatusChipProps) {
  const { projectId } = useProject();
  const { data } = useSuspenseQuery(cases.filters(projectId!));

  const label =
    (() => {
      switch (type) {
        case "chat":
          return data.conversationStates;
        case "change":
          return data.changeRequestStates;
        default:
          return data.caseStates;
      }
    })().find((s) => s.id === id)?.label ?? "N/A";

  const color =
    (() => {
      switch (type) {
        case "chat":
          return CONVERSATION_STATUS_CHIP_COLOR_CONFIG;
        case "change":
          return CHANGE_REQUEST_STATUS_CHIP_COLOR_CONFIG;
        default:
          return CASE_STATUS_CHIP_COLOR_CONFIG;
      }
    })()?.[id ?? ""] ?? "default";

  return (
    <Chip
      color={color}
      label={label}
      {...props}
      sx={(theme) => {
        if (color === "default") {
          return {
            bgcolor: alpha(theme.palette.text.primary, 0.08),
            color: theme.palette.text.secondary,
          };
        }

        return {
          bgcolor: alpha(theme.palette[color].light, 0.1),
          color: theme.palette[color].light,
        };
      }}
    />
  );
}
