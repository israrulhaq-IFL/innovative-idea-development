import React from 'react';
import styles from './ControlPanel.module.css';

const ControlPanel = ({
  viewMode,
  onViewModeChange,
  filters,
  onFilterChange,
  onRefresh
}) => {
  const handleFilterChange = (filterType, value) => {
    onFilterChange({ [filterType]: value });
  };

  const clearFilters = () => {
    onFilterChange({
      status: 'all',
      priority: 'all',
      assignee: 'all',
      dateRange: 'all'
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== 'all');

  return (
    <div className={styles.controlPanel}>
      <div className={styles.viewMode}>
        <label>View Mode:</label>
        <div className={styles.viewButtons}>
          <button
            className={`${styles.viewBtn} ${viewMode === 'overview' ? styles.active : ''}`}
            onClick={() => onViewModeChange('overview')}
          >
            📊 Overview
          </button>
          <button
            className={`${styles.viewBtn} ${viewMode === 'detailed' ? styles.active : ''}`}
            onClick={() => onViewModeChange('detailed')}
          >
            📈 Detailed
          </button>
        </div>
      </div>

      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label htmlFor="statusFilter">Status:</label>
          <select
            id="statusFilter"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className={styles.select}
          >
            <option value="all">All Statuses</option>
            <option value="Not Started">Not Started</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="On Hold">On Hold</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label htmlFor="priorityFilter">Priority:</label>
          <select
            id="priorityFilter"
            value={filters.priority}
            onChange={(e) => handleFilterChange('priority', e.target.value)}
            className={styles.select}
          >
            <option value="all">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label htmlFor="assigneeFilter">Assignee:</label>
          <select
            id="assigneeFilter"
            value={filters.assignee}
            onChange={(e) => handleFilterChange('assignee', e.target.value)}
            className={styles.select}
          >
            <option value="all">All Assignees</option>
            {/* This would be populated dynamically from actual assignees */}
            <option value="Unassigned">Unassigned</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label htmlFor="dateFilter">Date Range:</label>
          <select
            id="dateFilter"
            value={filters.dateRange}
            onChange={(e) => handleFilterChange('dateRange', e.target.value)}
            className={styles.select}
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
          </select>
        </div>
      </div>

      <div className={styles.actions}>
        {hasActiveFilters && (
          <button onClick={clearFilters} className={styles.clearBtn}>
            Clear Filters
          </button>
        )}
        <button onClick={onRefresh} className={styles.refreshBtn}>
          🔄 Refresh
        </button>
      </div>
    </div>
  );
};

export default ControlPanel;