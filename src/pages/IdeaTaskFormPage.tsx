// Idea Task Form Page Component
// src/pages/IdeaTaskFormPage.tsx
// Form for creating follow-up tasks for innovative ideas

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import GenericFormPage from "./GenericFormPage";
import { ValidatedInput } from "../components/common/ValidatedInput.tsx";
import { ValidatedSelect } from "../components/common/ValidatedSelect.tsx";
import SearchableIdeaSelect from "../components/common/SearchableIdeaSelect";
import { discussionApi } from "../services/discussionApi";
import PeoplePicker from "../components/common/PeoplePicker";
import { useToast } from "../components/common/Toast";
import { ideaApi } from "../services/ideaApi";
import { validationRules } from "../utils/validation";
import { logInfo, logError } from "../utils/logger";
import formStyles from "../components/incident/IncidentTaskForm.module.css";
import { useUser } from "../contexts/UserContext";
import { useIdeaData } from "../contexts/DataContext";

// Utility function to get current date in local format
const getCurrentDate = (): string => {
  const now = new Date();
  return now.toISOString().split("T")[0]; // YYYY-MM-DD
};

interface SelectedUser {
  id: number;
  name: string;
  email: string;
}

interface IdeaOption {
  id: number;
  title: string;
  status: string;
  category: string;
  priority: string;
  created: string;
  createdBy: string;
}

interface TaskFormData {
  // Required fields
  title: string; // Task Name
  ideaId: string; // Lookup to innovative_ideas

  // Optional fields
  priority: string; // Choice: Low, Normal, High, Critical
  status: string; // Choice: Not Started, In Progress, Completed, On Hold
  percentComplete: number; // Number 0-100
  assignees: SelectedUser[]; // Multi-select: Array of users from AD/SharePoint
  description: string; // Body - Multiple lines of text
  startDate: string; // Date
  dueDate: string; // Date
  ideaTitle?: string; // Store selected idea title for display
}

const IdeaTaskFormPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { id: routeIdeaId } = useParams<{ id: string }>();
  const { addToast } = useToast();
  const { data, loading, error } = useIdeaData();
  const mountedRef = useRef(true);

  // Check if user is admin (simplified check - in real app, use proper auth)
  const isAdmin = true; // TODO: Implement proper admin check

  // Transform ideas from DataContext to IdeaOption format
  const transformedIdeas: IdeaOption[] = (data.ideas || []).map(idea => ({
    id: idea.id,
    title: idea.title,
    status: idea.status,
    category: idea.category || 'No Category',
    priority: idea.priority,
    created: idea.createdDate.toISOString(),
    createdBy: idea.createdBy,
  }));

  // Get idea ID from URL path params (for direct navigation from approved ideas)
  const preSelectedIdeaId = routeIdeaId || searchParams.get("idea") || searchParams.get("ideaId") || "";
  const isIdeaPreSelected = !!preSelectedIdeaId;

  // Form data state
  const [formData, setFormData] = useState<TaskFormData>(() => {
    const currentDate = getCurrentDate();
    return {
      title: "",
      ideaId: preSelectedIdeaId,
      priority: "Normal", // Default priority
      status: "Not Started", // Default status
      percentComplete: 0,
      assignees: [], // Multi-select array of users
      description: "",
      startDate: currentDate,
      dueDate: "",
      ideaTitle: "",
    };
  });

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load pre-selected idea details
  useEffect(() => {
    if (isIdeaPreSelected && preSelectedIdeaId && data.ideas) {
      const idea = data.ideas.find(i => i.id.toString() === preSelectedIdeaId);
      if (idea) {
        setFormData(prev => ({
          ...prev,
          ideaId: preSelectedIdeaId,
          ideaTitle: idea.title,
        }));
        logInfo("[IdeaTaskForm] Pre-selected idea loaded", { ideaId: preSelectedIdeaId, title: idea.title });
      }
    }
  }, [isIdeaPreSelected, preSelectedIdeaId, data.ideas]);

  // Choice field options
  const priorityOptions = [
    { value: "Low", label: "Low" },
    { value: "Normal", label: "Normal" },
    { value: "High", label: "High" },
    { value: "Critical", label: "Critical" },
  ];

  const statusOptions = [
    { value: "Not Started", label: "Not Started" },
    { value: "In Progress", label: "In Progress" },
    { value: "Completed", label: "Completed" },
    { value: "On Hold", label: "On Hold" },
  ];

  // Redirect if not admin
  useEffect(() => {
    if (!isAdmin) {
      addToast({
        type: "error",
        title: "Access denied. Admin privileges required.",
      });
      navigate("/");
    }
  }, [isAdmin, navigate, addToast]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      logInfo("[IdeaTaskForm] Component unmounting");
      mountedRef.current = false;
    };
  }, []);

  const handleInputChange = useCallback(
    (name: string, value: string, _isValid?: boolean) => {
      setFormData((prev) => ({ ...prev, [name]: value }));
    },
    [],
  );

  const handleNumberChange = useCallback(
    (name: string, value: string, _isValid?: boolean) => {
      const numValue = parseInt(value, 10) || 0;
      // Clamp between 0 and 100 for percent complete
      const clampedValue = Math.max(0, Math.min(100, numValue));
      setFormData((prev) => ({ ...prev, [name]: clampedValue }));
    },
    [],
  );

  const handleSelectChange = useCallback(
    (name: string, value: string, _isValid: boolean) => {
      logInfo(`[IdeaTaskForm] handleSelectChange called: ${name} = ${value}`);
      setFormData((prev) => ({ ...prev, [name]: value }));
    },
    [],
  );

  // Handler for searchable idea select
  const handleIdeaChange = useCallback((ideaId: string, ideaTitle?: string) => {
    logInfo(
      `[IdeaTaskForm] handleIdeaChange called: ID=${ideaId}, Title=${ideaTitle}`,
    );
    setFormData((prev) => ({ ...prev, ideaId, ideaTitle: ideaTitle || "" }));
  }, []);

  // Handler for multi-select assignees
  const handleAssigneeAdd = useCallback((user: SelectedUser | null) => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        assignees: [...prev.assignees.filter((a) => a.id !== user.id), user], // Avoid duplicates
      }));
      logInfo(`[IdeaTaskForm] Added assignee: ${user.name} (${user.id})`);
    }
  }, []);

  const handleAssigneeRemove = useCallback((userId: number) => {
    setFormData((prev) => ({
      ...prev,
      assignees: prev.assignees.filter((a) => a.id !== userId),
    }));
    logInfo(`[IdeaTaskForm] Removed assignee with ID: ${userId}`);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.title.trim()) {
      addToast({
        type: "error",
        title: "Please enter a task name",
      });
      return;
    }

    if (!formData.ideaId) {
      addToast({
        type: "error",
        title: "Please select an idea",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      logInfo("[IdeaTaskForm] Submitting task:", formData);

      // Prepare task data for API
      const taskData = {
        title: formData.title,
        description: formData.description,
        status: formData.status as any,
        priority: formData.priority as any,
        percentComplete: formData.percentComplete,
        assignedTo: formData.assignees.map((a) => a.id.toString()),
        startDate: formData.startDate
          ? new Date(formData.startDate)
          : undefined,
        dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
      };

      // Get current user info (simplified - in real app, get from auth context)
      const currentUser = { id: 1, name: "Admin User" }; // TODO: Get from auth

      const result = await ideaApi.createTaskForIdea(
        parseInt(formData.ideaId),
        taskData,
        currentUser,
      );

      if (result) {
        // Auto-create discussion thread for the task with idea context
        try {
          const assignees = formData.assignees.map(a => ({
            id: a.id,
            name: a.name
          }));
          
          // Get the full idea details for context
          const idea = data.ideas.find(i => i.id.toString() === formData.ideaId);
          
          await discussionApi.createTaskDiscussion(
            result.id,
            taskData.title,
            taskData.description || '',
            parseInt(formData.ideaId),
            assignees,
            idea?.createdBy,
            idea?.description
          );
          logInfo('[IdeaTaskForm] Discussion thread created for task', result.id);
          
          // Create trail entry for discussion creation
          try {
            await ideaApi.createIdeaTrailEvent(
              parseInt(formData.ideaId),
              'commented',
              currentUser,
              `Discussion thread created for task: ${taskData.title}`
            );
            logInfo('[IdeaTaskForm] Trail entry created for discussion');
          } catch (trailError) {
            logError('[IdeaTaskForm] Failed to create trail entry:', trailError);
          }
        } catch (discussionError) {
          logError('[IdeaTaskForm] Failed to create discussion thread:', discussionError);
          // Don't fail the task creation if discussion creation fails
        }

        addToast({
          type: "success",
          title: "Task created successfully!",
        });
        logInfo("[IdeaTaskForm] Task created successfully", result);

        // Reset form for next entry
        const currentDate = getCurrentDate();
        setFormData({
          title: "",
          ideaId: preSelectedIdeaId,
          priority: "Normal",
          status: "Not Started",
          percentComplete: 0,
          assignees: [],
          description: "",
          startDate: currentDate,
          dueDate: "",
          ideaTitle: "",
        });
      }
    } catch (error) {
      logError("[IdeaTaskForm] Failed to create task:", error);
      addToast({
        type: "error",
        title: "Failed to create task. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    addToast({
      type: "info",
      title: "Form cancelled. Returning to Main Dashboard.",
      duration: 2000,
    });

    // Navigate using React Router with a small delay to show the toast
    setTimeout(() => {
      navigate("/");
    }, 500);
  };

  const handleBack = () => {
    // Navigate using React Router
    navigate("/");
  };

  // Don't render if not admin
  if (!isAdmin) {
    return null;
  }

  return (
    <GenericFormPage
      title="Create Task for Idea"
      onBack={handleBack}
      backLabel="Back to Main Dashboard"
      isSubmitting={isSubmitting}
      showControlPanel={false}
    >
      <div className={formStyles.pageContainer}>
        <form onSubmit={handleSubmit} className={formStyles.formContent}>
          {/* Section 1: Task Details */}
          <div className={formStyles.section}>
            <h3 className={formStyles.sectionTitle}>Task Details</h3>

            {/* Related Idea Selection - Searchable or Pre-selected Display */}
            <div className={formStyles.formRow}>
              <div className={formStyles.fullWidthField}>
                {isIdeaPreSelected ? (
                  // Display pre-selected idea as read-only
                  <div className={formStyles.preSelectedIdea}>
                    <label className={formStyles.label}>Related Idea *</label>
                    <div className={formStyles.selectedIdeaDisplay}>
                      <div className={formStyles.ideaInfo}>
                        <h4 className={formStyles.ideaTitle}>{formData.ideaTitle || "Loading..."}</h4>
                        <p className={formStyles.ideaId}>ID: {preSelectedIdeaId}</p>
                      </div>
                      <div className={formStyles.ideaStatus}>
                        <span className={`${formStyles.statusBadge} ${formStyles.approved}`}>
                          <i className="fas fa-check-circle"></i>
                          Approved
                        </span>
                      </div>
                    </div>
                    <p className={formStyles.fieldHint}>
                      <i className="fas fa-info-circle" /> Task will be created for this approved idea
                    </p>
                  </div>
                ) : (
                  // Show searchable idea select for manual selection
                  <SearchableIdeaSelect
                    id="ideaId"
                    label="Related Idea *"
                    value={formData.ideaId}
                    onChange={handleIdeaChange}
                    disabled={isSubmitting}
                    required
                    placeholder="Search by title, category, status, or creator..."
                    ideas={transformedIdeas}
                  />
                )}
              </div>
            </div>

            {/* Task Name */}
            <div className={formStyles.formRow}>
              <ValidatedInput
                type="text"
                id="title"
                label="Task Name *"
                value={formData.title}
                validationRules={[validationRules.required()]}
                onChange={(value, _isValid) =>
                  handleInputChange("title", value, _isValid)
                }
                className={formStyles.fullWidthField}
                disabled={isSubmitting}
                placeholder="Enter task name (e.g., Conduct feasibility study, Prepare implementation plan)"
              />
            </div>

            {/* Description */}
            <div className={formStyles.formRow}>
              <ValidatedInput
                type="textarea"
                id="description"
                label="Task Description"
                value={formData.description}
                onChange={(value, _isValid) =>
                  handleInputChange("description", value, _isValid)
                }
                className={formStyles.fullWidthField}
                disabled={isSubmitting}
                rows={4}
                placeholder="Describe the task requirements and objectives in detail"
              />
            </div>
          </div>

          {/* Section 2: Assignment & Status */}
          <div className={formStyles.section}>
            <h3 className={formStyles.sectionTitle}>Assignment & Status</h3>

            {/* Assigned To field - Multi-Select People Picker */}
            <div className={formStyles.formRow}>
              <div className={formStyles.fullWidthField}>
                <label className={formStyles.label}>Assigned To</label>
                {/* Selected assignees */}
                {formData.assignees.length > 0 && (
                  <div className={formStyles.assigneesList}>
                    {formData.assignees.map((assignee) => (
                      <div
                        key={assignee.id}
                        className={formStyles.assigneeChip}
                      >
                        <i className="fas fa-user"></i>
                        <span className={formStyles.assigneeName}>
                          {assignee.name}
                        </span>
                        {assignee.email && (
                          <span className={formStyles.assigneeEmail}>
                            ({assignee.email})
                          </span>
                        )}
                        <button
                          type="button"
                          className={formStyles.removeAssigneeButton}
                          onClick={() => handleAssigneeRemove(assignee.id)}
                          disabled={isSubmitting}
                          aria-label={`Remove ${assignee.name}`}
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {/* People picker for adding new assignees */}
                <PeoplePicker
                  id="assigneePicker"
                  label={formData.assignees.length === 0 ? 'Assigned To' : ''}
                  value={null}
                  onChange={handleAssigneeAdd}
                  placeholder="Search for team members to assign..."
                  disabled={isSubmitting}
                  className={formStyles.assigneePicker}
                />
              </div>
            </div>

            <div className={formStyles.formRow}>
              <ValidatedSelect
                id="priority"
                label="Priority"
                value={formData.priority}
                options={priorityOptions}
                onChange={(value, isValid) =>
                  handleSelectChange("priority", value, isValid)
                }
                className={formStyles.formField}
                disabled={isSubmitting}
              />

              <ValidatedSelect
                id="status"
                label="Task Status"
                value={formData.status}
                options={statusOptions}
                onChange={(value, isValid) =>
                  handleSelectChange("status", value, isValid)
                }
                className={formStyles.formField}
                disabled={isSubmitting}
              />

              <ValidatedInput
                type="number"
                id="percentComplete"
                label="% Complete"
                value={formData.percentComplete.toString()}
                onChange={(value, _isValid) =>
                  handleNumberChange("percentComplete", value, _isValid)
                }
                className={formStyles.formField}
                disabled={isSubmitting}
                min={0}
                max={100}
              />
            </div>
          </div>

          {/* Section 3: Schedule */}
          <div className={formStyles.section}>
            <h3 className={formStyles.sectionTitle}>Schedule</h3>

            <div className={formStyles.formRow}>
              <ValidatedInput
                type="date"
                id="startDate"
                label="Start Date"
                value={formData.startDate}
                onChange={(value, _isValid) =>
                  handleInputChange("startDate", value, _isValid)
                }
                className={formStyles.formField}
                disabled={isSubmitting}
              />

              <ValidatedInput
                type="date"
                id="dueDate"
                label="Due Date"
                value={formData.dueDate}
                onChange={(value, _isValid) =>
                  handleInputChange("dueDate", value, _isValid)
                }
                className={formStyles.formField}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className={formStyles.actions}>
            <button
              type="button"
              className={formStyles.cancelButton}
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={formStyles.submitButton}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  Creating Task...
                </>
              ) : (
                <>
                  <i className="fas fa-tasks"></i>
                  Create Task
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </GenericFormPage>
  );
};

export default IdeaTaskFormPage;
