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
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from "@wso2/oxygen-ui";
import { X } from "@wso2/oxygen-ui-icons-react";
import { useCallback, type JSX } from "react";
import type { CallRequest } from "@models/responses";
import { formatUtcToLocal } from "@utils/support";

export interface RejectCallRequestModalProps {
  open: boolean;
  call: CallRequest | null;
  onClose: () => void;
  onConfirm: () => void;
  isRejecting?: boolean;
  userTimeZone?: string;
}

/**
 * Confirmation modal for rejecting a "Pending on Customer" call request.
 * Implemented as PATCH with the Customer Rejected state key.
 *
 * @param {RejectCallRequestModalProps} props - open, call, onClose, onConfirm, isRejecting.
 * @returns {JSX.Element} The reject call request modal.
 */
export default function RejectCallRequestModal({
  open,
  call,
  onClose,
  onConfirm,
  isRejecting = false,
  userTimeZone,
}: RejectCallRequestModalProps): JSX.Element {
  const handleDialogClose = useCallback(
    (_event: object, _reason: string) => {
      if (isRejecting) return;
      onClose();
    },
    [isRejecting, onClose],
  );

  const handleClose = useCallback(() => {
    if (isRejecting) return;
    onClose();
  }, [isRejecting, onClose]);

  const handleConfirm = useCallback(() => {
    if (isRejecting) return;
    onConfirm();
  }, [isRejecting, onConfirm]);

  return (
    <Dialog
      open={open}
      onClose={handleDialogClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="reject-call-request-modal-title"
      aria-describedby="reject-call-request-modal-description"
      slotProps={{
        paper: {
          sx: { position: "relative" },
        },
      }}
    >
      <IconButton
        aria-label="Close"
        size="small"
        onClick={handleClose}
        disabled={isRejecting}
        sx={{
          position: "absolute",
          right: 8,
          top: 8,
          zIndex: 1,
        }}
      >
        <X size={18} />
      </IconButton>
      <DialogTitle id="reject-call-request-modal-title">
        Reject Call Request
      </DialogTitle>
      <DialogContent>
        <Typography
          id="reject-call-request-modal-description"
          color="text.secondary"
        >
          {call
            ? `Are you sure you want to reject the call request${call.scheduleTime ? ` scheduled for ${formatUtcToLocal(call.scheduleTime, "short", true, userTimeZone)}` : ""}?`
            : "Are you sure you want to reject this call request?"}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button variant="outlined" onClick={handleClose} disabled={isRejecting}>
          Go Back
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={handleConfirm}
          disabled={isRejecting}
          startIcon={
            isRejecting ? (
              <CircularProgress size={16} color="inherit" />
            ) : undefined
          }
        >
          {isRejecting ? "Rejecting..." : "Reject"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
