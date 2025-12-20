import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSharePoint } from '../context/SharePointContext';
import StatusCharts from '../components/StatusCharts';
import PriorityCharts from '../components/PriorityCharts';
import AssigneeCharts from '../components/AssigneeCharts';
import DelayedTasks from '../components/DelayedTasks';
import styles from './Analytics.module.css';

const Analytics = () => {
  const { tasks, analytics, getAnalyticsData, permissions, departments } = useSharePoint();
  const [timeRange, setTimeRange] = useState('30d');
  const [chartType, setChartType] = useState('bar');
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDepartment, setSelectedDepartment] = useState(null);

  // Load analytics data based on user permissions
  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true);
        const data = await getAnalyticsData(null, selectedDepartment);
        setAnalyticsData(data);
      } catch (error) {
        console.error('Failed to load analytics:', error);
        // Fallback to basic analytics calculation
        setAnalyticsData({
          totalTasks: tasks.length,
          completedTasks: tasks.filter(t => t.Status === 'Completed').length,
          inProgressTasks: tasks.filter(t => t.Status === 'In Progress').length,
          overdueTasks: tasks.filter(t => {
            if (!t.DueDate || t.Status === 'Completed') return false;
            return new Date(t.DueDate) < new Date();
          }).length,
          completionRate: tasks.length > 0 ?
            Math.round((tasks.filter(t => t.Status === 'Completed').length / tasks.length) * 100) : 0,
          avgCompletionTime: 0
        });
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [getAnalyticsData, selectedDepartment, tasks]);

  // Remove refreshData call since SharePointContext initializes automatically

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
    { value: 'pie', label: 'Pie Chart' }
  ];

  const filteredTasks = tasks.filter(task => {
    if (timeRange === 'all') return true;

    const taskDate = new Date(task.Created);
    const now = new Date();
    const daysDiff = (now - taskDate) / (1000 * 60 * 60 * 24);

    switch (timeRange) {
      case '7d': return daysDiff <= 7;
      case '30d': return daysDiff <= 30;
      case '90d': return daysDiff <= 90;
      case '1y': return daysDiff <= 365;
      default: return true;
    }
  });

  return (
    <>
      <Helmet>
        <title>ITG Analytics - Task Performance Insights</title>
        <meta name="description" content="Detailed analytics and performance insights for ITG SharePoint tasks" />
        <meta name="keywords" content="ITG, analytics, charts, performance, insights, SharePoint" />
      </Helmet>

      <div className={styles.analytics}>
      <div className={styles.header}>
        <h1>Analytics Dashboard</h1>
        <div className={styles.filters}>
          {/* Department Filter - only show if user can view all departments */}
          {permissions.canViewAll && departments.length > 1 && (
            <div className={styles.filterGroup}>
              <label htmlFor="department">Department:</label>
              <select
                id="department"
                value={selectedDepartment || ''}
                onChange={(e) => setSelectedDepartment(e.target.value || null)}
                className={styles.select}
              >
                <option value="">All Departments</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className={styles.filterGroup}>
            <label htmlFor="timeRange">Time Range:</label>
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
            <label htmlFor="chartType">Chart Type:</label>
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

      <div className={styles.stats}>
        <div className={styles.statCard}>
          <h3>Total Tasks</h3>
          <span className={styles.statValue}>
            {loading ? '...' : (analyticsData?.totalTasks || 0)}
          </span>
        </div>
        <div className={styles.statCard}>
          <h3>Completed</h3>
          <span className={styles.statValue}>
            {loading ? '...' : (analyticsData?.completedTasks || 0)}
          </span>
        </div>
        <div className={styles.statCard}>
          <h3>In Progress</h3>
          <span className={styles.statValue}>
            {loading ? '...' : (analyticsData?.inProgressTasks || 0)}
          </span>
        </div>
        <div className={styles.statCard}>
          <h3>Overdue</h3>
          <span className={styles.statValue}>
            {loading ? '...' : (analyticsData?.overdueTasks || 0)}
          </span>
        </div>
        <div className={styles.statCard}>
          <h3>Completion Rate</h3>
          <span className={styles.statValue}>
            {loading ? '...' : `${analyticsData?.completionRate || 0}%`}
          </span>
        </div>
        <div className={styles.statCard}>
          <h3>Avg. Completion Time</h3>
          <span className={styles.statValue}>
            {loading ? '...' : `${analyticsData?.avgCompletionTime || 0} days`}
          </span>
        </div>
      </div>

      <div className={styles.charts}>
        {loading ? (
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Loading analytics data...</p>
          </div>
        ) : (
          <>
            <div className={styles.chartSection}>
              <h2>Task Status Distribution</h2>
              <StatusCharts tasks={filteredTasks} chartType={chartType} />
            </div>

            <div className={styles.chartSection}>
              <h2>Priority Breakdown</h2>
              <PriorityCharts tasks={filteredTasks} chartType={chartType} />
            </div>

            <div className={styles.chartSection}>
              <h2>Assignee Workload</h2>
              <AssigneeCharts tasks={filteredTasks} chartType={chartType} />
            </div>

            <div className={styles.chartSection}>
              <h2>Delayed Tasks</h2>
              <DelayedTasks tasks={filteredTasks} showDetails={true} />
            </div>
          </>
        )}
      </div>
    </div>
    </>
  );
};

export default Analytics;