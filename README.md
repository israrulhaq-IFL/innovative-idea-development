# Innovative Ideas Enterprise Application

An enterprise application for managing innovative ideas within an organization, built with React and integrated with SharePoint 2016.

## Overview

This application allows employees to submit innovative ideas, managers to review and approve them, and teams to collaborate on implementation through tasks and discussions. It provides dashboards for tracking idea progress and organizational innovation metrics.

## Features (Planned)

### Core Functionality
- **Idea Submission**: Employees can submit new ideas with descriptions, categories, and attachments
- **Approval Workflow**: Managers can review, approve, or reject ideas
- **Task Management**: Create and assign tasks for approved ideas
- **Discussion System**: Collaborate on tasks with threaded discussions
- **File Attachments**: Support for documents, images, and other files
- **Progress Tracking**: Monitor task completion and idea implementation status

### Dashboards
- **Main Dashboard**: Overview of all ideas, pending approvals, and recent activity
- **Approver Dashboard**: Focused view for managers to review pending ideas
- **Idea Detail View**: Comprehensive view of individual ideas with tasks and discussions

### Data Visualization
- Charts showing idea status distribution
- Progress tracking with Gantt-style views
- Department-wise innovation metrics
- Timeline of idea lifecycle

### Export & Reporting
- PDF reports for ideas and tasks
- Excel exports for data analysis
- Custom report generation

## Technical Architecture

### Frontend
- **React 19** with TypeScript
- **Vite** for build tooling
- **React Router** for navigation
- **Bootstrap 5** for UI components
- **Framer Motion** for animations
- **Chart.js** for data visualization
- **React PDF Viewer** for document viewing

### Backend Integration
- **SharePoint 2016 REST API**
- Secure API client with CSRF protection
- Rate limiting and retry logic
- Form digest handling

### State Management
- React Context for global state
- Reducer pattern for complex state updates
- Error boundaries for robust error handling

### Development Tools
- **Jest** for unit testing
- **ESLint** for code quality
- **Prettier** for code formatting
- **Winston** for logging

## Current Implementation Status

### ✅ Completed Infrastructure
- Project setup with Vite and TypeScript
- SharePoint API integration layer
- State management with contexts
- Routing and navigation structure
- Error handling and logging
- UI component library setup

### 🚧 Partially Implemented
- Data loading hooks (ideas and tasks working, discussions and approvers mock)
- Basic page layouts with placeholders

### ❌ Not Yet Implemented
- All main page components (dashboards, forms, detail views)
- Idea submission and editing forms
- Task creation and management UI
- Discussion interface
- Approval workflow UI
- Data visualization components
- File upload functionality
- User authentication and permissions
- Search and filtering
- Export features

## SharePoint Requirements

The application expects the following SharePoint lists to exist:

1. **innovative_ideas** (Ideas List)
   - Title (Text)
   - Description (Multi-line text)
   - Status (Choice: Pending Approval, Approved, Rejected, In Progress, Completed)
   - ApprovedBy (Person/Group lookup)

2. **ino_ideas_tasks** (Tasks List)
   - Title (Text)
   - Body (Multi-line text)
   - Status (Choice: Not Started, In Progress, Completed, On Hold)
   - Priority (Choice: Low, Normal, High, Critical)
   - PercentComplete (Number 0-100)
   - DueDate (Date/Time)
   - StartDate (Date/Time)
   - AssignedTo (Person/Group multi-select)
   - IdeaId (Lookup to Ideas list)

3. **innovative_idea_discussions** (Discussions List)
   - Title (Text)
   - Body (Multi-line text)
   - TaskId (Lookup to Tasks list)

## Development Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

3. Run tests:
   ```bash
   npm test
   ```

4. Build for production:
   ```bash
   npm run build
   ```

5. Build for SharePoint deployment:
   ```bash
   npm run build:sharepoint
   ```

## Environment Configuration

Set the following environment variables in `.env`:

```
VITE_SHAREPOINT_BASE_URL=http://your-sharepoint-site
```

## Deployment

The application can be deployed as:
- Standalone SPA in SharePoint content editor
- Integrated SharePoint app
- Modern SharePoint page web part

## Contributing

1. Follow the existing code style and patterns
2. Add tests for new functionality
3. Update this README as features are implemented
4. Ensure SharePoint compatibility (2016+)

## Future Enhancements

- Real-time notifications
- Mobile-responsive design optimization
- Advanced search and filtering
- Integration with Microsoft Teams
- AI-powered idea categorization
- Gamification features for idea submission
- Integration with project management tools</content>
<parameter name="filePath">d:\sharepoint development\innovative_Idea_development\README.md