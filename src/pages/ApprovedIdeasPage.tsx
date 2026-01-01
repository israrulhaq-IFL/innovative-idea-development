// Approved Ideas Page Component
// src/pages/ApprovedIdeasPage.tsx
// Admin page for viewing approved ideas and creating tasks in split-screen layout

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { useUser } from "../contexts/UserContext";
import { useIdeaData, ProcessedIdea, ProcessedTask } from "../contexts/DataContext";
import { useNotification } from "../contexts/NotificationContext";
import { ideaApi } from "../services/ideaApi";
import LoadingSpinner from "../components/common/LoadingSpinner";
import StatusBar from "../components/common/StatusBar";
import { ValidatedInput } from "../components/common/ValidatedInput.tsx";
import { ValidatedSelect } from "../components/common/ValidatedSelect.tsx";
import PeoplePicker from "../components/common/PeoplePicker";
import { logInfo, logError } from "../utils/logger";
import formStyles from "../components/incident/IncidentTaskForm.module.css";
import styles from "./ApprovedIdeasPage.module.css";

interface SelectedUser {
  id: number;
  name: string;
  email: string;
}

interface TaskFormData {
  title: string;
  ideaId: string;
  priority: string;
  status: string;
  percentComplete: number;
  assignees: SelectedUser[];
  description: string;
  startDate: string;
  dueDate: string;
  ideaTitle?: string;
}

const ApprovedIdeasPage: React.FC = () => {
  const { isAdmin, user } = useUser();
  const { data, loading, error, loadTasks } = useIdeaData();
  const { addNotification } = useNotification();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIdea, setSelectedIdea] = useState<ProcessedIdea | null>(null);
  const [selectedTask, setSelectedTask] = useState<ProcessedTask | null>(null);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Task form data
  const [taskFormData, setTaskFormData] = useState<TaskFormData>(() => {
    const currentDate = new Date().toISOString().split("T")[0];
    return {
      title: "",
      ideaId: "",
      priority: "Normal",
      status: "Not Started",
      percentComplete: 0,
      assignees: [],
      description: "",
      startDate: currentDate,
      dueDate: "",
      ideaTitle: "",
    };
  });

  // Redirect non-admin users
  useEffect(() => {
    if (!isAdmin) {
      // Could navigate to home, but for now just log
      logInfo("Non-admin user accessing approved ideas page");
    }
  }, [isAdmin]);

  // Load tasks when component mounts
  useEffect(() => {
    if (isAdmin) {
      loadTasks();
    }
  }, [isAdmin, loadTasks]);

  // Filter approved ideas
  const approvedIdeas = useMemo(() => {
    return (data.ideas || []).filter(idea => idea.status === "Approved");
  }, [data.ideas]);

  // Filter ideas based on search term
  const filteredIdeas = useMemo(() => {
    if (!searchTerm.trim()) {
      return approvedIdeas;
    }

    const term = searchTerm.toLowerCase();
    return approvedIdeas.filter(idea =>
      idea.title.toLowerCase().includes(term) ||
      idea.description.toLowerCase().includes(term) ||
      (idea.category && idea.category.toLowerCase().includes(term)) ||
      idea.createdBy.toLowerCase().includes(term)
    );
  }, [approvedIdeas, searchTerm]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalIdeas = approvedIdeas.length;
    const filteredCount = filteredIdeas.length;
    return { totalIdeas, filteredCount };
  }, [approvedIdeas.length, filteredIdeas.length]);

  // Set first idea as selected when ideas load
  useEffect(() => {
    if (filteredIdeas.length > 0 && !selectedIdea) {
      setSelectedIdea(filteredIdeas[0]);
    }
  }, [filteredIdeas, selectedIdea]);

  // Calculate task count for each idea
  const getTaskCountForIdea = useCallback((ideaId: number): number => {
    return (data.tasks || []).filter(task => task.ideaId === ideaId).length;
  }, [data.tasks]);

  // Handle idea selection
  const handleIdeaSelect = useCallback((idea: ProcessedIdea) => {
    setSelectedIdea(idea);
    setSelectedTask(null); // Clear task selection when selecting different idea
    setIsCreatingTask(false); // Exit task creation mode when selecting different idea
  }, []);

  // Handle task selection for detailed view
  const handleTaskSelect = useCallback((task: ProcessedTask) => {
    setSelectedTask(task);
  }, []);

  // Handle back to idea details
  const handleBackToIdea = useCallback(() => {
    setSelectedTask(null);
  }, []);

  // Handle view tasks for selected idea
  const handleViewTasks = useCallback(() => {
    if (!selectedIdea) return;

    const ideaTasks = (data.tasks || []).filter(task => task.ideaId === selectedIdea.id);

    if (ideaTasks.length === 0) {
      addNotification({ message: "No tasks found for this idea", type: "info" });
      return;
    }

    if (ideaTasks.length === 1) {
      // Navigate to the single task discussion page
      window.location.hash = `#/task/${ideaTasks[0].id}`;
    } else {
      // For multiple tasks, navigate to my-tasks page (could be enhanced later)
      addNotification({
        message: `This idea has ${ideaTasks.length} tasks. Navigate to My Tasks to view all tasks.`,
        type: "info"
      });
      window.location.hash = `#/my-tasks`;
    }
  }, [selectedIdea, data.tasks, addNotification]);

  // Handle create task for selected idea
  const handleCreateTask = useCallback(() => {
    if (!selectedIdea) return;

    setTaskFormData(prev => ({
      ...prev,
      ideaId: selectedIdea.id.toString(),
      ideaTitle: selectedIdea.title,
      title: `Task for: ${selectedIdea.title}`,
    }));
    setIsCreatingTask(true);
  }, [selectedIdea]);

  // Handle form field changes
  const handleInputChange = useCallback((field: keyof TaskFormData, value: any) => {
    setTaskFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  // Handle assignee selection
  const handleAssigneeSelect = useCallback((users: SelectedUser[]) => {
    setTaskFormData(prev => ({
      ...prev,
      assignees: users,
    }));
  }, []);

  // Form validation
  const validateForm = useCallback((): boolean => {
    if (!taskFormData.title.trim()) {
      addNotification({ message: "Task title is required", type: "error" });
      return false;
    }

    if (!taskFormData.ideaId) {
      addNotification({ message: "Please select an idea", type: "error" });
      return false;
    }

    if (taskFormData.dueDate && taskFormData.startDate && new Date(taskFormData.dueDate) < new Date(taskFormData.startDate)) {
      addNotification({ message: "Due date cannot be before start date", type: "error" });
      return false;
    }

    return true;
  }, [taskFormData, addNotification]);

  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      logInfo("[ApprovedIdeasPage] Creating task:", taskFormData);

      // Prepare task data for the createTaskForIdea method
      const taskData = {
        title: taskFormData.title,
        description: taskFormData.description,
        status: taskFormData.status,
        priority: taskFormData.priority,
        percentComplete: taskFormData.percentComplete,
        assignedTo: taskFormData.assignees.map(u => u.id.toString()),
        startDate: taskFormData.startDate ? new Date(taskFormData.startDate) : undefined,
        dueDate: taskFormData.dueDate ? new Date(taskFormData.dueDate) : undefined,
      };

      console.log("[ApprovedIdeasPage] Prepared task data:", taskData);
      logInfo("[ApprovedIdeasPage] Creating task for idea:", { ideaId: parseInt(taskFormData.ideaId), taskData });

      const result = await ideaApi.createTaskForIdea(
        parseInt(taskFormData.ideaId),
        taskData,
        user?.user ? { id: user.user.Id, name: user.user.Title } : undefined
      );

      logInfo("[ApprovedIdeasPage] Task created successfully:", result);
      addNotification({ message: "Task created successfully!", type: "success" });

      // Reset form and exit creation mode
      setTaskFormData({
        title: "",
        ideaId: "",
        priority: "Normal",
        status: "Not Started",
        percentComplete: 0,
        assignees: [],
        description: "",
        startDate: new Date().toISOString().split("T")[0],
        dueDate: "",
        ideaTitle: "",
      });
      setIsCreatingTask(false);

    } catch (error) {
      logError("[ApprovedIdeasPage] Error creating task:", error);
      addNotification({ message: "Failed to create task. Please try again.", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  }, [taskFormData, validateForm, addNotification]);

  // Handle cancel task creation
  const handleCancelTask = useCallback(() => {
    setIsCreatingTask(false);
    setTaskFormData({
      title: "",
      ideaId: "",
      priority: "Normal",
      status: "Not Started",
      percentComplete: 0,
      assignees: [],
      description: "",
      startDate: new Date().toISOString().split("T")[0],
      dueDate: "",
      ideaTitle: "",
    });
  }, []);

  if (loading.ideas) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <LoadingSpinner size="lg" message="Loading approved ideas..." />
      </div>
    );
  }

  if (error.ideas) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <StatusBar status="error" message="Failed to load approved ideas. Please try again." />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Approved Ideas</h1>
        <p className={styles.subtitle}>
          Review approved ideas and create follow-up tasks
        </p>
      </div>

      {/* Search Bar - Moved to top */}
      <div className={styles.searchSection}>
        <div className={styles.searchContainer}>
          <i className={`fas fa-search ${styles.searchIcon}`}></i>
          <input
            type="text"
            placeholder="Search approved ideas by title, description, category, or creator..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className={styles.clearButton}
              aria-label="Clear search"
            >
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className={styles.statsGrid}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={styles.statCard}
        >
          <div className={styles.statIcon}>✅</div>
          <div className={styles.statContent}>
            <h3 className={styles.statNumber}>{stats.totalIdeas}</h3>
            <p className={styles.statLabel}>Approved Ideas</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={styles.statCard}
        >
          <div className={styles.statIcon}>🔍</div>
          <div className={styles.statContent}>
            <h3 className={styles.statNumber}>{stats.filteredCount}</h3>
            <p className={styles.statLabel}>Filtered Results</p>
          </div>
        </motion.div>
      </div>

      {/* Split Screen Layout */}
      <div className={styles.splitLayout}>
        {/* Left Panel - Approved Ideas List */}
        <div className={styles.leftPanel}>
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>Approved Ideas</h2>
          </div>

          {filteredIdeas.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>💡</div>
              <h3 className={styles.emptyTitle}>No approved ideas found</h3>
              <p className={styles.emptyMessage}>
                {searchTerm
                  ? "Try adjusting your search terms"
                  : "There are no approved ideas yet. Ideas need to be approved before tasks can be created."
                }
              </p>
            </div>
          ) : (
            <div className={styles.compactCardsList}>
              {filteredIdeas.map((idea, index) => (
                <motion.div
                  key={idea.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * index }}
                  onClick={() => handleIdeaSelect(idea)}
                  className={`${styles.compactCard} ${
                    selectedIdea?.id === idea.id ? styles.compactCardSelected : ""
                  }`}
                >
                  <div className={styles.compactCardHeader}>
                    <div className={styles.compactCardMeta}>
                      <span className={`${styles.status} ${styles.statusApproved}`}>
                        Approved
                      </span>
                      <span className={`${styles.compactPriority} ${
                        idea.priority === 'Critical' ? styles.priorityCritical :
                        idea.priority === 'High' ? styles.priorityHigh :
                        idea.priority === 'Medium' ? styles.priorityMedium :
                        styles.priorityLow
                      }`}>
                        {idea.priority}
                      </span>
                    </div>
                    <div className={styles.compactCardCategory}>
                      {idea.category || "General"}
                    </div>
                  </div>

                  <h3 className={styles.compactCardTitle}>{idea.title}</h3>

                  <p className={styles.compactCardDescription}>
                    {idea.description.length > 120
                      ? `${idea.description.substring(0, 120)}...`
                      : idea.description
                    }
                  </p>

                  <div className={styles.compactCardMeta}>
                    <span className={styles.compactCardCreator}>
                      By: {idea.createdBy}
                    </span>
                    <span className={styles.compactCardDate}>
                      {idea.createdDate.toLocaleDateString()}
                    </span>
                    {getTaskCountForIdea(idea.id) > 0 && (
                      <span className={styles.taskCount}>
                        📋 {getTaskCountForIdea(idea.id)} task{getTaskCountForIdea(idea.id) !== 1 ? 's' : ''}
                      </span>
                    )}
                    {idea.attachments && idea.attachments.length > 0 && (
                      <span className={styles.attachmentCount}>
                        📎 {idea.attachments.length}
                      </span>
                    )}
                  </div>

                  {idea.approvedBy && (
                    <div className={styles.compactCardMeta}>
                      <span className={styles.compactCardApprover}>
                        Approved by: {idea.approvedBy}
                      </span>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Right Panel - Idea Detail View or Task Creation Form */}
        <div className={styles.rightPanel}>
          {isCreatingTask ? (
            /* Task Creation Form */
            <div className={styles.detailView}>
              <div className={styles.detailHeader}>
                <div className={styles.detailTitleSection}>
                  <h1 className={styles.detailTitle}>Create Task</h1>
                  <div className={styles.detailStatusBadges}>
                    <button
                      onClick={handleCancelTask}
                      className={styles.cancelButton}
                      disabled={isSubmitting}
                    >
                      ✕ Cancel
                    </button>
                  </div>
                </div>
              </div>

              <div className={styles.detailContent}>
                <form onSubmit={handleSubmit} className={formStyles.formContent}>
                  {/* Section 1: Task Details */}
                  <div className={formStyles.section}>
                    <h3 className={formStyles.sectionTitle}>Task Details</h3>

                    <div className={formStyles.row}>
                      <ValidatedInput
                        label="Task Title"
                        type="text"
                        value={taskFormData.title}
                        onChange={(value) => handleInputChange("title", value)}
                        placeholder="Enter task title"
                        validation={{ required: true }}
                        required
                      />
                    </div>

                    <div className={formStyles.row}>
                      <div className={formStyles.col}>
                        <ValidatedSelect
                          label="Priority"
                          value={taskFormData.priority}
                          onChange={(value) => handleInputChange("priority", value)}
                          options={[
                            { value: "Low", label: "Low" },
                            { value: "Normal", label: "Normal" },
                            { value: "High", label: "High" },
                            { value: "Critical", label: "Critical" },
                          ]}
                        />
                      </div>
                      <div className={formStyles.col}>
                        <ValidatedSelect
                          label="Status"
                          value={taskFormData.status}
                          onChange={(value) => handleInputChange("status", value)}
                          options={[
                            { value: "Not Started", label: "Not Started" },
                            { value: "In Progress", label: "In Progress" },
                            { value: "Completed", label: "Completed" },
                            { value: "On Hold", label: "On Hold" },
                          ]}
                        />
                      </div>
                    </div>

                    <div className={formStyles.row}>
                      <ValidatedInput
                        label="Percent Complete (%)"
                        type="number"
                        value={taskFormData.percentComplete.toString()}
                        onChange={(value) => handleInputChange("percentComplete", parseInt(value) || 0)}
                        placeholder="0"
                        min="0"
                        max="100"
                      />
                    </div>
                  </div>

                  {/* Section 2: Assignment & Dates */}
                  <div className={formStyles.section}>
                    <h3 className={formStyles.sectionTitle}>Assignment & Dates</h3>

                    <div className={formStyles.row}>
                      <PeoplePicker
                        label="Assign To"
                        selectedUsers={taskFormData.assignees}
                        onSelectionChange={handleAssigneeSelect}
                        placeholder="Search and select team members"
                        multiple={true}
                      />
                    </div>

                    <div className={formStyles.row}>
                      <div className={formStyles.col}>
                        <ValidatedInput
                          label="Start Date"
                          type="date"
                          value={taskFormData.startDate}
                          onChange={(value) => handleInputChange("startDate", value)}
                        />
                      </div>
                      <div className={formStyles.col}>
                        <ValidatedInput
                          label="Due Date"
                          type="date"
                          value={taskFormData.dueDate}
                          onChange={(value) => handleInputChange("dueDate", value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Description */}
                  <div className={formStyles.section}>
                    <h3 className={formStyles.sectionTitle}>Description</h3>

                    <div className={formStyles.row}>
                      <ValidatedInput
                        label="Task Description"
                        type="textarea"
                        value={taskFormData.description}
                        onChange={(value) => handleInputChange("description", value)}
                        placeholder="Describe the task details, objectives, and requirements"
                        rows={4}
                      />
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className={formStyles.actions}>
                    <button
                      type="button"
                      onClick={handleCancelTask}
                      className={formStyles.cancelButton}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmit}
                      className={formStyles.submitButton}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Creating Task..." : "Create Task"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : selectedTask ? (
            /* Task Detail View */
            <div className={styles.detailView}>
              <div className={styles.detailHeader}>
                <div className={styles.detailTitleSection}>
                  <button
                    onClick={handleBackToIdea}
                    className={styles.backButton}
                    title="Back to idea details"
                  >
                    ← Back to Idea
                  </button>
                  <h1 className={styles.detailTitle}>{selectedTask.title}</h1>
                  <div className={styles.detailStatusBadges}>
                    <span className={`${styles.taskStatus} ${
                      selectedTask.status === 'Completed' ? styles.statusCompleted :
                      selectedTask.status === 'In Progress' ? styles.statusInProgress :
                      selectedTask.status === 'On Hold' ? styles.statusOnHold :
                      styles.statusNotStarted
                    }`}>
                      {selectedTask.status}
                    </span>
                    <span className={`${styles.compactPriority} ${
                      selectedTask.priority === 'Critical' ? styles.priorityCritical :
                      selectedTask.priority === 'High' ? styles.priorityHigh :
                      selectedTask.priority === 'Normal' ? styles.priorityMedium :
                      styles.priorityLow
                    }`}>
                      {selectedTask.priority || 'Normal'}
                    </span>
                  </div>
                </div>
              </div>

              <div className={styles.detailContent}>
                <div className={styles.detailSection}>
                  <h3 className={styles.detailSectionTitle}>Description</h3>
                  <p className={styles.detailDescription}>
                    {selectedTask.description || 'No description provided.'}
                  </p>
                </div>

                <div className={styles.detailSection}>
                  <h3 className={styles.detailSectionTitle}>Task Details</h3>
                  <div className={styles.detailGrid}>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Assigned To:</span>
                      <span className={styles.detailValue}>
                        {Array.isArray(selectedTask.assignedTo)
                          ? selectedTask.assignedTo.join(', ')
                          : 'Unassigned'
                        }
                      </span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Priority:</span>
                      <span className={styles.detailValue}>{selectedTask.priority || 'Normal'}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Status:</span>
                      <span className={styles.detailValue}>{selectedTask.status}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Progress:</span>
                      <span className={styles.detailValue}>
                        {selectedTask.percentComplete || 0}%
                      </span>
                    </div>
                    {selectedTask.startDate && (
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Start Date:</span>
                        <span className={styles.detailValue}>
                          {new Date(selectedTask.startDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {selectedTask.dueDate && (
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Due Date:</span>
                        <span className={styles.detailValue}>
                          {new Date(selectedTask.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Created:</span>
                      <span className={styles.detailValue}>
                        {selectedTask.created ? new Date(selectedTask.created).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Last Modified:</span>
                      <span className={styles.detailValue}>
                        {selectedTask.modified ? new Date(selectedTask.modified).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : selectedIdea ? (
            /* Idea Detail View */
            <div className={styles.detailView}>
              <div className={styles.detailHeader}>
                <div className={styles.detailTitleSection}>
                  <h1 className={styles.detailTitle}>{selectedIdea.title}</h1>
                  <div className={styles.detailStatusBadges}>
                    <span className={`${styles.status} ${styles.statusApproved}`}>
                      Approved
                    </span>
                    <span className={`${styles.compactPriority} ${
                      selectedIdea.priority === 'Critical' ? styles.priorityCritical :
                      selectedIdea.priority === 'High' ? styles.priorityHigh :
                      selectedIdea.priority === 'Medium' ? styles.priorityMedium :
                      styles.priorityLow
                    }`}>
                      {selectedIdea.priority}
                    </span>
                    <button
                      onClick={handleCreateTask}
                      className={styles.createTaskButton}
                      title="Create task for this idea"
                    >
                      + Add Task
                    </button>
                  </div>
                </div>
              </div>

              <div className={styles.detailContent}>
                <div className={styles.detailSection}>
                  <h3 className={styles.detailSectionTitle}>Description</h3>
                  <p className={styles.detailDescription}>
                    {selectedIdea.description}
                  </p>
                </div>

                <div className={styles.detailSection}>
                  <h3 className={styles.detailSectionTitle}>Details</h3>
                  <div className={styles.detailGrid}>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Category:</span>
                      <span className={styles.detailValue}>{selectedIdea.category || "General"}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Priority:</span>
                      <span className={styles.detailValue}>{selectedIdea.priority}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Created By:</span>
                      <span className={styles.detailValue}>{selectedIdea.createdBy}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Created Date:</span>
                      <span className={styles.detailValue}>{selectedIdea.createdDate.toLocaleDateString()}</span>
                    </div>
                    {selectedIdea.approvedBy && (
                      <>
                        <div className={styles.detailItem}>
                          <span className={styles.detailLabel}>Approved By:</span>
                          <span className={styles.detailValue}>{selectedIdea.approvedBy}</span>
                        </div>
                        <div className={styles.detailItem}>
                          <span className={styles.detailLabel}>Approved Date:</span>
                          <span className={styles.detailValue}>
                            {selectedIdea.approvedDate ? selectedIdea.approvedDate.toLocaleDateString() : "N/A"}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Attachments Section */}
                {selectedIdea.attachments && selectedIdea.attachments.length > 0 && (
                  <div className={styles.detailSection}>
                    <h3 className={styles.detailSectionTitle}>Attachments ({selectedIdea.attachments.length})</h3>
                    <div className={styles.attachmentsList}>
                      {selectedIdea.attachments.map((attachment, index) => (
                        <div key={index} className={styles.attachmentItem}>
                          <span className={styles.attachmentIcon}>📎</span>
                          <span className={styles.attachmentName}>{attachment.fileName || attachment}</span>
                          <button
                            onClick={() => window.open(attachment.serverRelativeUrl || attachment, '_blank')}
                            className={styles.downloadButton}
                            title="Download attachment"
                          >
                            📥 Download
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tasks Section */}
                {getTaskCountForIdea(selectedIdea.id) > 0 && (
                  <div className={styles.detailSection}>
                    <h3 className={styles.detailSectionTitle}>Tasks ({getTaskCountForIdea(selectedIdea.id)})</h3>
                    <div className={styles.tasksList}>
                      {(data.tasks || [])
                        .filter(task => task.ideaId === selectedIdea.id)
                        .map((task) => (
                          <div key={task.id} className={styles.taskItem}>
                            <div className={styles.taskHeader}>
                              <h4 className={styles.taskTitle}>{task.title}</h4>
                              <span className={`${styles.taskStatus} ${
                                task.status === 'Completed' ? styles.statusCompleted :
                                task.status === 'In Progress' ? styles.statusInProgress :
                                task.status === 'On Hold' ? styles.statusOnHold :
                                styles.statusNotStarted
                              }`}>
                                {task.status}
                              </span>
                            </div>
                            {task.description && (
                              <p className={styles.taskDescription}>{task.description}</p>
                            )}
                            <div className={styles.taskMeta}>
                              <span className={styles.taskAssignee}>
                                Assigned to: {task.assignedTo.join(', ') || 'Unassigned'}
                              </span>
                              {task.dueDate && (
                                <span className={styles.taskDueDate}>
                                  Due: {new Date(task.dueDate).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                            <button
                              onClick={() => handleTaskSelect(task)}
                              className={styles.viewTaskDetailButton}
                            >
                              View Details
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* No selection state */
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>📋</div>
              <h3 className={styles.emptyTitle}>Select an Idea</h3>
              <p className={styles.emptyMessage}>
                Choose an approved idea from the list to view details and create tasks.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApprovedIdeasPage;