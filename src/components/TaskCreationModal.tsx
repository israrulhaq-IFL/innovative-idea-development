// Task Creation Modal Component
// src/components/TaskCreationModal.tsx
// Modal for creating follow-up tasks for approved ideas

import React, { useState, useEffect, useCallback, useRef } from "react";
import { ValidatedInput } from "./common/ValidatedInput.tsx";
import { ValidatedSelect } from "./common/ValidatedSelect.tsx";
import SearchableIdeaSelect from "./common/SearchableIdeaSelect";
import PeoplePicker from "./common/PeoplePicker";
import { useToast } from "./common/Toast";
import { ideaApi } from "../services/ideaApi";
import { validationRules } from "../utils/validation";
import { logInfo, logError } from "../utils/logger";
import formStyles from "./incident/IncidentTaskForm.module.css";
import { useUser } from "../contexts/UserContext";
import { useIdeaData } from "../contexts/DataContext";
import styles from "./TaskCreationModal.module.css";

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

interface TaskCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  preSelectedIdeaId?: string;
  preSelectedIdeaTitle?: string;
}

const TaskCreationModal: React.FC<TaskCreationModalProps> = ({
  isOpen,
  onClose,
  preSelectedIdeaId = "",
  preSelectedIdeaTitle = "",
}) => {
  const { addToast } = useToast();
  const { data, loading, error } = useIdeaData();
  const mountedRef = useRef(true);

  // Utility function to get current date in local format
  const getCurrentDate = (): string => {
    const now = new Date();
    return now.toISOString().split("T")[0];
  };

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

  // Form data state
  const [formData, setFormData] = useState<TaskFormData>(() => {
    const currentDate = getCurrentDate();
    return {
      title: "",
      ideaId: preSelectedIdeaId,
      priority: "Normal",
      status: "Not Started",
      percentComplete: 0,
      assignees: [],
      description: "",
      startDate: currentDate,
      dueDate: "",
      ideaTitle: preSelectedIdeaTitle,
    };
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState<IdeaOption | null>(null);

  // Update form data when preSelectedIdeaId changes
  useEffect(() => {
    if (preSelectedIdeaId && preSelectedIdeaTitle) {
      setFormData(prev => ({
        ...prev,
        ideaId: preSelectedIdeaId,
        ideaTitle: preSelectedIdeaTitle,
      }));
    }
  }, [preSelectedIdeaId, preSelectedIdeaTitle]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Handle form field changes
  const handleInputChange = useCallback((field: keyof TaskFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  // Handle idea selection
  const handleIdeaSelect = useCallback((idea: IdeaOption | null) => {
    setSelectedIdea(idea);
    setFormData(prev => ({
      ...prev,
      ideaId: idea ? idea.id.toString() : "",
      ideaTitle: idea ? idea.title : "",
    }));
  }, []);

  // Handle assignee selection
  const handleAssigneeSelect = useCallback((users: SelectedUser[]) => {
    setFormData(prev => ({
      ...prev,
      assignees: users,
    }));
  }, []);

  // Form validation
  const validateForm = useCallback((): boolean => {
    if (!formData.title.trim()) {
      addToast("Task title is required", "error");
      return false;
    }

    if (!formData.ideaId) {
      addToast("Please select an idea", "error");
      return false;
    }

    if (formData.dueDate && formData.startDate && new Date(formData.dueDate) < new Date(formData.startDate)) {
      addToast("Due date cannot be before start date", "error");
      return false;
    }

    return true;
  }, [formData, addToast]);

  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      logInfo("[TaskCreationModal] Creating task:", formData);

      // Prepare task data for SharePoint
      const taskData = {
        Title: formData.title,
        innovative_ideasId: parseInt(formData.ideaId),
        Priority: formData.priority,
        Status: formData.status,
        PercentComplete: formData.percentComplete / 100, // Convert to decimal
        AssignedToId: formData.assignees.length > 0 ? { results: formData.assignees.map(u => u.id) } : null,
        Description: formData.description,
        StartDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
        DueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
      };

      const result = await ideaApi.createTask(taskData);

      if (mountedRef.current) {
        logInfo("[TaskCreationModal] Task created successfully:", result);
        addToast("Task created successfully!", "success");
        onClose();

        // Reset form
        setFormData({
          title: "",
          ideaId: preSelectedIdeaId,
          priority: "Normal",
          status: "Not Started",
          percentComplete: 0,
          assignees: [],
          description: "",
          startDate: getCurrentDate(),
          dueDate: "",
          ideaTitle: preSelectedIdeaTitle,
        });
        setSelectedIdea(null);
      }
    } catch (error) {
      logError("[TaskCreationModal] Error creating task:", error);
      if (mountedRef.current) {
        addToast("Failed to create task. Please try again.", "error");
      }
    } finally {
      if (mountedRef.current) {
        setIsSubmitting(false);
      }
    }
  }, [formData, validateForm, addToast, onClose, preSelectedIdeaId, preSelectedIdeaTitle]);

  // Handle modal close
  const handleClose = useCallback(() => {
    if (!isSubmitting) {
      onClose();
    }
  }, [isSubmitting, onClose]);

  if (!isOpen) return null;

  return (
    <div className={styles.modal} onClick={handleClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Create Task for Idea</h2>
          <button
            className={styles.closeBtn}
            onClick={handleClose}
            disabled={isSubmitting}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <div className={styles.modalBody}>
          <form onSubmit={handleSubmit} className={formStyles.formContent}>
            {/* Section 1: Task Details */}
            <div className={formStyles.section}>
              <h3 className={formStyles.sectionTitle}>Task Details</h3>

              <div className={formStyles.row}>
                <ValidatedInput
                  label="Task Title *"
                  type="text"
                  value={formData.title}
                  onChange={(value) => handleInputChange("title", value)}
                  placeholder="Enter task title"
                  validation={validationRules.required}
                  required
                />
              </div>

              <div className={formStyles.row}>
                <SearchableIdeaSelect
                  label="Related Idea *"
                  value={selectedIdea}
                  onChange={handleIdeaSelect}
                  ideas={transformedIdeas}
                  placeholder="Search and select an approved idea"
                  disabled={!!preSelectedIdeaId}
                  required
                />
              </div>

              <div className={formStyles.row}>
                <div className={formStyles.col}>
                  <ValidatedSelect
                    label="Priority"
                    value={formData.priority}
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
                    value={formData.status}
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
                  value={formData.percentComplete.toString()}
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
                  selectedUsers={formData.assignees}
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
                    value={formData.startDate}
                    onChange={(value) => handleInputChange("startDate", value)}
                  />
                </div>
                <div className={formStyles.col}>
                  <ValidatedInput
                    label="Due Date"
                    type="date"
                    value={formData.dueDate}
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
                  value={formData.description}
                  onChange={(value) => handleInputChange("description", value)}
                  placeholder="Describe the task details, objectives, and requirements"
                  rows={4}
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className={formStyles.formActions}>
              <button
                type="button"
                onClick={handleClose}
                className={formStyles.cancelBtn}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={formStyles.submitBtn}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creating Task..." : "Create Task"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TaskCreationModal;