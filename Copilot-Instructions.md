# Copilot Instructions for Modern ITG SharePoint Task Dashboard

## Project Overview

This is a modern React-based executive dashboard for ITG (Information Technology Group) with SharePoint integration. The application provides real-time task management and analytics across four departments (Infrastructure, ERP, Operations, Networks & Security) with role-based access control and advanced split-screen drill-down functionality.

**Current Architecture Focus:**
- Single-screen executive dashboard with 4 department columns
- **Split-screen drill-down system**: Click any KPI, chart segment, or delayed tasks to open detailed task views
- **Expandable split screen**: Full-screen task details with overlay and proper positioning
- Compact 60px icon-based sidebar for maximized content space
- Utility bar positioned immediately after sidebar (no gaps)
- Each column shows KPI metrics, status distribution, priority breakdown, and delayed tasks
- Interactive drill-down panels with smooth animations and state transitions
- SharePoint group-based permissions (HOD, ITG Managers, Team Members, Limited access)
- GUID-based SharePoint list access with explicit field selection
- Comprehensive error handling with mock data fallbacks

## Executive Dashboard UX (Current Implementation)

- **Single-screen dashboard** with 4 department columns (DCI/ERP/Operations/Networks)
- **Split-screen drill-down system**:
  - Click any KPI card, chart segment, or "View Details" link to open split-screen panel
  - Split panel shows 60% width with department-specific task details
  - Smooth opening/closing animations with proper state transitions
  - Navigation controls for multi-department pagination when >2 departments visible
- **Expandable split screen**: Click expand button for full-screen task details with backdrop overlay
- **Compact sidebar navigation**: 60px wide icon-based sidebar (Dashboard/Analytics/Settings) with tooltips
- **Top utility bar**: Positioned immediately after sidebar (no gap) with user info and theme toggle
- **Maximized content area**: Main dashboard spans full available width after 60px sidebar
- **DepartmentColumn component** for each department with consistent structure:
  1) **KPI strip**: Total tasks, completed, in-progress, overdue counts (clickable for drill-down)
  2) **Status donut chart**: Visual breakdown of task statuses (clickable segments for drill-down)
  3) **Priority horizontal bar chart**: Priority distribution (clickable bars for drill-down)
  4) **Delayed tasks summary**: Clickable section showing overdue tasks with "View Details" link
- **Global controls**: Status/priority filters, time range filters (7d/30d/90d/all), search functionality
- **Drill-down system**:
  - **Split Panel**: 60% width panel showing filtered task lists with expandable rows
  - **Expanded View**: Full-screen overlay with detailed task cards and editing capabilities
  - **State Management**: Proper drill state handling (open/closing/expanded) with smooth transitions
- **Permission enforcement**: Edit buttons/controls only visible when `canEditDepartments` includes the department
- **Responsive design**: Adapts to different screen sizes while maintaining column layout

## Key Technologies & Architecture

- **Frontend**: React 18 with functional components and hooks
- **Build Tool**: Vite for fast development and building
- **Styling**: CSS Modules for component-scoped styling
- **Charts**: Chart.js with React Chart.js 2 for data visualization
- **Routing**: React Router DOM for navigation
- **Backend**: SharePoint REST API with fallback mock data
- **Testing**: Vitest with React Testing Library
- **State Management**: React Context for SharePoint and theme management

## Code Structure & Conventions

### Component Architecture
- Use functional components with hooks
- CSS Modules for styling (`.module.css` files)
- Component files named `ComponentName.jsx`
- Style files named `ComponentName.module.css`

