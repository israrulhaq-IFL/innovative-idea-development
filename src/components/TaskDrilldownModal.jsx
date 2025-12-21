import React, { useMemo, useState } from 'react'
import ChartModal from './ChartModal'
import styles from './TaskDrilldownModal.module.css'

const StatusBadge = ({ status }) => {
  const tone = {
    Completed: styles.good,
    'In Progress': styles.warn,
    'Not Started': styles.neutral,
    'On Hold': styles.warn,
    Cancelled: styles.bad,
  }[status] || styles.neutral

  return <span className={`${styles.badge} ${tone}`}>{status || 'Unknown'}</span>
}

const PriorityBadge = ({ priority }) => {
  const tone = {
    Critical: styles.bad,
    High: styles.warn,
    Medium: styles.neutral,
    Low: styles.good,
  }[priority] || styles.neutral

  return <span className={`${styles.badge} ${tone}`}>{priority || 'Unknown'}</span>
}

const TaskDrilldownModal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  tasks,
  canEdit,
  onUpdateStatus,
}) => {
  const [expandedIds, setExpandedIds] = useState(() => new Set())
  const [savingId, setSavingId] = useState(null)

  const sortedTasks = useMemo(() => {
    const copy = [...(tasks || [])]
    copy.sort((a, b) => {
      const ad = a.DueDate ? new Date(a.DueDate).getTime() : Number.POSITIVE_INFINITY
      const bd = b.DueDate ? new Date(b.DueDate).getTime() : Number.POSITIVE_INFINITY
      return ad - bd
    })
    return copy
  }, [tasks])

  const toggleExpand = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleStatusChange = async (task, nextStatus) => {
    if (!onUpdateStatus) return
    try {
      setSavingId(task.Id)
      await onUpdateStatus(task, nextStatus)
    } finally {
      setSavingId(null)
    }
  }

  return (
    <ChartModal isOpen={isOpen} onClose={onClose} title={title}>
      <div className={styles.modalTop}>
        {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
        <div className={styles.meta}>
          <span className={styles.metaItem}>Tasks: {sortedTasks.length}</span>
          <span className={styles.metaItem}>{canEdit ? 'Editing enabled' : 'Read-only'}</span>
        </div>
      </div>

      {sortedTasks.length === 0 ? (
        <div className={styles.empty}>No tasks match this selection.</div>
      ) : (
        <div className={styles.list}>
          {sortedTasks.map((t) => {
            const expanded = expandedIds.has(t.Id)
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

                  {canEdit && (
                    <div className={styles.actions}>
                      <select
                        className={styles.select}
                        value={t.Status || 'Not Started'}
                        disabled={savingId === t.Id}
                        onChange={(e) => handleStatusChange(t, e.target.value)}
                      >
                        <option value="Not Started">Not Started</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="On Hold">On Hold</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                      {savingId === t.Id && <span className={styles.saving}>Saving…</span>}
                    </div>
                  )}
                </div>

                {expanded && (
                  <div className={styles.expandArea}>
                    {t.Description && <div className={styles.block}>{t.Description}</div>}
                    <div className={styles.grid}>
                      <div className={styles.kv}><span>Department</span><strong>{t.Department || t.DepartmentId}</strong></div>
                      <div className={styles.kv}><span>Created</span><strong>{t.Created ? new Date(t.Created).toLocaleString() : '—'}</strong></div>
                      <div className={styles.kv}><span>Modified</span><strong>{t.Modified ? new Date(t.Modified).toLocaleString() : '—'}</strong></div>
                      <div className={styles.kv}><span>Remarks</span><strong>{t.Remarks || '—'}</strong></div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </ChartModal>
  )
}

export default TaskDrilldownModal
