# PLAN: Multi-page UI and copy fixes

Overall Goal: Fix sign-out UI behavior, related-case preselection, icons/text, and layout tweaks across dashboard, operations, project details, usage metrics, settings, and case creation flows.

---

### Step 1: Fix sign-out overlay visuals
- Goal: Keep the sign-out/loading screen on the expected light style instead of switching to a dark background.
- Files: `src/AppWithConfig.tsx`
- Verify: Sign out from the profile menu and confirm the overlay stays light with visible "Signing out..." text and progress bar.

### Step 2: Fix Open Related Case deployment/product auto-selection
- Goal: Ensure `Open Related Case` preselects both deployment and product consistently on the create-related-case page.
- Files: `src/features/support/pages/CaseDetailsPage.tsx`, `src/features/support/pages/CreateCasePage.tsx` (and helper usage if needed)
- Verify: From a closed case, click `Open Related Case` and confirm deployment + product are preselected without manual input.

### Step 3: Update Operations stat icon for Action Required Changes
- Goal: Replace the current icon with a more suitable action-required icon in the Operations page stat card.
- Files: `src/features/support/constants/supportConstants.ts`
- Verify: Open `/operations` and confirm the "Action Required Changes" card displays the updated icon.

### Step 4: Remove Open Cases stat from Project Statistics section
- Goal: Hide/remove the `Open Cases` card from project details statistics as requested.
- Files: `src/features/project-details/constants/projectDetailsConstants.ts` (and related tests if needed)
- Verify: Open project details overview and confirm `Open Cases` no longer appears in Project Statistics.

### Step 5: Reduce Usage Metrics sub-navigation width
- Goal: Slightly reduce the deployment sub-tab area width in usage metrics to improve layout balance.
- Files: `src/features/usage-metrics/components/UsageAndMetricsTabContent.tsx`
- Verify: Open `/usage-metrics` and confirm the sub-nav width is visibly narrower while remaining usable.

### Step 6: Adjust AI settings banner tone and admin-only text
- Goal: Make the AI settings banner a lighter grey and update admin-only copy.
- Files: `src/features/settings/components/SettingsAiAssistant.tsx`, `src/features/settings/constants/settingsConstants.ts`
- Verify: Open AI Assistant settings; banner appears lighter grey and text reads exactly `Users with Admin role can only update this setting`.

### Step 7: Rename "Deployment Type" label to "Deploymnet"
- Goal: Change label copy where requested in case/service request/security report analysis creation forms.
- Files: `src/features/support/components/case-creation-layout/form-sections/basic-information-section/BasicInformationSection.tsx` (and any constants/usages needed)
- Verify: Open create case, create service request, and security report analysis create flows; label reads `Deploymnet`.

### Final Step: Cleanup & Validation
- Goal: Run lint/tests for touched scope and ensure no regressions.
- Verify: `pnpm test -- --run`, `pnpm lint` run without new errors for changed files.
# PLAN: Sign-out redirect + list filter visibility + security/usage layout fixes

Overall Goal: Remove unwanted root-hop during sign-out, enforce context-specific filter/status visibility on support/engagement/security list pages, and fix security components skeleton overflow and usage-metrics tab overflow behavior.

---

### Step 1: Prevent root navigation during sign-out flow
- Goal: Ensure sign-out does not briefly navigate/render root route before final redirect.
- Files: `src/components/header/UserProfile.tsx`, `src/providers/IdleTimeoutProvider.tsx`, `src/layouts/AuthGuard.tsx` (and any minimal shared sign-out state key if needed).
- Verify: Trigger sign-out from header and idle dialog; confirm "Signing out…" loader persists until browser leaves app without root bounce.

### Step 2: Support cases/conversations filter visibility rules
- Goal: Apply requested UX rules:
  - hide status filter on outstanding support cases route
  - hide filter button entirely on conversations `?statusFilter=active`
  - for conversations `?statusFilter=resolvedViaChat`, status options show only Converted + Resolved.
- Files: `src/features/support/pages/AllCasesPage.tsx`, `src/features/support/pages/AllConversationsPage.tsx`, and supporting list-view components if needed.
- Verify: Route-test each URL and validate filter/status behavior.

### Step 3: Engagements and security stat-drilldown filter button visibility
- Goal: Hide filter button when viewing stat-drilldown contexts:
  - Engagements Outstanding / Completed / On Hold
  - Security center Outstanding Security Reports / Resolved Recent Activity.
