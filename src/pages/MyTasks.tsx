import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useIdeaData, ProcessedTask } from "../contexts/DataContext";
import { useUser } from "../contexts/UserContext";
import { useNotification } from "../contexts/NotificationContext";
import { ideaApi } from "../services/ideaApi";
import { discussionApi } from "../services/discussionApi";
import LoadingSpinner from "../components/common/LoadingSpinner";
import StatusBar from "../components/common/StatusBar";
import { ValidatedInput } from "../components/common/ValidatedInput.tsx";
import { ValidatedSelect } from "../components/common/ValidatedSelect.tsx";
import { logInfo, logError } from "../utils/logger";
import { MessageCircle, Send, Lock, Unlock } from 'lucide-react';
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
  
  // Discussion state
  const [discussionExists, setDiscussionExists] = useState(false);
  const [discussions, setDiscussions] = useState<any[]>([]);
  const [showDiscussionPanel, setShowDiscussionPanel] = useState(false);
  const [discussionMessage, setDiscussionMessage] = useState('');
  const [isDiscussionLocked, setIsDiscussionLocked] = useState(false);
  const [loadingDiscussions, setLoadingDiscussions] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  // Discussion handlers (defined before useEffects that call them)
  const loadDiscussionsForTask = async (taskId: number) => {
    try {
      setLoadingDiscussions(true);
      
      // Check if discussion exists for this task
      const hasDiscussion = await discussionApi.hasDiscussion(taskId);
      setDiscussionExists(hasDiscussion);
      
      if (hasDiscussion) {
        const messages = await discussionApi.getDiscussionsByTask(taskId);
        setDiscussions(messages);
        
        // Check lock status
        const locked = await discussionApi.getDiscussionLockStatus(taskId);
        setIsDiscussionLocked(locked);
      } else {
        setDiscussions([]);
        setIsDiscussionLocked(false);
      }
    } catch (error) {
      console.error('Failed to load discussions:', error);
      addNotification({ 
        message: 'Failed to load discussions', 
        type: 'error' 
      });
    } finally {
      setLoadingDiscussions(false);
    }
  };

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

  // Load discussions when selected task changes
  useEffect(() => {
    if (selectedTask) {
      loadDiscussionsForTask(selectedTask.id);
    }
  }, [selectedTask?.id]);

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
    setShowDiscussionPanel(false); // Close discussion panel when switching tasks
    setDiscussionExists(false);
    setDiscussions([]);
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
        await ideaApi.updateTask(selectedTask.id, updates, { id: user?.user?.Id || 0, name: user?.user?.Title || 'Unknown User' });
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

  // Toggle discussion panel
  const handleToggleDiscussion = async () => {
    if (!selectedTask) return;

    if (!showDiscussionPanel) {
      await loadDiscussionsForTask(selectedTask.id);
    }
    setShowDiscussionPanel(!showDiscussionPanel);
  };

  // Create new discussion
  const handleCreateDiscussion = async () => {
    if (!selectedTask) return;

    try {
      setSendingMessage(true);
      
      // Get the idea details for context
      const idea = data.ideas.find(i => i.id === selectedTask.ideaId);
      
      // Create initial discussion with rich context
      await discussionApi.createTaskDiscussion(
        selectedTask.id,
        selectedTask.title,
        selectedTask.description || 'No description provided',
        selectedTask.ideaId || 0,
        selectedTask.assignedTo.map(u => ({ id: parseInt(u.id), name: u.name })),
        idea?.createdBy || 'Unknown',
        idea?.description || ''
      );

      // Reload discussions
      await loadDiscussionsForTask(selectedTask.id);
      setShowDiscussionPanel(true);
      
      addNotification({ 
        message: 'Discussion created successfully!', 
        type: 'success' 
      });
    } catch (error) {
      console.error('Failed to create discussion:', error);
      addNotification({ 
        message: 'Failed to create discussion. Please try again.', 
        type: 'error' 
      });
    } finally {
      setSendingMessage(false);
    }
  };

  // Send discussion message
  const handleSendMessage = async () => {
    if (!selectedTask || !discussionMessage.trim() || sendingMessage) return;

    try {
      setSendingMessage(true);
      
      // Add reply to existing discussion
      await discussionApi.addReplyToDiscussion(
        selectedTask.id,
        `Re: ${selectedTask.title}`,
        discussionMessage,
        false
      );

      // Clear message and reload discussions
      setDiscussionMessage('');
      await loadDiscussionsForTask(selectedTask.id);
      
      addNotification({ 
        message: 'Message sent successfully!', 
        type: 'success' 
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      addNotification({ 
        message: 'Failed to send message. Please try again.', 
        type: 'error' 
      });
    } finally {
      setSendingMessage(false);
    }
  };

  // Toggle discussion lock
  const handleToggleLock = async () => {
    if (!selectedTask) return;

    try {
      await discussionApi.updateDiscussionLockStatus(
        selectedTask.id,
        !isDiscussionLocked
      );
      
      setIsDiscussionLocked(!isDiscussionLocked);
      
      addNotification({ 
        message: isDiscussionLocked ? 'Discussion unlocked' : 'Discussion locked', 
        type: 'success' 
      });
    } catch (error) {
      console.error('Failed to toggle lock:', error);
      addNotification({ 
        message: 'Failed to toggle lock status', 
        type: 'error' 
      });
    }
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
      className={styles.pageContainer}
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

                {/* Discussion Section */}
                <div className={styles.detailSection}>
                  <h3 className={styles.detailSectionTitle}>Discussion</h3>
                  
                  {!discussionExists ? (
                    <div className={styles.discussionPlaceholder}>
                      <MessageCircle size={48} className={styles.discussionPlaceholderIcon} />
                      <p className={styles.discussionPlaceholderText}>
                        No discussion created yet
                      </p>
                      <button
                        onClick={handleCreateDiscussion}
                        className={styles.createDiscussionButton}
                        disabled={sendingMessage}
                      >
                        {sendingMessage ? '⏳ Creating...' : '💬 Create Discussion'}
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className={styles.discussionHeader}>
                        <button
                          onClick={handleToggleDiscussion}
                          className={styles.discussionToggleButton}
                        >
                          <div className={styles.discussionIconWrapper}>
                            <MessageCircle size={20} />
                            {discussions.length > 0 && (
                              <span className={styles.discussionBadge}>
                                {discussions.length}
                              </span>
                            )}
                          </div>
                          {showDiscussionPanel ? 'Hide' : 'Show'} Discussion
                        </button>
                        <button
                          onClick={handleToggleLock}
                          className={styles.lockButton}
                          title={isDiscussionLocked ? 'Unlock discussion' : 'Lock discussion'}
                        >
                          {isDiscussionLocked ? <Lock size={16} /> : <Unlock size={16} />}
                        </button>
                      </div>

                      {showDiscussionPanel && (
                        <div className={styles.discussionPanel}>
                          {loadingDiscussions ? (
                            <div className={styles.discussionLoading}>Loading discussions...</div>
                          ) : (
                            <>
                              <div className={styles.discussionMessages}>
                                {discussions.map((msg) => (
                                  <div key={msg.id} className={styles.discussionMessage}>
                                    <div className={styles.messageHeader}>
                                      <span className={styles.messageAuthor}>
                                        {msg.author || 'Unknown User'}
                                      </span>
                                      <span className={styles.messageDate}>
                                        {new Date(msg.created).toLocaleString()}
                                      </span>
                                    </div>
                                    {msg.subject && (
                                      <div className={styles.messageSubject}>{msg.subject}</div>
                                    )}
                                    <div 
                                      className={styles.messageBody}
                                      dangerouslySetInnerHTML={{ __html: msg.body }}
                                    />
                                  </div>
                                ))}
                              </div>

                              {!isDiscussionLocked && (
                                <div className={styles.discussionReply}>
                                  <textarea
                                    value={discussionMessage}
                                    onChange={(e) => setDiscussionMessage(e.target.value)}
                                    placeholder="Type your message here..."
                                    className={styles.messageTextarea}
                                    rows={3}
                                    disabled={sendingMessage}
                                  />
                                  <button
                                    onClick={handleSendMessage}
                                    disabled={!discussionMessage.trim() || sendingMessage}
                                    className={styles.sendButton}
                                  >
                                    <Send size={16} />
                                    {sendingMessage ? 'Sending...' : 'Send'}
                                  </button>
                                </div>
                              )}

                              {isDiscussionLocked && (
                                <div className={styles.lockedMessage}>
                                  🔒 This discussion has been locked
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
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