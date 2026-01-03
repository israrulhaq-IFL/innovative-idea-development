# Copilot Instructions for Innovative Ideas Management System

## Project Overview

This is a modern React-based Innovation Management System with SharePoint 2016 REST API integration. The application provides comprehensive idea submission, approval workflow, task management, discussion forums, and analytics with role-based access control (Admin, Approver, Contributor).

**Current Architecture Focus:**
- **Innovation Hub Dashboard**: Main dashboard with KPI cards, recent ideas, status distribution, and quick actions
- **Idea Submission**: Multi-step form with category selection, priority levels, and file attachments (1MB limit)
- **Approval Workflow**: Approver dashboard with attachment preview (images in modal, PDFs in new tab)
- **My Ideas**: Split-panel view showing user's submitted ideas with detailed information
- **Task Management**: Task creation, assignment, progress tracking with percentage completion
- **Discussion System**: Comprehensive discussion forums with role-based features
  - **Manual Task Discussion Creation**: Task discussions created manually by approvers (not auto-created on task assignment)
  - **Approver-Initiated Idea Discussions**: Approvers create discussions during idea approval process
  - **Separate Discussion Folders in Discussion Board**: 
    - "Discussions I Started as Approver" - Shows discussions created by current user as approver
    - "Discussions on My Ideas" - Shows discussions where user is the idea author
    - "Task Discussions" - Shows task-related discussions where user is a participant
  - **Lock/Unlock Functionality**: 
    - Approvers can lock/unlock discussions from multiple locations:
      - Approver Dashboard (during approval process)
      - Discussion Board (after idea is approved)
      - MyTasks (for task discussions - approvers only)
    - Contributors see lock status but cannot toggle it
    - Locked discussions disable message input and show lock indicator
  - **Auto-Load on Selection**: Discussions automatically load when idea/task is selected in any view
  - **Real-time Updates**: 10-second auto-refresh when discussion panel is open in Approver Dashboard
  - **Discussion State Management**: Proper state updates prevent duplicate discussion creation
  - **API Methods**: 
    - `updateIdeaDiscussionLockStatus(ideaId, isLocked)` - Lock/unlock idea discussions
    - `updateTaskDiscussionLockStatus(taskId, isLocked)` - Lock/unlock task discussions
    - `hasDiscussion(taskId)` / `hasIdeaDiscussions(ideaId)` - Check discussion existence
- **Theme Support**: Complete light/dark theme toggle for all pages and components
- **Idea Trail**: Event tracking system showing idea lifecycle and status changes
- **SharePoint 2016 Integration**: REST API with MCP server for direct list operations
- **Toast Notifications**: User feedback system for actions and validations

## Key Technologies & Architecture

- **Frontend**: React 19 with TypeScript and functional components
- **Build Tool**: Vite for fast development and production builds
- **Styling**: CSS Modules for component-scoped styling with theme support
- **Routing**: React Router DOM with HashRouter for SharePoint compatibility
- **Charts**: Recharts for analytics visualization
- **Animations**: Framer Motion for smooth transitions
- **Backend**: SharePoint 2016 REST API
- **MCP Integration**: Model Context Protocol server for SharePoint operations
- **Testing**: Jest with React Testing Library and Vitest
- **State Management**: React Context for data, user, and theme management

## SharePoint Integration

### Lists Structure
1. **innovative_ideas**: Main ideas list with Category, Priority, Status fields
2. **innovative_idea_discussions**: Discussion threads with TaskIdId, IdeaIdId, IsLocked, InitiatedByApprover fields
   - **TaskIdId**: Links discussion to a task (0 or null for idea-only discussions)
   - **IdeaIdId**: Links discussion to an idea
   - **IsLocked**: Boolean flag indicating if discussion is locked
   - **InitiatedByApprover**: Boolean flag indicating if approver created the discussion
   - **ContentTypeId**: Used to differentiate Discussion (0x0120) from Message (0x0107)
3. **innovative_idea_tasks**: Task assignments with progress tracking and AssignedToId (multi-value user field)
4. **innovative_idea_trail**: Event tracking for idea lifecycle

