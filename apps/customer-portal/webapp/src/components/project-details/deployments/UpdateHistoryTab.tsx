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
  Box,
  Button,
  IconButton,
  MenuItem,
  Skeleton,
  TextField,
  Typography,
  alpha,
} from "@wso2/oxygen-ui";
import { SquarePen, Trash2 } from "@wso2/oxygen-ui-icons-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type JSX,
} from "react";
import type { ProductUpdate } from "@models/responses";
import { useGetRecommendedUpdateLevels } from "@api/useGetRecommendedUpdateLevels";
import { usePostUpdateLevelsSearch } from "@api/usePostUpdateLevelsSearch";

export interface UpdateHistoryTabProps {
  updates: ProductUpdate[];
  productName: string;
  productVersion: string;
  isLoading?: boolean;
  onSaveUpdates: (updates: ProductUpdate[]) => Promise<void>;
  onFormStateChange?: (state: {
    canAdd: boolean;
    isSaving: boolean;
    handleAdd: () => void;
  }) => void;
}

interface UpdateFormData {
  updateLevel: string;
  date: string;
  details: string;
}

const INITIAL_FORM: UpdateFormData = {
  updateLevel: "",
  date: "",
  details: "",
};

/**
 * Displays update history timeline and allows adding/editing/deleting updates.
 *
 * @param {UpdateHistoryTabProps} props - updates array, product info, loading state, and save callback.
 * @returns {JSX.Element} The update history tab component.
 */
