// Mock for SharePoint Context
import React from 'react';

const SharePointContext = React.createContext();

export const useSharePoint = () => ({
  showToast: jest.fn(),
  hideToast: jest.fn(),
  user: { Id: 1, Title: 'Test User', Email: 'test@example.com' },
  permissions: { canViewAll: true, allowedDepartments: [] },
  tasks: [],
  analytics: {
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    overdueTasks: 0,
    completionRate: 0,
    avgCompletionTime: 0
  },
  departments: [],
  siteGroups: [],
  userGroups: [],
  loading: false,
  error: null,
  toast: null,
  settings: {
    autoRefresh: false,
    refreshInterval: 300,
    notifications: true
  },
  lastReload: {
    time: null,
    type: null,
    nextAutoReload: null
  },
  refreshData: jest.fn(),
  filterTasksByDepartment: jest.fn(),
  updateTaskStatus: jest.fn(),
  updateSettings: jest.fn()
});

export const SharePointProvider = ({ children }) => <div>{children}</div>;