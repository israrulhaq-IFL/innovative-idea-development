import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import dataService from '../services/dataService';
import useUserPermissions from '../hooks/useUserPermissions';

const SharePointContext = createContext();

export const useSharePoint = () => {
  const context = useContext(SharePointContext);
  if (!context) {
    throw new Error('useSharePoint must be used within a SharePointProvider');
  }
  return context;
};

export const SharePointProvider = ({ children }) => {
  const {
    permissions,
    loading: permissionsLoading,
    error: permissionsError,
  } = useUserPermissions();
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [analytics, setAnalytics] = useState({
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    overdueTasks: 0,
    completionRate: 0,
    avgCompletionTime: 0,
  });
  const [departments, setDepartments] = useState([]);
  const [siteGroups, setSiteGroups] = useState([]);
  const [userGroups, setUserGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [initialized, setInitialized] = useState(false);
  const [toast, setToast] = useState(null);
  const [settings, setSettings] = useState({
    autoRefresh: true,
    refreshInterval: 300,
    notifications: true,
  });

  // Reload status tracking
  const [lastReload, setLastReload] = useState({
    time: null,
    type: null, // 'manual' or 'auto'
    nextAutoReload: null,
  });

  // Guard against React 18 StrictMode (dev) double-invoking effects and against concurrent inits.
  const initInFlightRef = useRef(false);

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('dashboardSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings((prev) => ({ ...prev, ...parsed }));
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    }
  }, []);

  // Function to update settings
  const updateSettings = useCallback((newSettings) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem('dashboardSettings', JSON.stringify(updated));
      } catch (error) {
        console.error('Failed to save settings:', error);
      }
      return updated;
    });
  }, []);

  // Toast notification functions
  const showToast = useCallback(
    (message, type = 'success', duration = 3000, onUndo = null) => {
      // Check if notifications are enabled
      if (!settings.notifications) {
        return;
      }
      setToast({ message, type, onUndo });
      setTimeout(() => setToast(null), duration);
    },
    [settings.notifications],
  );

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  const computeAnalyticsFromTasks = useCallback((taskData) => {
    const safeTasks = Array.isArray(taskData) ? taskData : [];

    const totalTasks = safeTasks.length;
    const completedTasks = safeTasks.filter(
      (t) => t.Status === 'Completed',
    ).length;
    const inProgressTasks = safeTasks.filter(
      (t) => t.Status === 'In Progress',
    ).length;
    const overdueTasks = safeTasks.filter((t) => {
      if (!t.DueDate || t.Status === 'Completed') return false;
      return new Date(t.DueDate) < new Date();
    }).length;

    const completionRate =
      totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

    // Average completion time in days
    const completedWithDates = safeTasks.filter(
      (t) => t.Status === 'Completed' && t.Created && t.Modified,
    );
    const avgCompletionTime =
      completedWithDates.length === 0
        ? 0
        : Math.round(
            completedWithDates.reduce((sum, task) => {
              const created = new Date(task.Created);
              const modified = new Date(task.Modified);
              const diffTime = Math.abs(modified - created);
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              return sum + diffDays;
            }, 0) / completedWithDates.length,
          );

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      overdueTasks,
      completionRate,
      avgCompletionTime,
    };
  }, []);

  // Load tasks based on current permissions
  const loadTasks = useCallback(
    async (departmentFilter = null, departmentId = null) => {
      try {
        // Determine which departments this user can access
        const allDepartments = dataService().getDepartments();
        const allowedDepartments = permissions.canViewAll
          ? allDepartments
          : permissions.allowedDepartments &&
              permissions.allowedDepartments.length > 0
            ? allDepartments.filter((d) =>
                permissions.allowedDepartments.includes(d.id),
              )
            : [allDepartments[0]]; // Default to first department

        // Load tasks for each allowed department
        const allTasks = [];
        for (const dept of allowedDepartments) {
          try {
            const departmentTasks = await dataService().getTasks(dept.id, {
              permissions,
            });
            allTasks.push(...departmentTasks);
          } catch (err) {
            console.error(
              `Failed to load tasks for department ${dept.id}:`,
              err,
            );
            // Continue with other departments
          }
        }

        // Sort tasks by due date (null dates at end)
        allTasks.sort((a, b) => {
          if (!a.DueDate && !b.DueDate) return 0;
          if (!a.DueDate) return 1;
          if (!b.DueDate) return -1;
          return new Date(a.DueDate) - new Date(b.DueDate);
        });

        setTasks(allTasks);
        setAnalytics(computeAnalyticsFromTasks(allTasks));
        setError(null);
      } catch (err) {
        console.error('Failed to load tasks:', err);
        setError('Failed to load tasks');
        setTasks([]);
        setAnalytics(computeAnalyticsFromTasks([]));
      }
    },
    [permissions, computeAnalyticsFromTasks],
  );

  // Refresh data
  const refreshData = useCallback(
    async (isSilent = false) => {
      if (!permissions) return;

      const reloadType = isSilent ? 'auto' : 'manual';
      const now = new Date();

      try {
        if (!isSilent) {
          setLoading(true);
          setError(null);
        }

        await loadTasks();

        // Update last reload status
        const nextAutoReload =
          settings.autoRefresh && settings.refreshInterval
            ? new Date(now.getTime() + settings.refreshInterval * 1000)
            : null;

        setLastReload({
          time: now,
          type: reloadType,
          nextAutoReload,
        });

        if (!isSilent) {
          showToast('Dashboard data updated successfully', 'success');
        }
      } catch (err) {
        console.error('Failed to refresh tasks:', err);
        setError('Failed to refresh tasks');
        if (!isSilent) {
          showToast('Failed to refresh data', 'error');
        }
      } finally {
        if (!isSilent) {
          setLoading(false);
        }
      }
    },
    [
      permissions,
      computeAnalyticsFromTasks,
      showToast,
      settings.autoRefresh,
      settings.refreshInterval,
      loadTasks,
    ],
  );

  // Update next auto-reload time when settings change
  useEffect(() => {
    if (lastReload.time && settings.autoRefresh && settings.refreshInterval) {
      const nextAutoReload = new Date(
        lastReload.time.getTime() + settings.refreshInterval * 1000,
      );
      setLastReload((prev) => ({ ...prev, nextAutoReload }));
    } else if (!settings.autoRefresh) {
      setLastReload((prev) => ({ ...prev, nextAutoReload: null }));
    }
  }, [settings.autoRefresh, settings.refreshInterval, lastReload.time]);

  // Auto-refresh effect
  useEffect(() => {
    let intervalId;

    if (
      settings.autoRefresh &&
      settings.refreshInterval &&
      initialized &&
      !loading
    ) {
      intervalId = setInterval(async () => {
        try {
          console.log('Auto-refreshing dashboard data...');
          await refreshData(true); // Silent refresh
        } catch (error) {
          console.error('Auto-refresh failed:', error);
          // Don't show error toast for auto-refresh failures to avoid spam
        }
      }, settings.refreshInterval * 1000); // Convert seconds to milliseconds
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [
    settings.autoRefresh,
    settings.refreshInterval,
    initialized,
    loading,
    refreshData,
  ]);

  // Load tasks based on current permissions
  // Initialize SharePoint connection
  const initializeSharePoint = useCallback(async () => {
    if (!permissions) return;

    if (initInFlightRef.current || initialized) {
      return;
    }

    initInFlightRef.current = true;

    try {
      setLoading(true);
      setError(null);

      // Get current user
      const userInfo = await dataService().getCurrentUser();
      setUser(userInfo);

      // Get site groups
      const groups = await dataService().getSiteGroups();
      setSiteGroups(groups);

      // Get current user's group memberships
      const currentUserGroups = await dataService().getCurrentUserGroups();
      setUserGroups(currentUserGroups);

      // Load departments based on permissions
      const availableDepartments = await dataService().getDepartments();
      setDepartments(availableDepartments);

      // Load initial tasks
      await loadTasks();

      setInitialized(true);
    } catch (err) {
      console.error('❌ Failed to initialize SharePoint:', err);
      setError(err.message);
    } finally {
      initInFlightRef.current = false;
      setLoading(false);
    }
  }, [permissions, initialized]);

  // Initialize SharePoint when permissions are loaded
  useEffect(() => {
    if (permissions && !permissionsLoading && !initialized) {
      initializeSharePoint();
    }
  }, [permissions, permissionsLoading, initialized, initializeSharePoint]);

  // Filter tasks by department
  const filterTasksByDepartment = useCallback(
    async (departmentId) => {
      try {
        await loadTasks(null, departmentId);
      } catch (err) {
        console.error('Failed to filter tasks by department:', err);
        setError('Failed to filter tasks');
      }
    },
    [loadTasks],
  );

  // Update task status
  const updateTaskStatus = useCallback(
    async (taskId, newStatus, departmentId = null) => {
      try {
        const effectiveDepartmentId =
          departmentId ||
          (permissions?.canEditDepartments?.length === 1
            ? permissions.canEditDepartments[0]
            : null);
        if (!effectiveDepartmentId) {
          throw new Error('Missing department context for update.');
        }

        const canEditDept = permissions?.canEditDepartments?.includes(
          effectiveDepartmentId,
        );
        if (!canEditDept) {
          throw new Error(
            'You do not have permission to edit tasks for this department.',
          );
        }

        await dataService().updateTaskStatus(
          taskId,
          newStatus,
          effectiveDepartmentId,
        );
        // Refresh tasks after update
        await loadTasks(null, effectiveDepartmentId);
      } catch (err) {
        console.error('Failed to update task status:', err);
        throw err;
      }
    },
    [permissions, computeAnalyticsFromTasks, loadTasks],
  );

  const value = {
    // State
    user,
    permissions,
    tasks,
    analytics,
    departments,
    siteGroups,
    userGroups,
    loading,
    error,
    toast,
    settings,
    lastReload,

    // Actions
    refreshData,
    filterTasksByDepartment,
    updateTaskStatus,
    updateSettings,
    showToast,
    hideToast,
  };

  return (
    <SharePointContext.Provider value={value}>
      {children}
    </SharePointContext.Provider>
  );
};
