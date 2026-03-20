Tooling
- Stack: React, TypeScript, Vite, Vitest, ESLint, Prettier
- UI Library: Oxygen UI (WSO2 design system)
- Package manager: pnpm
- Test command: pnpm test
- Lint command: pnpm lint
- Dev command: pnpm run dev
- Theme: Acrylic Orange only, no border radius except borderRadius: "50%" for circular avatars/icons


Preferences
- License header: WSO2 Apache 2.0 in every file (lines 1-15), one blank line after header
- Comments: Components get JSDoc with description and @returns; functions/hooks get JSDoc with @param/@returns
- Path aliases: @components/, @api/, @pages/, @layouts/, @config/, @constants/, @context/, @hooks/, @models/, @utils/, @providers/, @assets/
- Max line length 100 characters where practical
- Pages are composition only, no inline component implementations
- Types: Define interfaces for all props, APIs, request/response shapes
- Tests: Colocated in __tests__/ directories, use Vitest and @testing-library/react


Coding Patterns
- React hooks for state and side effects
- TanStack Query (@tanstack/react-query) for API state management
- Oxygen UI components for all UI elements
- Theme spacing system via sx prop
- API hooks pattern: useGet*, usePost*, usePatch*, useDelete* in @api/
- Custom colors via theme palette or colors from @wso2/oxygen-ui
- Loading states with Skeleton components
- Error handling with try/catch and error boundaries


Business Context
- Domain: Customer support portal for WSO2 products
- Projects contain deployments
- Deployments contain deployed products (WSO2 product instances)
- Products have versions, updates, cores, TPS, release dates, EOL dates
- Product updates track update level, date, and details
- Update history displayed in timeline format with edit/delete capabilities
- Backend API uses Ballerina


Project Structure
- webapp/src/components/: Reusable UI components
- webapp/src/pages/: Page-level components (composition only)
- webapp/src/api/: API hooks using TanStack Query
- webapp/src/models/: TypeScript types and interfaces
- webapp/src/constants/: Static configuration and constants
- webapp/src/hooks/: Custom React hooks
- webapp/src/utils/: Utility functions
- webapp/src/layouts/: Layout components
- backend/: Ballerina backend service


Call Request Flows
- "Pending on Customer" status added to CallRequestStatus constants
- CALL_REQUEST_STATE_CUSTOMER_REJECTED = 4, CALL_REQUEST_STATE_PENDING_ON_WSO2 = 2 constants added
- CallRequestCard shows Approve/Reject buttons when state is "Pending on Customer", Reschedule/Cancel otherwise
- Reject: PATCH with stateKey=4, no utcTimes, no reason required
- Approve: opens ApproveCallRequestModal with only preferred time field, PATCH with stateKey=2 and utcTimes
- PatchCallRequest.reason is now optional (string | undefined)
- Canceled state (key 6) is filtered out from callRequestStates in useGetProjectFilters response
- ApproveCallRequestModal, MissingTimezoneDialog colocated in calls-tab folder alongside other modals
- formatUtcToLocal accepts optional userTimeZone param (4th arg) for IANA timezone formatting
- CallsPanel fetches useGetUserDetails for userTimeZone; shows MissingTimezoneDialog once per mount if not set; clicking "Set Time Zone" opens UserProfileModal inline
- CallRequestCard/CallRequestList thread userTimeZone down for time display
- RequestCallModal and ApproveCallRequestModal show "Your current time zone is X" hint when userTimeZone is set

Recent Updates
- Product update history now tracked via ProductUpdate[] in DeploymentProductItem
- ManageProductModal includes Update History tab with timeline UI
- Update operations (add/edit/delete) use PATCH /deployments/:deploymentId/products/:productId
- AddProductModal no longer includes Initial Update Information section
- UpdateHistoryTab component displays timeline with edit/delete inline actions
- Current update level badge shows highest update level
- Update level selection uses dropdown populated from API endpoints
- GET /updates/recommended-update-levels fetches product-specific recommendations with startingUpdateLevel and endingUpdateLevel
- POST /updates/levels/search retrieves detailed update information by product name, version, and level range
- Update descriptions auto-fill from API when update level is selected
- Recommended update level badge displays when available for product
- Update level dropdown shows plain integers (not "U"-prefixed)
- Description field is optional
- Add Update form has Clear and Add Update buttons in same row
- API hook: usePostUpdateLevelsSearch (uses startingUpdateLevel and endingUpdateLevel parameters)
