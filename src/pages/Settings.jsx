import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSharePoint } from '../context/SharePointContext';
import { useTheme } from '../context/ThemeContext';
import GroupInfo from '../components/GroupInfo';
import styles from './Settings.module.css';

const Settings = () => {
  const { user, permissions, refreshData } = useSharePoint();
  const { theme, toggleTheme } = useTheme();
  const [settings, setSettings] = useState({
    autoRefresh: true,
    refreshInterval: 300, // 5 minutes
    notifications: true,
    compactView: false,
    showCompletedTasks: true,
    exportFormat: 'excel'
  });

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveSettings = () => {
    // Save settings to localStorage or SharePoint
    localStorage.setItem('dashboardSettings', JSON.stringify(settings));
    alert('Settings saved successfully!');
  };

  const handleResetSettings = () => {
    const defaultSettings = {
      autoRefresh: true,
      refreshInterval: 300,
      notifications: true,
      compactView: false,
      showCompletedTasks: true,
      exportFormat: 'excel'
    };
    setSettings(defaultSettings);
    localStorage.removeItem('dashboardSettings');
  };

  const exportData = async (format) => {
    try {
      // This would integrate with SharePoint export functionality
      alert(`Exporting data as ${format.toUpperCase()}...`);
    } catch (error) {
      alert('Export failed. Please try again.');
    }
  };

  if (!permissions || !permissions.isManagement) {
    return (
      <div className={styles.settings}>
        <div className={styles.accessDenied}>
          <h1>Access Denied</h1>
          <p>You need administrator permissions to access settings.</p>
        </div>
      </div>
    );
  }

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
                onChange={(e) => toggleTheme()}
                className={styles.select}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>

            <div className={styles.setting}>
              <label htmlFor="compactView">Compact View</label>
              <input
                type="checkbox"
                id="compactView"
                checked={settings.compactView}
                onChange={(e) => handleSettingChange('compactView', e.target.checked)}
                className={styles.checkbox}
              />
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

            <div className={styles.setting}>
              <label htmlFor="showCompletedTasks">Show Completed Tasks</label>
              <input
                type="checkbox"
                id="showCompletedTasks"
                checked={settings.showCompletedTasks}
                onChange={(e) => handleSettingChange('showCompletedTasks', e.target.checked)}
                className={styles.checkbox}
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
          <h2>Data Export</h2>
          <div className={styles.settingGroup}>
            <div className={styles.setting}>
              <label htmlFor="exportFormat">Default Export Format</label>
              <select
                id="exportFormat"
                value={settings.exportFormat}
                onChange={(e) => handleSettingChange('exportFormat', e.target.value)}
                className={styles.select}
              >
                <option value="excel">Excel (.xlsx)</option>
                <option value="csv">CSV (.csv)</option>
                <option value="json">JSON (.json)</option>
              </select>
            </div>

            <div className={styles.exportActions}>
              <button
                onClick={() => exportData(settings.exportFormat)}
                className={styles.exportBtn}
              >
                Export Current Data
              </button>
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
          <button onClick={handleSaveSettings} className={styles.saveBtn}>
            Save Settings
          </button>
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