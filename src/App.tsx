import React, { Suspense, useEffect } from "react";
import {
  HashRouter as Router,
  Routes,
  Route,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { AppProviders } from "./contexts/AppProviders";
import ErrorBoundary from "./components/common/ErrorBoundary";
import DataErrorBoundary from "./components/common/DataErrorBoundary";
import LoadingSpinner from "./components/common/LoadingSpinner";
import TopUtilityBar from "./components/common/TopUtilityBar";
import TopControlPanel from "./components/control/TopControlPanel";
import { useIdeaData } from "./contexts/DataContext";
import { useUser } from "./contexts/UserContext";
import { logInfo } from "./utils/logger";
import "./styles/index.css";

// Lazy load components for better performance
const ApproverDashboard = React.lazy(() => import("./pages/ApproverDashboard"));
const MainDashboard = React.lazy(() => import("./pages/MainDashboard"));
const MyIdeas = React.lazy(() => import("./pages/MyIdeas"));
const IdeaFormPage = React.lazy(() => import("./pages/IdeaFormPage"));
const IdeaDetailPage = React.lazy(() => import("./pages/IdeaDetailPage"));
const TaskDiscussionPage = React.lazy(
  () => import("./pages/TaskDiscussionPage"),
);

// Role-based routing component
const RoleBasedRouter: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin, isApprover, isContributor, isLoading } = useUser();

  useEffect(() => {
    // Don't redirect if still loading
    if (isLoading) {
      return;
    }

    // No automatic redirection - users can access the general dashboard at "/"
    // Role-specific dashboards are available at /admin, /approver, /contributor
    logInfo("User can access general dashboard at root path");
  }, [isLoading]);

  // Show loading while determining role
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading user permissions..." />
      </div>
    );
  }

  return (
    <Routes>
      {/* Role-based dashboard routes */}
      <Route path="/admin" element={<MainDashboard />} />
      <Route path="/approver" element={<ApproverDashboard />} />
      <Route path="/contributor" element={<MainDashboard />} />

      {/* My Ideas page for all users */}
      <Route path="/my-ideas" element={<MyIdeas />} />

      {/* Shared routes accessible to all roles */}
      <Route path="/idea/new" element={<IdeaFormPage />} />
      <Route path="/idea/:id" element={<IdeaDetailPage />} />
      <Route path="/task/:id" element={<TaskDiscussionPage />} />

      {/* General dashboard accessible to all users */}
      <Route path="/" element={<MainDashboard />} />
    </Routes>
  );
};

const AppContent: React.FC = () => {
  const { data } = useIdeaData();

  return (
    <ErrorBoundary>
      <DataErrorBoundary>
        <Router>
          <AppWithRouter data={data} />
        </Router>
      </DataErrorBoundary>
    </ErrorBoundary>
  );
};

interface AppWithRouterProps {
  data: { lastUpdated?: Date | null };
}

const AppWithRouter: React.FC<AppWithRouterProps> = ({ data }) => {
  // Routes that need a control panel
  const routesWithControlPanel = ["/", "/admin", "/approver", "/contributor", "/my-ideas"];

  const showControlPanel = routesWithControlPanel.some((route) =>
    window.location.hash.startsWith(`#${route}`),
  );

  // Routes that are form pages (should hide nav and alerts)
  const formRoutes = ["/idea/new", "/idea/:id", "/task/:id"];

  const isFormPage = formRoutes.some((route) =>
    window.location.hash.startsWith(`#${route}`),
  );

  return (
    <div
      className={`app-container ${showControlPanel ? "has-control-panel" : ""}`}
    >
      <TopUtilityBar lastUpdated={data.lastUpdated || new Date()} />
      {showControlPanel && !isFormPage && <TopControlPanel />}
      <Suspense
        fallback={
          <div className="d-flex justify-content-center align-items-center min-vh-100">
            <LoadingSpinner size="lg" />
          </div>
        }
      >
        <RoleBasedRouter />
      </Suspense>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AppProviders>
      <AppContent />
    </AppProviders>
  );
};

export default App;