### File Organization
```
src/
├── components/          # Reusable UI components
│   ├── DepartmentColumn.jsx           # Main dashboard column with KPI, charts, delayed tasks
│   ├── DepartmentColumnContent.jsx    # Content wrapper for split-screen layout
│   ├── TaskDrilldownPanel.jsx         # Split panel for task details and editing
│   ├── TaskDrilldownModal.jsx         # Modal for task details and editing
│   ├── ChartModal.jsx                 # Reusable modal component for charts
│   ├── ExecutiveDashboardControls.jsx # Global filters and controls
│   ├── AssigneeCharts.jsx             # Horizontal bar chart for assignee workload
│   ├── StatusCharts.jsx               # Donut chart for status distribution
│   ├── PriorityCharts.jsx             # Horizontal bar chart for priority breakdown
│   ├── AssigneeAvatars.jsx            # User avatar display component
│   ├── Layout/                        # Layout-related components
│   │   ├── Header.jsx
│   │   ├── Sidebar.jsx                # Compact 60px icon-based navigation
│   │   └── UtilityBar.jsx             # Top bar positioned after sidebar (left: 60px)
│   ├── [Feature]/                     # Feature-specific components
│   └── ...
├── pages/                             # Route-based page components
│   ├── Dashboard.jsx                  # Main executive dashboard with split-screen functionality
│   ├── Analytics.jsx                  # Analytics page
│   ├── Settings.jsx                   # Settings page
│   └── ...
├── context/                           # React context providers
│   ├── SharePointContext.jsx          # SharePoint state management
│   └── ThemeContext.jsx               # Theme management
├── services/                          # API services and business logic
│   ├── sharePointService.js           # SharePoint REST API service
│   └── sharePointService.test.js      # Unit tests
├── hooks/                             # Custom React hooks
│   └── useUserPermissions.js          # Permission management hook
├── utils/                             # Utility functions
└── styles/                            # Global styles
```

