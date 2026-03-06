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
  type JSX,
  useState,
  useEffect,
  useCallback,
  type ChangeEvent,
} from "react";
import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@wso2/oxygen-ui";
import useGetUserDetails from "@api/useGetUserDetails";
import { usePatchUserMe } from "@api/usePatchUserMe";
import { useErrorBanner } from "@context/error-banner/ErrorBannerContext";
import { useSuccessBanner } from "@context/success-banner/SuccessBannerContext";
import { TIME_ZONE_OPTIONS } from "@constants/timeZoneConstants";

export interface UserProfileModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Modal displaying user profile from useGetUserDetails (avatar, name, email)
 * with editable phone number and time zone. PATCH /users/me with only changed fields.
 *
 * @param {UserProfileModalProps} props - open, onClose.
 * @returns {JSX.Element} The profile modal.
 */
export default function UserProfileModal({
  open,
  onClose,
}: UserProfileModalProps): JSX.Element {
  const { showError } = useErrorBanner();
  const { showSuccess } = useSuccessBanner();
  const { data: userDetails, isLoading } = useGetUserDetails();
  const patchUserMe = usePatchUserMe();

  const [phoneNumber, setPhoneNumber] = useState("");
  const [timeZone, setTimeZone] = useState("");

  useEffect(() => {
    if (open && userDetails) {
      setPhoneNumber(userDetails.phoneNumber ?? "");
      setTimeZone(userDetails.timeZone ?? "");
    }
  }, [open, userDetails]);

  const handlePhoneChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => setPhoneNumber(e.target.value),
    [],
  );
  const handleTimeZoneChange = useCallback(
    (e: { target: { value: unknown } }) =>
      setTimeZone(String(e.target.value ?? "")),
    [],
  );

  const handleSave = useCallback(() => {
    if (!userDetails) return;

    const payload: { phoneNumber?: string; timeZone?: string } = {};
    if (String(userDetails.phoneNumber ?? "") !== phoneNumber) {
      payload.phoneNumber = phoneNumber;
    }
    if (String(userDetails.timeZone ?? "") !== timeZone) {
      payload.timeZone = timeZone;
    }

    if (Object.keys(payload).length === 0) {
      onClose();
      return;
    }

    patchUserMe.mutate(payload, {
      onSuccess: () => {
        showSuccess("Profile updated successfully");
        onClose();
      },
      onError: (err) => {
        showError(err?.message ?? "Failed to update profile");
      },
    });
  }, [userDetails, phoneNumber, timeZone, patchUserMe, showSuccess, showError, onClose]);

  const handleClose = useCallback(() => {
    if (!patchUserMe.isPending) {
      onClose();
    }
  }, [onClose, patchUserMe.isPending]);

  const name =
    userDetails?.firstName || userDetails?.lastName
      ? `${userDetails.firstName ?? ""} ${userDetails.lastName ?? ""}`.trim()
      : "--";
  const email = userDetails?.email ?? "--";

  const initials = (() => {
    const first = userDetails?.firstName?.charAt(0) ?? "";
    const last = userDetails?.lastName?.charAt(0) ?? "";
    return (first + last).toUpperCase() || "?";
  })();

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography variant="h6">Profile</Typography>
      </DialogTitle>
      <DialogContent>
        {isLoading || !userDetails ? (
          <Box sx={{ py: 4, textAlign: "center" }}>
            <CircularProgress size={32} />
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3, pt: 1 }}>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 1,
              }}
            >
              <Avatar
                src={userDetails.avatar ?? undefined}
                sx={{
                  width: 80,
                  height: 80,
                  fontSize: "1.5rem",
                  borderRadius: "50%",
                }}
              >
                {!userDetails.avatar ? initials : null}
              </Avatar>
              <Typography variant="h6">{name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {email}
              </Typography>
            </Box>

            <TextField
              label="Phone Number"
              value={phoneNumber}
              onChange={handlePhoneChange}
              fullWidth
              size="small"
            />

            <FormControl fullWidth size="small">
              <InputLabel id="profile-timezone-label">Time Zone</InputLabel>
              <Select
                labelId="profile-timezone-label"
                label="Time Zone"
                value={timeZone}
                onChange={handleTimeZoneChange}
              >
                {TIME_ZONE_OPTIONS.map((tz) => (
                  <MenuItem key={tz} value={tz}>
                    {tz}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={patchUserMe.isPending}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={
            patchUserMe.isPending || isLoading || !userDetails
          }
          startIcon={
            patchUserMe.isPending ? (
              <CircularProgress size={18} sx={{ color: "inherit" }} />
            ) : null
          }
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
