import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  ReactNode,
} from "react";
import { ideaApi } from "../services/ideaApi";
import { useUser } from "./UserContext";

// Data types for Innovative Ideas
export interface IdeaData {
  ideas: Idea[];
  tasks: Task[];
  discussions: Discussion[];
  approvers: Approver[];
  lastUpdated: Date | null;
}

export interface Idea {
  id: number;
  title: string;
  description: string;
  status: "Pending" | "Approved" | "Rejected" | "In Progress" | "Completed";
  createdBy: string;
  createdDate: Date;
  approvedBy?: string;
  approvedDate?: Date;
  category: string;
  priority: "Low" | "Medium" | "High" | "Critical";
}

export interface Task {
  id: number;
  ideaId: number;
  title: string;
  description: string;
  status: "Not Started" | "In Progress" | "Completed" | "On Hold";
  assignedTo: string[];
  createdBy: string;
  createdDate: Date;
  dueDate?: Date;
  progress: number;
  priority?: "Low" | "Medium" | "High" | "Critical";
  percentComplete?: number;
  startDate?: Date;
}

export interface Discussion {
  id: number;
  taskId: number;
  title?: string;
  body?: string;
  author: string;
  message: string;
  timestamp: Date;
  attachments?: string[];
}

export interface Approver {
  id: string;
  name: string;
  email: string;
  department: string;
}

// Processed types for SharePoint data
export interface ProcessedIdea {
  id: number;
  title: string;
  description: string;
  status:
    | "Pending Approval"
    | "Approved"
    | "Rejected"
    | "In Progress"
    | "Completed";
  category: string;
  priority: "Low" | "Medium" | "High" | "Critical";
  created: Date;
  modified: Date;
  createdBy: {
    id: number;
    name: string;
    email?: string;
  };
  approvedBy?: {
    id: number;
    name: string;
    email?: string;
  };
  attachments?: Array<{
    fileName: string;
    serverRelativeUrl: string;
  }>;
}

export interface ProcessedTask {
  id: number;
  title: string;
  description: string;
  status: "Not Started" | "In Progress" | "Completed" | "On Hold";
  priority: "Low" | "Normal" | "High" | "Critical";
  percentComplete: number;
  dueDate?: Date;
  startDate?: Date;
  assignedTo: Array<{
    id: number;
    name: string;
    email?: string;
    source: "AD" | "Organogram";
    designation?: string;
    department?: string;
  }>;
  created: Date;
  modified: Date;
  ideaId?: number;
}

export interface ProcessedDiscussion {
  id: number;
  title: string;
  body: string;
  created: Date;
  modified: Date;
  createdBy: {
    id: number;
    name: string;
    email?: string;
  };
  taskId?: number;
}

// Loading and error states
export interface DataState {
  data: IdeaData;
  loading: {
    ideas: boolean;
    tasks: boolean;
    discussions: boolean;
    approvers: boolean;
  };
  error: {
    ideas: string | null;
    tasks: string | null;
    discussions: string | null;
    approvers: string | null;
  };
}

// Actions
type DataAction =
  | {
      type: "SET_LOADING";
      payload: { key: keyof DataState["loading"]; value: boolean };
    }
  | {
      type: "SET_ERROR";
      payload: { key: keyof DataState["error"]; value: string | null };
    }
  | { type: "SET_IDEAS"; payload: Idea[] }
  | { type: "SET_TASKS"; payload: Task[] }
  | { type: "SET_DISCUSSIONS"; payload: Discussion[] }
  | { type: "SET_APPROVERS"; payload: Approver[] }
  | { type: "UPDATE_LAST_UPDATED" };

// Initial state
const initialData: IdeaData = {
  ideas: [],
  tasks: [],
  discussions: [],
  approvers: [],
  lastUpdated: null,
};

const initialState: DataState = {
  data: initialData,
  loading: {
    ideas: false,
    tasks: false,
    discussions: false,
    approvers: false,
  },
  error: {
    ideas: null,
    tasks: null,
    discussions: null,
    approvers: null,
  },
};

