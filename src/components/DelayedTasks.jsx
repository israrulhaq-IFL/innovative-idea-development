import React from 'react';
import styles from './DelayedTasks.module.css';
import AssigneeAvatars from './AssigneeAvatars';

const DelayedTasks = ({ tasks, showDetails = false, onViewDetails }) => {
  const now = new Date();

  const delayedTasks = tasks.filter(task => {
    if (!task.DueDate || task.Status === 'Completed') return false;

    const dueDate = new Date(task.DueDate);
    return dueDate < now;
  }).sort((a, b) => {
    const aDue = new Date(a.DueDate);
    const bDue = new Date(b.DueDate);
    return aDue - bDue; // Sort by due date ascending (most overdue first)
  });

  const getDelayDays = (dueDate) => {
    const due = new Date(dueDate);
    const diffTime = now - due;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'Critical': 'var(--danger-color)',
      'High': 'var(--warning-color)',
      'Medium': 'var(--info-color)',
      'Low': 'var(--success-color)',
    };
    return colors[priority] || 'var(--text-muted)';
  };

  if (delayedTasks.length === 0) {
    return (
      <div className={styles.delayedTasks}>
        <h3>Delayed Tasks</h3>
        <div className={styles.noDelayed}>
          <p>🎉 No delayed tasks! All tasks are on track.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.delayedTasks}>
      <div className={styles.header}>
        <h3>Delayed Tasks ({delayedTasks.length})</h3>
        {!showDetails && (
          <button
            type="button"
            className={styles.viewAll}
            onClick={() => onViewDetails?.()}
          >
            View Details
          </button>
        )}
      </div>

      {showDetails ? (
        <div className={styles.taskList}>
          {delayedTasks.map((task, index) => (
            <div key={task.Id || index} className={styles.taskItem}>
              <div className={styles.taskHeader}>
                <h4 className={styles.taskTitle}>{task.Title}</h4>
                <span
                  className={styles.priorityBadge}
                  style={{ backgroundColor: getPriorityColor(task.Priority) }}
                >
                  {task.Priority || 'Unknown'}
                </span>
              </div>

              <div className={styles.taskDetails}>
                <div className={styles.detail}>
                  <span className={styles.detailLabel}>Assignee:</span>
                  <div className={styles.detailValue}>
                    <AssigneeAvatars assignees={task.AssignedTo} />
                  </div>
                </div>
                <div className={styles.detail}>
                  <span className={styles.detailLabel}>Due Date:</span>
                  <span className={styles.detailValue}>
                    {new Date(task.DueDate).toLocaleDateString()}
                  </span>
                </div>
                <div className={styles.detail}>
                  <span className={styles.detailLabel}>Delay:</span>
                  <span className={styles.detailValue}>
                    {getDelayDays(task.DueDate)} days overdue
                  </span>
                </div>
                <div className={styles.detail}>
                  <span className={styles.detailLabel}>Status:</span>
                  <span className={styles.detailValue}>{task.Status}</span>
                </div>
              </div>

              {task.Description && (
                <div className={styles.taskDescription}>
                  {task.Description}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.summary}>
          <div className={styles.summaryStats}>
            <div className={styles.stat}>
              <span className={styles.statNumber}>{delayedTasks.length}</span>
              <span className={styles.statLabel}>Total Delayed</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statNumber}>
                {delayedTasks.filter(t => t.Priority === 'Critical').length}
              </span>
              <span className={styles.statLabel}>Critical Priority</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statNumber}>
                {Math.max(...delayedTasks.map(t => getDelayDays(t.DueDate)))}
              </span>
              <span className={styles.statLabel}>Max Delay (days)</span>
            </div>
          </div>

          <div className={styles.recentDelayed}>
            <h4>Most Overdue Tasks</h4>
            <ul className={styles.taskList}>
              {delayedTasks.slice(0, 5).map((task, index) => (
                <li key={task.Id || index} className={styles.taskSummary}>
                  <span className={styles.taskTitle}>{task.Title}</span>
                  <span className={styles.delayDays}>
                    {getDelayDays(task.DueDate)} days
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default DelayedTasks;