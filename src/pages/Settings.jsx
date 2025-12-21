import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSharePoint } from '../context/SharePointContext';
import { useTheme } from '../context/ThemeContext';
import GroupInfo from '../components/GroupInfo';
import styles from './Settings.module.css';

const Settings = () => {
  const { user, permissions, settings, updateSettings } = useSharePoint();
  const { theme, toggleTheme, setThemeMode } = useTheme();

  const handleSettingChange = (key, value) => {
    // Validate refresh interval
    if (key === 'refreshInterval') {
      const numValue = parseInt(value);
      if (isNaN(numValue) || numValue < 60 || numValue > 3600) {
        alert('Refresh interval must be between 60 and 3600 seconds (1-60 minutes)');
        return;
      }
      value = numValue;
    }

    // Show warning when disabling auto-refresh
    if (key === 'autoRefresh' && value === false) {
      const confirmed = window.confirm(
        '⚠️ WARNING: Disabling auto-refresh means you will not receive new task updates automatically.\n\n' +
        'You will need to manually refresh the page to see new tasks, status changes, or updates from other users.\n\n' +
        'This may cause you to miss important task assignments or status updates.\n\n' +
        'Are you sure you want to disable auto-refresh?'
      );
      if (!confirmed) {
        return; // Don't update the setting
      }
    }

    updateSettings({ [key]: value });
  };

  const handleResetSettings = () => {
    const defaultSettings = {
      autoRefresh: true,
      refreshInterval: 300,
      notifications: true
    };
    updateSettings(defaultSettings);
    alert('Settings reset to defaults!');
  };

  return (
    <>
      <Helmet>
        <title>ITG Settings - Dashboard Configuration</title>
        <meta name="description" content="Configure ITG dashboard settings, themes, and preferences" />
        <meta name="keywords" content="ITG, settings, configuration, preferences, theme" />
      </Helmet>
      <div className={styles.settings}>
        <div className={styles.header}>
          <h1>Settings</h1>
          <p>Configure your dashboard preferences and system settings.</p>
        </div>

      <div className={styles.content}>
        <section className={styles.section}>
          <h2>Appearance</h2>
          <div className={styles.settingGroup}>
            <div className={styles.setting}>
              <label htmlFor="theme">Theme</label>
              <select
                id="theme"
                value={theme}
                onChange={(e) => setThemeMode(e.target.value)}
                className={styles.select}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2>Data & Refresh</h2>
          <div className={styles.settingGroup}>
            <div className={styles.setting}>
              <label htmlFor="autoRefresh">Auto Refresh</label>
              <input
                type="checkbox"
                id="autoRefresh"
                checked={settings.autoRefresh}
                onChange={(e) => handleSettingChange('autoRefresh', e.target.checked)}
                className={styles.checkbox}
              />
            </div>

            <div className={styles.setting}>
              <label htmlFor="refreshInterval">Refresh Interval (seconds)</label>
              <input
                type="number"
                id="refreshInterval"
                value={settings.refreshInterval}
                onChange={(e) => handleSettingChange('refreshInterval', parseInt(e.target.value))}
                min="60"
                max="3600"
                className={styles.input}
              />
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2>Notifications</h2>
          <div className={styles.settingGroup}>
            <div className={styles.setting}>
              <label htmlFor="notifications">Enable Notifications</label>
              <input
                type="checkbox"
                id="notifications"
                checked={settings.notifications}
                onChange={(e) => handleSettingChange('notifications', e.target.checked)}
                className={styles.checkbox}
              />
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2>System Information</h2>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Current User:</span>
              <span className={styles.infoValue}>{user?.Title || 'Unknown'}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>User Permissions:</span>
              <span className={styles.infoValue}>
                {permissions
                  ? `${permissions.userCategory} | view: ${(permissions.allowedDepartments || []).join(', ') || '—'} | edit: ${(permissions.canEditDepartments || []).join(', ') || '—'}`
                  : 'None'}
              </span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Last Refresh:</span>
              <span className={styles.infoValue}>{new Date().toLocaleString()}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Version:</span>
              <span className={styles.infoValue}>2.0.0</span>
            </div>
          </div>
        </section>

        <div className={styles.actions}>
          <button onClick={handleResetSettings} className={styles.resetBtn}>
            Reset to Defaults
          </button>
        </div>
      </div>
    </div>
    </>
  );
};

export default Settings;