// Reducer
const dataReducer = (state: DataState, action: DataAction): DataState => {
  switch (action.type) {
    case "SET_LOADING":
      return {
        ...state,
        loading: {
          ...state.loading,
          [action.payload.key]: action.payload.value,
        },
      };

    case "SET_ERROR":
      return {
        ...state,
        error: { ...state.error, [action.payload.key]: action.payload.value },
      };

    case "SET_IDEAS":
      return {
        ...state,
        data: { ...state.data, ideas: action.payload, lastUpdated: new Date() },
      };

    case "SET_TASKS":
      return {
        ...state,
        data: { ...state.data, tasks: action.payload, lastUpdated: new Date() },
      };

    case "SET_DISCUSSIONS":
      return {
        ...state,
        data: {
          ...state.data,
          discussions: action.payload,
          lastUpdated: new Date(),
        },
      };

    case "SET_APPROVERS":
      return {
        ...state,
        data: {
          ...state.data,
          approvers: action.payload,
          lastUpdated: new Date(),
        },
      };

    case "UPDATE_LAST_UPDATED":
      return {
        ...state,
        data: { ...state.data, lastUpdated: new Date() },
      };

    default:
      return state;
  }
};

// Context
const DataContext = createContext<
  | {
      state: DataState;
      dispatch: React.Dispatch<DataAction>;
      loadIdeas: () => Promise<void>;
      loadTasks: () => Promise<void>;
      loadDiscussions: () => Promise<void>;
      loadApprovers: () => Promise<void>;
    }
  | undefined
>(undefined);

