import React, { useMemo, useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSharePoint } from '../context/SharePointContext';
import {
  FiMaximize,
  FiMinimize,
  FiChevronRight,
  FiChevronLeft,
} from 'react-icons/fi';
import DepartmentColumn from '../components/DepartmentColumn';
import DepartmentColumnContent from '../components/DepartmentColumnContent';
import ExecutiveDashboardControls from '../components/ExecutiveDashboardControls';
import TaskDrilldownPanel from '../components/TaskDrilldownPanel';
import AssigneeAvatars from '../components/AssigneeAvatars';
import DashboardSkeleton from '../components/DashboardSkeleton';
import dataService from '../services/dataService';
import styles from './Dashboard.module.css';

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

// Helper function to normalize priority values consistently
const normalizePriority = (rawPriority) => {
  if (!rawPriority) return 'Unknown';

  // Handle SharePoint priorities that may have numeric prefixes like "(1) High"
  const priorityMatch = rawPriority.match(/^\(\d+\)\s*(.+)$/);
  const extractedPriority = priorityMatch ? priorityMatch[1] : rawPriority;

  // Map SharePoint priority names to display values
  const priorityMap = {
    High: 'High',
    Normal: 'Medium', // SharePoint "Normal" maps to display "Medium"
    Low: 'Low',
    Critical: 'Critical',
  };

  return priorityMap[extractedPriority] || extractedPriority;
};

