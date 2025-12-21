import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSharePoint } from '../context/SharePointContext';
import { FiBarChart2, FiTrendingUp, FiCheckCircle, FiClock, FiAlertTriangle, FiTarget } from 'react-icons/fi';
import StatusCharts from '../components/StatusCharts';
import PriorityCharts from '../components/PriorityCharts';
import DelayedTasks from '../components/DelayedTasks';
import AnalyticsTrends from '../components/AnalyticsTrends';
import AnalyticsComparison from '../components/AnalyticsComparison';
import AnalyticsSkeleton from '../components/AnalyticsSkeleton';
import styles from './Analytics.module.css';

const Analytics = () => {
  const { tasks, permissions, departments, loading: contextLoading } = useSharePoint();
  const [timeRange, setTimeRange] = useState('all');
  const [chartType, setChartType] = useState('doughnut');
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Determine available departments based on user permissions
  const availableDepartments = useMemo(() => {
    if (!permissions || !departments) return [];

    if (permissions.canViewAll) {
      // HOD/ITG Managers can see all departments
      return departments;
    } else if (permissions.allowedDepartments?.length > 0) {
      // Team members/managers can only see their departments
      return departments.filter(dept => permissions.allowedDepartments.includes(dept.id));
    }

    return [];
  }, [permissions, departments]);

  // Set default department for restricted users
  useEffect(() => {
    if (!permissions || selectedDepartment !== null) return;

    if (!permissions.canViewAll && permissions.allowedDepartments?.length === 1) {
      // Single department users get their department selected by default
      setSelectedDepartment(permissions.allowedDepartments[0]);
    }
  }, [permissions, selectedDepartment]);

  // Compute analytics from filtered tasks
  const computeAnalyticsFromTasks = useMemo(() => {
    return (taskData) => {
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
    };
  }, []);

  // Filter tasks based on time range and department
  const filteredTasks = useMemo(() => {
    let filtered = [...(tasks || [])];

    // Filter by department if selected
    if (selectedDepartment) {
      filtered = filtered.filter(task => task.DepartmentId === selectedDepartment);
    } else if (!permissions?.canViewAll && permissions?.allowedDepartments?.length > 0) {
      // For restricted users, only show their departments if no specific department selected
      filtered = filtered.filter(task => permissions.allowedDepartments.includes(task.DepartmentId));
    }

    // Filter by time range
    if (timeRange !== 'all') {
      const now = new Date();
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;

      filtered = filtered.filter(task => {
        if (!task.Created) return false;
        const taskDate = new Date(task.Created);
        const diffDays = (now - taskDate) / (1000 * 60 * 60 * 24);
        return diffDays <= days;
      });
    }

    return filtered;
  }, [tasks, selectedDepartment, permissions, timeRange]);

  // Calculate analytics from filtered tasks
  const analyticsData = useMemo(() => {
    return computeAnalyticsFromTasks(filteredTasks);
  }, [computeAnalyticsFromTasks, filteredTasks]);

  // Set loading state based on tasks availability and context loading
  useEffect(() => {
    if (tasks !== null && permissions !== null && !contextLoading) {
      setLoading(false);
    } else if (contextLoading) {
      setLoading(true);
    }
  }, [tasks, permissions, contextLoading]);

  const timeRangeOptions = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' },
    { value: '1y', label: 'Last year' },
    { value: 'all', label: 'All time' }
  ];

  const chartTypeOptions = [
    { value: 'bar', label: 'Bar Chart' },
    { value: 'line', label: 'Line Chart' },
    { value: 'pie', label: 'Pie Chart' },
    { value: 'doughnut', label: 'Doughnut Chart' }
  ];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <FiBarChart2 /> },
    { id: 'trends', label: 'Trends', icon: <FiTrendingUp /> },
    { id: 'comparison', label: 'Comparison', icon: <FiBarChart2 /> }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'trends':
        return (
          <AnalyticsTrends
            tasks={filteredTasks}
            timeRange={timeRange}
            department={selectedDepartment}
            chartType={chartType}
          />
        );
      case 'comparison':
        return (
          <AnalyticsComparison
            tasks={filteredTasks}
            departments={availableDepartments}
            permissions={permissions}
            chartType={chartType}
          />
        );
      default: // overview
        return (
          <div className={styles.overviewSection}>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statIcon}><FiBarChart2 /></div>
                <div className={styles.statContent}>
                  <h3>Total Tasks</h3>
                  <span className={styles.statValue}>
                    {loading ? '...' : (analyticsData?.totalTasks || 0)}
                  </span>
                  <span className={styles.statChange}>+12% from last month</span>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIcon}><FiCheckCircle /></div>
                <div className={styles.statContent}>
                  <h3>Completed</h3>
                  <span className={styles.statValue}>
                    {loading ? '...' : (analyticsData?.completedTasks || 0)}
                  </span>
                  <span className={styles.statChange}>+8% completion rate</span>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIcon}>🔄</div>
                <div className={styles.statContent}>
                  <h3>In Progress</h3>
                  <span className={styles.statValue}>
                    {loading ? '...' : (analyticsData?.inProgressTasks || 0)}
                  </span>
                  <span className={styles.statChange}>-5% from last week</span>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIcon}><FiAlertTriangle /></div>
                <div className={styles.statContent}>
                  <h3>Overdue</h3>
                  <span className={styles.statValue}>
                    {loading ? '...' : (analyticsData?.overdueTasks || 0)}
                  </span>
                  <span className={styles.statChange}>-15% improvement</span>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIcon}><FiTarget /></div>
                <div className={styles.statContent}>
                  <h3>Completion Rate</h3>
                  <span className={styles.statValue}>
                    {loading ? '...' : `${analyticsData?.completionRate || 0}%`}
                  </span>
                  <span className={styles.statChange}>+5% from target</span>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIcon}><FiClock /></div>
                <div className={styles.statContent}>
                  <h3>Avg. Completion Time</h3>
                  <span className={styles.statValue}>
                    {loading ? '...' : `${analyticsData?.avgCompletionTime || 0} days`}
                  </span>
                  <span className={styles.statChange}>-2 days faster</span>
                </div>
              </div>
            </div>

            <div className={styles.chartGrid}>
              <div className={styles.chartCard}>
                <h3>Task Status Distribution</h3>
                <div className={styles.chartContainer}>
                  <StatusCharts
                    tasks={filteredTasks}
                    chartType={chartType}
                    title=""
                    compact={true}
                    showTitle={false}
                    showLegend={false}
                    showStats={false}
                  />
                </div>
              </div>

              <div className={styles.chartCard}>
                <h3>Priority Breakdown</h3>
                <div className={styles.chartContainer}>
                  <PriorityCharts
                    tasks={filteredTasks}
                    chartType={chartType}
                    title=""
                    compact={true}
                    showTitle={false}
                    showLegend={false}
                  />
                </div>
              </div>

              <div className={styles.chartCard}>
                <h3>Delayed Tasks</h3>
                <DelayedTasks tasks={filteredTasks} showDetails={false} />
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <>
      <Helmet>
        <title>ITG Analytics - Deep Performance Insights</title>
        <meta name="description" content="Advanced analytics and performance insights for ITG SharePoint tasks with trends and comparisons" />
        <meta name="keywords" content="ITG, analytics, trends, performance, insights, comparisons, SharePoint" />
      </Helmet>

      <div className={styles.analytics}>
        {/* Compact Header with Controls */}
        <div className={styles.compactHeader}>
          <div className={styles.headerLeft}>
            <h1>Analytics</h1>
          </div>

          <div className={styles.headerRight}>
            {/* Department Filter - only show for users who can view multiple departments */}
            {availableDepartments.length > 1 && (
              <div className={styles.filterGroup}>
                <select
                  id="department"
                  value={selectedDepartment || ''}
                  onChange={(e) => setSelectedDepartment(e.target.value || null)}
                  className={styles.select}
                >
                  <option value="">All Departments</option>
                  {availableDepartments.map(dept => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className={styles.filterGroup}>
              <select
                id="timeRange"
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className={styles.select}
              >
                {timeRangeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.filterGroup}>
              <select
                id="chartType"
                value={chartType}
                onChange={(e) => setChartType(e.target.value)}
                className={styles.select}
              >
                {chartTypeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Minimalistic Tab Navigation */}
        <div className={styles.minimalTabs}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`${styles.minimalTab} ${activeTab === tab.id ? styles.minimalTabActive : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className={styles.tabIcon}>{tab.icon}</span>
              <span className={styles.tabLabel}>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className={styles.content}>
          {loading ? (
            <AnalyticsSkeleton />
          ) : (
            renderTabContent()
          )}
        </div>
      </div>
    </>
  );
};

export default Analytics;