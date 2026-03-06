// Copyright (c) 2026 WSO2 LLC. (https://www.wso2.com).
//
// WSO2 LLC. licenses this file to you under the Apache License,
// Version 2.0 (the "License"); you may not use this file except
// in compliance with the License. You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied. See the License for the
// specific language governing permissions and limitations
// under the License.

import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Paper,
  Skeleton,
  Typography,
} from "@wso2/oxygen-ui";
import {
  ChevronDown,
  FileText,
  Network,
  Package,
  RefreshCw,
  Settings,
  Shield,
  ShieldAlert,
} from "@wso2/oxygen-ui-icons-react";
import type { ComponentType, JSX } from "react";
import type { Catalog, CatalogItem } from "@models/responses";

export interface CatalogSelectorProps {
  catalogs: Catalog[] | undefined;
  isLoading: boolean;
  selectedCatalogId: string;
  selectedCatalogItemId: string;
  onSelectCatalogItem: (catalogId: string, catalogItemId: string) => void;
}

interface CatalogIconConfig {
  Icon: ComponentType<{ size?: number; color?: string }>;
  iconColor: string;
  bgColor: string;
}

const CATALOG_ICON_MAP: Array<{
  pattern: RegExp;
  config: CatalogIconConfig;
}> = [
  {
    pattern: /operational\s*request/i,
    config: {
      Icon: RefreshCw,
      iconColor: "#3B82F6",
      bgColor: "#DBEAFE",
    },
  },
  {
    pattern: /certificate/i,
    config: {
      Icon: Shield,
      iconColor: "#22C55E",
      bgColor: "#DCFCE7",
    },
  },
  {
    pattern: /information\s*request/i,
    config: {
      Icon: FileText,
      iconColor: "#8B5CF6",
      bgColor: "#EDE9FE",
    },
  },
  {
    pattern: /artifact\s*deployment/i,
    config: {
      Icon: Package,
      iconColor: "#F97316",
      bgColor: "#FFEDD5",
    },
  },
  {
    pattern: /security|vulnerability|patching/i,
    config: {
      Icon: ShieldAlert,
      iconColor: "#EC4899",
      bgColor: "#FCE7F3",
    },
  },
  {
    pattern: /product\s*change/i,
    config: {
      Icon: Settings,
      iconColor: "#6366F1",
      bgColor: "#EEF2FF",
    },
  },
  {
    pattern: /infrastructure/i,
    config: {
      Icon: Network,
      iconColor: "#06B6D4",
      bgColor: "#CFFAFE",
    },
  },
];

function getCatalogIconConfig(catalogName: string): CatalogIconConfig {
  const match = CATALOG_ICON_MAP.find(({ pattern }) =>
    pattern.test(catalogName),
  );
  return (
    match?.config ?? {
      Icon: FileText,
      iconColor: "#6B7280",
      bgColor: "#F3F4F6",
    }
  );
}

/**
 * Renders catalogs as expandable groups with selectable catalog items.
 * Matches the design: category cards with colored icons, option counts, and flat sub-items.
 *
 * @param {CatalogSelectorProps} props - Catalogs data and selection state.
 * @returns {JSX.Element} The catalog selector UI.
 */
export default function CatalogSelector({
  catalogs,
  isLoading,
  selectedCatalogId,
  selectedCatalogItemId,
  onSelectCatalogItem,
}: CatalogSelectorProps): JSX.Element {
  if (isLoading) {
    return (
      <Paper variant="outlined" sx={{ p: 3, borderRadius: 0 }}>
        <Typography variant="h6" fontWeight={600} sx={{ mb: 0.5 }}>
          Select Request Type *
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Choose the type of service request you need from the categories below
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Skeleton variant="rounded" height={72} sx={{ borderRadius: 0 }} />
          <Skeleton variant="rounded" height={72} sx={{ borderRadius: 0 }} />
          <Skeleton variant="rounded" height={72} sx={{ borderRadius: 0 }} />
        </Box>
      </Paper>
    );
  }

  if (!catalogs?.length) {
    return (
      <Paper variant="outlined" sx={{ p: 3, borderRadius: 0 }}>
        <Typography variant="h6" fontWeight={600} sx={{ mb: 0.5 }}>
          Select Request Type *
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Choose the type of service request you need from the categories below
        </Typography>
        <Typography variant="body2" color="text.secondary">
          No catalogs available for the selected product.
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 3,
        borderRadius: 0,
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
      }}
    >
      <Typography variant="h6" fontWeight={600} sx={{ mb: 0.5 }}>
        Select Request Type{" "}
        <Box component="span" sx={{ color: "error.main" }}>
          *
        </Box>
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Choose the type of service request you need from the categories below
      </Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {catalogs.map((catalog) => {
          const { Icon, iconColor, bgColor } = getCatalogIconConfig(
            catalog.name,
          );
          const itemCount = catalog.catalogItems?.length ?? 0;
          const optionsLabel =
            itemCount === 1 ? "1 option" : `${itemCount} options`;

          return (
            <Accordion
              key={catalog.id}
              disableGutters
              sx={{
                "&:before": { display: "none" },
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                borderRadius: 0,
                "&.Mui-expanded": { margin: 0 },
                overflow: "hidden",
              }}
            >
              <AccordionSummary
                expandIcon={
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <ChevronDown
                      size={20}
                      className="accordion-chevron"
                      style={{ transition: "transform 0.2s" }}
                    />
                  </Box>
                }
                sx={{
                  borderRadius: 0,
                  px: 2,
                  py: 1.5,
                  minHeight: 56,
                  "& .MuiAccordionSummary-expandIconWrapper.Mui-expanded": {
                    "& .accordion-chevron": {
                      transform: "rotate(180deg)",
                    },
                  },
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    width: "100%",
                  }}
                >
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      bgcolor: bgColor,
                    }}
                  >
                    <Icon size={20} color={iconColor} />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="body1"
                      fontWeight={600}
                      color="text.primary"
                    >
                      {catalog.name}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 0.25 }}
                    >
                      {optionsLabel}
                    </Typography>
                  </Box>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 0, borderRadius: 0, borderTop: 1 }}>
                <Box sx={{ display: "flex", flexDirection: "column" }}>
                  {(catalog.catalogItems ?? []).map((item: CatalogItem, idx) => {
                    const isSelected =
                      selectedCatalogId === catalog.id &&
                      selectedCatalogItemId === item.id;
                    return (
                      <Box
                        key={item.id}
                        component="button"
                        type="button"
                        onClick={() =>
                          onSelectCatalogItem(catalog.id, item.id)
                        }
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "flex-start",
                          width: "100%",
                          px: 2,
                          py: 1.5,
                          textAlign: "left",
                          border: "none",
                          borderBottom:
                            idx < (catalog.catalogItems?.length ?? 1) - 1
                              ? 1
                              : "none",
                          background: isSelected
                            ? "action.selected"
                            : "transparent",
                          cursor: "pointer",
                          borderRadius: 0,
                        }}
                      >
                        <Typography
                          variant="body2"
                          color={
                            isSelected ? "primary" : "text.primary"
                          }
                          fontWeight={isSelected ? 600 : 400}
                        >
                          {item.label}
                        </Typography>
                      </Box>
                    );
                  })}
                  {(!catalog.catalogItems ||
                    catalog.catalogItems.length === 0) && (
                    <Box sx={{ px: 2, py: 2 }}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        No items in this catalog
                      </Typography>
                    </Box>
                  )}
                </Box>
              </AccordionDetails>
            </Accordion>
          );
        })}
      </Box>
    </Paper>
  );
}
