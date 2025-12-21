import React, { useMemo } from 'react';
import { FiTrendingUp, FiTarget, FiClock } from 'react-icons/fi';
import { LazyStatusCharts, LazyPriorityCharts } from './LazyCharts';
import styles from './AnalyticsTrends.module.css';

const AnalyticsTrends = ({
  tasks,
  timeRange,
  department,
  chartType
}) => {
  return (
    <div className={styles.trends}>
      <div className={styles.header}>
        <h2>Performance Trends</h2>
        <p>Track task performance and completion patterns over time</p>
      </div>

      {/* Key Metrics Overview */}
      <div className={styles.metricsOverview}>
        <div className={styles.metric}>
          <div className={styles.metricIcon}><FiTrendingUp /></div>
          <div className={styles.metricContent}>
            <h3>Completion Trend</h3>
            <p>Tasks completed over time</p>
          </div>
        </div>

        <div className={styles.metric}>
          <div className={styles.metricIcon}><FiClock /></div>
          <div className={styles.metricContent}>
            <h3>Overdue Pattern</h3>
            <p>Delayed tasks identification</p>
          </div>
        </div>

        <div className={styles.metric}>
          <div className={styles.metricIcon}><FiTarget /></div>
          <div className={styles.metricContent}>
            <h3>Priority Focus</h3>
            <p>High priority task trends</p>
          </div>
        </div>
      </div>

      {/* Trend Charts */}
      <div className={styles.chartsGrid}>
        <div className={styles.chartCard}>
          <h3>Task Completion Trend</h3>
          <div className={styles.chartContainer}>
            <LazyStatusCharts
              tasks={tasks}
              chartType="line"
              title=""
              compact={true}
              showTitle={false}
              showLegend={false}
              showStats={false}
            />
          </div>
        </div>

        <div className={styles.chartCard}>
          <h3>Priority Distribution Trend</h3>
          <div className={styles.chartContainer}>
            <LazyPriorityCharts
              tasks={tasks}
              chartType="line"
              title=""
              compact={true}
              showTitle={false}
              showLegend={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsTrends;