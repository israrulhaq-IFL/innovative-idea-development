import React from 'react';
import styles from './KPISection.module.css';

const KPISection = ({ analytics }) => {
  if (!analytics) {
    return (
      <div className={styles.kpiSection}>
        <div className={styles.loading}>Loading KPIs...</div>
      </div>
    );
  }

  const kpis = [
    {
      title: 'Total Tasks',
      value: analytics.totalTasks || 0,
      icon: '📊',
      color: 'primary'
    },
    {
      title: 'Completed',
      value: analytics.completedTasks || 0,
      icon: '✅',
      color: 'success'
    },
    {
      title: 'In Progress',
      value: analytics.inProgressTasks || 0,
      icon: '🔄',
      color: 'warning'
    },
    {
      title: 'Overdue',
      value: analytics.overdueTasks || 0,
      icon: '⚠️',
      color: 'danger'
    },
    {
      title: 'Completion Rate',
      value: analytics.completionRate ? `${analytics.completionRate}%` : '0%',
      icon: '📈',
      color: 'info'
    },
    {
      title: 'Avg. Completion Time',
      value: analytics.avgCompletionTime ? `${analytics.avgCompletionTime}d` : 'N/A',
      icon: '⏱️',
      color: 'secondary'
    }
  ];

  return (
    <div className={styles.kpiSection}>
      <h2 className={styles.title}>Key Performance Indicators</h2>
      <div className={styles.kpiGrid}>
        {kpis.map((kpi, index) => (
          <div key={index} className={`${styles.kpiCard} ${styles[kpi.color]}`}>
            <div className={styles.kpiIcon}>
              {kpi.icon}
            </div>
            <div className={styles.kpiContent}>
              <h3 className={styles.kpiValue}>{kpi.value}</h3>
              <p className={styles.kpiTitle}>{kpi.title}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default KPISection;