### Naming Conventions
- **Components**: PascalCase (e.g., `TaskCard.jsx`)
- **Functions**: camelCase (e.g., `fetchTasks()`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_BASE_URL`)
- **Files**: kebab-case for utilities, PascalCase for components

## Development Guidelines

### State Management
- Use React hooks (`useState`, `useEffect`) for local component state
- Context providers for global state (SharePoint data, theme)
- Split screen state managed in `Dashboard.jsx` with `drillState` object:
  ```javascript
  const [drillState, setDrillState] = useState({
    isOpen: false,
    type: null,        // 'kpi', 'assignee', 'status', 'priority'
    data: null,        // Chart data or KPI info
    department: null   // Department name
  });
  ```

#### Split Screen Functionality
- **Opening**: Click KPI cards or chart bars to open split panel
- **Closing**: Click close button or outside panel area
- **Animation**: Smooth CSS transitions with `cubic-bezier(0.4, 0, 0.2, 1)`
- **Layout**: Panel takes full width, pushes content to left
- **State**: Managed centrally in Dashboard component

### Adding New Components
1. Create component file in appropriate directory under `src/components/`
2. Create corresponding CSS module file
3. Export component from index file if needed
4. Add tests in `__tests__/` directory

### Chart Interactions
- Chart.js for data visualization
- Click handlers on bars/pie slices trigger split screen
- Hover effects for better UX
- Consistent color schemes across charts

### SharePoint Integration
- Use `SharePointService` class for all API calls
- Handle authentication and permissions appropriately
- Implement fallback mock data for development/testing
- Department-specific lists with GUIDs:
  - Infrastructure: `Datacenter and Cloude Infrastructure Ongoing Tasks` (GUID: e41bb365-20be-4724-8ff8-18438d9c2354)
  - ERP: `ERP System/Software Development Ongoing Tasks` (GUID: 4693a94b-4a71-4821-b8c1-3a6fc8cdac69)
  - Operations: `ITG Operations Ongoing Tasks` (GUID: 6eb2cec0-f94f-47ae-8745-5e48cd52ffd9)
  - Networks: `Networks and Security Ongoing Tasks` (GUID: 1965d5a7-b9f0-4066-b2c5-8d9b8a442537)
- API calls use GUID-based endpoints with explicit `$select` parameters (no `$expand`)
- Task fields: Id, Title, Body, Status, Priority, PercentComplete, AssignedToId, StartDate, DueDate, Created, Modified, tonc (Remarks), Attachments

### Permissions model (group-based)
- All permission logic is derived from SharePoint group titles in `SharePointService.getUserPermissions()`.
- Group name normalization: converts underscores/hyphens to spaces, handles case-insensitive matching
- Department-specific patterns:
  - **Infrastructure**: member patterns ['dci', 'data center', 'datacenter', 'cloud infrastructure', 'infrastructure'], manager patterns ['dci manager', 'infra manager', 'data center manager', 'infrastructure manager']
  - **ERP**: member patterns ['erp', 'software development', 'software'], manager patterns ['erp manager', 'software manager']
  - **Operations**: member patterns ['operations', 'itg operations', 'ops'], manager patterns ['operations manager', 'ops manager']
  - **Networks**: member patterns ['network', 'networks', 'security'], manager patterns ['network manager', 'networks manager', 'security manager']
- User categories:
  - **HOD** (Head of Department): group matches ['hod', 'head of department'] → can view all departments, edit none
  - **ITG Manager**: group matches ['itg manager', 'itg managers', 'itg management', 'management'] → can view all departments, edit only departments where they have manager membership
  - **Team Member**: belongs to department member/manager groups → can view/edit their department(s) only
  - **Limited**: fallback access → can view infrastructure department only, no edit rights
- Key fields used across UI and data loading:
  - `allowedDepartments: string[]` → departments the user can view
  - `canEditDepartments: string[]` → departments the user can edit
  - `canViewAll: boolean` → used for executive/global visibility
  - `userCategory: 'team_member' | 'manager' | 'hod' | 'limited'`
- Always enforce edits in the data/action layer (not only via hidden buttons).

### State Management
- Use `SharePointContext` for SharePoint-related state with `useSharePoint` hook
- Use `ThemeContext` for theme management
- `SharePointProvider` manages: user, tasks, analytics, departments, siteGroups, userGroups, loading states
- Custom hook `useUserPermissions` handles permission loading and caching
- Prefer local state for component-specific data
- Context includes `loadTasks()` and `updateTaskStatus()` methods with permission enforcement

### Testing
- Write unit tests for utilities and services
- Write integration tests for components
- Use descriptive test names and arrange-act-assert pattern
- Mock external dependencies (SharePoint API, etc.)

## Common Tasks

### Adding a New Chart Component
1. Create component in `src/components/` (e.g., `NewChart.jsx`)
2. Use Chart.js with React Chart.js 2
3. Follow existing chart patterns (AssigneeCharts, PriorityCharts, etc.)
4. Add responsive design and accessibility features

### Drill-down patterns
- Charts should expose an `onSegmentClick` callback and pass semantic filter info (label/value).
- Use `TaskDrilldownModal` for task details display with expandable task rows.
- Dashboard uses `DepartmentColumn` components with KPI strip, status donut chart, priority bar chart, and delayed tasks summary.
- **Split Screen System**: Click KPI cards or chart elements to open full-width drill-down panel
- When updating tasks, call `updateTaskStatus(taskId, newStatus, departmentId)` with a **departmentId**; the context enforces permissions.
- Modal filtering supports department + status/priority/delayed task combinations.

### Implementing Split Screen Drill-downs
1. Add click handler to chart/component that calls `openDrill(type, data, department)`
2. Update `drillState` in Dashboard component
3. Render `TaskDrilldownPanel` when `drillState.isOpen` is true
4. Handle close with `closeDrill()` function
5. Use CSS transitions for smooth open/close animations
6. Ensure panel takes full viewport width with proper z-index

### Adding a New Page
1. Create page component in `src/pages/`
2. Add route in main App component
3. Update navigation in Layout components
4. Add page-specific styling

### Modifying SharePoint Integration
1. Update `SharePointService` class methods
2. Handle different department lists appropriately with GUID-based access
3. Update mock data if needed
4. Test with both real and mock data
5. API calls use OData verbose format with explicit field selection
6. Error handling includes fallback to mock data for development

### API Structure
- Base URL: `{siteUrl}/_api/web/lists(guid'{guid}')/items`
- Query parameters: `$orderby=Created desc&$select={fieldList}`
- Headers: `Accept: application/json;odata=verbose`, `Content-Type: application/json;odata=verbose`
- Authentication: `credentials: 'same-origin'`
- No `$expand` parameters (causes 400 errors) - use `AssignedToId` array instead

### Styling Guidelines
- Use CSS custom properties for theme variables
- Follow BEM-like naming in CSS modules
- Ensure responsive design with mobile-first approach
- Maintain consistent spacing and typography
- **Split Screen Animations**: Use `cubic-bezier(0.4, 0, 0.2, 1)` for smooth transitions
- **Layout positioning**: 
  - Sidebar: `position: fixed; left: 0; width: 60px; z-index: 1000`
  - Utility bar: `position: fixed; left: 60px; right: 0; z-index: 1001`
  - Main content: `margin-left: 60px` (desktop), `margin-left: 50px` (mobile)
  - Split panel: `position: fixed; right: 0; width: 100vw; z-index: 1002`
  - No gaps between sidebar and utility bar - utility bar content has `padding-left: 0`

## Current Implementation Status

### Split Screen Functionality ✅
- **Full-width expandable panels** for KPI and chart drill-downs
- **Smooth animations** with CSS transitions (`cubic-bezier(0.4, 0, 0.2, 1)`)
- **State management** centralized in `Dashboard.jsx` with `drillState` object
- **Interactive elements**: KPI cards and chart bars trigger split panels
- **Responsive design** with proper z-index layering

### Recent Enhancements ✅
- **Percentage displays** in KPI section with click interactions
- **Assignee workload charts** with clickable bars
- **Smooth closing animations** for split panels
- **Full-width expansion** (fixed previous 2-column constraint)
- **Proper scroll positioning** during panel transitions

### Component Architecture ✅
- **DepartmentColumnContent.jsx**: Content wrapper for split-screen layout
- **TaskDrilldownPanel.jsx**: Split panel component for task details
- **ChartModal.jsx**: Reusable modal component
- **AssigneeCharts.jsx**: Horizontal bar charts with click handlers
- **StatusCharts.jsx**: Donut charts for status distribution
- **PriorityCharts.jsx**: Horizontal bar charts for priority breakdown

### Known Issues & TODOs
- Test split screen functionality across different screen sizes
- Optimize chart rendering performance for large datasets
- Add keyboard navigation support for accessibility
- Consider adding loading states for split panel content

- Use provided deployment scripts (`deploy.ps1` or `deploy.bat`)
- Deploy to SharePoint Site Assets
- Configure site URL and target folder as needed
- See `DEPLOYMENT_README.md` for detailed instructions

## Best Practices

- Always run tests before committing
- Use ESLint for code quality
- Keep components small and focused
- Document complex business logic
- Handle errors gracefully with user-friendly messages
- Optimize bundle size and performance

## Troubleshooting

- Check browser console for SharePoint API errors
- Verify list permissions and site URLs
- Test with mock data when SharePoint is unavailable
- Use Vitest UI for debugging tests
- Check deployment logs for build issues
- **400 Bad Request errors**: Remove `$expand` parameters from API calls - use `$select` instead
- **GUID vs Title access**: Prefer GUID-based list access for reliability
- **Permission issues**: Check SharePoint group memberships and pattern matching in `getUserPermissions()`
- **Layout positioning**: Sidebar is fixed at 60px width, utility bar starts at 60px with no gap
- **Responsive layout**: Mobile sidebar is 50px, utility bar adjusts accordingly