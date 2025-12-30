import React, { useMemo, useState } from 'react';
import styles from './TaskDrilldownPanel.module.css';
import AssigneeAvatars from './AssigneeAvatars';

// Utility function to strip HTML tags and clean up text
const stripHtml = (html) => {
  if (!html) return '';

  // Create a temporary div element to parse HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;

  // Remove script and style elements
  const scripts = tempDiv.querySelectorAll('script, style');
  scripts.forEach((script) => script.remove());

  // Get text content and clean up whitespace
  const text = tempDiv.textContent || tempDiv.innerText || '';

  // Clean up extra whitespace and line breaks
  return text
    .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
    .replace(/\n\s*\n/g, '\n') // Remove empty lines
    .trim();
};

const StatusBadge = ({ status }) => {
  const tone =
    {
      Completed: styles.good,
      'In Progress': styles.warn,
      'Not Started': styles.neutral,
      'On Hold': styles.warn,
      Cancelled: styles.bad,
    }[status] || styles.neutral;

  return (
    <span className={`${styles.badge} ${tone}`}>{status || 'Unknown'}</span>
  );
};

const PriorityBadge = ({ priority }) => {
  const tone =
    {
      Critical: styles.bad,
      High: styles.warn,
      Medium: styles.neutral,
      Low: styles.good,
    }[priority] || styles.neutral;

  return (
    <span className={`${styles.badge} ${tone}`}>{priority || 'Unknown'}</span>
  );
};

const TaskDrilldownPanel = ({ subtitle, tasks }) => {
  const [expandedIds, setExpandedIds] = useState(() => new Set());

  const sortedTasks = useMemo(() => {
    const copy = [...(tasks || [])];
    copy.sort((a, b) => {
      const ad = a.DueDate
        ? new Date(a.DueDate).getTime()
        : Number.POSITIVE_INFINITY;
      const bd = b.DueDate
        ? new Date(b.DueDate).getTime()
        : Number.POSITIVE_INFINITY;
      return ad - bd;
    });
    return copy;
  }, [tasks]);

  const toggleExpand = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className={styles.panel}>
      <div className={styles.panelTop}>
        {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
        <div className={styles.meta}>
          <span className={styles.metaItem}>Tasks: {sortedTasks.length}</span>
        </div>
      </div>

      {sortedTasks.length === 0 ? (
        <div className={styles.empty}>No tasks match this selection.</div>
      ) : (
        <div className={styles.list}>
          {sortedTasks.map((t) => {
            const expanded = expandedIds.has(t.Id);
            return (
              <div key={t.Id} className={styles.row}>
                <div className={styles.rowTop}>
                  <button
                    type="button"
                    className={styles.expandBtn}
                    onClick={() => toggleExpand(t.Id)}
                    aria-label={expanded ? 'Collapse task' : 'Expand task'}
                  >
                    {expanded ? '▾' : '▸'}
                  </button>

                  <div className={styles.titleWrap}>
                    <div className={styles.taskTitle}>{t.Title}</div>
                    <div className={styles.badgeRow}>
                      <StatusBadge status={t.Status} />
                      <PriorityBadge priority={t.Priority} />
                      {t.DueDate && (
                        <span className={styles.dim}>
                          Due: {new Date(t.DueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {expanded && (
                  <div className={styles.expandArea}>
                    {t.Description && (
                      <div className={styles.block}>
                        {stripHtml(t.Description)}
                      </div>
                    )}
                    <div className={styles.grid}>
                      <div className={styles.kv}>
                        <span>Assignee</span>
                        <div className={styles.assigneeContainer}>
                          <AssigneeAvatars assignees={t.AssignedTo} />
                        </div>
                      </div>
                      <div className={styles.kv}>
                        <span>Department</span>
                        <strong>{t.Department || t.DepartmentId}</strong>
                      </div>
                      <div className={styles.kv}>
                        <span>Created</span>
                        <strong>
                          {t.Created
                            ? new Date(t.Created).toLocaleString()
                            : '—'}
                        </strong>
                      </div>
                      <div className={styles.kv}>
                        <span>Modified</span>
                        <strong>
                          {t.Modified
                            ? new Date(t.Modified).toLocaleString()
                            : '—'}
                        </strong>
                      </div>
                      <div className={styles.kv}>
                        <span>Remarks</span>
                        <strong>{stripHtml(t.Remarks) || '—'}</strong>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TaskDrilldownPanel;
