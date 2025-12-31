import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useIdeaData, ProcessedTask } from "../contexts/DataContext";
import { useUser } from "../contexts/UserContext";
import { useNotification } from "../contexts/NotificationContext";
import { ideaApi } from "../services/ideaApi";
import LoadingSpinner from "../components/common/LoadingSpinner";
import StatusBar from "../components/common/StatusBar";
import { ValidatedInput } from "../components/common/ValidatedInput.tsx";
import { ValidatedSelect } from "../components/common/ValidatedSelect.tsx";
import { logInfo, logError } from "../utils/logger";
import styles from './MyTasks.module.css';

const MyTasks: React.FC = () => {
  const navigate = useNavigate();
  const { data, loading, error } = useIdeaData();
  const { user, isAdmin, isApprover, isContributor } = useUser();
  const { addNotification } = useNotification();
  const [selectedTask, setSelectedTask] = useState<ProcessedTask | null>(null);
  const [myTasks, setMyTasks] = useState<ProcessedTask[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedTask, setEditedTask] = useState<Partial<ProcessedTask> | null>(null);

  useEffect(() => {
    // Load tasks assigned to current user
    const loadMyTasks = async () => {
      if (!user?.user?.Id) {
        logInfo("User not loaded yet, skipping task load", { user });
        return;
      }

      setTasksLoading(true);
      try {
        logInfo(`Loading tasks for user ID: ${user.user.Id}`, { userId: user.user.Id, userName: user.user.Title });
        const tasks = await ideaApi.getTasksForUser(user.user.Id);
        setMyTasks(tasks);
        logInfo(`Loaded ${tasks.length} tasks for user ${user.user.Id}`, { tasks: tasks.map(t => ({ id: t.id, title: t.title, assignedTo: t.assignedTo })) });
      } catch (error) {
        logError("Failed to load user tasks", error);
      } finally {
        setTasksLoading(false);
      }
    };

    loadMyTasks();
  }, [user]);

  // Set first task as selected when tasks load
  useEffect(() => {
    if (myTasks.length > 0 && !selectedTask) {
      setSelectedTask(myTasks[0]);
    }
  }, [myTasks, selectedTask]);

  // Calculate statistics for user's tasks
  const stats = useMemo(() => {
    const totalTasks = myTasks.length;
    const notStartedTasks = myTasks.filter(
      (task) => task.status === 'Not Started',
    ).length;
    const inProgressTasks = myTasks.filter(
      (task) => task.status === 'In Progress',
    ).length;
    const completedTasks = myTasks.filter(
      (task) => task.status === 'Completed',
    ).length;
    const onHoldTasks = myTasks.filter(
      (task) => task.status === 'On Hold',
    ).length;

    return {
      totalTasks,
      notStartedTasks,
      inProgressTasks,
      completedTasks,
      onHoldTasks,
    };
  }, [myTasks]);

  const handleTaskSelect = (task: ProcessedTask) => {
    setSelectedTask(task);
    setIsEditMode(false); // Reset edit mode when selecting a new task
    setEditedTask(null); // Reset edited task
  };

  const handleEditClick = () => {
    setIsEditMode(true);
    // Initialize edited task with current values
    if (selectedTask) {
      setEditedTask({
        status: selectedTask.status,
        percentComplete: selectedTask.percentComplete,
      });
    }
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditedTask(null); // Reset edited task
  };

  const handleSaveChanges = async () => {
    if (!selectedTask || !editedTask) {
      logError('handleSaveChanges called with invalid state', { selectedTask, editedTask });
      return;
    }

    try {
      const updates: Partial<Pick<ProcessedTask, 'status' | 'percentComplete'>> = {};

      // Check what has changed
      if (editedTask.status !== selectedTask.status) {
        updates.status = editedTask.status;
      }
      if (editedTask.percentComplete !== selectedTask.percentComplete) {
        updates.percentComplete = editedTask.percentComplete;
      }

      // Only update if there are changes
      if (Object.keys(updates).length > 0) {
        logInfo(`Updating task ${selectedTask.id} with changes`, updates);
        await ideaApi.updateTask(selectedTask.id, updates);
        logInfo(`Task ${selectedTask.id} updated successfully`);

        // Update local state
        const updatedTask = { ...selectedTask, ...updates };
        setMyTasks(prevTasks =>
          prevTasks.map(task =>
            task.id === selectedTask.id ? updatedTask : task
          )
        );
        setSelectedTask(updatedTask);

        logInfo(`Task ${selectedTask.id} updated`, updates);
      }

      setIsEditMode(false);
      setEditedTask(null);
      addNotification({ message: 'Task updated successfully!', type: 'success' });
    } catch (error) {
      logError(`Failed to save task changes for ${selectedTask?.id || 'unknown'}`, error);
      addNotification({ message: 'Failed to save task changes', type: 'error' });
    }
  };

  const handleStatusChange = (newStatus: string) => {
    setEditedTask(prev => prev ? { ...prev, status: newStatus } : { status: newStatus });
  };

  const handleProgressChange = (newProgress: number) => {
    setEditedTask(prev => prev ? { ...prev, percentComplete: newProgress } : { percentComplete: newProgress });
  };

  // Helper functions for status and priority classes
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'Not Started':
        return styles.statusDefault;
      case 'In Progress':
        return styles.statusInProgress;
      case 'Completed':
        return styles.statusApproved;
      case 'On Hold':
        return styles.statusPending;
      case 'Cancelled':
        return styles.statusRejected;
      default:
        return styles.statusDefault;
    }
  };

  const getPriorityClass = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'critical':
        return styles.priorityCritical;
      case 'high':
        return styles.priorityHigh;
      case 'medium':
        return styles.priorityMedium;
      case 'low':
        return styles.priorityLow;
      default:
        return styles.priorityMedium;
    }
  };

  if (tasksLoading) {
    return <LoadingSpinner />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={styles.splitContainer}
    >
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>My Tasks</h1>
        <p className={styles.subtitle}>
          Track and manage all your assigned tasks
        </p>
      </div>

      {/* Statistics Cards */}
      <div className={styles.statsGrid}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={styles.statCard}
        >
          <div className={styles.statIcon}>📋</div>
          <div className={styles.statContent}>
            <h3 className={styles.statNumber}>{stats.totalTasks}</h3>
            <p className={styles.statLabel}>Total Tasks</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={styles.statCard}
        >
          <div className={styles.statIcon}>⚡</div>
          <div className={styles.statContent}>
            <h3 className={styles.statNumber}>{stats.inProgressTasks}</h3>
            <p className={styles.statLabel}>In Progress</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={styles.statCard}
        >
          <div className={styles.statIcon}>✅</div>
          <div className={styles.statContent}>
            <h3 className={styles.statNumber}>{stats.completedTasks}</h3>
            <p className={styles.statLabel}>Completed</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className={styles.statCard}
        >
          <div className={styles.statIcon}>⏸️</div>
          <div className={styles.statContent}>
            <h3 className={styles.statNumber}>{stats.onHoldTasks}</h3>
            <p className={styles.statLabel}>On Hold</p>
          </div>
        </motion.div>
      </div>

      {/* Split Screen Layout */}
      <div className={styles.splitLayout}>
        {/* Left Panel - Compact Task List */}
        <div className={styles.leftPanel}>
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>My Assigned Tasks</h2>
          </div>

          {myTasks.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>📋</div>
              <h3 className={styles.emptyTitle}>No tasks assigned</h3>
              <p className={styles.emptyMessage}>
                You don't have any tasks assigned to you yet.
              </p>
            </div>
          ) : (
            <div className={styles.compactCardsList}>
              {myTasks.map((task, index) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * index }}
                  onClick={() => handleTaskSelect(task)}
                  className={`${styles.compactCard} ${
                    selectedTask?.id === task.id
                      ? styles.compactCardSelected
                      : ""
                  }`}
                >
                  <div className={styles.compactCardHeader}>
                    <h3 className={styles.compactCardTitle}>{task.title}</h3>
                    <div className={styles.compactStatusBadge}>
                      <span className={`${styles.status} ${getStatusClass(task.status)}`}>
                        {task.status}
                      </span>
                    </div>
                  </div>

                  <p className={styles.compactCardDescription}>
                    {task.description || 'No description provided'}
                  </p>

                  <div className={styles.compactCardMeta}>
                    <span className={`${styles.compactPriority} ${getPriorityClass(task.priority)}`}>
                      {task.priority}
                    </span>
                    <span className={styles.compactCardDate}>
                      Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
                    </span>
                  </div>

                  <div className={styles.compactCardMeta}>
                    <span className={styles.compactCardDate}>
                      Progress: {Math.round(task.percentComplete)}%
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Right Panel - Task Detail View */}
        <div className={styles.rightPanel}>
          {selectedTask ? (
            <div className={styles.detailView}>
              <div className={styles.detailHeader}>
                <div className={styles.detailTitleSection}>
                  <h1 className={styles.detailTitle}>{selectedTask.title}</h1>
                  <div className={styles.detailStatusBadges}>
                    <span className={`${styles.status} ${getStatusClass(selectedTask.status)}`}>
                      {selectedTask.status}
                    </span>
                    <span className={`${styles.compactPriority} ${getPriorityClass(selectedTask.priority)}`}>
                      {selectedTask.priority}
                    </span>
                    {!isEditMode && isContributor && (
                      <button
                        onClick={handleEditClick}
                        className={styles.editButton}
                        title="Edit task"
                      >
                        ✏️ Edit
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className={styles.detailContent}>
                <div className={styles.detailSection}>
                  <h3 className={styles.detailSectionTitle}>Description</h3>
                  <p className={styles.detailDescription}>
                    {selectedTask.description || 'No description provided'}
                  </p>
                </div>

                <div className={styles.detailSection}>
                  <h3 className={styles.detailSectionTitle}>Task Details</h3>
                  <div className={styles.detailGrid}>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Status</span>
                      {isEditMode ? (
                        <ValidatedSelect
                          label=""
                          value={editedTask?.status || selectedTask.status}
                          onChange={(value) => handleStatusChange(value)}
                          options={[
                            { value: "Not Started", label: "Not Started" },
                            { value: "In Progress", label: "In Progress" },
                            { value: "Completed", label: "Completed" },
                            { value: "On Hold", label: "On Hold" },
                          ]}
                        />
                      ) : (
                        <span className={styles.detailValue}>{selectedTask.status}</span>
                      )}
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Priority</span>
                      <span className={styles.detailValue}>{selectedTask.priority}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Progress</span>
                      {isEditMode ? (
                        <ValidatedInput
                          label=""
                          type="number"
                          value={editedTask?.percentComplete !== undefined ? Math.round(editedTask.percentComplete).toString() : Math.round(selectedTask.percentComplete).toString()}
                          onChange={(value) => handleProgressChange(parseInt(value) || 0)}
                          min="0"
                          max="100"
                        />
                      ) : (
                        <span className={styles.detailValue}>{Math.round(selectedTask.percentComplete)}%</span>
                      )}
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Due Date</span>
                      <span className={styles.detailValue}>
                        {selectedTask.dueDate ? new Date(selectedTask.dueDate).toLocaleDateString() : 'No due date'}
                      </span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Start Date</span>
                      <span className={styles.detailValue}>
                        {selectedTask.startDate ? new Date(selectedTask.startDate).toLocaleDateString() : 'Not set'}
                      </span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Assigned To</span>
                      <span className={styles.detailValue}>
                        {selectedTask.assignedTo.length > 0
                          ? selectedTask.assignedTo.map(user => user.name).join(', ')
                          : 'Unassigned'}
                      </span>
                    </div>
                  </div>
                </div>

                {isEditMode && (
                  <div className={styles.detailSection}>
                    <div className={styles.editActions}>
                      <button
                        onClick={handleSaveChanges}
                        className={`${styles.actionButton} ${styles.saveButton}`}
                      >
                        ✅ Save Changes
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className={`${styles.actionButton} ${styles.cancelButton}`}
                      >
                        ❌ Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>👆</div>
              <h3 className={styles.emptyTitle}>Select a task</h3>
              <p className={styles.emptyMessage}>
                Choose a task from the list to view its details and update progress.
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default MyTasks;