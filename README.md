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

3. **innovative_idea_discussions** (Discussion Board List)
   - Title (Text) - Subject of the discussion/message
   - Body (Multi-line text) - Content of the discussion/message
   - TaskId (Lookup to Tasks list) - Links discussion to a task
   - IdeaId (Lookup to Ideas list) - Links discussion to an idea
   - IsQuestion (Yes/No) - Marks if the post is a question

## SharePoint 2016 Discussion Board API

### Content Types
SharePoint Discussion Boards use two content types:
- **Discussion** (0x0120...): The parent thread/topic - `FileSystemObjectType: 1` (folder)
- **Message** (0x0107...): Replies within a discussion - `FileSystemObjectType: 0` (item)

### Creating Discussion Threads
```javascript
// POST to /_api/web/lists/getbytitle('innovative_idea_discussions')/items
{
  "__metadata": { "type": "SP.Data.Innovative_x005f_idea_x005f_discussionsListItem" },
  "Title": "Discussion Subject",
  "Body": "Discussion content",
  "TaskIdId": 13,  // Lookup field ID
  "IdeaIdId": 23,  // Lookup field ID
  "IsQuestion": false
}
```

### Creating Message Replies
For SharePoint 2016, use the standard List API with the Message content type ID:
```javascript
// POST to /_api/web/lists/getbytitle('innovative_idea_discussions')/items
{
  "__metadata": { "type": "SP.Data.Innovative_x005f_idea_x005f_discussionsListItem" },
  "ContentTypeId": "0x0107000184D056442E7742904D37B7FE5AFF4C",  // Message content type (full ID)
  "Title": "Re: Discussion Subject",
  "Body": "Reply message content",
  "TaskIdId": 13,
  "IdeaIdId": 23,
  "IsQuestion": false
}
```

### Querying Discussions and Messages
```javascript
// Get all discussions and messages for a task
/_api/web/lists/getbytitle('innovative_idea_discussions')/items
  ?$select=ID,Title,Body,IsQuestion,TaskIdId,IdeaIdId,Author/Id,Author/Title,Created,Modified,ContentTypeId
  &$expand=Author
  &$filter=(TaskIdId eq 13) and (startswith(ContentTypeId,'0x0120') or startswith(ContentTypeId,'0x0107'))
  &$orderby=Created asc
```

### Important Notes
1. **Do NOT use file-based approach**: Creating files in discussion folders and using `ListItemAllFields` does not work reliably in SharePoint 2016
2. **Use full Content Type ID**: The Message content type requires the complete ID (e.g., `0x0107000184D056442E7742904D37B7FE5AFF4C`), not just the prefix
3. **Link via TaskIdId**: Messages are linked to their parent discussion via the `TaskIdId` lookup field
4. **ParentItemID is read-only**: SharePoint manages this field internally; do not try to set it manually

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