### Key Features
- **File Attachments**: 1MB size limit with validation and Toast notifications
- **Discussion Management**: 
  - Manual creation by approvers (not auto-created)
  - Lock/unlock functionality with role-based access
  - Separate API methods for idea and task discussions
  - Auto-load on selection to prevent duplicate creation
  - Real-time updates with 10-second polling
- **Date Handling**: ISO 8601 from SharePoint → Date objects → Proper formatting
- **Category & Priority**: Properly mapped from SharePoint to UI (fixed hardcoding issue)
- **Attachment Preview**: Images shown in modal, PDFs open in new tab with ?Web=1

## Code Structure & Conventions

### Component Architecture
- Use functional components with hooks
- TypeScript interfaces for type safety
- CSS Modules for styling (`.module.css` files)
- Component files named `ComponentName.tsx` or `ComponentName.jsx`
- Style files named `ComponentName.module.css`

### File Organization
```
src/
├── components/          # Reusable UI components
│   ├── common/         # Shared components
│   │   ├── LoadingSpinner.tsx
│   │   ├── StatusBar.tsx
│   │   ├── Toast.tsx
│   │   ├── TopUtilityBar.tsx      # Theme toggle, user info
│   │   └── ...
│   ├── control/        # Control panel components
│   │   └── TopControlPanel.tsx
│   ├── AnalyticsComparison.jsx
│   ├── AnalyticsTrends.jsx
│   ├── AssigneeCharts.jsx
│   ├── ChartModal.jsx
│   ├── DashboardSkeleton.jsx
│   ├── KPISection.jsx
│   ├── PriorityCharts.jsx
│   ├── StatusCharts.jsx
│   ├── TaskDrilldownModal.jsx
│   ├── TaskDrilldownPanel.jsx
│   └── ...
├── pages/              # Route-based page components
│   ├── MainDashboard.tsx          # Innovation Hub with light/dark theme
│   ├── IdeaFormPage.tsx           # Idea submission form
│   ├── ApproverDashboard.tsx      # Approval workflow page
│   ├── MyIdeas.tsx                # User's ideas with split-panel
│   ├── MyTasks.tsx                # Task management
│   ├── ApprovedIdeasPage.tsx      # Approved ideas listing
│   ├── IdeaCompletionPage.tsx     # Implementation tracking
│   ├── IdeaTrailModal.tsx         # Idea lifecycle visualization
│   └── ...
├── contexts/           # React context providers
│   ├── DataContext.tsx            # Global data management
│   │   # ProcessedIdea vs Idea interfaces
│   │   # Idea: createdDate, approvedDate (from DataContext)
│   │   # ProcessedIdea: created, modified (from ideaApi)
│   ├── UserContext.tsx            # User and permissions
│   └── ThemeContext.tsx           # Light/dark theme
├── services/           # API services
│   ├── ideaApi.ts                 # Ideas CRUD operations
│   ├── discussionApi.ts           # Discussion operations
│   └── ...
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
├── types/              # TypeScript type definitions
└── styles/             # Global styles
    └── shared-page-theme.module.css  # Shared theme styles
```

