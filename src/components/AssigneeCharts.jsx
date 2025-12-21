import React from 'react';
import styles from './AssigneeCharts.module.css';

const AssigneeCharts = ({ tasks }) => {
  // Calculate assignee workload statistics
  const assigneeStats = tasks.reduce((acc, task) => {
    let assigneeNames = ['Unassigned'];

    if (task.AssignedTo && Array.isArray(task.AssignedTo) && task.AssignedTo.length > 0) {
      assigneeNames = task.AssignedTo.map(assignee => assignee.Title || 'Unknown');
    }

    assigneeNames.forEach(name => {
      acc[name] = (acc[name] || 0) + 1;
    });

    return acc;
  }, {});

  const assigneeEntries = Object.entries(assigneeStats);
  const totalAssignees = assigneeEntries.length;
  const totalTasks = tasks.length;
  const averageTasksPerAssignee = totalAssignees > 0 ? (totalTasks / totalAssignees).toFixed(1) : 0;

  // Find most loaded assignee
  const mostLoaded = assigneeEntries.reduce((max, [name, count]) =>
    count > max.count ? { name, count } : max,
    { name: 'None', count: 0 }
  );

  // Calculate workload distribution
  const workloadDistribution = assigneeEntries.reduce((acc, [, count]) => {
    if (count >= 5) acc.high++;
    else if (count >= 2) acc.medium++;
    else acc.low++;
    return acc;
  }, { high: 0, medium: 0, low: 0 });

  const highWorkloadPercentage = totalAssignees > 0 ? ((workloadDistribution.high / totalAssignees) * 100).toFixed(0) : 0;
  const mediumWorkloadPercentage = totalAssignees > 0 ? ((workloadDistribution.medium / totalAssignees) * 100).toFixed(0) : 0;
  const lowWorkloadPercentage = totalAssignees > 0 ? ((workloadDistribution.low / totalAssignees) * 100).toFixed(0) : 0;

  return (
    <div className={styles.assigneeOverview}>
      <div className={styles.overviewGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricIcon}>👥</div>
          <div className={styles.metricContent}>
            <h3>{totalAssignees}</h3>
            <p>Total Assignees</p>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricIcon}>📊</div>
          <div className={styles.metricContent}>
            <h3>{averageTasksPerAssignee}</h3>
            <p>Avg Tasks/Assignee</p>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricIcon}>🏆</div>
          <div className={styles.metricContent}>
            <h3>{mostLoaded.count}</h3>
            <p>Most Loaded ({mostLoaded.name})</p>
          </div>
        </div>
      </div>

      <div className={styles.workloadDistribution}>
        <h4>Workload Distribution</h4>
        <div className={styles.distributionBars}>
          <div className={styles.distributionItem}>
            <div className={styles.distributionLabel}>
              <span className={styles.highDot}></span>
              High (5+ tasks)
            </div>
            <div className={styles.distributionBar}>
              <div
                className={styles.distributionFill}
                style={{
                  width: `${highWorkloadPercentage}%`,
                  backgroundColor: '#dc3545'
                }}
              ></div>
            </div>
            <span className={styles.distributionValue}>{workloadDistribution.high} ({highWorkloadPercentage}%)</span>
          </div>

          <div className={styles.distributionItem}>
            <div className={styles.distributionLabel}>
              <span className={styles.mediumDot}></span>
              Medium (2-4 tasks)
            </div>
            <div className={styles.distributionBar}>
              <div
                className={styles.distributionFill}
                style={{
                  width: `${mediumWorkloadPercentage}%`,
                  backgroundColor: '#ffc107'
                }}
              ></div>
            </div>
            <span className={styles.distributionValue}>{workloadDistribution.medium} ({mediumWorkloadPercentage}%)</span>
          </div>

          <div className={styles.distributionItem}>
            <div className={styles.distributionLabel}>
              <span className={styles.lowDot}></span>
              Low (1 task)
            </div>
            <div className={styles.distributionBar}>
              <div
                className={styles.distributionFill}
                style={{
                  width: `${lowWorkloadPercentage}%`,
                  backgroundColor: '#28a745'
                }}
              ></div>
            </div>
            <span className={styles.distributionValue}>{workloadDistribution.low} ({lowWorkloadPercentage}%)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssigneeCharts;