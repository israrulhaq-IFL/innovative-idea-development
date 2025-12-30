import React, { useMemo } from 'react';
import { LazyStatusCharts, LazyPriorityCharts } from './LazyCharts';
import AssigneeWorkload from './AssigneeWorkload';
import DelayedTasksList from './DelayedTasksList';
import styles from './DepartmentColumn.module.css';

const computeAnalytics = (tasks) => {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.Status === 'Completed').length;
  const inProgressTasks = tasks.filter(
    (t) => t.Status === 'In Progress',
  ).length;
  const overdueTasks = tasks.filter((t) => {
    if (!t.DueDate || t.Status === 'Completed') return false;
    return new Date(t.DueDate) < new Date();
  }).length;
  const highPriorityTasks = tasks.filter(
    (t) => t.Priority === 'High' || t.Priority === '(1) High',
  ).length;

  const completionRate =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const inProgressRate =
    totalTasks > 0 ? Math.round((inProgressTasks / totalTasks) * 100) : 0;
  const highPriorityRate =
    totalTasks > 0 ? Math.round((highPriorityTasks / totalTasks) * 100) : 0;
  const overdueRate =
    totalTasks > 0 ? Math.round((overdueTasks / totalTasks) * 100) : 0;

  return {
    totalTasks,
    completedTasks,
    inProgressTasks,
    overdueTasks,
    highPriorityTasks,
    completionRate,
    inProgressRate,
    highPriorityRate,
    overdueRate,
  };
};

const KPICard = ({ title, value, subtitle, icon, color, trend, onClick }) => {
  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up':
        return 'fas fa-arrow-up';
      case 'down':
        return 'fas fa-arrow-down';
      case 'right':
        return 'fas fa-arrow-right';
      default:
        return 'fas fa-minus';
    }
  };

  const getTrendColor = (trend) => {
    switch (trend) {
      case 'up':
        return '#28a745'; // green
      case 'down':
        return '#dc3545'; // red
      case 'right':
        return '#6c757d'; // gray
      default:
        return '#6c757d';
    }
  };

  return (
    <div
      className={styles.kpiCard}
      onClick={onClick}
      tabIndex={0}
      role="button"
      title={`View ${title} tasks`}
    >
      <div className={styles.kpiHeader}>
        <div
          className={styles.kpiIcon}
          style={{ backgroundColor: `${color}0D` }}
        >
          <i className={icon} style={{ color }}></i>
        </div>
        <div className={styles.kpiTrend}>
          <i
            className={getTrendIcon(trend)}
            style={{ color: getTrendColor(trend) }}
          ></i>
        </div>
      </div>
      <div className={styles.kpiContent}>
        <div className={styles.kpiTitle}>{title}</div>
        <div className={styles.kpiValue}>
          <span className={styles.kpiNumber} style={{ color }}>
            {value}
          </span>
          <span className={styles.kpiUnit}>%</span>
        </div>
        <div className={styles.kpiSubtitle}>{subtitle}</div>
      </div>
    </div>
  );
};

const MiniKpi = ({ label, value, tone }) => {
  return (
    <div className={`${styles.miniKpi} ${styles[tone] || ''}`}>
      <div className={styles.miniKpiValue}>{value}</div>
      <div className={styles.miniKpiLabel}>{label}</div>
    </div>
  );
};

const DepartmentColumnContent = ({
  tasks,
  onStatusDrill,
  onPriorityDrill,
  onDelayedDrill,
  onAssigneeDrill,
}) => {
  const analytics = useMemo(() => computeAnalytics(tasks), [tasks]);

  const kpiData = [
    {
      title: 'Completion',
      value: analytics.completionRate,
      subtitle: `${analytics.completedTasks} of ${analytics.totalTasks} tasks`,
      icon: 'fas fa-check-circle',
      color: '#dc3545', // red
      trend: 'up',
      onClick: () => onStatusDrill?.('Completed'),
    },
    {
      title: 'In Progress',
      value: analytics.inProgressRate,
      subtitle: `${analytics.inProgressTasks} of ${analytics.totalTasks} tasks`,
      icon: 'fas fa-spinner',
      color: '#17a2b8', // info blue
      trend: 'right',
      onClick: () => onStatusDrill?.('In Progress'),
    },
    {
      title: 'High Priority',
      value: analytics.highPriorityRate,
      subtitle: `${analytics.highPriorityTasks} of ${analytics.totalTasks} tasks`,
      icon: 'fas fa-exclamation-triangle',
      color: '#28a745', // green
      trend: 'down',
      onClick: () => onPriorityDrill?.('High'),
    },
    {
      title: 'Delayed Tasks',
      value: analytics.overdueRate,
      subtitle: `${analytics.overdueTasks} of ${analytics.totalTasks} tasks`,
      icon: 'fas fa-exclamation-circle',
      color: '#dc3545', // red
      trend: 'up',
      onClick: () => onDelayedDrill?.(),
    },
  ];

  return (
    <div className={styles.content}>
      <div className={styles.kpiGrid}>
        {kpiData.map((kpi, index) => (
          <KPICard
            key={index}
            title={kpi.title}
            value={kpi.value}
            subtitle={kpi.subtitle}
            icon={kpi.icon}
            color={kpi.color}
            trend={kpi.trend}
            onClick={kpi.onClick}
          />
        ))}
      </div>

      <div className={styles.card}>
        <div className={styles.cardTitle}>Status</div>
        <div className={styles.chartArea}>
          <LazyStatusCharts
            tasks={tasks}
            chartType="doughnut"
            compact={true}
            showLegend={false}
            showTitle={false}
            showStats={false}
            onSegmentClick={({ label }) => onStatusDrill?.(label)}
          />
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardTitle}>Priority</div>
        <div className={styles.chartArea}>
          <LazyPriorityCharts
            tasks={tasks}
            chartType="doughnut"
            compact={true}
            showLegend={false}
            showTitle={false}
            onSegmentClick={({ label }) => onPriorityDrill?.(label)}
          />
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardTitle}>Assignee Workload</div>
        <div className={styles.chartArea}>
          <AssigneeWorkload tasks={tasks} onAssigneeClick={onAssigneeDrill} />
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardTitle}>Delayed</div>
        <DelayedTasksList tasks={tasks} onViewDetails={onDelayedDrill} />
      </div>
    </div>
  );
};

export default DepartmentColumnContent;