- Files: `src/features/engagements/pages/EngagementsPage.tsx`, `src/features/engagements/components/EngagementsListSection.tsx`, `src/features/engagements/types/engagements.ts`, `src/features/security/components/SecurityReportAnalysis.tsx`.
- Verify: Click each stat card and confirm filter button is hidden in filtered drilldown state.

### Step 4: Security components skeleton/layout overflow
- Goal: Make components-tab loading skeleton/layout visually match table area and avoid page overflow.
- Files: `src/features/security/components/ProductVulnerabilitiesTable.tsx`, `src/features/security/components/ProductVulnerabilitiesList.tsx`, `src/features/security/components/ProductVulnerabilitiesTableSkeleton.tsx` (as needed).
- Verify: Open `security-center?tab=components` during loading and confirm skeleton stays inside viewport.

### Step 5: Usage-metrics deployment sub-tab horizontal overflow
- Goal: Ensure deployment-heavy usage metrics tabs remain usable with horizontal scrolling.
- Files: `src/features/usage-metrics/components/UsageAndMetricsTabContent.tsx` (or adjust if additional wrapper is required).
- Verify: Project with many deployments keeps content in viewport and allows horizontal scrolling on sub-nav.

### Final Step: Cleanup & Validation
- Goal: Validate no regressions in touched routes/components.
- Verify: Run targeted tests (if available), then `pnpm run build` and resolve any introduced errors.

Overall Goal: Update case details activity/header layout, tighten dashboard-driven filtering behavior (including operations active-count usage), improve settings disabled-action tooltip UX, and add truncation tooltip behaviors for long text in case titles and header project switcher.

---

### Step 1: Case details activity alignment and width
- Goal: Render all activity comments on left side (no right-aligned current-user comments) and make comment cards use full available width.
- Files: `src/features/support/components/case-details/activity-tab/CommentBubble.tsx`, `src/features/support/components/case-details/activity-tab/CaseDetailsActivityPanel.tsx`, `src/features/support/components/case-details/activity-tab/ChatMessageCard.tsx`, related tests
- Verify: Activity comment bubbles are consistently left-aligned, card widths are full, and skeleton alignment matches.

### Step 2: Case details header/action-row redesign
- Goal: Remove the old left summary block (`Manage Case Status` + support engineer avatar row), place `Assigned Engineer : {name}` on the second header line next to status with divider, and keep action buttons right-aligned with existing action logic.
- Files: `src/features/support/components/case-details/header/CaseDetailsHeader.tsx`, `src/features/support/components/case-details/header/CaseDetailsActionRow.tsx`, `src/features/support/components/case-details/details-tab/CaseDetailsContent.tsx`, `src/features/support/components/case-details/header/CaseDetailsSkeleton.tsx`, related types/tests
- Verify: Header shows status + divider + assigned engineer on second line; action buttons remain functional and right aligned; skeleton mirrors new structure.

### Step 3: Case title truncation and tooltip
- Goal: Clamp case title to two lines and show full content in tooltip when truncated.
- Files: `src/features/support/components/case-details/header/CaseDetailsHeader.tsx`, supporting tests if needed
- Verify: Long title shows at most two lines with ellipsis; hover tooltip reveals full title.

### Step 4: Settings disabled action tooltip behavior
- Goal: Remove static “admins only” display and show tooltip message only when hovering disabled actions (generate/actions menu) in restricted mode.
- Files: `src/features/settings/components/SettingsRegistryTokens.tsx`, related settings constants/tests (if needed)
- Verify: Tooltip appears only on disabled controls; no persistent admin-only text.

### Step 5: Dashboard operations count source and resilience
- Goal: In Outstanding Operations chart data mapping, use `activeCount` for both service requests and change requests while keeping existing fallback/resilience logic for project capability permutations.
- Files: `src/features/dashboard/pages/DashboardPage.tsx`, optional utility/helpers if needed, related tests
- Verify: Chart counts are sourced from `activeCount` when present; existing no-error behavior for only-SR/only-CR projects remains.

### Step 6: Dashboard navigation-driven filter visibility
- Goal: Hide severity + status filters when navigating from severity chart to cases page; hide stat row and status filter when navigating to outstanding SR/CR pages from operations chart.
- Files: `src/features/support/pages/AllCasesPage.tsx`, `src/features/components/list-view/ListSearchPanel.tsx`, `src/components/list-view/ListFilters.tsx`, `src/features/operations/pages/ServiceRequestsPage.tsx`, `src/features/operations/pages/ChangeRequestsPage.tsx`
- Verify: Expected filters/stats are hidden only in dashboard outstanding navigation context.

