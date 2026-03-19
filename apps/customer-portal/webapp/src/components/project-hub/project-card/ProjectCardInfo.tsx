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

import { Box, Form, Tooltip, Typography } from "@wso2/oxygen-ui";
import { type JSX, useMemo, useRef, useState, useEffect } from "react";
import { stripHtmlTags } from "@utils/projectCard";

interface ProjectCardInfoProps {
  title: string;
  subtitle: string;
}

/**
 * Renders a clampable line with optional tooltip when truncated.
 *
 * @param {Object} props - text, lineClamp, variant, sx.
 * @returns {JSX.Element} Typography wrapped in Tooltip when truncated.
 */
function ClampedTextWithTooltip({
  text,
  lineClamp,
  variant = "body2",
  sx = {},
}: {
  text: string;
  lineClamp: number;
  variant?: "h6" | "body2";
  sx?: Record<string, unknown>;
}): JSX.Element {
  const ref = useRef<HTMLParagraphElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setIsTruncated(el.scrollHeight > el.clientHeight);
  }, [text]);

  const content = (
    <Typography
      ref={ref}
      variant={variant}
      sx={{
        display: "-webkit-box",
        WebkitLineClamp: lineClamp,
        WebkitBoxOrient: "vertical",
        overflow: "hidden",
        textOverflow: "ellipsis",
        wordBreak: "break-word",
        whiteSpace: "normal",
        ...sx,
      }}
    >
      {text}
    </Typography>
  );

  if (isTruncated) {
    return (
      <Tooltip title={text} arrow placement="top">
        {content}
      </Tooltip>
    );
  }
  return content;
}

// Fixed heights so all cards match: 2-line title and 4-line description.
const TITLE_BLOCK_HEIGHT = "3.2rem"; // 2 lines at ~1.6rem line-height
const DESCRIPTION_BLOCK_HEIGHT = "6rem"; // 4 lines at ~1.5rem line-height

/**
 * Component to render the title and subheader for the Project Card.
 * Title clamped to 2 lines, description to 4 lines; fixed block heights so all cards match; tooltip when truncated.
 *
 * @param {ProjectCardInfoProps} props - The props for the component.
 * @returns {JSX.Element} The rendered info section.
 */
export default function ProjectCardInfo({
  title,
  subtitle,
}: ProjectCardInfoProps): JSX.Element {
  const strippedSubtitle = useMemo(() => stripHtmlTags(subtitle), [subtitle]);
  const displayTitle = title || "--";
  const displaySubtitle = strippedSubtitle || "--";

  return (
    <Form.CardHeader
      sx={{ pt: 1.5 }}
      title={
        <Box sx={{ height: TITLE_BLOCK_HEIGHT, overflow: "hidden" }}>
          <ClampedTextWithTooltip
            text={displayTitle}
            lineClamp={2}
            variant="h6"
            sx={{ mb: 1 }}
          />
        </Box>
      }
      subheader={
        <Box sx={{ height: DESCRIPTION_BLOCK_HEIGHT, overflow: "hidden" }}>
          <ClampedTextWithTooltip
            text={displaySubtitle}
            lineClamp={4}
          />
        </Box>
      }
    />
  );
}
