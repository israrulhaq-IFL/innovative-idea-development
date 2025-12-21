import React from 'react';
import KPISection from './KPISection';
import { LazyStatusCharts } from './LazyCharts';
import DelayedTasks from './DelayedTasks';
import styles from './OverviewMode.module.css';

const OverviewMode = ({ tasks, analytics, filters }) => {
  // Get recent tasks (last 7 days)
  const recentTasks = tasks.filter(task => {
    const taskDate = new Date(task.Created);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return taskDate >= weekAgo;
  });

  // Get upcoming due tasks (next 7 days)
  const upcomingTasks = tasks.filter(task => {
    if (!task.DueDate || task.Status === 'Completed') return false;
    const dueDate = new Date(task.DueDate);
    const weekFromNow = new Date();
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    return dueDate <= weekFromNow && dueDate >= new Date();
  });

  // Get tasks by status for quick overview
  const statusSummary = tasks.reduce((acc, task) => {
    const status = task.Status || 'Unknown';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className={styles.overview}>
      <KPISection analytics={analytics} />

      <div className={styles.quickStats}>
        <div className={styles.statCard}>
          <h3>This Week</h3>
          <div className={styles.statGrid}>
            <div className={styles.miniStat}>
              <span className={styles.miniValue}>{recentTasks.length}</span>
              <span className={styles.miniLabel}>New Tasks</span>
            </div>
            <div className={styles.miniStat}>
              <span className={styles.miniValue}>
                {recentTasks.filter(t => t.Status === 'Completed').length}
              </span>
              <span className={styles.miniLabel}>Completed</span>
            </div>
          </div>
        </div>

        <div className={styles.statCard}>
          <h3>Coming Up</h3>
          <div className={styles.statGrid}>
            <div className={styles.miniStat}>
              <span className={styles.miniValue}>{upcomingTasks.length}</span>
              <span className={styles.miniLabel}>Due Soon</span>
            </div>
            <div className={styles.miniStat}>
              <span className={styles.miniValue}>
                {upcomingTasks.filter(t => t.Priority === 'High' || t.Priority === 'Critical').length}
              </span>
              <span className={styles.miniLabel}>High Priority</span>
            </div>
          </div>
        </div>

        <div className={styles.statCard}>
          <h3>Status Overview</h3>
          <div className={styles.statusList}>
            {Object.entries(statusSummary).map(([status, count]) => (
              <div key={status} className={styles.statusItem}>
                <span className={styles.statusName}>{status}</span>
                <span className={styles.statusCount}>{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.chartsSection}>
        <div className={styles.chartCard}>
          <LazyStatusCharts tasks={tasks} chartType="doughnut" />
        </div>
      </div>

      <DelayedTasks tasks={tasks} />
    </div>
  );
};

export default OverviewMode;