import React from 'react';
import { FiRefreshCw, FiMoon, FiSun } from 'react-icons/fi';
import { useSharePoint } from '../../context/SharePointContext';
import { useTheme } from '../../context/ThemeContext';
import UserInfo from '../UserInfo';
import styles from './UtilityBar.module.css';

const UtilityBar = () => {
  const { user, permissions, refreshData } = useSharePoint();
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <div className={styles.utilityBar}>
      <div className={styles.utilityBarContent}>
        {/* User Info Section */}
        <div className={styles.userSection}>
          {user && permissions && (
            <UserInfo user={user} permissions={permissions} />
          )}
        </div>

        {/* Actions Section */}
        <div className={styles.actionsSection}>
          {/* Refresh Button */}
          <button
            className={styles.refreshButton}
            onClick={refreshData}
            aria-label="Refresh dashboard data"
            title="Refresh dashboard data"
          >
            <FiRefreshCw className={styles.refreshIcon} />
          </button>

          <div className={styles.divider}></div>

          {/* Theme Toggle */}
          <button
            className={styles.themeToggle}
            onClick={toggleTheme}
            aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
          >
            <span className={styles.themeIcon}>
              {isDark ? <FiSun /> : <FiMoon />}
            </span>
            <span className={styles.themeText}>
              {isDark ? 'Light' : 'Dark'}
            </span>
          </button>

          {/* Additional actions can be added here */}
          <div className={styles.divider}></div>

          {/* Status indicator */}
          <div className={styles.statusIndicator}>
            <span className={styles.statusDot}></span>
            <span className={styles.statusText}>Online</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UtilityBar;
