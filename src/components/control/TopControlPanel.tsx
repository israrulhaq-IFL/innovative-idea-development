import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
  ClipboardList,
  CheckCheck,
  MessageCircle,
} from 'lucide-react';
import { useUser } from '../../contexts/UserContext';
import { useIdeaData } from '../../contexts/DataContext';
import styles from './TopControlPanel.module.css';

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
  className = '',
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin, isApprover, isContributor } = useUser();
  const { data } = useIdeaData();
  const [isUtilityBarScrolled, setIsUtilityBarScrolled] = useState(false);

  // Listen to scroll events to adjust position based on utility bar state
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop =
        window.pageYOffset ||
        document.documentElement.scrollTop ||
        document.body.scrollTop ||
        0;
      const shouldBeScrolled = scrollTop > 50;
      setIsUtilityBarScrolled(shouldBeScrolled);
    };

    // Attach to multiple elements for better compatibility
    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('scroll', handleScroll, { passive: true });

    // Also try attaching to the document element
    const htmlElement = document.documentElement;
    if (htmlElement) {
      htmlElement.addEventListener('scroll', handleScroll, { passive: true });
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('scroll', handleScroll);
      if (htmlElement) {
        htmlElement.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  // Role-based navigation items
  const getNavigationItems = () => {
    const items = [
      {
        path: '/',
        label: 'Dashboard',
        icon: Home,
        description: 'Main Dashboard & Overview',
      },
      {
        path: '/my-ideas',
        label: 'My Ideas',
        icon: User,
        description: 'My Submitted Ideas',
      },
    ];

    // Add role-specific navigation
    if (isContributor) {
      items.push({
        path: '/my-tasks',
        label: 'My Tasks',
        icon: ClipboardList,
        description: 'My Assigned Tasks',
      });
    }

    if (isApprover && !isAdmin) {
      items.push({
        path: '/approver',
        label: 'Approvals',
        icon: CheckSquare,
        description: 'Review & Approve Ideas',
      });
    }

    if (isAdmin) {
      items.push({
        path: '/admin',
        label: 'Admin',
        icon: Settings,
        description: 'Administrative Controls',
      });
    }

    return items;
  };

  // Role-based action controls
  const getActionControls = () => {
    const controls = [];

    // Discussion button for all users
    const discussionCount = data.discussions?.length || 0;
    controls.push(
      <button
        key="discussions"
        onClick={() => navigate('/discussions')}
        className={`${styles.actionButton} ${styles.secondary} ${styles.withBadge}`}
        title="View your task discussions"
      >
        <MessageCircle size={16} />
        <span>Discussions</span>
        {discussionCount > 0 && (
          <span className={styles.badge}>{discussionCount}</span>
        )}
      </button>,
    );

    // Common actions for all users
    controls.push(
      <button
        key="new-idea"
        onClick={() => navigate('/idea/new')}
        className={`${styles.actionButton} ${styles.primary}`}
        title="Submit a new idea"
      >
        <Plus size={16} />
        <span>New Idea</span>
      </button>,
    );

    // Role-specific actions
    if (isAdmin) {
      controls.push(
        <button
          key="approved-ideas"
          onClick={() => navigate('/approved-ideas')}
          className={`${styles.actionButton} ${styles.primary}`}
          title="View approved ideas and create tasks"
        >
          <CheckSquare size={16} />
          <span>Approved Ideas</span>
        </button>,
      );
    }

    if (isAdmin) {
      controls.push(
        <button
          key="idea-completion"
          onClick={() => navigate('/idea-completion')}
          className={`${styles.actionButton} ${styles.primary}`}
          title="Manage idea completion and mark as completed"
        >
          <CheckCheck size={16} />
          <span>Idea Completion</span>
        </button>,
      );
    }

    return controls;
  };

  const navigationItems = getNavigationItems();
  const actionControls = getActionControls();

  return (
    <div
      className={`${styles.controlPanel} ${className}`}
      style={{
        top: isUtilityBarScrolled ? "48px" : "56px", // Adjust based on utility bar height
      }}
    >
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
                      isActive ? styles.active : ''
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
