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

import { type JSX } from "react";
import { Box, Button, Stack, Typography } from "@wso2/oxygen-ui";
import { useNavigate } from "react-router";

interface ErrorPageProps {
  illustration: string;
  illustrationAlt: string;
  title: string;
  description: string;
}

export default function ErrorPage({
  illustration,
  illustrationAlt,
  title,
  description,
}: ErrorPageProps): JSX.Element {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 3,
        py: 6,
      }}
    >
      <Stack spacing={3} alignItems="center" sx={{ maxWidth: 640 }}>
        <Box
          component="img"
          src={illustration}
          alt={illustrationAlt}
          sx={{
            width: "100%",
            maxWidth: 480,
            height: "auto",
          }}
        />
        <Typography variant="h4" component="h1" textAlign="center">
          {title}
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          textAlign="center"
        >
          {description}
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button variant="outlined" onClick={() => navigate(-1)}>
            Go back
          </Button>
          <Button variant="contained" onClick={() => navigate("/")}>
            Go home
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
