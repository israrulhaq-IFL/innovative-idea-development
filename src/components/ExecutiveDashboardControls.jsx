import React from 'react'
import styles from './ExecutiveDashboardControls.module.css'

const ExecutiveDashboardControls = ({ filters, onFiltersChange }) => {
  const set = (patch) => onFiltersChange({ ...filters, ...patch })

  const hasActiveFilters = Object.entries(filters).some(([k, v]) => k !== 'search' && v !== 'all') || Boolean(filters.search)

  return (
    <div className={styles.controls}>
      <div className={styles.left}>
        <div className={styles.group}>
          <label className={styles.label} htmlFor="status">Status</label>
          <select id="status" className={styles.select} value={filters.status} onChange={(e) => set({ status: e.target.value })}>
            <option value="all">All</option>
            <option value="Not Started">Not Started</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="On Hold">On Hold</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        <div className={styles.group}>
          <label className={styles.label} htmlFor="priority">Priority</label>
          <select id="priority" className={styles.select} value={filters.priority} onChange={(e) => set({ priority: e.target.value })}>
            <option value="all">All</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
        </div>

        <div className={styles.group}>
          <label className={styles.label} htmlFor="timeRange">Time</label>
          <select id="timeRange" className={styles.select} value={filters.timeRange} onChange={(e) => set({ timeRange: e.target.value })}>
            <option value="all">All</option>
            <option value="7d">7 days</option>
            <option value="30d">30 days</option>
            <option value="90d">90 days</option>
          </select>
        </div>

        <div className={styles.searchWrap}>
          <input
            className={styles.search}
            value={filters.search}
            onChange={(e) => set({ search: e.target.value })}
            placeholder="Search tasks…"
          />
        </div>
      </div>

      <div className={styles.right}>
        {hasActiveFilters && (
          <button
            type="button"
            className={styles.btnGhost}
            onClick={() => onFiltersChange({ status: 'all', priority: 'all', timeRange: 'all', search: '' })}
          >
            Clear
          </button>
        )}
      </div>
    </div>
  )
}

export default ExecutiveDashboardControls
