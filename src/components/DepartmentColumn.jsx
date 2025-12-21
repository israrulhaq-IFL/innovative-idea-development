import React, { useMemo } from 'react'
import { LazyStatusCharts, LazyPriorityCharts } from './LazyCharts'
import DelayedTasks from './DelayedTasks'
import styles from './DepartmentColumn.module.css'

const computeAnalytics = (tasks) => {
  const totalTasks = tasks.length
  const completedTasks = tasks.filter((t) => t.Status === 'Completed').length
  const inProgressTasks = tasks.filter((t) => t.Status === 'In Progress').length
  const overdueTasks = tasks.filter((t) => {
    if (!t.DueDate || t.Status === 'Completed') return false
    return new Date(t.DueDate) < new Date()
  }).length

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  return {
    totalTasks,
    completedTasks,
    inProgressTasks,
    overdueTasks,
    completionRate,
  }
}

const MiniKpi = ({ label, value, tone }) => {
  return (
    <div className={`${styles.miniKpi} ${styles[tone] || ''}`}>
      <div className={styles.miniKpiValue}>{value}</div>
      <div className={styles.miniKpiLabel}>{label}</div>
    </div>
  )
}

const DepartmentColumn = ({
  departmentId,
  departmentLabel,
  departmentSubtitle,
  tasks,
  canEdit,
  onStatusDrill,
  onPriorityDrill,
  onDelayedDrill,
}) => {
  const analytics = useMemo(() => computeAnalytics(tasks), [tasks])

  return (
    <section className={styles.column}>
      <header className={styles.header}>
        <div className={styles.headerText}>
          <h2 className={styles.title}>{departmentLabel}</h2>
          {departmentSubtitle && <div className={styles.subtitle}>{departmentSubtitle}</div>}
        </div>

        <div className={`${styles.badge} ${canEdit ? styles.badgeEdit : styles.badgeView}`}>
          {canEdit ? 'Editable' : 'View only'}
        </div>
      </header>

      <div className={styles.kpiRow}>
        <MiniKpi label="Total" value={analytics.totalTasks} tone="neutral" />
        <MiniKpi label="Completed" value={analytics.completedTasks} tone="good" />
        <MiniKpi label="In Progress" value={analytics.inProgressTasks} tone="warn" />
        <MiniKpi label="Overdue" value={analytics.overdueTasks} tone="bad" />
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
            chartType="bar"
            horizontal={true}
            compact={true}
            showLegend={false}
            showTitle={false}
            onSegmentClick={({ label }) => onPriorityDrill?.(label)}
          />
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardTitle}>Delayed</div>
        <DelayedTasks tasks={tasks} onViewDetails={onDelayedDrill} />
      </div>
    </section>
  )
}

export default DepartmentColumn