// Provider
export const DataProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(dataReducer, initialState);
  const { user } = useUser();

  const loadIdeas = useCallback(async () => {
    dispatch({ type: "SET_LOADING", payload: { key: "ideas", value: true } });
    dispatch({ type: "SET_ERROR", payload: { key: "ideas", value: null } });

    try {
      const processedIdeas = await ideaApi.getIdeas();

      // Convert ProcessedIdea to Idea format
      const ideas: Idea[] = processedIdeas.map((idea) => ({
        id: idea.id,
        title: idea.title,
        description: idea.description,
        status: idea.status as any, // Type assertion needed
        createdBy: idea.createdBy.name,
        createdDate: idea.created,
        approvedBy: idea.approvedBy?.name,
        approvedDate: idea.modified,
        category: "General", // Default category
        priority: "Medium", // Default priority
      }));

      dispatch({ type: "SET_IDEAS", payload: ideas });
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload: {
          key: "ideas",
          value:
            error instanceof Error ? error.message : "Failed to load ideas",
        },
      });
    } finally {
      dispatch({
        type: "SET_LOADING",
        payload: { key: "ideas", value: false },
      });
    }
  }, []);

  const loadTasks = useCallback(async () => {
    dispatch({ type: "SET_LOADING", payload: { key: "tasks", value: true } });
    dispatch({ type: "SET_ERROR", payload: { key: "tasks", value: null } });

    try {
      // For now, load tasks for all ideas (this might need optimization)
      const allTasks: Task[] = [];

      // Get all ideas first to load tasks for each
      const ideas = state.data.ideas;
      for (const idea of ideas) {
        try {
          const processedTasks = await ideaApi.getTasksForIdea(idea.id);
          const tasks: Task[] = processedTasks.map((task) => ({
            id: task.id,
            ideaId: task.ideaId || idea.id,
            title: task.title,
            description: task.description,
            status: task.status as any,
            assignedTo: task.assignedTo.map((user) => user.name),
            createdBy: task.assignedTo[0]?.name || "Unknown",
            createdDate: task.created,
            dueDate: task.dueDate,
            progress: task.percentComplete,
          }));
          allTasks.push(...tasks);
        } catch (error) {
          console.warn(`Failed to load tasks for idea ${idea.id}`, error);
        }
      }

      dispatch({ type: "SET_TASKS", payload: allTasks });
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload: {
          key: "tasks",
          value:
            error instanceof Error ? error.message : "Failed to load tasks",
        },
      });
    } finally {
      dispatch({
        type: "SET_LOADING",
        payload: { key: "tasks", value: false },
      });
    }
  }, [state.data.ideas]);

  const loadDiscussions = useCallback(async () => {
    dispatch({
      type: "SET_LOADING",
      payload: { key: "discussions", value: true },
    });
    dispatch({
      type: "SET_ERROR",
      payload: { key: "discussions", value: null },
    });

    try {
      // TODO: Implement SharePoint API call
      const discussions: Discussion[] = [];
      dispatch({ type: "SET_DISCUSSIONS", payload: discussions });
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload: {
          key: "discussions",
          value:
            error instanceof Error
              ? error.message
              : "Failed to load discussions",
        },
      });
    } finally {
      dispatch({
        type: "SET_LOADING",
        payload: { key: "discussions", value: false },
      });
    }
  }, []);

  const loadApprovers = useCallback(async () => {
    dispatch({
      type: "SET_LOADING",
      payload: { key: "approvers", value: true },
    });
    dispatch({ type: "SET_ERROR", payload: { key: "approvers", value: null } });

    try {
      // TODO: Load approvers from SharePoint group or list
      // For now, using mock data
      const approvers: Approver[] = [
        {
          id: "1",
          name: "John Manager",
          email: "john.manager@company.com",
          department: "IT",
        },
        {
          id: "2",
          name: "Sarah Director",
          email: "sarah.director@company.com",
          department: "Operations",
        },
        {
          id: "3",
          name: "Mike Supervisor",
          email: "mike.supervisor@company.com",
          department: "HR",
        },
      ];
      dispatch({ type: "SET_APPROVERS", payload: approvers });
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload: {
          key: "approvers",
          value:
            error instanceof Error ? error.message : "Failed to load approvers",
        },
      });
    } finally {
      dispatch({
        type: "SET_LOADING",
        payload: { key: "approvers", value: false },
      });
    }
  }, []);

  const updateIdeaStatus = useCallback(async (ideaId: number, newStatus: string, skipRefresh = false) => {
    try {
      // Prepare update data
      const updateData: any = { status: newStatus };

      // If approving or rejecting, set the approvedBy field
      if ((newStatus === "Approved" || newStatus === "Rejected") && user?.user?.Id) {
        updateData.approvedBy = user.user.Id.toString();
      }

      // Update the idea status via API
      const updatedIdea = await ideaApi.updateIdea(ideaId, updateData);

      // Update local state
      const updatedIdeas = state.data.ideas.map(idea =>
        idea.id === ideaId
          ? {
              ...idea,
              status: newStatus as any,
              approvedBy: newStatus === "Approved" || newStatus === "Rejected" ? user?.user?.Title : idea.approvedBy,
              approvedDate: newStatus === "Approved" || newStatus === "Rejected" ? new Date() : idea.approvedDate
            }
          : idea
      );

      dispatch({ type: "SET_IDEAS", payload: updatedIdeas });
      dispatch({ type: "UPDATE_LAST_UPDATED" });

      // Refresh data from server to ensure consistency (skip for undo operations)
      if (!skipRefresh) {
        setTimeout(() => loadIdeas(), 1000);
      }

      return updatedIdea;
    } catch (error) {
      console.error(`Failed to update idea ${ideaId} status to ${newStatus}`, error);
      throw error;
    }
  }, [state.data.ideas, user?.user?.Id, user?.user?.Title, loadIdeas]);

  return (
    <DataContext.Provider
      value={{
        state,
        dispatch,
        loadIdeas,
        loadTasks,
        loadDiscussions,
        loadApprovers,
        updateIdeaStatus,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

// Hook
export const useIdeaData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useIdeaData must be used within a DataProvider");
  }
  return {
    data: context.state.data,
    loading: context.state.loading,
    error: context.state.error,
    loadIdeas: context.loadIdeas,
    loadTasks: context.loadTasks,
    loadDiscussions: context.loadDiscussions,
    loadApprovers: context.loadApprovers,
    updateIdeaStatus: context.updateIdeaStatus,
  };
};