### Step 7: Header project dropdown truncation tooltip
- Goal: Truncate long project names in header project switcher with ellipsis and show full project name on hover tooltip.
- Files: `src/components/header/ProjectSwitcher.tsx`, related header tests
- Verify: Long selected project name truncates with ellipsis; hover displays full name tooltip.

### Final Step: Cleanup & Validation
- Goal: Run targeted tests and lint for all changed files.
- Verify: `pnpm vitest` on impacted suites and `pnpm eslint` on touched files complete without errors/warnings.
# PLAN: Dashboard dark-mode chart and legend blue shade update

Overall Goal: Make dashboard page charts and their legends use the DOM-observed dark mode state, and in dark mode force chart/legend colors to `colors.blue[300]` only on dashboard charts.

---

### Step 1: Add shared shade constant for dashboard dark-mode chart override
- Goal: Define a single dashboard chart dark-mode shade value (`300`) for consistency.
- Files: `src/features/dashboard/constants/charts.ts`
- Verify: TypeScript build passes and constant is used by dashboard chart components.

### Step 2: Apply DOM-observed dark-mode color override in dashboard chart components
- Goal: Use `useDarkMode` hook and apply `colors.blue[shade]` to chart slices and legends only when dark mode is active.
- Files: `src/features/dashboard/components/charts/ActiveCasesChart.tsx`, `src/features/dashboard/components/charts/CasesTrendChart.tsx`, `src/features/dashboard/components/charts/OutstandingIncidentsChart.tsx`
- Verify: Dashboard charts keep existing colors in light mode and use blue 300 for slices/legends in dark mode.

### Step 3: Validate with focused tests/lint checks
- Goal: Ensure no regressions in chart rendering behavior.
- Files: dashboard chart test files (if needed)
- Verify: Related tests/lint run clean for updated files.

### Final Step: Cleanup & Validation
- Goal: Run lint/tests for touched files and confirm no issues.
- Verify: Project checks complete without errors for changed files.
# PLAN: Use Project Features API for permissions and severity

Overall Goal: Replace hardcoded project-type and `hasPdpSubscription` permission/severity logic with API-driven project features from `/projects/{projectId}/features`, including SRA and time-log based UI access.

---

### Step 1: Add project-features API model and query hook
- Goal: Introduce typed API access for project feature flags and accepted severity values.
- Files: `src/features/project-hub/types/projects.ts`, `src/constants/apiConstants.ts`, `src/api/useGetProjectFeatures.ts` (new)
- Verify: TypeScript compiles with no type errors for the new hook/types.

### Step 2: Refactor permission utilities to consume feature payload
- Goal: Replace project-type branching in permission helpers with a single mapping from features response.
- Files: `src/types/permission.ts`, `src/utils/permission.ts`, affected utility tests in `src/utils/__tests__/permission.test.ts`
- Verify: Permission utility tests pass with API-driven expectations.

### Step 3: Wire feature-based permissions into page/layout consumers
- Goal: Update pages/components currently using `getProjectPermissions(projectType, { hasPdpSubscription })` to use project feature data only.
- Files: `src/components/side-nav-bar/SideBar.tsx`, `src/features/project-details/pages/ProjectDetails.tsx`, `src/features/dashboard/pages/DashboardPage.tsx`, `src/features/operations/pages/OperationsPage.tsx`, `src/features/operations/pages/ServiceRequestsPage.tsx`, `src/features/operations/pages/CreateServiceRequestPage.tsx`, `src/features/security/pages/SecurityPage.tsx`, `src/features/security/components/SecurityReportAnalysis.tsx`, `src/components/header/GetHelpDropdown.tsx`, `src/features/support/pages/AllCasesPage.tsx`, `src/features/support/pages/SupportPage.tsx`
- Verify: Components compile and feature gates align to API flags (`hasSra*`, `hasTimeLogsReadAccess`, etc.).

### Step 4: Use API-provided severities for support flows
- Goal: Ensure accepted severity options and S0 handling come from `acceptedSeverityValues` instead of project-type hardcoding.
- Files: support severity-related pages/components and helpers discovered in implementation (e.g. case creation/filter utils)
- Verify: Severity options rendered from API list and fallback behavior remains safe when features are unavailable.

### Final Step: Cleanup & Validation
- Goal: Run lint/type checks and finalize targeted changes only.
- Verify: `npm run lint` and relevant tests complete without introduced errors.
