// Top Utility Bar Component for Innovative Ideas

// src/components/common/TopUtilityBar.tsx

import React, { memo, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Sun,
  Moon,
  X,
  CheckCircle,
  AlertCircle,
  Info,
  AlertTriangle,
  RefreshCw,
  User,
  Shield,
  Users,
} from "lucide-react";
import UserProfile from "./UserProfile";
import { autoRefreshEnabled } from "../../utils/constants";
import { useTheme } from "../../contexts/ThemeContext";
import { useNotification } from "../../contexts/NotificationContext";
import { useUser } from "../../contexts/UserContext";
import styles from "./TopUtilityBar.module.css";

interface TopUtilityBarProps {
  lastUpdated: Date;
}

const TopUtilityBar: React.FC<TopUtilityBarProps> = memo(({ lastUpdated }) => {
  const { theme, toggleTheme } = useTheme();
  const { notifications, markAsRead, removeNotification, clearAll } =
    useNotification();
  const {
    user,
    isAdmin,
    isApprover,
    isContributor,
    switchToContributor,
    switchToApprover,
    switchToAdmin,
  } = useUser();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [_logoLoaded, setLogoLoaded] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Get logo URL from SharePoint assets library
  const getLogoUrl = (): string => {
    // Use logo directly from SharePoint assets library
    return "http://hospp16srv:36156/_layouts/15/DocIdRedir.aspx?ID=YXKCFK7R4HD4-1677176773-59";
  };

  // Format notification timestamp
  const formatNotificationTime = (timestamp: Date): string => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return timestamp.toLocaleDateString();
  };

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop =
        window.pageYOffset ||
        document.documentElement.scrollTop ||
        document.body.scrollTop ||
        0;
      const shouldBeScrolled = scrollTop > 50;
      setIsScrolled(shouldBeScrolled);
    };

    // Attach to multiple elements for better compatibility
    window.addEventListener("scroll", handleScroll, { passive: true });
    document.addEventListener("scroll", handleScroll, { passive: true });

    // Also try attaching to the document element
    const htmlElement = document.documentElement;
    if (htmlElement) {
      htmlElement.addEventListener("scroll", handleScroll, { passive: true });
    }

    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("scroll", handleScroll);
      if (htmlElement) {
        htmlElement.removeEventListener("scroll", handleScroll);
      }
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setIsNotificationOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogoLoad = (): void => {
    setLogoLoaded(true);
  };

  const handleLogoError = (): void => {
    setLogoError(true);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle size={16} className="text-green-500" />;
      case "error":
        return <AlertCircle size={16} className="text-red-500" />;
      case "warning":
        return <AlertTriangle size={16} className="text-yellow-500" />;
      case "info":
      default:
        return <Info size={16} className="text-blue-500" />;
    }
  };

  const formatLastUpdated = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  const handleNotificationClick = (notification: any) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    setIsNotificationOpen(false);
    // Navigate based on notification type
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  const handleClearNotification = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    removeNotification(id);
  };

  // Check if current user is the developer for testing mode
  const isDeveloperUser =
    user?.user?.Title?.toLowerCase().includes("israr") ||
    user?.user?.Name?.toLowerCase().includes("israr");

  // Testing functions for role switching (developer only)
  const handleSwitchToContributor = () => {
    switchToContributor();
  };

  const handleSwitchToApprover = () => {
    switchToApprover();
  };

  const handleSwitchToAdmin = () => {
    switchToAdmin();
  };

  return (
    <div
      className={`${styles.topUtilityBar} ${isScrolled ? styles.scrolled : ""}`}
    >
      <div className={styles.utilityBarContent}>
        {/* Logo at very start */}
        {!isScrolled && !logoError && (
          <div className={styles.utilityBarLogoContainer}>
            <img
              src={getLogoUrl()}
              alt="Innovative Ideas Logo"
              className={styles.utilityBarLogo}
              onLoad={handleLogoLoad}
              onError={handleLogoError}
              loading="lazy"
            />
          </div>
        )}

        <div className={styles.utilityBarLeft}>
          <div className={styles.utilityBarText}>
            <div className={styles.utilityBarTitleRow}>
              {/* Full title for wide screens */}
              <h1
                className={`${styles.utilityBarTitle} ${isScrolled ? styles.compact : ""}`}
              >
                {isScrolled ? "Innovative Ideas" : "Innovative Ideas Platform"}
                {!isScrolled && lastUpdated && (
                  <span className={styles.inlineStatusBar}>
                    <span className={styles.statusIndicator}>
                      <span className={styles.statusDot}></span>
                      <span className={styles.statusText}>
                        Updated {formatLastUpdated(lastUpdated)}
                      </span>
                    </span>
                  </span>
                )}
              </h1>

              {/* Compact title used on small screens */}
              <span
                className={styles.compactTitle}
                aria-hidden={isScrolled ? "true" : "false"}
              >
                Ideas
              </span>
            </div>
          </div>
        </div>

        <div className={styles.utilityBarRight}>
          <div className={styles.utilityIconsSeparator}></div>

          {/* Notifications */}
          <div className={styles.notificationIcon} ref={notificationRef}>
            <div
              className={styles.alertsToggleBtn}
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setIsNotificationOpen(!isNotificationOpen);
                }
              }}
              role="button"
              tabIndex={0}
              title="Notifications"
            >
              <Bell size={18} />
              {notifications.length > 0 && (
                <span className={styles.notificationBadge}>
                  {notifications.length > 99 ? "99+" : notifications.length}
                </span>
              )}
            </div>
            {isNotificationOpen && (
              <div className={styles.notificationDropdown}>
                <div className={styles.notificationHeader}>
                  <h4>Notifications</h4>
                  <button
                    onClick={() => setIsNotificationOpen(false)}
                    className={styles.closeButton}
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className={styles.notificationList}>
                  {notifications.length === 0 ? (
                    <div className={styles.noNotifications}>
                      No new notifications
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={styles.notificationItem}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className={styles.notificationContent}>
                          <div className={styles.notificationTitle}>
                            {notification.title}
                          </div>
                          <div className={styles.notificationMessage}>
                            {notification.message}
                          </div>
                          <div className={styles.notificationTime}>
                            {formatNotificationTime(notification.timestamp)}
                          </div>
                        </div>
                        <div className={styles.notificationIcon}>
                          {getNotificationIcon(notification.type)}
                        </div>
                        <button
                          onClick={(e) =>
                            handleClearNotification(notification.id, e)
                          }
                          className={styles.closeButton}
                          aria-label="Clear notification"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className={styles.utilityIconsSeparator}></div>

          {/* Refresh Button */}
          <div
            className={`${styles.utilityIcon} ${styles.reloadButton}`}
            onClick={() => {
              // Silent reload - just refresh data without page flickering
              window.dispatchEvent(new globalThis.CustomEvent("silentReload"));
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                window.dispatchEvent(
                  new globalThis.CustomEvent("silentReload"),
                );
              }
            }}
            role="button"
            tabIndex={0}
            title="Refresh Data"
          >
            <RefreshCw size={18} />
          </div>

          <div className={styles.themeSeparator}></div>

          {/* Theme Toggle */}
          <div
            className={styles.themeToggleBtn}
            onClick={toggleTheme}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                toggleTheme();
              }
            }}
            role="button"
            tabIndex={0}
            title={
              theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"
            }
          >
            {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
          </div>

          <div className={styles.profileSeparator}></div>

          {/* Testing Role Switcher (Developer Only) */}
          {isDeveloperUser && (
            <div className={styles.testingSection}>
              <div className={styles.testingLabel}>🔧 TEST</div>
              <div className={styles.testingButtons}>
                <button
                  onClick={handleSwitchToContributor}
                  className={`${styles.testingButton} ${isContributor && !isApprover && !isAdmin ? styles.active : ""}`}
                  title="Switch to Contributor Role"
                >
                  <User size={14} />
                  <span>Contributor</span>
                </button>
                <button
                  onClick={handleSwitchToApprover}
                  className={`${styles.testingButton} ${isApprover && !isAdmin ? styles.active : ""}`}
                  title="Switch to Approver Role"
                >
                  <Users size={14} />
                  <span>Approver</span>
                </button>
                <button
                  onClick={handleSwitchToAdmin}
                  className={`${styles.testingButton} ${isAdmin ? styles.active : ""}`}
                  title="Switch to Administrator Role"
                >
                  <Shield size={14} />
                  <span>Admin</span>
                </button>
              </div>
            </div>
          )}

          <div className={styles.profileSeparator}></div>

          {/* User Profile */}
          <UserProfile />
        </div>
      </div>
    </div>
  );
});

export default TopUtilityBar;
