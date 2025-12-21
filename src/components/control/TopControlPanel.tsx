import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Plus,
  FileText,
  Users,
  BarChart3,
  Filter,
  Home,
  CheckSquare,
  Settings,
  User,
} from "lucide-react";
import { useUser } from "../../contexts/UserContext";
import styles from "./TopControlPanel.module.css";

interface TopControlPanelProps {
  onNewIdea?: () => void;
  onViewAll?: () => void;
  onFilter?: () => void;
  onExport?: () => void;
  className?: string;
}

export const TopControlPanel: React.FC<TopControlPanelProps> = ({
  onNewIdea,
  onViewAll,
  onFilter,
  onExport,
  className = "",
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin, isApprover, isContributor } = useUser();

  // Role-based navigation items
  const getNavigationItems = () => {
    const items = [
      {
        path: "/",
        label: "Dashboard",
        icon: Home,
        description: "Main Dashboard & Overview",
      },
      {
        path: "/my-ideas",
        label: "My Ideas",
        icon: User,
        description: "My Submitted Ideas",
      },
    ];

    // Add role-specific navigation
    if (isApprover && !isAdmin) {
      items.push({
        path: "/approver",
        label: "Approvals",
        icon: CheckSquare,
        description: "Review & Approve Ideas",
      });
    }

    if (isAdmin) {
      items.push({
        path: "/admin",
        label: "Admin",
        icon: Settings,
        description: "Administrative Controls",
      });
    }

    return items;
  };

  // Role-based action controls
  const getActionControls = () => {
    const controls = [];

    // Common actions for all users
    controls.push(
      <button
        key="new-idea"
        onClick={() => navigate("/idea/new")}
        className={`${styles.actionButton} ${styles.primary}`}
        title="Submit a new idea"
      >
        <Plus size={16} />
        <span>New Idea</span>
      </button>
    );

    // Role-specific actions
    if (isApprover || isAdmin) {
      controls.push(
        <button
          key="view-all"
          onClick={onViewAll}
          className={`${styles.actionButton} ${styles.secondary}`}
          title="View all ideas"
        >
          <FileText size={16} />
          <span>View All</span>
        </button>
      );
    }

    if (isAdmin) {
      controls.push(
        <button
          key="export"
          onClick={onExport}
          className={`${styles.actionButton} ${styles.secondary}`}
          title="Export reports"
        >
          <BarChart3 size={16} />
          <span>Export</span>
        </button>
      );
    }

    // Filter for all users
    controls.push(
      <button
        key="filter"
        onClick={onFilter}
        className={`${styles.actionButton} ${styles.secondary}`}
        title="Filter ideas"
      >
        <Filter size={16} />
        <span>Filter</span>
      </button>
    );

    return controls;
  };

  const navigationItems = getNavigationItems();
  const actionControls = getActionControls();

  return (
    <div className={`${styles.controlPanel} ${className}`}>
      <div className={styles.panelContainer}>
        <div className={styles.panelContent}>
          {/* Navigation Section */}
          <div className={styles.navigationSection}>
            {/* Navigation Pills */}
            <div className={styles.navigationPills}>
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`${styles.navButton} ${
                      isActive ? styles.active : ""
                    }`}
                    title={item.description}
                  >
                    <Icon size={16} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Divider */}
            <div className={styles.divider}></div>

            {/* Action Controls */}
            <div className={styles.actionControls}>{actionControls}</div>
          </div>

          {/* Status/Info Section */}
          <div className={styles.statusSection}>
            <div className={styles.statusIndicator}></div>
            <span>Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopControlPanel;