### Naming Conventions
- **Components**: PascalCase (e.g., `IdeaCard.tsx`)
- **Functions**: camelCase (e.g., `fetchIdeas()`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_FILE_SIZE`)
- **Files**: kebab-case for utilities, PascalCase for components
- **CSS Modules**: camelCase for class names (e.g., `.ideaCard`)

## Development Guidelines

### State Management
- Use React hooks (`useState`, `useEffect`, `useMemo`) for local component state
- Context providers for global state (data, user, theme)
- **DataContext**: Manages ideas, tasks, discussions, approvers, and trail events
  - `ProcessedIdea` interface (from ideaApi): has `created`, `modified` as Date fields
  - `Idea` interface (from DataContext): has `createdDate`, `approvedDate` as Date fields
  - Status values: "Pending Approval" | "Approved" | "Rejected" | "In Progress" | "Completed"
- **UserContext**: Manages user info and role-based permissions (isAdmin, isApprover, isContributor)
- **ThemeContext**: Manages light/dark theme with localStorage persistence

### Theme System
- **Light Theme**: Light blue gradient background (#f0f4ff → #e6eeff → #dce6ff)
  - White cards with purple accents
  - Dark text (#1f2937)
  - Better shadows and borders
- **Dark Theme**: Dark gradient background (#0f0f23 → #1a1a3e → #0d1b2a)
  - Dark cards with white overlays
  - White/light text
  - Subtle shadows
- **Theme Toggle**: Available in TopUtilityBar component
- **Implementation**: Apply theme classes dynamically: `${theme === 'dark' ? styles.darkTheme : styles.lightTheme}`
- **CSS Structure**: Base styles + theme-specific overrides in same CSS module

### Data Flow & Type Handling
- **SharePoint → ideaApi**: ISO 8601 strings converted to Date objects
- **ideaApi → DataContext**: ProcessedIdea with `created`, `modified` dates
- **DataContext → Components**: Idea with `createdDate`, `approvedDate` dates
- **Date Formatting**: Use `toLocaleDateString()` and `toLocaleString()` with 'en-US' locale
- **Category & Priority**: Properly mapped from SharePoint (fixed hardcoding issue in DataContext)

### Adding New Components
1. Create component file in appropriate directory under `src/components/` or `src/pages/`
2. Create corresponding CSS module file with theme support
3. Use TypeScript interfaces for props and state
4. Add theme classes for light/dark mode support
5. Add tests in `__tests__/` directory

### File Attachments
- **Size Limit**: 1MB (1048576 bytes) enforced in validation
- **Validation**: Check file size before upload, show Toast notification on error
- **Discussion Attachments**: Validated and stored with discussion messages
- **Attachment Preview**: 
  - Images: Show in modal with proper sizing
  - PDFs: Open in new tab with `?Web=1` parameter for SharePoint auth
- **SharePoint Access**: Use `serverRelativeUrl` field from attachments array

### Discussion System
- **Manual Creation**: 
  - Task discussions: Created manually by approvers via "Create Discussion" button in MyTasks
  - Idea discussions: Created by approvers during approval process in ApproverDashboard
  - NOT auto-created on task assignment or idea approval
- **Discussion State Management**:
  - `discussionExists` state tracks if discussion already created
  - Auto-loads discussions when idea/task selected (prevents duplicate "Create Discussion" buttons)
  - State properly updated after creation: `setDiscussionExists(true)` before reload
- **Lock/Unlock System**:
  - **IsLocked Field**: Boolean field in innovative_idea_discussions list
  - **Lock Methods**: 
    - `updateIdeaDiscussionLockStatus(ideaId, isLocked)` - Updates ALL discussion items for an idea
    - `updateTaskDiscussionLockStatus(taskId, isLocked)` - Updates discussion item for a task
  - **API Method**: Uses `sharePointApi.put()` to update IsLocked field
  - **Lock Locations**: 
    - ApproverDashboard: Lock button visible during approval (approvers only)
    - DiscussionPanel: Lock button in thread header (approvers only)
    - MyTasks: Lock button in discussion section (approvers only)
  - **UI Behavior**: 
    - Locked: Shows 🔒 lock icon, "Unlock" button, message input disabled
    - Unlocked: Shows 🔓 unlock icon, "Lock" button, message input enabled
    - Contributors: Can see lock status but cannot toggle (button hidden)
- **Discussion Folders** (DiscussionPanel):
  - Separate folders based on user role:
    - "Discussions I Started as Approver" (`userRole === 'approver'`)
    - "Discussions on My Ideas" (`userRole === 'author'`)
    - "Task Discussions" (`userRole === 'participant'`)
  - `userRole` field added to Discussion interface
- **Auto-Loading**:
  - ApproverDashboard: useEffect triggers `loadDiscussionsForIdea()` on selection
  - MyTasks: useEffect triggers `loadDiscussionsForTask()` on task selection
  - Checks `hasDiscussion()` / `hasIdeaDiscussions()` to set proper state
- **Real-Time Updates**:
  - 10-second polling in ApproverDashboard when discussion panel open
  - Auto-refreshes messages to show new replies
  - Prevents need for manual page reload
- **Discussion APIs**:
  - `createDiscussionForIdea(ideaId, subject, body, isQuestion)` - Sets `InitiatedByApprover: true`
  - `createTaskDiscussion(taskId, title, description, ideaId, assignees, ...)` - Creates task discussion
  - `hasDiscussion(taskId)` - Checks if task has Discussion (0x0120) items
  - `hasIdeaDiscussions(ideaId)` - Checks if idea has discussions with InitiatedByApprover
  - `getDiscussionsByTask(taskId)` - Gets all Discussion and Message items for task
  - `getDiscussionsByIdea(ideaId)` - Gets discussions for idea (only InitiatedByApprover)
  - `getMyDiscussions(userId)` - Gets task discussions for user's assigned tasks
  - `getMyIdeaDiscussions(userId)` - Gets idea discussions where user is author OR discussion creator
  - `getAllMyDiscussions(userId)` - Combines task and idea discussions
  - `updateIdeaDiscussionLockStatus(ideaId, isLocked)` - Locks/unlocks all idea discussions
  - `updateTaskDiscussionLockStatus(taskId, isLocked)` - Locks/unlocks task discussion
  - `getIdeaDiscussionLockStatus(ideaId)` - Gets lock status for idea
  - `getDiscussionLockStatus(taskId)` - Gets lock status for task

### SharePoint Integration
- Use `ideaApi` service for ideas CRUD operations
- Use `discussionApi` service for discussion operations
- **Lists**: innovative_ideas, innovative_idea_discussions, innovative_idea_tasks, innovative_idea_trail
- **Date Handling**: SharePoint returns ISO 8601, convert to Date objects in processIdea()
- **Field Mapping**: Ensure Category and Priority are properly mapped (not hardcoded)
- **Error Handling**: Handle SharePoint errors gracefully with user-friendly messages

### Permissions Model
- **Admin**: Full access to all features, can approve/reject ideas
- **Approver**: Can review and approve/reject ideas
- **Contributor**: Can submit ideas and manage their own submissions
- **Role Checking**: Use `isAdmin`, `isApprover`, `isContributor` from UserContext
- **Conditional Rendering**: Show/hide features based on user role

### Testing
- Write unit tests for utilities and services
- Write integration tests for components
- Use descriptive test names and arrange-act-assert pattern
- Mock external dependencies (SharePoint API, Toast notifications, etc.)
- Test files in `__tests__/` directories

## Common Tasks

### Adding Theme Support to a New Page
1. Import `useTheme` hook: `import { useTheme } from '../contexts/ThemeContext';`
2. Get theme: `const { theme } = useTheme();`
3. Apply theme class: `className={\`\${styles.container} \${theme === 'dark' ? styles.darkTheme : styles.lightTheme}\`}`
4. Add theme-specific CSS:
   ```css
   .container { /* base styles */ }
   .darkTheme .element { /* dark theme overrides */ }
   .lightTheme .element { /* light theme overrides */ }
   ```

### Adding a New Chart Component
1. Create component in `src/components/` (e.g., `NewChart.tsx`)
2. Use Recharts library for consistency
3. Follow existing chart patterns (StatusCharts, PriorityCharts, etc.)
4. Add responsive design and accessibility features
5. Support both light and dark themes

### Implementing Idea Workflow
1. **Idea Submission**: Use IdeaFormPage with validation and file upload
2. **Approval Process**: ApproverDashboard for review and decision
3. **Status Updates**: Trigger trail events
4. **Task Creation**: Create tasks for approved ideas
5. **Discussion Management**: 
   - Approvers manually create discussions during approval
   - Discussions auto-load when idea/task selected
   - Approvers can lock/unlock from multiple locations

### Working with Discussions
1. **Creating Discussions**:
   - Check if discussion exists first: `hasDiscussion()` or `hasIdeaDiscussions()`
   - Idea discussions: Call `createDiscussionForIdea()` in ApproverDashboard
   - Task discussions: Call `createTaskDiscussion()` from MyTasks
   - Update state: `setDiscussionExists(true)` immediately after creation
2. **Loading Discussions**:
   - Add useEffect to auto-load on selection
   - Prevents showing "Create Discussion" when discussion exists
   - Example:
     ```typescript
     useEffect(() => {
       if (selectedIdea) {
         loadDiscussionsForIdea(selectedIdea.id);
       }
     }, [selectedIdea?.id]);
     ```
3. **Lock/Unlock**:
   - Only show button to approvers: `{isApprover && (<button...>)}`
   - Use appropriate method:
     - Idea discussions: `updateIdeaDiscussionLockStatus(ideaId, isLocked)`
     - Task discussions: `updateTaskDiscussionLockStatus(taskId, isLocked)`
   - Update local state after API call
   - Reload discussions to ensure consistency
4. **Discussion Folders**:
   - Add `userRole` field to Discussion interface
   - Set role during creation:
     - 'approver': User created the discussion
     - 'author': User is the idea author
     - 'participant': User is assigned to task
   - Filter discussions by userRole in DiscussionPanel
5. **Real-Time Updates**:
   - Add auto-refresh useEffect in components with discussion panels
   - Poll every 10 seconds when panel is open
   - Clear interval on unmount or when panel closes

### Working with Attachments
1. **Validate File Size**: Check against 1MB limit (1048576 bytes)
2. **Show Toast**: Use Toast component for validation feedback
3. **Upload to SharePoint**: Attach files to list items
4. **Preview Logic**:
   - Images: Display in modal
   - PDFs: Open in new tab with `?Web=1` parameter
5. **Error Handling**: Graceful fallbacks for attachment failures

### Adding a New Page
1. Create page component in `src/pages/` with TypeScript
2. Add route in App.tsx with HashRouter
3. Update navigation in Layout components
4. Add page-specific styling with CSS module
5. Implement theme support (light/dark)
6. Add loading states and error handling

### Modifying SharePoint Integration
1. Update service methods in `src/services/` (ideaApi.ts, discussionApi.ts)
2. Handle SharePoint 2016 REST API specifics
3. Update ProcessedIdea or Idea interfaces if needed
4. Test with real SharePoint data
5. Implement error handling with user-friendly messages
6. Update DataContext if data structure changes

### API Structure
- Base URL: `{siteUrl}/_api/web/lists/getbytitle('{listName}')/items`
- Query parameters: `$orderby=Created desc&$select={fieldList}&$expand=AttachmentFiles`
- Headers: `Accept: application/json;odata=verbose`, `Content-Type: application/json;odata=verbose`
- Authentication: `credentials: 'same-origin'`
- Date handling: Convert ISO 8601 strings to Date objects
- Attachment access: Use `serverRelativeUrl` from AttachmentFiles array

### Styling Guidelines
- Use CSS Modules for component-scoped styling
- Implement theme support with `.darkTheme` and `.lightTheme` classes
- Follow consistent naming: camelCase for CSS class names
- Ensure responsive design with mobile-first approach
- Maintain consistent spacing and typography
- **Color Palette**:
  - Purple gradient: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
  - Light theme bg: `linear-gradient(135deg, #f0f4ff 0%, #e6eeff 50%, #dce6ff 100%)`
  - Dark theme bg: `linear-gradient(135deg, #0f0f23 0%, #1a1a3e 50%, #0d1b2a 100%)`
- **Status Colors**: Consistent across light/dark themes
- **Transitions**: Use `transition: all 0.3s ease` for smooth interactions

## Current Implementation Status

### Core Features ✅
- **Idea Submission**: Multi-step form with validation and file upload (1MB limit)
- **Approval Workflow**: Approver dashboard with attachment preview
- **My Ideas**: Split-panel view with detailed idea information
- **Task Management**: Task creation, assignment, progress tracking
- **Discussion System**: Auto-locking based on idea status, file attachments
- **Idea Trail**: Event tracking for idea lifecycle
- **Theme System**: Complete light/dark theme support across all pages

### Recent Enhancements ✅
- **Date Display Fix**: Corrected field mapping (createdDate/approvedDate vs created/modified)
- **Category/Priority Fix**: Proper mapping from SharePoint (removed hardcoding)
- **Attachment Preview**: Images in modal, PDFs in new tab with SharePoint auth
- **Theme Implementation**: Light/dark theme for MainDashboard with all components
- **Discussion Locking**: Auto-lock when idea status changes from "Pending Approval"
- **File Validation**: 1MB size limit with Toast notifications
- **Idea Trail Styling**: Enhanced visibility with proper colors and spacing
- **Card Date Display**: More prominent date in MyIdeas cards with calendar icon

### Component Architecture ✅
- **MainDashboard.tsx**: Innovation Hub with theme support and KPI cards
- **IdeaFormPage.tsx**: Idea submission with validation
- **ApproverDashboard.tsx**: Approval workflow with attachment preview
- **MyIdeas.tsx**: User's ideas with split-panel layout and theme support
- **MyTasks.tsx**: Task management with progress tracking
- **IdeaTrailModal.tsx**: Idea lifecycle visualization
- **TopUtilityBar.tsx**: Theme toggle and user information
- **Toast.tsx**: Notification system for user feedback

### Data Interfaces ✅
- **ProcessedIdea**: From ideaApi with `created`, `modified` Date fields
- **Idea**: From DataContext with `createdDate`, `approvedDate` Date fields
- **Status Mapping**: "Pending Approval" | "Approved" | "Rejected" | "In Progress" | "Completed"
- **Date Conversion**: ISO 8601 → Date objects → Locale formatted strings

### Known Features & TODOs
- Test theme consistency across all pages (only MainDashboard and MyIdeas completed)
- Apply shared theme to ApprovedIdeasPage, IdeaCompletionPage
- Optimize chart rendering performance for analytics
- Add keyboard navigation support for accessibility
- Consider adding real-time notifications for status changes

## Deployment

- Use provided deployment scripts (`deploy.ps1` or `deploy.bat`)
- Deploy to SharePoint Site Assets at `/innovativeIdeas/dist/`
- Application URL: `http://hospp16srv:36156/innovativeIdeas/dist/index.html`
- Build command: `npm run build` or `npm run build:sharepoint`
- Deploy command: `npm run deploy`
- See `DEPLOYMENT_README.md` for detailed instructions

## Best Practices

- Always run tests before committing
- Use TypeScript for type safety
- Keep components small and focused
- Document complex business logic
- Handle errors gracefully with user-friendly messages and Toast notifications
- Optimize bundle size and performance
- Maintain theme consistency (light/dark) for all new components
- Validate file sizes before upload (1MB limit)
- Use proper date field names (createdDate/approvedDate for Idea interface)
- Implement proper loading states and skeleton screens

## Troubleshooting

- **Date Display Issues**: Check field mapping (ProcessedIdea vs Idea interfaces)
- **Theme Not Working**: Ensure theme class is applied to root element
- **Attachment Preview Fails**: Verify SharePoint permissions and use `?Web=1` for PDFs
- **Category Shows "General"**: Check DataContext mapping (use `idea.category`, not hardcoded)
- Check browser console for SharePoint API errors
- Verify list permissions and site URLs
- Test with SharePoint 2016 REST API specifics
- Use MCP server for direct list operations and debugging
- Test with mock data when SharePoint is unavailable
- Use Vitest UI for debugging tests
- Check deployment logs for build issues
- **400 Bad Request errors**: Remove `$expand` parameters from API calls - use `$select` instead
- **GUID vs Title access**: Prefer GUID-based list access for reliability
- **Permission issues**: Check SharePoint group memberships and pattern matching in `getUserPermissions()`
- **Layout positioning**: Sidebar is fixed at 60px width, utility bar starts at 60px with no gap
- **Responsive layout**: Mobile sidebar is 50px, utility bar adjusts accordingly
- **Grid Layout Issues**: Department headers and content use React-based responsive design - check `getGridTemplateColumns()` function and screen width detection in `Dashboard.jsx`