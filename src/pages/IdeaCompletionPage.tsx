import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIdeaData } from '../contexts/DataContext';
import { useUser } from '../contexts/UserContext';
import { useNotification } from '../contexts/NotificationContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { CheckCircle2, Circle, Clock, Pause, Search, Edit, CheckCheck, AlertCircle } from 'lucide-react';
import styles from './IdeaCompletionPage.module.css';

const IdeaCompletionPage: React.FC = () => {
  const navigate = useNavigate();
  const { data, loading, updateIdeaStatus } = useIdeaData();
  const { isAdmin, isLoading: userLoading } = useUser();
  const { showNotification } = useNotification();

  const [selectedIdeaId, setSelectedIdeaId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEditingStatus, setIsEditingStatus] = useState(false);

  // Redirect non-admins
  useEffect(() => {
    if (!userLoading && !isAdmin) {
      showNotification('Access denied. Admin privileges required.', 'error');
      navigate('/');
    }
  }, [isAdmin, userLoading, navigate, showNotification]);

  // Get approved and in-progress ideas with their tasks
  const ideasWithTasks = useMemo(() => {
    const approvedIdeas = data.ideas.filter(
      (idea) => idea.status === 'Approved' || idea.status === 'In Progress'
    );

    return approvedIdeas
      .map((idea) => {
        const ideaTasks = data.tasks.filter((task) => task.ideaId === idea.id);
        const completedTasks = ideaTasks.filter((task) => task.status === 'Completed').length;
        const totalTasks = ideaTasks.length;
        const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
        const allTasksCompleted = totalTasks > 0 && completedTasks === totalTasks;

        return {
          ...idea,
          tasks: ideaTasks,
          totalTasks,
          completedTasks,
          completionRate,
          allTasksCompleted,
        };
      })
      .sort((a, b) => {
        // Sort by completion rate (higher first), then by total tasks (more first)
        if (b.completionRate !== a.completionRate) {
          return b.completionRate - a.completionRate;
        }
        return b.totalTasks - a.totalTasks;
      });
  }, [data.ideas, data.tasks]);

  // Filter ideas by search query
  const filteredIdeas = useMemo(() => {
    if (!searchQuery.trim()) return ideasWithTasks;

    const query = searchQuery.toLowerCase();
    return ideasWithTasks.filter(
      (idea) =>
        idea.title.toLowerCase().includes(query) ||
        idea.description.toLowerCase().includes(query) ||
        idea.createdBy.toLowerCase().includes(query)
    );
  }, [ideasWithTasks, searchQuery]);

  // Get selected idea details
  const selectedIdea = useMemo(
    () => filteredIdeas.find((idea) => idea.id === selectedIdeaId),
    [filteredIdeas, selectedIdeaId]
  );

  // Statistics
  const stats = useMemo(() => {
    const totalIdeas = ideasWithTasks.length;
    const ideasWithAllTasksCompleted = ideasWithTasks.filter(
      (idea) => idea.allTasksCompleted
    ).length;
    const totalTasks = ideasWithTasks.reduce((sum, idea) => sum + idea.totalTasks, 0);
    const completedTasks = ideasWithTasks.reduce(
      (sum, idea) => sum + idea.completedTasks,
      0
    );

    return {
      totalIdeas,
      ideasWithAllTasksCompleted,
      totalTasks,
      completedTasks,
    };
  }, [ideasWithTasks]);

  // Handle mark as completed
  const handleMarkAsCompleted = async () => {
    if (!selectedIdea) return;

    if (!selectedIdea.allTasksCompleted) {
      showNotification(
        'Cannot mark as completed: Not all tasks are completed yet.',
        'error'
      );
      return;
    }

    const confirmMessage = `Are you sure you want to mark "${selectedIdea.title}" as Completed? This will finalize the implementation.`;
    if (!window.confirm(confirmMessage)) return;

    try {
      setIsUpdating(true);
      await updateIdeaStatus(selectedIdea.id, 'Completed');
      showNotification('Idea marked as completed successfully!', 'success');
      setSelectedIdeaId(null);
    } catch (error) {
      console.error('Failed to mark idea as completed:', error);
      showNotification('Failed to mark idea as completed. Please try again.', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle status change
  const handleStatusChange = async (newStatus: string) => {
    if (!selectedIdea) return;

    const confirmMessage = `Are you sure you want to change the status of "${selectedIdea.title}" to ${newStatus}?`;
    if (!window.confirm(confirmMessage)) return;

    try {
      setIsUpdating(true);
      await updateIdeaStatus(selectedIdea.id, newStatus);
      showNotification(`Idea status updated to ${newStatus} successfully!`, 'success');
      setIsEditingStatus(false);
    } catch (error) {
      console.error('Failed to update idea status:', error);
      showNotification('Failed to update idea status. Please try again.', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  // Get status badge class
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Approved':
        return styles.statusApproved;
      case 'In Progress':
        return styles.statusInProgress;
      default:
        return '';
    }
  };

  // Get task status badge class
  const getTaskStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Completed':
        return styles.statusCompleted;
      case 'In Progress':
        return styles.statusInProgressTask;
      case 'Not Started':
        return styles.statusNotStarted;
      case 'On Hold':
        return styles.statusOnHold;
      default:
        return '';
    }
  };

  // Get task status icon
  const getTaskStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle2 size={16} />;
      case 'In Progress':
        return <Clock size={16} />;
      case 'On Hold':
        return <Pause size={16} />;
      default:
        return <Circle size={16} />;
    }
  };

  // Format date
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (userLoading || loading.ideas || loading.tasks) {
    return (
      <div className={styles.loadingContainer}>
        <LoadingSpinner size="lg" message="Loading idea completion data..." />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <span className={styles.headerIcon}>🎯</span>
          <h1>Idea Completion Management</h1>
        </div>
        <div className={styles.headerStats}>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{stats.totalIdeas}</span>
            <span className={styles.statLabel}>Active Ideas</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{stats.ideasWithAllTasksCompleted}</span>
            <span className={styles.statLabel}>Ready to Complete</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>
              {stats.completedTasks}/{stats.totalTasks}
            </span>
            <span className={styles.statLabel}>Tasks Completed</span>
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className={styles.mainLayout}>
        {/* Ideas List Panel */}
        <div className={styles.ideasPanel}>
          <div className={styles.panelHeader}>
            <h2>💡 Ideas</h2>
          </div>

          {/* Search Box */}
          <div className={styles.searchBox}>
            <div style={{ position: 'relative' }}>
              <Search
                size={18}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#999',
                }}
              />
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Search ideas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '40px' }}
              />
            </div>
          </div>

          {/* Ideas List */}
          <div className={styles.ideasList}>
            {filteredIdeas.length === 0 ? (
              <div className={styles.emptyState}>
                <AlertCircle size={48} />
                <p>No ideas found matching your search.</p>
              </div>
            ) : (
              filteredIdeas.map((idea) => (
                <div
                  key={idea.id}
                  className={`${styles.ideaCard} ${
                    selectedIdeaId === idea.id ? styles.selected : ''
                  }`}
                  onClick={() => setSelectedIdeaId(idea.id)}
                >
                  <div className={styles.ideaCardHeader}>
                    <h3 className={styles.ideaTitle}>{idea.title}</h3>
                    <span
                      className={`${styles.statusBadge} ${getStatusBadgeClass(
                        idea.status
                      )}`}
                    >
                      {idea.status}
                    </span>
                  </div>

                  <div className={styles.taskProgress}>
                    <div className={styles.progressBar}>
                      <div
                        className={styles.progressFill}
                        style={{ width: `${idea.completionRate}%` }}
                      />
                    </div>
                    <span className={styles.progressText}>
                      {idea.completedTasks}/{idea.totalTasks}
                    </span>
                  </div>

                  <div className={styles.ideaMetadata}>
                    <span>By {idea.createdBy}</span>
                    <span
                      className={`${styles.completionIndicator} ${
                        idea.allTasksCompleted
                          ? styles.allCompleted
                          : idea.completedTasks > 0
                          ? styles.partialCompleted
                          : styles.noneCompleted
                      }`}
                    >
                      {idea.allTasksCompleted ? (
                        <>
                          <CheckCircle2 size={14} /> Ready
                        </>
                      ) : idea.completedTasks > 0 ? (
                        <>
                          <Clock size={14} /> In Progress
                        </>
                      ) : (
                        <>
                          <Circle size={14} /> Pending
                        </>
                      )}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Details Panel */}
        <div className={styles.detailsPanel}>
          {!selectedIdea ? (
            <div className={styles.emptyState}>
              <AlertCircle size={64} />
              <h3>No Idea Selected</h3>
              <p>Select an idea from the list to view details and manage completion.</p>
            </div>
          ) : (
            <>
              <div className={styles.panelHeader}>
                <h2>📋 Idea Details</h2>
              </div>

              <div className={styles.detailsContent}>
                {/* Idea Header */}
                <div className={styles.detailsHeader}>
                  <div className={styles.detailsHeaderTop}>
                    <div style={{ flex: 1 }}>
                      <h2 className={styles.detailsTitle}>{selectedIdea.title}</h2>
                      <p className={styles.detailsDescription}>
                        {selectedIdea.description}
                      </p>
                    </div>
                    <div className={styles.actionButtons}>
                      <button 
                        className={styles.editButton} 
                        onClick={() => setIsEditingStatus(!isEditingStatus)}
                        disabled={isUpdating}
                      >
                        <Edit size={18} />
                        {isEditingStatus ? 'Cancel' : 'Edit Status'}
                      </button>
                      <button
                        className={styles.completeButton}
                        onClick={handleMarkAsCompleted}
                        disabled={!selectedIdea.allTasksCompleted || isUpdating}
                      >
                        <CheckCheck size={18} />
                        {isUpdating ? 'Updating...' : 'Mark as Completed'}
                      </button>
                    </div>
                  </div>

                  <div className={styles.infoGrid}>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Status</span>
                      <span className={styles.infoValue}>
                        {isEditingStatus ? (
                          <select
                            className={styles.statusSelect}
                            value={selectedIdea.status}
                            onChange={(e) => handleStatusChange(e.target.value)}
                            disabled={isUpdating}
                          >
                            <option value="Approved">Approved</option>
                            <option value="In Progress">In Progress</option>
                          </select>
                        ) : (
                          <span
                            className={`${styles.statusBadge} ${getStatusBadgeClass(
                              selectedIdea.status
                            )}`}
                          >
                            {selectedIdea.status}
                          </span>
                        )}
                      </span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Created By</span>
                      <span className={styles.infoValue}>{selectedIdea.createdBy}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Created Date</span>
                      <span className={styles.infoValue}>
                        {formatDate(selectedIdea.createdDate)}
                      </span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Category</span>
                      <span className={styles.infoValue}>{selectedIdea.category}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Priority</span>
                      <span className={styles.infoValue}>{selectedIdea.priority}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Task Completion</span>
                      <span className={styles.infoValue}>
                        {selectedIdea.completedTasks}/{selectedIdea.totalTasks} (
                        {Math.round(selectedIdea.completionRate)}%)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tasks Section */}
                <div className={styles.tasksSection}>
                  <h3 className={styles.sectionTitle}>
                    📝 Tasks ({selectedIdea.tasks.length})
                  </h3>

                  {selectedIdea.tasks.length === 0 ? (
                    <div className={styles.emptyState}>
                      <AlertCircle size={48} />
                      <p>No tasks created for this idea yet.</p>
                    </div>
                  ) : (
                    <div className={styles.tasksList}>
                      {selectedIdea.tasks.map((task) => (
                        <div key={task.id} className={styles.taskCard}>
                          <div className={styles.taskCardHeader}>
                            <h4 className={styles.taskTitle}>{task.title}</h4>
                            <span
                              className={`${
                                styles.taskStatusBadge
                              } ${getTaskStatusBadgeClass(task.status)}`}
                            >
                              {getTaskStatusIcon(task.status)}
                              {task.status}
                            </span>
                          </div>

                          {task.description && (
                            <p className={styles.taskDescription}>{task.description}</p>
                          )}

                          <div className={styles.taskFooter}>
                            <div className={styles.taskAssignees}>
                              <span>Assigned to:</span>
                              <strong>
                                {task.assignedTo.length > 0
                                  ? task.assignedTo.join(', ')
                                  : 'Unassigned'}
                              </strong>
                            </div>
                            {task.dueDate && (
                              <span>Due: {formatDate(task.dueDate)}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default IdeaCompletionPage;
