Implemented product update history management UI with timeline visualization.
- Removed "Initial Update Information" section from `webapp/src/components/project-details/deployments/AddProductModal.tsx`.
- Updated `webapp/src/models/requests.ts` to include updates array in `PatchDeploymentProductRequest`.
- Created `webapp/src/components/project-details/deployments/UpdateHistoryTab.tsx` with timeline UI showing update level, date, and description.
- Updated `webapp/src/components/project-details/deployments/ManageProductModal.tsx` to enable Update History tab and integrate UpdateHistoryTab component.
- Added inline edit and delete functionality for individual updates in timeline.
- Implemented add new update form with validation for update level and date fields.
- Added loading skeleton for update history tab.
- Updated `webapp/src/api/usePatchDeploymentProduct.ts` logging to include updates array.
- Created test file `webapp/src/components/project-details/deployments/__tests__/UpdateHistoryTab.test.tsx`.
- Current update level badge displays highest update level from updates array.
- Timeline sorted by date (newest first).
- Updates sent via PATCH /deployments/:deploymentId/products/:productId with payload: { updates: [{ date, details, updateLevel }] }.

Enhanced update history with API-driven update level dropdown.
- Uses existing `webapp/src/api/usePostUpdateLevelsSearch.ts` to fetch update level details via POST /updates/levels/search.
- Uses `webapp/src/api/useGetRecommendedUpdateLevels.ts` to fetch recommended update levels from GET /updates/recommended-update-levels.
- Modified `webapp/src/components/project-details/deployments/UpdateHistoryTab.tsx` to use dropdown for update level selection instead of manual input.
- Dropdown populated with available update levels (displays as plain integers, not "U"-prefixed).
- Update level search requires startingUpdateLevel and endingUpdateLevel from recommended update levels API.
- Automatically pre-fills description field when update level is selected from dropdown using API data.
- Added recommended update level badge showing product-specific recommendation from /updates/recommended-update-levels.
- Description field labeled as "Description (Optional)" to indicate it's not required.
- Edit mode also uses dropdown for update level selection.
- Removed duplicate Close button from UpdateHistoryTab - now only in ManageProductModal DialogActions.
- Props include productName, productVersion (no onClose).
- ManageProductModal passes product.product.label and product.version to UpdateHistoryTab.
- Fixed sorting/editing issue: handlers use stable update identifiers (updateLevel + date) instead of rendered indices.
- Added aria-labels to edit and delete IconButtons for accessibility.
- Improved formatDate to avoid UTC date parsing issues by manually extracting YYYY-MM-DD components.
- Normalized ProductUpdate.details from null to undefined before sending to API.
- Updated logging to avoid leaking sensitive update details (logs only updatesCount).
- Fixed editForm not resetting: added useEffect to reset form when update prop or isEditing changes.
- Fixed build errors: removed unused imports, corrected prop usage, fixed test assertions.

Fixed ProjectDetails tab spacing and hidernation glitch.
- Wrapped TabBar and content in Box container to match other pages' layout (SecurityPage, SettingsPage).
- Uses existing `useInfiniteProjects` from `webapp/src/api/useGetProjects.ts` to fetch project type early.
- Flattens project pages and finds current project from cached projects list.
- Updated ProjectDetails to use projectTypeLabel from projects list instead of waiting for full project details.
- Eliminates UI glitch where tabs appear then disappear during loading.
- Project type determined from already-cached projects search data, no additional API call needed.
- Tab visibility determined immediately based on projectTypeLabel from search, not from detailed project fetch.

Updated ManageProductModal button layout for consistency.
- Add Update button now appears in DialogActions row (same row as Close button) when on Update History tab.
- Product Details tab: Close + Save Changes buttons in DialogActions.
- Update History tab: Close + Add Update buttons in DialogActions.
- UpdateHistoryTab uses renderAddButton render prop pattern to allow parent to control button rendering.
- Button state (disabled, loading) managed by UpdateHistoryTab, rendered by ManageProductModal in DialogActions.

Implement timezone-aware call request time display with missing timezone prompt.
- Extended formatUtcToLocal in utils/support.ts with optional 4th userTimeZone param for IANA timezone display.
- Created MissingTimezoneDialog.tsx: small dialog prompting timezone setup with Later/Set Time Zone actions.
- Added userTimeZone prop to CallRequestCard and CallRequestList to display times in user's timezone.
- Added userTimeZone prop to RequestCallModal and ApproveCallRequestModal showing "Your current time zone is X" hint.
- Updated CallsPanel to call useGetUserDetails, derive userTimeZone, auto-show MissingTimezoneDialog once per mount when timezone is missing, and open UserProfileModal when "Set Time Zone" is clicked.
- Added MissingTimezoneDialog.test.tsx; updated CallsPanel.test.tsx to mock useGetUserDetails and UserProfileModal (37 tests passing).

Implement Call Request Approve/Reject flow for "Pending on Customer" state.
- Added CALL_REQUEST_STATE_CUSTOMER_REJECTED=4, CALL_REQUEST_STATE_PENDING_ON_WSO2=2, and PENDING_ON_CUSTOMER label to supportConstants.ts.
- Filtered Canceled state (key 6) from callRequestStates in useGetProjectFilters.ts response.
- Updated PatchCallRequest.reason to optional in models/requests.ts; usePatchCallRequest.ts only includes reason in body when defined.
- Created ApproveCallRequestModal.tsx with preferred time input and PATCH stateKey=2 + utcTimes.
- Updated CallRequestCard.tsx: shows Approve/Reject buttons when state is "Pending on Customer", Reschedule/Cancel otherwise.
- Updated CallRequestList.tsx and CallsPanel.tsx to wire onApproveClick and onRejectClick.
- Reject handler in CallsPanel.tsx calls PATCH inline with stateKey=4 (no modal required).
- Added ApproveCallRequestModal.test.tsx and updated CallRequestCard.test.tsx, CallRequestList.test.tsx, CallsPanel.test.tsx with new tests (32 tests passing).

Fix call request search filters, reject flow with reason, and dynamic state keys from project filters.
- Fixed MetadataItem.id type comparison bug in useGetProjectFilters (string vs number; was always true, nothing filtered).
- Updated useGetCallRequests to accept optional stateKeys param; sends filters.stateKeys in search body when provided.
- CallsPanel now calls useGetProjectFilters to derive callRequestStateKeys (all non-Canceled state IDs) for the search query.
- approveStateKey and rejectStateKey derived from filter labels; cancel falls back to CALL_REQUEST_STATE_CANCELLED constant.
- Created RejectCallRequestModal.tsx with mandatory reason field, same structure as DeleteCallRequestModal.
- ApproveCallRequestModal accepts approveStateKey prop with fallback to CALL_REQUEST_STATE_PENDING_ON_WSO2.
- Fixed useGetCallRequests.test.tsx: mocks useAuthApiClient directly (was using fragile vi.stubGlobal fetch stub).
- Added RejectCallRequestModal.test.tsx; added stateKeys filter test; 49 tests passing.
