# Modern ITG SharePoint Task Dashboard

A modern React-based task management dashboard for ITG with SharePoint integration, built with component architecture and comprehensive testing.

## Features

- **Modern React Architecture**: Built with React 18, hooks, and functional components
- **Component-Based Design**: Modular, reusable components with CSS modules
- **SharePoint Integration**: REST API integration with fallback mock data
- **Responsive Design**: Mobile-friendly interface with theme support
- **Analytics Dashboard**: Interactive charts and KPI visualizations
- **Permission System**: Role-based access control
- **Comprehensive Testing**: Unit and integration tests with Vitest

## Tech Stack

- **Frontend**: React 18, React Router DOM
- **Build Tool**: Vite
- **Styling**: CSS Modules
- **Charts**: Chart.js with React Chart.js 2
- **Testing**: Vitest, React Testing Library, jsdom
- **Backend Integration**: SharePoint REST API

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Layout/         # Header, Sidebar, Layout wrapper
│   ├── Dashboard/      # Main dashboard components
│   └── ...
├── pages/              # Route-based page components
│   ├── Dashboard.jsx
│   ├── Analytics.jsx
│   └── Settings.jsx
├── context/            # React context providers
│   ├── SharePointContext.jsx
│   └── ThemeContext.jsx
├── services/           # API and business logic
│   └── sharePointService.js
├── styles/             # Global styles
└── test/               # Test utilities
```

## Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Building

```bash
npm run build
```

### Testing

```bash
# Run all tests
npm test

# Run tests with UI
npm run test:ui

# Run tests once
npm run test -- --run
```

### Deployment

The project includes automated deployment scripts for SharePoint:

```bash
# Quick deployment with defaults
npm run deploy

# Or use the batch file
deploy.bat

# Custom deployment
deploy.bat "http://your-site" "SiteAssets" "custom-folder"
```

See `DEPLOYMENT_README.md` for detailed deployment instructions.

## Testing

The project includes comprehensive test coverage:

### Test Structure

- **Unit Tests**: Individual component and service testing
- **Integration Tests**: Context provider and component interaction testing
- **API Mocking**: SharePoint REST API calls are mocked for reliable testing

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test sharePointService.test.js

# Run with coverage
npm test -- --coverage
```

### Test Files

- `src/services/sharePointService.test.js` - Service layer testing
- `src/context/SharePointContext.test.jsx` - Context provider testing
- `src/components/Dashboard.test.jsx` - Component testing

## SharePoint Integration

### Configuration

Update the service configuration in `src/services/sharePointService.js`:

```javascript
constructor() {
  this.siteUrl = window.location.origin;
  this.listName = 'YourTaskListName'; // Update this
}
```

### Permissions

The app supports role-based permissions:
- **Management**: Full access to all departments
- **Executive**: Read-only access to all data
- **Department Users**: Access limited to their department

### API Endpoints

- `/_api/web/currentuser` - Get current user
- `/_api/web/lists/getbytitle('Tasks')/items` - Get tasks
- `/_api/contextinfo` - Get request digest for updates

## Component Architecture

### Key Components

- **Layout**: Responsive layout with header and sidebar
- **Dashboard**: Main task overview with KPIs
- **Analytics**: Chart visualizations and reporting
- **Settings**: Configuration and preferences

### Context Providers

- **SharePointContext**: Manages SharePoint data and API calls
- **ThemeContext**: Handles light/dark theme switching

## Styling

- **CSS Modules**: Scoped styling for component isolation
- **Responsive Design**: Mobile-first approach
- **Theme Support**: Light/dark mode toggle

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

This project is licensed under the MIT License.