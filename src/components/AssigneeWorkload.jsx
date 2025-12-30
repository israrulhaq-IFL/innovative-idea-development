import React, { useState } from "react";
import styles from "./AssigneeWorkload.module.css";

const AssigneeWorkload = ({ tasks, onAssigneeClick }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Calculate assignee workload
  const assigneeStats = tasks.reduce((acc, task) => {
    let assigneeNames = ["Unassigned"];

    if (
      task.AssignedTo &&
      Array.isArray(task.AssignedTo) &&
      task.AssignedTo.length > 0
    ) {
      assigneeNames = task.AssignedTo.map(
        (assignee) => assignee.Title || "Unknown",
      );
    }

    assigneeNames.forEach((name) => {
      acc[name] = (acc[name] || 0) + 1;
    });

    return acc;
  }, {});

  const assigneeEntries = Object.entries(assigneeStats).sort(
    ([, a], [, b]) => b - a,
  ); // Sort by task count descending

  const displayedEntries = isExpanded
    ? assigneeEntries
    : assigneeEntries.slice(0, 12);
  const maxTasks = Math.max(...assigneeEntries.map(([, count]) => count));

  const handleAssigneeClick = (assigneeName) => {
    if (onAssigneeClick) {
      onAssigneeClick(assigneeName);
    }
  };

  return (
    <div className={styles.assigneeWorkload}>
      <div
        className={`${styles.workloadList} ${isExpanded ? styles.expanded : styles.collapsed}`}
      >
        {displayedEntries.length === 0 ? (
          <div className={styles.noAssignees}>No assignees found</div>
        ) : (
          displayedEntries.map(([name, count]) => (
            <div
              key={name}
              className={`${styles.workloadItem} ${onAssigneeClick ? styles.clickable : ""}`}
              onClick={() => handleAssigneeClick(name)}
            >
              <div className={styles.assigneeName}>{name}</div>
              <div className={styles.workloadBar}>
                <div
                  className={styles.workloadFill}
                  style={{
                    width: `${maxTasks > 0 ? (count / maxTasks) * 100 : 0}%`,
                    backgroundColor:
                      count >= 5
                        ? "#dc3545"
                        : count >= 3
                          ? "#ffc107"
                          : "#28a745",
                  }}
                />
              </div>
              <div className={styles.taskCount}>{count}</div>
            </div>
          ))
        )}
      </div>
      {assigneeEntries.length > 6 && (
        <button
          className={styles.expandButton}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? "Show Less" : `Show All (${assigneeEntries.length})`}
        </button>
      )}
    </div>
  );
};

export default AssigneeWorkload;
