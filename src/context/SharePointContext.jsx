import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import sharePointService from '../services/sharePointService';
import useUserPermissions from '../hooks/useUserPermissions';

const SharePointContext = createContext()

export const useSharePoint = () => {
  const context = useContext(SharePointContext)
  if (!context) {
    throw new Error('useSharePoint must be used within a SharePointProvider')
  }
  return context
}

export const SharePointProvider = ({ children }) => {
  const { permissions, loading: permissionsLoading, error: permissionsError } = useUserPermissions();
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [analytics, setAnalytics] = useState({
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    overdueTasks: 0,
    completionRate: 0,
    avgCompletionTime: 0
  });
  const [departments, setDepartments] = useState([]);
  const [siteGroups, setSiteGroups] = useState([]);
  const [userGroups, setUserGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [initialized, setInitialized] = useState(false);
  const [toast, setToast] = useState(null);

  // Guard against React 18 StrictMode (dev) double-invoking effects and against concurrent inits.
  const initInFlightRef = useRef(false);

  // Toast notification functions
  const showToast = useCallback((message, type = 'success', duration = 3000) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), duration);
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  const computeAnalyticsFromTasks = useCallback((taskData) => {
    const safeTasks = Array.isArray(taskData) ? taskData : [];

    const totalTasks = safeTasks.length;
    const completedTasks = safeTasks.filter(t => t.Status === 'Completed').length;
    const inProgressTasks = safeTasks.filter(t => t.Status === 'In Progress').length;
    const overdueTasks = safeTasks.filter(t => {
      if (!t.DueDate || t.Status === 'Completed') return false;
      return new Date(t.DueDate) < new Date();
    }).length;

    // Average completion time in days
    const completedWithDates = safeTasks.filter(t => t.Status === 'Completed' && t.Created && t.Modified);
    const avgCompletionTime = completedWithDates.length === 0
      ? 0
      : Math.round(completedWithDates.reduce((sum, t) => {
          const created = new Date(t.Created);
          const modified = new Date(t.Modified);
          const diffDays = (modified - created) / (1000 * 60 * 60 * 24);
          return sum + diffDays;
        }, 0) / completedWithDates.length);

    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      overdueTasks,
      completionRate,
      avgCompletionTime
    };
  }, []);

  // Load tasks based on current permissions
  const loadTasks = useCallback(async (departmentFilter = null, departmentId = null) => {
    try {
      const taskData = await sharePointService.getTasks(permissions, departmentFilter, departmentId)
      setTasks(taskData)
      setAnalytics(computeAnalyticsFromTasks(taskData))
    } catch (err) {
      console.error('Failed to load tasks:', err)
      setError('Failed to load tasks')
    }
  }, [permissions, computeAnalyticsFromTasks])

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
      const userInfo = await sharePointService.getCurrentUser();
      setUser(userInfo);

      // Get site groups
      const groups = await sharePointService.getSiteGroups();
      setSiteGroups(groups);

      // Get current user's group memberships
      const currentUserGroups = await sharePointService.getCurrentUserGroups();
      setUserGroups(currentUserGroups);

      // Load departments based on permissions
      const availableDepartments = await sharePointService.getDepartments(permissions);
      setDepartments(availableDepartments);

      // Load initial tasks
      const taskData = await sharePointService.getTasks(permissions);
      setTasks(taskData);
      setAnalytics(computeAnalyticsFromTasks(taskData));

      setInitialized(true);
    } catch (err) {
      console.error('❌ Failed to initialize SharePoint:', err);
      setError(err.message);
    } finally {
      initInFlightRef.current = false;
      setLoading(false);
    }
  }, [permissions, initialized]);

  // Refresh data
  const refreshData = useCallback(async () => {
    if (!permissions) return;

    // Refresh should not re-run the whole initialization pipeline; it should reload the data.
    try {
      setLoading(true);
      setError(null);
      const taskData = await sharePointService.getTasks(permissions);
      setTasks(taskData);
      setAnalytics(computeAnalyticsFromTasks(taskData));
      showToast('Dashboard data updated successfully', 'success');
    } catch (err) {
      console.error('Failed to refresh tasks:', err)
      setError('Failed to refresh tasks')
      showToast('Failed to refresh data', 'error');
    } finally {
      setLoading(false);
    }
  }, [permissions, computeAnalyticsFromTasks, showToast]);

  // Filter tasks by department
  const filterTasksByDepartment = useCallback(async (departmentId) => {
    try {
      const taskData = await sharePointService.getTasks(permissions, null, departmentId)
      setTasks(taskData)
      setAnalytics(computeAnalyticsFromTasks(taskData));
    } catch (err) {
      console.error('Failed to filter tasks by department:', err)
      setError('Failed to filter tasks')
    }
  }, [permissions, computeAnalyticsFromTasks])

  // Update task status
  const updateTaskStatus = useCallback(async (taskId, newStatus, departmentId = null) => {
    try {
      const effectiveDepartmentId = departmentId || (permissions?.canEditDepartments?.length === 1 ? permissions.canEditDepartments[0] : null);
      if (!effectiveDepartmentId) {
        throw new Error('Missing department context for update.');
      }

      const canEditDept = permissions?.canEditDepartments?.includes(effectiveDepartmentId);
      if (!canEditDept) {
        throw new Error('You do not have permission to edit tasks for this department.');
      }

      await sharePointService.updateTaskStatus(taskId, newStatus, effectiveDepartmentId)
      // Refresh tasks after update
      const taskData = await sharePointService.getTasks(permissions, null, effectiveDepartmentId)
      setTasks(taskData)
      setAnalytics(computeAnalyticsFromTasks(taskData));
    } catch (err) {
      console.error('Failed to update task status:', err)
      throw err
    }
  }, [permissions, computeAnalyticsFromTasks])

  useEffect(() => {
    if (permissions && !permissionsLoading && !initialized) {
      initializeSharePoint();
    }
  }, [permissions, permissionsLoading, initialized, initializeSharePoint]);

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

    // Actions
    refreshData,
    filterTasksByDepartment,
    updateTaskStatus,
    showToast,
    hideToast
  }

  return (
    <SharePointContext.Provider value={value}>
      {children}
    </SharePointContext.Provider>
  )
}
