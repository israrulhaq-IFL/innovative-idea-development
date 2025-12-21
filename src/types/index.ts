// TypeScript type definitions for Innovative Ideas Application

// Re-export data types from DataContext
export type {
  IdeaData,
  Idea,
  Task,
  Discussion,
  Approver,
  ProcessedIdea,
  ProcessedTask,
  ProcessedDiscussion,
} from "../contexts/DataContext";

// SharePoint List Item base interface
export interface SharePointListItem {
  ID: number;
  Title: string;
  Created: string;
  Modified: string;
  Author: {
    ID: number;
    Title: string;
    EMail?: string;
  };
  Editor: {
    ID: number;
    Title: string;
    EMail?: string;
  };
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

// Loading states
export interface LoadingState {
  ideas: boolean;
  tasks: boolean;
  discussions: boolean;
  approvers: boolean;
}

// Error states
export interface ErrorState {
  ideas: string | null;
  tasks: string | null;
  discussions: string | null;
  approvers: string | null;
}

// User information from SharePoint
export interface SharePointUser {
  ID: number;
  Title: string;
  EMail: string;
  Department?: string;
  JobTitle?: string;
}

// Form validation
export interface ValidationRule {
  validate: (value: any) => boolean;
  message: string;
}

export interface FormField {
  name: string;
  label: string;
  type: "text" | "textarea" | "select" | "date" | "file";
  required?: boolean;
  validation?: ValidationRule[];
  options?: { value: string; label: string }[];
}

// Route types
export type RouteType =
  | "dashboard"
  | "approver"
  | "form"
  | "detail"
  | "discussion";

// Theme types (re-exported from ThemeContext)
export type { Theme } from "../contexts/ThemeContext";

// Component props types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface CardProps extends BaseComponentProps {
  title?: string;
  subtitle?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export interface ButtonProps extends BaseComponentProps {
  variant?: "primary" | "secondary" | "danger" | "success";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
}

// Status types
export type IdeaStatus =
  | "Pending"
  | "Approved"
  | "Rejected"
  | "In Progress"
  | "Completed";
export type TaskStatus =
  | "Not Started"
  | "In Progress"
  | "Completed"
  | "On Hold";
export type Priority = "Low" | "Medium" | "High" | "Critical";

// Color mappings for statuses
export const STATUS_COLORS: Record<IdeaStatus | TaskStatus, string> = {
  Pending: "#ffb900",
  Approved: "#107c10",
  Rejected: "#d13438",
  "In Progress": "#0078d4",
  Completed: "#107c10",
  "Not Started": "#605e5c",
  "On Hold": "#ff8c00",
};

export const PRIORITY_COLORS: Record<Priority, string> = {
  Low: "#107c10",
  Medium: "#ffb900",
  High: "#ff8c00",
  Critical: "#d13438",
};