export default function UpdateHistoryTab({
  updates,
  productName,
  productVersion,
  isLoading,
  onSaveUpdates,
  onFormStateChange,
}: UpdateHistoryTabProps): JSX.Element {
  const [form, setForm] = useState<UpdateFormData>(INITIAL_FORM);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const { data: recommendedUpdateLevels = [] } = useGetRecommendedUpdateLevels();

  const matchedRecommendation = useMemo(() => {
    if (
      !productName ||
      !productVersion ||
      recommendedUpdateLevels.length === 0
    ) {
      return null;
    }

    return recommendedUpdateLevels.find(
      (item) =>
        item.productName === productName &&
        item.productBaseVersion === productVersion,
    );
  }, [productName, productVersion, recommendedUpdateLevels]);

  const searchParams = useMemo(() => {
    if (!productName || !productVersion || !matchedRecommendation) {
      return null;
    }

    return {
      productName,
      productVersion,
      startingUpdateLevel: matchedRecommendation.startingUpdateLevel,
      endingUpdateLevel: matchedRecommendation.endingUpdateLevel,
    };
  }, [productName, productVersion, matchedRecommendation]);

  const { data: updateLevelsData, isLoading: isLoadingUpdateLevels } =
    usePostUpdateLevelsSearch(searchParams);

  const availableUpdateLevels = useMemo(() => {
    if (!updateLevelsData) return [];

    const levels = Object.keys(updateLevelsData)
      .map((key) => parseInt(key, 10))
      .filter((level) => !isNaN(level))
      .sort((a, b) => b - a);

    return levels;
  }, [updateLevelsData]);

  const getUpdateDescription = useCallback(
    (updateLevel: number): string | null => {
      if (!updateLevelsData) return null;

      const levelData = updateLevelsData[String(updateLevel)];
      if (!levelData?.updateDescriptionLevels?.[0]) return null;

      return levelData.updateDescriptionLevels[0].description || null;
    },
    [updateLevelsData],
  );

  const sortedUpdates = useMemo(() => {
    return [...updates].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA;
    });
  }, [updates]);

  const currentUpdateLevel = useMemo(() => {
    if (sortedUpdates.length === 0) return null;
    const levels = sortedUpdates
      .map((u) => u.updateLevel)
      .filter((l): l is number => typeof l === "number");
    return levels.length > 0 ? Math.max(...levels) : null;
  }, [sortedUpdates]);

  const handleFormChange =
    (field: keyof UpdateFormData) => (e: ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setForm((prev) => {
        const next = { ...prev, [field]: value };
        if (field === "updateLevel" && value && !prev.details) {
          const description = getUpdateDescription(parseInt(value, 10));
          if (description) {
            next.details = description;
          }
        }
        return next;
      });
    };

  const handleAddUpdate = useCallback(async () => {
    const updateLevel = parseInt(form.updateLevel, 10);
    if (!form.updateLevel || !form.date || isNaN(updateLevel)) {
      return;
    }

    const newUpdate: ProductUpdate = {
      updateLevel,
      date: form.date,
      details: form.details || undefined,
    };

    setIsSaving(true);
    try {
      await onSaveUpdates([...updates, newUpdate]);
      setForm(INITIAL_FORM);
    } finally {
      setIsSaving(false);
    }
  }, [form, updates, onSaveUpdates]);

  const isFormValid = !!form.updateLevel && !!form.date;

  // Notify parent of form state changes
  useEffect(() => {
    if (onFormStateChange) {
      onFormStateChange({
        canAdd: isFormValid && !isSaving,
        isSaving,
        handleAdd: handleAddUpdate,
      });
    }
  }, [isFormValid, isSaving, handleAddUpdate, onFormStateChange]);

  const handleEditClick = useCallback(
    (update: ProductUpdate) => {
      const index = updates.findIndex(
        (u) => u.updateLevel === update.updateLevel && u.date === update.date,
      );
      setEditingIndex(index);
    },
    [updates],
  );

  const handleDeleteUpdate = useCallback(
    async (update: ProductUpdate) => {
      const newUpdates = updates.filter(
        (u) => !(u.updateLevel === update.updateLevel && u.date === update.date),
      );
      setIsSaving(true);
      try {
        await onSaveUpdates(newUpdates);
      } finally {
        setIsSaving(false);
      }
    },
    [updates, onSaveUpdates],
  );

  const handleSaveEdit = useCallback(
    async (originalUpdate: ProductUpdate, editedUpdate: ProductUpdate) => {
      const index = updates.findIndex(
        (u) =>
          u.updateLevel === originalUpdate.updateLevel &&
          u.date === originalUpdate.date,
      );
      if (index === -1) return;

      const newUpdates = [...updates];
      newUpdates[index] = editedUpdate;
      setIsSaving(true);
      try {
        await onSaveUpdates(newUpdates);
        setEditingIndex(null);
      } finally {
        setIsSaving(false);
      }
    },
    [updates, onSaveUpdates],
  );

  const formatDate = (dateStr: string): string => {
    try {
      const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (match) {
        const [, year, month, day] = match;
        return `${day}/${month}/${year}`;
      }
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  if (isLoading) {
    return <UpdateHistorySkeleton />;
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {currentUpdateLevel !== null && (
        <Box
          sx={{
            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
            border: 1,
            borderColor: (theme) => alpha(theme.palette.primary.main, 0.3),
            p: 2,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Typography
              variant="body2"
              sx={{ fontWeight: 500, color: "text.primary" }}
            >
              Current Update Level:
            </Typography>
            <Typography
              variant="h6"
              sx={{ fontWeight: 600, color: "primary.main" }}
            >
              U{currentUpdateLevel}
            </Typography>
          </Box>
        </Box>
      )}

      <Box>
        <Typography
          variant="subtitle2"
          sx={{ mb: 2, fontWeight: 600, color: "text.primary" }}
        >
          Update History
        </Typography>
        {sortedUpdates.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
            No update history available
          </Typography>
        ) : (
          <Box sx={{ position: "relative" }}>
            <Box
              sx={{
                position: "absolute",
                left: 13,
                top: 0,
                bottom: 0,
                width: "2px",
                bgcolor: "divider",
              }}
            />
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {sortedUpdates.map((update) => {
                const originalIndex = updates.findIndex(
                  (u) =>
                    u.updateLevel === update.updateLevel && u.date === update.date,
                );
                return (
                  <TimelineItem
                    key={`${update.updateLevel}-${update.date}`}
                    update={update}
                    isEditing={editingIndex === originalIndex}
                    onEdit={() => handleEditClick(update)}
                    onDelete={() => handleDeleteUpdate(update)}
                    onSave={(edited) => handleSaveEdit(update, edited)}
                    onCancelEdit={() => setEditingIndex(null)}
                    formatDate={formatDate}
                    isSaving={isSaving}
                    availableUpdateLevels={availableUpdateLevels}
                    isLoadingUpdateLevels={isLoadingUpdateLevels}
                  />
                );
              })}
            </Box>
          </Box>
        )}
      </Box>

      <Box
        sx={{
          borderTop: 1,
          borderColor: "divider",
          pt: 3,
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <Typography
          variant="subtitle2"
          sx={{ fontWeight: 600, color: "text.primary" }}
        >
          Add New Update
        </Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 2,
          }}
        >
          <TextField
            select
            id="new-update-level"
            label="Update Level *"
            value={form.updateLevel}
            onChange={handleFormChange("updateLevel")}
            fullWidth
            size="small"
            disabled={isSaving || isLoadingUpdateLevels}
            sx={{
              "& .MuiSelect-select": {
                color: !form.updateLevel ? "text.secondary" : undefined,
              },
            }}
          >
            <MenuItem value="">
              {isLoadingUpdateLevels ? "Loading..." : "Select Update Level"}
            </MenuItem>
            {availableUpdateLevels.map((level) => (
              <MenuItem key={level} value={level}>
                {level}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            id="new-applied-on"
            label="Applied On *"
            type="date"
            value={form.date}
            onChange={handleFormChange("date")}
            fullWidth
            size="small"
            disabled={isSaving}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Box>
        <TextField
          id="new-update-description"
          label="Description (Optional)"
          placeholder="Brief description about the update..."
          value={form.details}
          onChange={handleFormChange("details")}
          fullWidth
          size="small"
          multiline
          rows={2}
          disabled={isSaving}
        />
        {matchedRecommendation && (
          <Box
            sx={{
              bgcolor: (theme) => alpha(theme.palette.info.main, 0.08),
              border: 1,
              borderColor: (theme) => alpha(theme.palette.info.main, 0.3),
              p: 1.5,
            }}
          >
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Recommended Update Level: U
              {matchedRecommendation.recommendedUpdateLevel}
              {matchedRecommendation.availableUpdatesCount > 0 &&
                ` (${matchedRecommendation.availableUpdatesCount} updates available)`}
            </Typography>
          </Box>
        )}
        {!onFormStateChange && (
          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleAddUpdate}
              disabled={!isFormValid || isSaving}
              sx={{ minWidth: 120 }}
            >
              {isSaving ? "Adding..." : "Add Update"}
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
}

interface TimelineItemProps {
  update: ProductUpdate;
  isEditing: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onSave: (edited: ProductUpdate) => void;
  onCancelEdit: () => void;
  formatDate: (dateStr: string) => string;
  isSaving: boolean;
  availableUpdateLevels: number[];
  isLoadingUpdateLevels: boolean;
}

/**
 * Single timeline item displaying an update entry.
 *
 * @param {TimelineItemProps} props - update data and event handlers.
 * @returns {JSX.Element} The timeline item component.
 */
function TimelineItem({
  update,
  isEditing,
  onEdit,
  onDelete,
  onSave,
  onCancelEdit,
  formatDate,
  isSaving,
  availableUpdateLevels,
  isLoadingUpdateLevels,
}: TimelineItemProps): JSX.Element {
  const [editForm, setEditForm] = useState<ProductUpdate>(update);

  useEffect(() => {
    setEditForm(update);
  }, [update, isEditing]);

  const handleEditChange =
    (field: keyof ProductUpdate) => (e: ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setEditForm((prev) => ({
        ...prev,
        [field]: field === "updateLevel" ? parseInt(value, 10) : value,
      }));
    };

  const handleSave = () => {
    if (editForm.updateLevel && editForm.date) {
      onSave(editForm);
    }
  };

  return (
    <Box sx={{ position: "relative", display: "flex", gap: 2 }}>
      <Box
        sx={{
          position: "relative",
          zIndex: 10,
          flexShrink: 0,
        }}
      >
        <Box
          sx={{
            width: 28,
            height: 28,
            bgcolor: "primary.main",
            border: 4,
            borderColor: "background.paper",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "50%",
          }}
        >
          <Box
            sx={{
              width: 8,
              height: 8,
              bgcolor: "background.paper",
              borderRadius: "50%",
            }}
          />
        </Box>
      </Box>
      <Box
        sx={{
          flex: 1,
          bgcolor: (theme) =>
            theme.palette.mode === "dark" ? "grey.800" : "grey.700",
          color: "white",
          p: 2,
          position: "relative",
          ml: -1,
        }}
      >
        <Box
          sx={{
            position: "absolute",
            left: 0,
            top: 12,
            width: 0,
            height: 0,
            borderTop: "6px solid transparent",
            borderBottom: "6px solid transparent",
            borderRight: (theme) =>
              `8px solid ${theme.palette.mode === "dark" ? theme.palette.grey[800] : theme.palette.grey[700]}`,
            transform: "translateX(-100%)",
          }}
        />
        {isEditing ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 2,
              }}
            >
              <TextField
                select
                label="Update Level"
                value={editForm.updateLevel}
                onChange={handleEditChange("updateLevel")}
                size="small"
                fullWidth
                disabled={isSaving || isLoadingUpdateLevels}
                sx={{
                  "& .MuiInputBase-root": { bgcolor: "background.paper" },
                }}
              >
                <MenuItem value="">
                  {isLoadingUpdateLevels ? "Loading..." : "Select"}
                </MenuItem>
                {availableUpdateLevels.map((level) => (
                  <MenuItem key={level} value={level}>
                    {level}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Date"
                type="date"
                value={editForm.date}
                onChange={handleEditChange("date")}
                size="small"
                fullWidth
                disabled={isSaving}
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{
                  "& .MuiInputBase-root": { bgcolor: "background.paper" },
                }}
              />
            </Box>
            <TextField
              label="Description"
              value={editForm.details || ""}
              onChange={handleEditChange("details")}
              size="small"
              fullWidth
              multiline
              rows={2}
              disabled={isSaving}
              sx={{
                "& .MuiInputBase-root": { bgcolor: "background.paper" },
              }}
            />
            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={onCancelEdit}
                disabled={isSaving}
                sx={{
                  color: "grey.300",
                  borderColor: "grey.600",
                  "&:hover": { borderColor: "grey.400" },
                }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                size="small"
                onClick={handleSave}
                disabled={isSaving || !editForm.updateLevel || !editForm.date}
                sx={{
                  bgcolor: "primary.main",
                  "&:hover": { bgcolor: "primary.dark" },
                }}
              >
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </Box>
          </Box>
        ) : (
          <>
            <Box
              sx={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                mb: 1,
              }}
            >
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 600, color: "white" }}
                  >
                    U{update.updateLevel}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={onEdit}
                    disabled={isSaving}
                    aria-label={`Edit update U${update.updateLevel}`}
                    sx={{
                      color: "grey.300",
                      "&:hover": {
                        color: "primary.light",
                        bgcolor: (theme) => alpha(theme.palette.grey[600], 0.3),
                      },
                    }}
                  >
                    <SquarePen size={12} aria-hidden />
                  </IconButton>
                </Box>
                <Typography variant="body2" sx={{ color: "grey.300", mt: 0.5 }}>
                  Date: {formatDate(update.date)}
                </Typography>
              </Box>
              <IconButton
                size="small"
                onClick={onDelete}
                disabled={isSaving}
                aria-label={`Delete update U${update.updateLevel}`}
                sx={{
                  color: "grey.300",
                  "&:hover": {
                    color: "error.light",
                    bgcolor: (theme) => alpha(theme.palette.grey[600], 0.3),
                  },
                }}
              >
                <Trash2 size={16} aria-hidden />
              </IconButton>
            </Box>
            {update.details && (
              <Typography variant="body2" sx={{ color: "grey.200" }}>
                {update.details}
              </Typography>
            )}
          </>
        )}
      </Box>
    </Box>
  );
}

/**
 * Loading skeleton for update history tab.
 *
 * @returns {JSX.Element} The skeleton component.
 */
function UpdateHistorySkeleton(): JSX.Element {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Skeleton variant="rectangular" width="100%" height={60} />
      <Box>
        <Skeleton variant="text" width={150} height={24} sx={{ mb: 2 }} />
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {[1, 2].map((i) => (
            <Box key={i} sx={{ display: "flex", gap: 2 }}>
              <Skeleton
                variant="circular"
                width={28}
                height={28}
                sx={{ flexShrink: 0 }}
              />
              <Skeleton variant="rectangular" width="100%" height={100} />
            </Box>
          ))}
        </Box>
      </Box>
      <Box sx={{ borderTop: 1, borderColor: "divider", pt: 3 }}>
        <Skeleton variant="text" width={150} height={24} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" width="100%" height={120} />
      </Box>
    </Box>
  );
}
