import React from "react";
import styles from "./DelayedTasks.module.css";

const DelayedTasks = ({ tasks, showDetails = false, onViewDetails }) => {
  const now = new Date();

  const delayedTasks = tasks
    .filter((task) => {
      if (!task.DueDate || task.Status === "Completed") return false;
      const dueDate = new Date(task.DueDate);
      return dueDate < now;
    })
    .sort((a, b) => {
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
      Critical: "var(--danger-color)",
      High: "var(--warning-color)",
      Medium: "var(--info-color)",
      Low: "var(--success-color)",
    };
    return colors[priority] || "var(--text-muted)";
  };

  // Modern compact layout for overview
  if (!showDetails) {
    if (delayedTasks.length === 0) {
      return (
        <div className={styles.compactDelayed}>
          <div className={styles.compactHeader}>
            <div className={styles.statusIcon}>✅</div>
            <div className={styles.compactTitle}>All Tasks On Track</div>
          </div>
          <div className={styles.compactMessage}>
            No delayed tasks found. Great job keeping everything on schedule!
          </div>
        </div>
      );
    }

    return (
      <div className={styles.compactDelayed}>
        <div className={styles.compactHeader}>
          <div className={styles.statusIcon}>⚠️</div>
          <div className={styles.compactTitle}>
            {delayedTasks.length} Delayed Tasks
          </div>
        </div>

        <div className={styles.delayedStats}>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>
              {delayedTasks.filter((t) => t.Priority === "Critical").length}
            </span>
            <span className={styles.statLabel}>Critical</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>
              {Math.max(...delayedTasks.map((t) => getDelayDays(t.DueDate)), 0)}
            </span>
            <span className={styles.statLabel}>Max Days</span>
          </div>
        </div>

        <div className={styles.topDelayedTasks}>
          {delayedTasks.slice(0, 3).map((task, index) => (
            <div key={task.Id || index} className={styles.delayedTaskCard}>
              <div className={styles.taskHeader}>
                <span
                  className={styles.taskPriority}
                  style={{
                    backgroundColor: getPriorityColor(task.Priority),
                  }}
                >
                  {task.Priority || "Med"}
                </span>
                <span className={styles.delayDays}>
                  {getDelayDays(task.DueDate)}d
                </span>
              </div>
              <div className={styles.taskTitle}>
                {task.Title.length > 30
                  ? `${task.Title.substring(0, 30)}...`
                  : task.Title}
              </div>
              <div className={styles.taskAssignee}>
                {task.AssignedTo?.[0]?.Title || "Unassigned"}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Original detailed layout for other uses
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

  // Group delayed tasks by priority for better visualization
  const priorityGroups = delayedTasks.reduce((acc, task) => {
    const priority = task.Priority || "Unknown";
    if (!acc[priority]) {
      acc[priority] = [];
    }
    acc[priority].push(task);
    return acc;
  }, {});

  return (
    <div className={styles.delayedTasks}>
      <div className={styles.header}>
        <h3>Delayed Tasks Overview</h3>
      </div>

      {/* Summary Cards */}
      <div className={styles.summaryCards}>
        <div className={styles.summaryCard}>
          <div className={styles.cardIcon}>⏰</div>
          <div className={styles.cardContent}>
            <h4>{delayedTasks.length}</h4>
            <p>Total Delayed</p>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.cardIcon}>🚨</div>
          <div className={styles.cardContent}>
            <h4>
              {delayedTasks.filter((t) => t.Priority === "Critical").length}
            </h4>
            <p>Critical Priority</p>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.cardIcon}>📅</div>
          <div className={styles.cardContent}>
            <h4>
              {Math.max(...delayedTasks.map((t) => getDelayDays(t.DueDate)))}
            </h4>
            <p>Max Delay (days)</p>
          </div>
        </div>
      </div>

      {/* Priority Breakdown */}
      <div className={styles.priorityBreakdown}>
        {Object.entries(priorityGroups).map(([priority, tasks]) => (
          <div key={priority} className={styles.priorityGroup}>
            <div className={styles.priorityHeader}>
              <span
                className={styles.priorityBadge}
                style={{ backgroundColor: getPriorityColor(priority) }}
              >
                {priority}
              </span>
              <span className={styles.priorityCount}>{tasks.length}</span>
            </div>
            <div className={styles.priorityBar}>
              <div
                className={styles.priorityFill}
                style={{
                  width: `${(tasks.length / delayedTasks.length) * 100}%`,
                  backgroundColor: getPriorityColor(priority),
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Most Critical Tasks */}
      <div className={styles.criticalTasks}>
        <h4>Most Critical Delays</h4>
        <div className={styles.taskList}>
          {delayedTasks
            .sort((a, b) => getDelayDays(b.DueDate) - getDelayDays(a.DueDate))
            .slice(0, 3)
            .map((task, index) => (
              <div key={task.Id || index} className={styles.criticalTask}>
                <div className={styles.taskInfo}>
                  <span className={styles.taskTitle}>{task.Title}</span>
                  <span className={styles.delayBadge}>
                    {getDelayDays(task.DueDate)} days overdue
                  </span>
                </div>
                <div className={styles.taskMeta}>
                  <span className={styles.assignee}>
                    {task.AssignedTo?.[0]?.Title || "Unassigned"}
                  </span>
                  <span className={styles.dueDate}>
                    Due: {new Date(task.DueDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default DelayedTasks;