// Expanded Task View Component
const ExpandedTaskView = ({ tasks, subtitle }) => {
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return '#28a745';
      case 'In Progress':
        return '#ffc107';
      case 'Not Started':
        return '#6c757d';
      case 'On Hold':
        return '#fd7e14';
      case 'Cancelled':
        return '#dc3545';
      default:
        return '#6c757d';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Critical':
        return 'linear-gradient(135deg, #dc3545, #c82333)';
      case 'High':
        return 'linear-gradient(135deg, #fd7e14, #e8590c)';
      case 'Medium':
        return 'linear-gradient(135deg, #ffc107, #e0a800)';
      case 'Low':
        return 'linear-gradient(135deg, #28a745, #1e7e34)';
      default:
        return 'linear-gradient(135deg, #6c757d, #545b62)';
    }
  };

  return (
    <div className={styles.expandedTaskView}>
      {subtitle && <h3>{subtitle}</h3>}
      <div className={styles.expandedTaskGrid}>
        {sortedTasks.length === 0 ? (
          <div className={styles.expandedEmpty}>
            No tasks match this selection.
          </div>
        ) : (
          sortedTasks.map((task) => (
            <div key={task.Id} className={styles.expandedCard}>
              <div className={styles.expandedCardHeader}>
                <h4 className={styles.expandedCardTitle}>{task.Title}</h4>
                <div
                  className={styles.expandedCardPriority}
                  style={{
                    background: getPriorityColor(
                      normalizePriority(task.Priority),
                    ),
                  }}
                >
                  {normalizePriority(task.Priority)}
                </div>
              </div>

              <div className={styles.expandedCardContent}>
                {task.Description && (
                  <div className={styles.expandedCardSection}>
                    <h4 className={styles.expandedCardSectionTitle}>
                      Description
                    </h4>
                    <p className={styles.expandedCardText}>
                      {stripHtml(task.Description)}
                    </p>
                  </div>
                )}

                <div className={styles.expandedCardGrid}>
                  <div className={styles.expandedCardField}>
                    <span className={styles.expandedCardFieldLabel}>
                      Assignee
                    </span>
                    <div className={styles.expandedCardFieldValue}>
                      <AssigneeAvatars assignees={task.AssignedTo} />
                    </div>
                  </div>

                  <div className={styles.expandedCardField}>
                    <span className={styles.expandedCardFieldLabel}>
                      Department
                    </span>
                    <span className={styles.expandedCardFieldValue}>
                      {task.Department || task.DepartmentId}
                    </span>
                  </div>

                  <div className={styles.expandedCardField}>
                    <span className={styles.expandedCardFieldLabel}>
                      Due Date
                    </span>
                    <span className={styles.expandedCardFieldValue}>
                      {task.DueDate
                        ? new Date(task.DueDate).toLocaleDateString()
                        : '—'}
                    </span>
                  </div>

                  <div className={styles.expandedCardField}>
                    <span className={styles.expandedCardFieldLabel}>
                      Created
                    </span>
                    <span className={styles.expandedCardFieldValue}>
                      {task.Created
                        ? new Date(task.Created).toLocaleString()
                        : '—'}
                    </span>
                  </div>

                  <div className={styles.expandedCardField}>
                    <span className={styles.expandedCardFieldLabel}>
                      Modified
                    </span>
                    <span className={styles.expandedCardFieldValue}>
                      {task.Modified
                        ? new Date(task.Modified).toLocaleString()
                        : '—'}
                    </span>
                  </div>

                  {task.Remarks && (
                    <div className={styles.expandedCardField}>
                      <span className={styles.expandedCardFieldLabel}>
                        Remarks
                      </span>
                      <span className={styles.expandedCardFieldValue}>
                        {stripHtml(task.Remarks)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { permissions, tasks, refreshData, updateTaskStatus, error, loading } =
    useSharePoint();

  // Get departments dynamically to avoid module-level initialization issues
  const DEPARTMENTS = React.useMemo(() => {
    try {
      return dataService()
        .getDepartments()
        .map((dept) => ({
          id: dept.id,
          label: dept.name.split(' ')[0], // Take first word as label (DCI, ERP, etc.)
          subtitle: dept.name,
          listName: dept.listName,
        }));
    } catch (error) {
      console.error('Failed to load departments:', error);
      // Fallback to empty array if service not ready
      return [];
    }
  }, []);

  const applyTimeRange = (tasks, timeRange) => {
    if (timeRange === 'all') return tasks;

    const now = new Date();
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    return tasks.filter((t) => {
      if (!t.Created) return true;
      const created = new Date(t.Created);
      const diffDays = (now - created) / (1000 * 60 * 60 * 24);
      return diffDays <= days;
    });
  };

  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    timeRange: 'all',
    search: '',
  });

  const [drill, setDrill] = useState({
    open: false,
    closing: false,
    departmentId: null,
    filterType: null, // 'status' | 'priority' | 'delayed' | 'assignee'
    filterValue: null,
  });

  const [departmentPage, setDepartmentPage] = useState(0); // 0 for first 2, 1 for last 2 departments
  const [isExpanded, setIsExpanded] = useState(false);
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);

  // Track screen width for responsive grid calculations
  useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const visibleDepartmentIds = useMemo(() => {
    if (!permissions) return [];
    if (permissions.canViewAll) return DEPARTMENTS.map((d) => d.id);
    if (permissions.allowedDepartments?.length)
      return permissions.allowedDepartments;
    return [];
  }, [permissions]);

  const displayedDepartments = useMemo(() => {
    const allVisible = DEPARTMENTS.filter((d) =>
      visibleDepartmentIds.includes(d.id),
    );

    // When split view is open, paginate departments (2 per page)
    if (drill.open && allVisible.length > 2) {
      const startIndex = departmentPage * 2;
      return allVisible.slice(startIndex, startIndex + 2);
    }

    return allVisible;
  }, [visibleDepartmentIds, drill.open, departmentPage]);

  const totalPages = useMemo(() => {
    const allVisible = DEPARTMENTS.filter((d) =>
      visibleDepartmentIds.includes(d.id),
    );
    const pages =
      drill.open && allVisible.length > 2
        ? Math.ceil(allVisible.length / 2)
        : 1;
    return pages;
  }, [visibleDepartmentIds, drill.open, departmentPage]);

  const canNavigatePrev = departmentPage > 0;
  const canNavigateNext = departmentPage < totalPages - 1;

  const filteredTasks = useMemo(() => {
    let out = [...(tasks || [])];

    if (filters.status !== 'all')
      out = out.filter((t) => t.Status === filters.status);
    if (filters.priority !== 'all') {
      out = out.filter((t) => {
        const taskPriority = t.Priority || '';
        // Handle SharePoint priorities that may have numeric prefixes like "(1) High"
        const priorityMatch = taskPriority.match(/^\(\d+\)\s*(.+)$/);
        const rawPriority = priorityMatch ? priorityMatch[1] : taskPriority;
        // Map SharePoint priority names to filter values
        const priorityMap = {
          High: 'High',
          Normal: 'Medium', // SharePoint "Normal" maps to filter "Medium"
          Low: 'Low',
          Critical: 'Critical',
        };
        const mappedPriority = priorityMap[rawPriority] || rawPriority;
        return mappedPriority === filters.priority;
      });
    }

    out = applyTimeRange(out, filters.timeRange);

    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      out = out.filter(
        (t) =>
          String(t.Title || '')
            .toLowerCase()
            .includes(q) ||
          String(t.Description || '')
            .toLowerCase()
            .includes(q) ||
          String(t.Remarks || '')
            .toLowerCase()
            .includes(q),
      );
    }

    return out;
  }, [tasks, filters]);

  const tasksByDepartment = useMemo(() => {
    const map = {};
    for (const d of DEPARTMENTS) {
      map[d.id] = filteredTasks.filter((t) => t.DepartmentId === d.id);
    }
    return map;
  }, [filteredTasks]);

  const drillTasks = useMemo(() => {
    if (!drill.open || !drill.departmentId) return [];
    const base = tasksByDepartment[drill.departmentId] || [];

    if (drill.filterType === 'status') {
      return base.filter((t) => (t.Status || 'Unknown') === drill.filterValue);
    }

    if (drill.filterType === 'priority') {
      return base.filter(
        (t) => normalizePriority(t.Priority) === drill.filterValue,
      );
    }

    if (drill.filterType === 'delayed') {
      const now = new Date();
      return base.filter((t) => {
        if (!t.DueDate || t.Status === 'Completed') return false;
        return new Date(t.DueDate) < now;
      });
    }

    return base;
  }, [drill, tasksByDepartment]);

  const drillTitle = useMemo(() => {
    const dept = DEPARTMENTS.find((d) => d.id === drill.departmentId);
    if (!dept) return 'Details';

    if (drill.filterType === 'status')
      return `${dept.label} — Status: ${drill.filterValue}`;
    if (drill.filterType === 'priority')
      return `${dept.label} — Priority: ${drill.filterValue}`;
    if (drill.filterType === 'delayed') return `${dept.label} — Delayed Tasks`;

    return `${dept.label} — All Tasks`;
  }, [drill]);

  const drillSubtitle = useMemo(() => {
    const dept = DEPARTMENTS.find((d) => d.id === drill.departmentId);
    return dept?.subtitle || null;
  }, [drill]);

  const canEditDrillDept = useMemo(() => {
    if (!permissions || !drill.departmentId) return false;
    return permissions.canEditDepartments?.includes(drill.departmentId);
  }, [permissions, drill.departmentId]);

  // Calculate grid columns based on screen width and department count
  const getGridTemplateColumns = (departmentCount) => {
    if (screenWidth <= 900) {
      return '1fr'; // Single column on very small screens
    } else if (screenWidth <= 1200) {
      // Auto-fit with minimum width on medium screens
      return "repeat(auto-fit, minmax(320px, 1fr))";
    } else {
      // Dynamic columns based on department count on large screens
      return `repeat(${departmentCount}, 1fr)`;
    }
  };

  const openDrill = (departmentId, filterType, filterValue = null) => {
    // Open split view immediately
    setDrill({
      open: true,
      closing: false,
      departmentId,
      filterType,
      filterValue,
    });

    // Then scroll to bring the split panel into view with minimal scrolling
    setTimeout(() => {
      const splitPanel = document.querySelector(`.${styles.splitPanel}`);
      if (splitPanel) {
        // Calculate position to show split panel with 55px from top
        const panelRect = splitPanel.getBoundingClientRect();
        const scrollTop = window.pageYOffset + panelRect.top - 55;

        window.scrollTo({
          top: scrollTop,
          behavior: 'smooth',
        });
      }
    }, 100); // Small delay to allow split panel to render
  };

  if (loading) {
    return (
      <>
        <Helmet>
          <title>ITG Dashboard — Executive Overview</title>
          <meta
            name="description"
            content="Executive ITG SharePoint task dashboard with per-department KPI and drilldowns"
          />
        </Helmet>
        <DashboardSkeleton />
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>ITG Dashboard — Executive Overview</title>
        <meta
          name="description"
          content="Executive ITG SharePoint task dashboard with per-department KPI and drilldowns"
        />
      </Helmet>

      <div className={styles.dashboard}>
        <section className={styles.headerSection}>
          <div className={styles.topRow}>
            <div className={styles.titleBlock}>
              <h1 className={styles.pageTitle}>Executive Dashboard</h1>
              <p className={styles.pageSubtitle}>
                One-screen view • drill into any slice for details • edits apply
                only where you have rights
              </p>
            </div>

            <ExecutiveDashboardControls
              filters={filters}
              onFiltersChange={setFilters}
            />
          </div>
        </section>

        {error && (
          <div className={styles.errorBanner}>
            <div className={styles.errorContent}>
              <span className={styles.errorIcon}>⚠️</span>
              <span className={styles.errorMessage}>{error}</span>
              <button
                className={styles.errorDismiss}
                onClick={() => window.location.reload()}
                title="Retry connection"
              >
                ↻
              </button>
            </div>
          </div>
        )}

        <div
          className={`${styles.mainContent} ${drill.open && !drill.closing ? styles.splitView : ''} ${drill.closing ? styles.splitClosing : ''} ${isExpanded ? styles.mainContentExpanded : ''}`}
        >
          <div
            className={`${styles.grid} ${drill.open && !drill.closing ? styles.gridSplit : ''} ${drill.closing ? styles.gridClosing : ''} ${isExpanded ? styles.gridExpanded : ''}`}
          >
            {/* Navigation controls when split view is open and there are more than 2 departments */}
            {drill.open && !drill.closing && totalPages > 1 && (
              <div
                className={`${styles.navigationBar} ${isExpanded ? styles.navigationBarExpanded : ''}`}
              >
                <button
                  className={`${styles.navButton} ${!canNavigatePrev ? styles.navDisabled : ''}`}
                  onClick={() =>
                    canNavigatePrev && setDepartmentPage(departmentPage - 1)
                  }
                  disabled={!canNavigatePrev}
                  aria-label="Previous departments"
                >
                  ‹ Previous
                </button>
                <span className={styles.pageIndicator}>
                  Page {departmentPage + 1} of {totalPages}
                </span>
                <button
                  className={`${styles.navButton} ${!canNavigateNext ? styles.navDisabled : ''}`}
                  onClick={() =>
                    canNavigateNext && setDepartmentPage(departmentPage + 1)
                  }
                  disabled={!canNavigateNext}
                  aria-label="Next departments"
                >
                  Next ›
                </button>
              </div>
            )}

            {/* Department headers - outside scroll area */}
            {drill.open && !drill.closing && (
              <div
                className={`${styles.departmentsHeadersSplit} ${isExpanded ? styles.departmentsHeadersExpanded : ''}`}
                style={{
                  gridTemplateColumns: getGridTemplateColumns(
                    displayedDepartments.length,
                  ),
                }}
              >
                {/* DEBUG: Headers should be hidden when expanded */}
                {displayedDepartments.map((d) => {
                  const canEdit = permissions?.canEditDepartments?.includes(
                    d.id,
                  );
                  return (
                    <div
                      key={`header-${d.id}`}
                      className={styles.departmentHeader}
                    >
                      <div className={styles.headerText}>
                        <h2 className={styles.title}>{d.label}</h2>
                        {d.subtitle && (
                          <div className={styles.subtitle}>{d.subtitle}</div>
                        )}
                      </div>
                      <div className={styles.headerActions}>
                        {canEdit && (
                          <a
                            href={`${window.location.origin}/Lists/${d.listName}/AllItems.aspx`}
                            className={styles.taskListLink}
                            title="Open task list"
                          >
                            📋
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Department content - inside scroll area */}
            {!isExpanded && (
              <div
                className={styles.departmentsGridNormal}
                style={{
                  gridTemplateColumns: getGridTemplateColumns(
                    displayedDepartments.length,
                  ),
                }}
              >
                {displayedDepartments.map((d) => {
                  const canEdit = permissions?.canEditDepartments?.includes(
                    d.id,
                  );
                  return (
                    <div
                      key={`content-${d.id}`}
                      className={
                        drill.open && !drill.closing
                          ? styles.departmentContent
                          : styles.departmentWrapper
                      }
                    >
                      {!drill.open && (
                        <header className={styles.header}>
                          <div className={styles.headerText}>
                            <h2 className={styles.title}>{d.label}</h2>
                            {d.subtitle && (
                              <div className={styles.subtitle}>
                                {d.subtitle}
                              </div>
                            )}
                          </div>
                          <div className={styles.headerActions}>
                            {canEdit && (
                              <a
                                href={`${window.location.origin}/Lists/${d.listName}/AllItems.aspx`}
                                className={styles.taskListLink}
                                title="Open task list"
                              >
                                📋
                              </a>
                            )}
                            <div
                              className={`${styles.badge} ${canEdit ? styles.badgeEdit : styles.badgeView}`}
                            >
                              {canEdit ? 'Editable' : 'View only'}
                            </div>
                          </div>
                        </header>
                      )}
                      <DepartmentColumnContent
                        tasks={tasksByDepartment[d.id] || []}
                        onStatusDrill={(status) =>
                          openDrill(d.id, 'status', status)
                        }
                        onPriorityDrill={(priority) =>
                          openDrill(d.id, 'priority', priority)
                        }
                        onDelayedDrill={() => openDrill(d.id, 'delayed')}
                        onAssigneeDrill={(assignee) =>
                          openDrill(d.id, 'assignee', assignee)
                        }
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {drill.open && (
            <div
              className={`${styles.splitPanel} ${drill.closing ? styles.splitClosing : ''} ${isExpanded ? styles.splitPanelExpanded : ''}`}
            >
              <div className={styles.splitHeader}>
                <h2 className={styles.splitTitle}>{drillTitle}</h2>
                <div className={styles.splitHeaderActions}>
                  {!isExpanded && (
                    <button
                      className={styles.closeSplitBtn}
                      onClick={() => {
                        // Start closing animation
                        setDrill((prev) => ({ ...prev, closing: true }));

                        // Complete close after animation
                        setTimeout(() => {
                          setDrill({
                            open: false,
                            closing: false,
                            departmentId: null,
                            filterType: null,
                            filterValue: null,
                          });
                          setDepartmentPage(0); // Reset to first page when closing split view
                          setIsExpanded(false); // Reset expanded state
                        }, 600); // Match CSS transition duration
                      }}
                      aria-label="Close split view"
                    >
                      ✕
                    </button>
                  )}
                  <button
                    className={styles.expandBtn}
                    onClick={() => setIsExpanded(!isExpanded)}
                    aria-label={
                      isExpanded ? 'Collapse split view' : 'Expand split view'
                    }
                    title={
                      isExpanded ? 'Collapse split view' : 'Expand split view'
                    }
                  >
                    {isExpanded ? <FiChevronLeft /> : <FiChevronRight />}
                  </button>
                </div>
              </div>
              <div className={styles.splitContent}>
                {isExpanded ? (
                  <ExpandedTaskView
                    tasks={drillTasks}
                    subtitle={drillSubtitle}
                  />
                ) : (
                  <TaskDrilldownPanel
                    subtitle={drillSubtitle}
                    tasks={drillTasks}
                  />
                )}
              </div>
            </div>
          )}

          {/* Overlay removed since we're not using modal anymore */}
          {/* {isExpanded && (
            <div
              className={`${styles.expandedOverlay} ${isExpanded ? styles.active : ''}`}
              onClick={() => setIsExpanded(false)}
            />
          )} */}
        </div>
      </div>
    </>
  );
};

export default Dashboard;
