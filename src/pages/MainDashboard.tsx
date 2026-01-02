import React, { useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIdeaData, Idea } from '../contexts/DataContext';
import { useUser } from '../contexts/UserContext';
import { useTheme } from '../contexts/ThemeContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import styles from './MainDashboard.module.css';

const MainDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { data, loading, error, loadIdeas, loadTasks, loadIdeaTrailEvents } = useIdeaData();
  const { user, isAdmin, isApprover } = useUser();
  const { theme } = useTheme();
  const dataLoadedRef = useRef(false);

  useEffect(() => {
    // Only load data once when component mounts
    if (!dataLoadedRef.current) {
      dataLoadedRef.current = true;
      loadIdeas();
      loadTasks();
      loadIdeaTrailEvents();
    }
  }, []); // Empty dependency array - run only on mount

  // All ideas for collective statistics
  const allIdeas = data.ideas;
  const allTasks = data.tasks;

  // Calculate statistics
  const stats = useMemo(() => {
    const totalIdeas = allIdeas.length;
    const pendingIdeas = allIdeas.filter(
      (idea) => idea.status === 'Pending Approval',
    ).length;
    const approvedIdeas = allIdeas.filter(
      (idea) => idea.status === 'Approved',
    ).length;
    const inProgressIdeas = allIdeas.filter(
      (idea) => idea.status === 'In Progress',
    ).length;
    const rejectedIdeas = allIdeas.filter(
      (idea) => idea.status === 'Rejected',
    ).length;
    const completedIdeas = allIdeas.filter(
      (idea) => idea.status === 'Completed',
    ).length;

    const approvalRate = totalIdeas > 0
      ? Math.round(((approvedIdeas + inProgressIdeas + completedIdeas) / totalIdeas) * 100)
      : 0;

    return {
      totalIdeas,
      pendingIdeas,
      approvedIdeas,
      inProgressIdeas,
      rejectedIdeas,
      completedIdeas,
      approvalRate,
    };
  }, [allIdeas]);

  // Get recent ideas (sorted by date, most recent first)
  const recentIdeas = useMemo(() => {
    return [...allIdeas]
      .sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime())
      .slice(0, 10);
  }, [allIdeas]);

  // Get ideas by status for the grid
  const pendingIdeasList = useMemo(() =>
    allIdeas.filter(idea => idea.status === 'Pending Approval').slice(0, 3),
    [allIdeas]);

  const approvedIdeasList = useMemo(() =>
    allIdeas.filter(idea => idea.status === 'Approved').slice(0, 3),
    [allIdeas]);

  const inProgressIdeasList = useMemo(() =>
    allIdeas.filter(idea => idea.status === 'In Progress').slice(0, 3),
    [allIdeas]);

  const implementedIdeasList = useMemo(() =>
    allIdeas.filter(idea => idea.status === 'Completed').slice(0, 3),
    [allIdeas]);

  // Get recent tasks
  const recentTasks = useMemo(() => {
    return [...allTasks]
      .sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime())
      .slice(0, 6);
  }, [allTasks]);

  // Get status class
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'Pending':
      case 'Pending Approval':
        return styles.statusPending;
      case 'Approved':
        return styles.statusApproved;
      case 'In Progress':
        return styles.statusInProgress;
      case 'Rejected':
        return styles.statusRejected;
      case 'Completed':
        return styles.statusCompleted;
      default:
        return styles.statusPending;
    }
  };

  // Get priority class
  const getPriorityClass = (priority?: string) => {
    switch (priority) {
      case 'High':
      case 'Critical':
        return styles.priorityHigh;
      case 'Medium':
      case 'Normal':
        return styles.priorityMedium;
      case 'Low':
        return styles.priorityLow;
      default:
        return styles.priorityMedium;
    }
  };

  // Format date
  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Calculate days ago
  const daysAgo = (date: Date | string) => {
    const now = new Date();
    const d = new Date(date);
    const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    return `${diff} days ago`;
  };

  if (loading.ideas) {
    return (
      <div className={`${styles.dashboard} ${theme === 'dark' ? styles.darkTheme : styles.lightTheme}`}>
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <h1 className={styles.title}>Loading Dashboard...</h1>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.dashboard} ${theme === 'dark' ? styles.darkTheme : styles.lightTheme}`}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>🚀 Innovation Hub</h1>
          <p className={styles.subtitle}>
            Enterprise Innovation Management Dashboard
          </p>
          {user?.user?.Title && (
            <div className={styles.userGreeting}>
              <span>👋</span> Welcome back, {user.user.Title}
            </div>
          )}
        </div>
      </header>

      {/* KPI Cards */}
      <section className={`${styles.kpiGrid} ${styles.fadeInUp} ${styles.delay1}`}>
        <div
          className={`${styles.kpiCard} ${styles.kpiCardTotal}`}
          onClick={() => navigate('/my-ideas')}
        >
          <div className={styles.kpiIcon}>💡</div>
          <div className={styles.kpiValue}>{stats.totalIdeas}</div>
          <div className={styles.kpiLabel}>Total Ideas</div>
          <div className={styles.kpiTrend}>
            <span>📊</span> All submissions
          </div>
        </div>

        <div
          className={`${styles.kpiCard} ${styles.kpiCardPending}`}
          onClick={() => navigate('/approver')}
        >
          <div className={styles.kpiIcon}>⏳</div>
          <div className={styles.kpiValue}>{stats.pendingIdeas}</div>
          <div className={styles.kpiLabel}>Pending Review</div>
          <div className={styles.kpiTrend}>
            <span>🔔</span> Awaiting approval
          </div>
        </div>

        <div
          className={`${styles.kpiCard} ${styles.kpiCardApproved}`}
          onClick={() => navigate('/my-ideas')}
        >
          <div className={styles.kpiIcon}>✅</div>
          <div className={styles.kpiValue}>{stats.approvedIdeas}</div>
          <div className={styles.kpiLabel}>Approved</div>
          <div className={styles.kpiTrend}>
            <span>🎉</span> Ready to implement
          </div>
        </div>

        <div
          className={`${styles.kpiCard} ${styles.kpiCardInProgress}`}
          onClick={() => navigate('/my-ideas')}
        >
          <div className={styles.kpiIcon}>🔄</div>
          <div className={styles.kpiValue}>{stats.inProgressIdeas}</div>
          <div className={styles.kpiLabel}>In Progress</div>
          <div className={styles.kpiTrend}>
            <span>⚡</span> Active development
          </div>
        </div>

        <div
          className={`${styles.kpiCard} ${styles.kpiCardRejected}`}
          onClick={() => navigate('/my-ideas')}
        >
          <div className={styles.kpiIcon}>❌</div>
          <div className={styles.kpiValue}>{stats.rejectedIdeas}</div>
          <div className={styles.kpiLabel}>Rejected</div>
          <div className={`${styles.kpiTrend} ${styles.kpiTrendDown}`}>
            <span>📝</span> Need revision
          </div>
        </div>
      </section>

      {/* Main Content Grid */}
      <div className={styles.contentGrid}>
        {/* Recent Ideas */}
        <section className={`${styles.card} ${styles.fadeInUp} ${styles.delay2}`}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>
              <span className={styles.cardTitleIcon}>📋</span>
              Recent Ideas
            </h2>
            <button
              className={styles.viewAllBtn}
              onClick={() => navigate('/my-ideas')}
            >
              View All
            </button>
          </div>
          <div className={styles.cardBody}>
            {recentIdeas.length > 0 ? (
              <div className={styles.ideasList}>
                {recentIdeas.map((idea) => (
                  <div
                    key={idea.id}
                    className={styles.ideaCard}
                    onClick={() => navigate(`/idea/${idea.id}`)}
                  >
                    <div className={styles.ideaCardHeader}>
                      <h3 className={styles.ideaTitle}>{idea.title}</h3>
                      <span className={`${styles.ideaStatus} ${getStatusClass(idea.status)}`}>
                        {idea.status}
                      </span>
                    </div>
                    <p className={styles.ideaDescription}>
                      {idea.description || 'No description provided'}
                    </p>
                    <div className={styles.ideaMeta}>
                      <span className={styles.ideaMetaItem}>
                        <span>👤</span> {idea.createdBy}
                      </span>
                      <span className={styles.ideaMetaItem}>
                        <span>📅</span> {formatDate(idea.createdDate)}
                      </span>
                      <span className={styles.ideaMetaItem}>
                        <span>🏷️</span> {idea.category || 'General'}
                      </span>
                      {idea.attachments && idea.attachments.length > 0 && (
                        <span className={styles.ideaMetaItem}>
                          <span>📎</span> {idea.attachments.length}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>💭</div>
                <p className={styles.emptyText}>No ideas submitted yet. Be the first to innovate!</p>
              </div>
            )}
          </div>
        </section>

        {/* Quick Actions & Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Quick Actions */}
          <section className={`${styles.card} ${styles.fadeInUp} ${styles.delay3}`}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>
                <span className={styles.cardTitleIcon}>⚡</span>
                Quick Actions
              </h2>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.quickActions}>
                <button
                  className={styles.actionBtn}
                  onClick={() => navigate('/idea/new')}
                >
                  <span className={styles.actionIcon}>💡</span>
                  <div className={styles.actionContent}>
                    <h3 className={styles.actionTitle}>Submit New Idea</h3>
                    <p className={styles.actionDescription}>Share your innovative ideas</p>
                  </div>
                  <span className={styles.actionArrow}>→</span>
                </button>

                <button
                  className={styles.actionBtn}
                  onClick={() => navigate('/my-ideas')}
                >
                  <span className={styles.actionIcon}>📋</span>
                  <div className={styles.actionContent}>
                    <h3 className={styles.actionTitle}>View My Ideas</h3>
                    <p className={styles.actionDescription}>Track your submissions</p>
                  </div>
                  <span className={styles.actionArrow}>→</span>
                </button>

                {isApprover && (
                  <button
                    className={styles.actionBtn}
                    onClick={() => navigate('/approver')}
                  >
                    <span className={styles.actionIcon}>✅</span>
                    <div className={styles.actionContent}>
                      <h3 className={styles.actionTitle}>Review Ideas</h3>
                      <p className={styles.actionDescription}>{stats.pendingIdeas} pending review</p>
                    </div>
                    <span className={styles.actionArrow}>→</span>
                  </button>
                )}

                {isAdmin && (
                  <button
                    className={styles.actionBtn}
                    onClick={() => navigate('/admin')}
                  >
                    <span className={styles.actionIcon}>⚙️</span>
                    <div className={styles.actionContent}>
                      <h3 className={styles.actionTitle}>Admin Panel</h3>
                      <p className={styles.actionDescription}>System management</p>
                    </div>
                    <span className={styles.actionArrow}>→</span>
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* Approval Rate */}
          <section className={`${styles.card} ${styles.fadeInUp} ${styles.delay4}`}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>
                <span className={styles.cardTitleIcon}>📈</span>
                Innovation Metrics
              </h2>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.progressRing}>
                <div className={styles.progressCircle}>
                  <svg width="160" height="160" viewBox="0 0 160 160">
                    <defs>
                      <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#667eea" />
                        <stop offset="100%" stopColor="#764ba2" />
                      </linearGradient>
                    </defs>
                    <circle
                      className={styles.progressBg}
                      cx="80"
                      cy="80"
                      r="68"
                    />
                    <circle
                      className={styles.progressFill}
                      cx="80"
                      cy="80"
                      r="68"
                      strokeDasharray={`${2 * Math.PI * 68}`}
                      strokeDashoffset={`${2 * Math.PI * 68 * (1 - stats.approvalRate / 100)}`}
                    />
                  </svg>
                  <div className={styles.progressCenter}>
                    <div className={styles.progressValue}>{stats.approvalRate}%</div>
                    <div className={styles.progressLabel}>Approval Rate</div>
                  </div>
                </div>
              </div>
              <div className={styles.activityList}>
                <div className={styles.activityItem}>
                  <span className={styles.activityIcon}>🎯</span>
                  <div className={styles.activityContent}>
                    <div className={styles.activityTitle}>In Implementation</div>
                    <div className={styles.activityMeta}>
                      {stats.inProgressIdeas} ideas currently being implemented
                    </div>
                  </div>
                </div>
                <div className={styles.activityItem}>
                  <span className={styles.activityIcon}>✅</span>
                  <div className={styles.activityContent}>
                    <div className={styles.activityTitle}>Implemented</div>
                    <div className={styles.activityMeta}>
                      {stats.completedIdeas} ideas successfully completed
                    </div>
                  </div>
                </div>
                <div className={styles.activityItem}>
                  <span className={styles.activityIcon}>📊</span>
                  <div className={styles.activityContent}>
                    <div className={styles.activityTitle}>Total Tasks</div>
                    <div className={styles.activityMeta}>
                      {allTasks.length} tasks across all ideas
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Ideas by Status Grid */}
      <section className={`${styles.fadeInUp} ${styles.delay5}`} style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
          {/* Pending Ideas */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>
                <span className={styles.cardTitleIcon}>⏳</span>
                Pending Approval
              </h2>
              <span className={`${styles.ideaStatus} ${styles.statusPending}`}>
                {stats.pendingIdeas}
              </span>
            </div>
            <div className={styles.cardBody}>
              {pendingIdeasList.length > 0 ? (
                <div className={styles.ideasList}>
                  {pendingIdeasList.map((idea) => (
                    <div
                      key={idea.id}
                      className={styles.ideaCard}
                      onClick={() => navigate(`/idea/${idea.id}`)}
                    >
                      <h3 className={styles.ideaTitle}>{idea.title}</h3>
                      <div className={styles.ideaMeta}>
                        <span className={styles.ideaMetaItem}>
                          <span>👤</span> {idea.createdBy}
                        </span>
                        <span className={styles.ideaMetaItem}>
                          <span>⏰</span> {daysAgo(idea.createdDate)}
                        </span>
                        {idea.attachments && idea.attachments.length > 0 && (
                          <span className={styles.ideaMetaItem}>
                            <span>📎</span> {idea.attachments.length}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>✨</div>
                  <p className={styles.emptyText}>No pending ideas</p>
                </div>
              )}
            </div>
          </div>

          {/* Approved Ideas */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>
                <span className={styles.cardTitleIcon}>✅</span>
                Approved Ideas
              </h2>
              <span className={`${styles.ideaStatus} ${styles.statusApproved}`}>
                {stats.approvedIdeas}
              </span>
            </div>
            <div className={styles.cardBody}>
              {approvedIdeasList.length > 0 ? (
                <div className={styles.ideasList}>
                  {approvedIdeasList.map((idea) => (
                    <div
                      key={idea.id}
                      className={styles.ideaCard}
                      onClick={() => navigate(`/idea/${idea.id}`)}
                    >
                      <h3 className={styles.ideaTitle}>{idea.title}</h3>
                      <div className={styles.ideaMeta}>
                        <span className={styles.ideaMetaItem}>
                          <span>👤</span> {idea.createdBy}
                        </span>
                        <span className={styles.ideaMetaItem}>
                          <span>⏰</span> {daysAgo(idea.createdDate)}
                        </span>
                        {idea.attachments && idea.attachments.length > 0 && (
                          <span className={styles.ideaMetaItem}>
                            <span>📎</span> {idea.attachments.length}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>📭</div>
                  <p className={styles.emptyText}>No approved ideas yet</p>
                </div>
              )}
            </div>
          </div>

          {/* In Progress Ideas */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>
                <span className={styles.cardTitleIcon}>🔄</span>
                In Progress
              </h2>
              <span className={`${styles.ideaStatus} ${styles.statusInProgress}`}>
                {stats.inProgressIdeas}
              </span>
            </div>
            <div className={styles.cardBody}>
              {inProgressIdeasList.length > 0 ? (
                <div className={styles.ideasList}>
                  {inProgressIdeasList.map((idea) => (
                    <div
                      key={idea.id}
                      className={styles.ideaCard}
                      onClick={() => navigate(`/idea/${idea.id}`)}
                    >
                      <h3 className={styles.ideaTitle}>{idea.title}</h3>
                      <div className={styles.ideaMeta}>
                        <span className={styles.ideaMetaItem}>
                          <span>👤</span> {idea.createdBy}
                        </span>
                        <span className={styles.ideaMetaItem}>
                          <span>⏰</span> {daysAgo(idea.createdDate)}
                        </span>
                        {idea.attachments && idea.attachments.length > 0 && (
                          <span className={styles.ideaMetaItem}>
                            <span>📎</span> {idea.attachments.length}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>📋</div>
                  <p className={styles.emptyText}>No ideas in progress</p>
                </div>
              )}
            </div>
          </div>

          {/* Implemented Ideas */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>
                <span className={styles.cardTitleIcon}>✅</span>
                Implemented
              </h2>
              <span className={`${styles.ideaStatus} ${styles.statusCompleted}`}>
                {stats.completedIdeas}
              </span>
            </div>
            <div className={styles.cardBody}>
              {implementedIdeasList.length > 0 ? (
                <div className={styles.ideasList}>
                  {implementedIdeasList.map((idea) => (
                    <div
                      key={idea.id}
                      className={styles.ideaCard}
                      onClick={() => navigate(`/idea/${idea.id}`)}
                    >
                      <h3 className={styles.ideaTitle}>{idea.title}</h3>
                      <div className={styles.ideaMeta}>
                        <span className={styles.ideaMetaItem}>
                          <span>👤</span> {idea.createdBy}
                        </span>
                        <span className={styles.ideaMetaItem}>
                          <span>⏰</span> {daysAgo(idea.createdDate)}
                        </span>
                        {idea.attachments && idea.attachments.length > 0 && (
                          <span className={styles.ideaMetaItem}>
                            <span>📎</span> {idea.attachments.length}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>🎉</div>
                  <p className={styles.emptyText}>No implemented ideas yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Recent Tasks */}
      {recentTasks.length > 0 && (
        <section className={`${styles.card} ${styles.fadeInUp} ${styles.delay6}`}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>
              <span className={styles.cardTitleIcon}>📝</span>
              Recent Tasks
            </h2>
            <span className={`${styles.ideaStatus} ${styles.statusInProgress}`}>
              {allTasks.length} total
            </span>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.tasksGrid}>
              {recentTasks.map((task) => (
                <div key={task.id} className={styles.taskCard}>
                  <div className={styles.taskHeader}>
                    <h3 className={styles.taskTitle}>{task.title}</h3>
                    <span className={`${styles.taskPriority} ${getPriorityClass(task.priority)}`}>
                      {task.priority || 'Medium'}
                    </span>
                  </div>
                  <div className={styles.taskMeta}>
                    <span>📋 {task.status}</span> • <span>📅 Due: {task.dueDate ? formatDate(task.dueDate) : 'Not set'}</span>
                  </div>
                  <div className={styles.taskProgress}>
                    <div className={styles.taskProgressBar}>
                      <div
                        className={styles.taskProgressFill}
                        style={{ width: `${task.progress || 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default MainDashboard;
