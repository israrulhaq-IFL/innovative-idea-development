import React from 'react';
import styles from './DelayedTasksList.module.css';

const DelayedTasksList = ({ tasks, onViewDetails }) => {
  const now = new Date();

  const delayedTasks = tasks
    .filter(task => {
      if (!task.DueDate || task.Status === 'Completed') return false;
      const dueDate = new Date(task.DueDate);
      return dueDate < now;
    })
    .sort((a, b) => {
      const aDue = new Date(a.DueDate);
      const bDue = new Date(b.DueDate);
      return aDue - bDue; // Sort by due date ascending (most overdue first)
    })
    .slice(0, 5); // Show only top 5 delayed tasks

  const getDelayDays = (dueDate) => {
    const due = new Date(dueDate);
    const diffTime = now - due;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (delayedTasks.length === 0) {
    return (
      <div className={styles.delayedTasksList}>
        <div className={styles.noDelayed}>
          ✅ All tasks on track
        </div>
      </div>
    );
  }

  return (
    <div className={styles.delayedTasksList}>
      <div className={styles.taskList}>
        {delayedTasks.map((task, index) => (
          <div key={task.Id || index} className={styles.taskItem}>
            <div className={styles.taskInfo}>
              <span className={styles.taskTitle}>{task.Title}</span>
              <span className={styles.delayDays}>
                {getDelayDays(task.DueDate)} days overdue
              </span>
            </div>
            <div className={styles.taskAssignee}>
              {task.AssignedTo?.[0]?.Title || 'Unassigned'}
            </div>
          </div>
        ))}
      </div>
      {onViewDetails && (
        <button
          className={styles.viewAllBtn}
          onClick={onViewDetails}
        >
          View All Delayed Tasks
        </button>
      )}
    </div>
  );
};

export default DelayedTasksList;