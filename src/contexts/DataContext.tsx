import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useRef,
  useEffect,
  ReactNode,
} from "react";
import { ideaApi } from "../services/ideaApi";
import { discussionApi, Discussion as DiscussionType } from "../services/discussionApi";
import { useUser } from "./UserContext";

// Data types for Innovative Ideas
export interface IdeaData {
  ideas: Idea[];
  tasks: Task[];
  discussions: Discussion[];
  approvers: Approver[];
  ideaTrailEvents: IdeaTrailEvent[];
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

export interface IdeaTrailEvent {
  id: number;
  ideaId: number;
  taskId?: number;
  discussionId?: number;
  eventType:
    | 'submitted'
    | 'reviewed'
    | 'approved'
    | 'rejected'
    | 'implementation_started'
    | 'implementation_completed'
    | 'status_changed'
    | 'commented'
    | 'attachment_added'
    | 'task_created';
  title: string;
  description: string;
  actor: string;
  actorId: number;
  timestamp: Date;
  previousStatus?: string;
  newStatus?: string;
  comments?: string;
  metadata?: Record<string, any>;
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
  | { type: "SET_IDEA_TRAIL_EVENTS"; payload: IdeaTrailEvent[] }
  | { type: "UPDATE_LAST_UPDATED" };

// Initial state
const initialData: IdeaData = {
  ideas: [],
  tasks: [],
  discussions: [],
  approvers: [],
  ideaTrailEvents: [],
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

    case "SET_IDEA_TRAIL_EVENTS":
      return {
        ...state,
        data: {
          ...state.data,
          ideaTrailEvents: action.payload,
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
      loadIdeaTrailEvents: () => Promise<void>;
      createInitialTrailEvents: () => Promise<void>;
      updateIdeaStatus: (
        ideaId: number,
        newStatus: string,
        skipRefresh?: boolean,
      ) => Promise<any>;
    }
  | undefined
>(undefined);

// Provider
export const DataProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(dataReducer, initialState);
  const { user } = useUser();
  
  // Create refs to store the latest function references
  const loadIdeasRef = useRef<(() => Promise<void>) | null>(null);
  const loadIdeaTrailEventsRef = useRef<(() => Promise<void>) | null>(null);
  const stateRef = useRef(state);
  
  // Keep state ref updated
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

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
  
  // Update the refs whenever functions change
  useEffect(() => {
    loadIdeasRef.current = loadIdeas;
  }, [loadIdeas]);

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
      // Load discussions for the current user
      if (user?.user?.Id) {
        const myDiscussions = await discussionApi.getMyDiscussions(user.user.Id);
        // Map to our Discussion format
        const discussions: Discussion[] = myDiscussions.map((d: DiscussionType) => ({
          id: d.id,
          taskId: d.taskId,
          title: d.taskTitle,
          body: d.messages[0]?.body || '',
          author: d.messages[0]?.author.name || 'Unknown',
          message: d.messages[0]?.body || '',
          timestamp: d.lastActivity,
          attachments: d.messages.flatMap(m => m.attachments || []).map(a => a.fileName),
        }));
        dispatch({ type: "SET_DISCUSSIONS", payload: discussions });
      } else {
        dispatch({ type: "SET_DISCUSSIONS", payload: [] });
      }
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

  const updateIdeaStatus = useCallback(
    async (ideaId: number, newStatus: string, skipRefresh = false) => {
      try {
        // Prepare update data
        const updateData: any = { status: newStatus };

        // If approving or rejecting, set the approvedBy field
        if (
          (newStatus === 'Approved' || newStatus === 'Rejected') &&
          user?.user?.Id
        ) {
          updateData.approvedBy = user.user.Id.toString();
        }

        // Update the idea status via API
        const updatedIdea = await ideaApi.updateIdea(ideaId, updateData);

        // Create trail event for status change
        try {
          const currentIdea = stateRef.current.data.ideas.find(
            (idea) => idea.id === ideaId,
          );
          if (currentIdea) {
            let eventType: IdeaTrailEvent['eventType'] = 'status_changed';
            let eventTitle = `Idea ${newStatus}`;
            let eventDescription = `Idea "${currentIdea.title}" status changed to ${newStatus}`;

            // Determine specific event type based on status transition
            if (newStatus === 'Approved') {
              eventType = 'approved';
            } else if (newStatus === 'Rejected') {
              eventType = 'rejected';
            } else if (
              newStatus === 'In Progress' &&
              currentIdea.status === 'Approved'
            ) {
              eventType = 'implementation_started';
              eventTitle = 'Implementation Started';
              eventDescription = `Implementation of idea "${currentIdea.title}" has begun`;
            } else if (
              newStatus === 'Completed' &&
              currentIdea.status === 'In Progress'
            ) {
              eventType = 'implementation_completed';
              eventTitle = 'Implementation Completed';
              eventDescription = `Implementation of idea "${currentIdea.title}" has been completed`;
            }

            await ideaApi.createIdeaTrailEvent({
              ideaId,
              eventType,
              title: eventTitle,
              description: eventDescription,
              actor: user?.user?.Title || 'System',
              actorId: user?.user?.Id || 0,
              previousStatus: currentIdea.status,
              newStatus,
              metadata: {
                approvedBy: user?.user?.Title,
                previousStatus: currentIdea.status,
              },
            });
          }
        } catch (trailError) {
          console.error(
            'Failed to create trail event for status change',
            trailError,
          );
          // Don't fail the status update if trail event fails
        }

        // Update local state
        const updatedIdeas = stateRef.current.data.ideas.map((idea) =>
          idea.id === ideaId
            ? {
                ...idea,
                status: newStatus as any,
                approvedBy:
                  newStatus === 'Approved' || newStatus === 'Rejected'
                    ? user?.user?.Title
                    : idea.approvedBy,
                approvedDate:
                  newStatus === 'Approved' || newStatus === 'Rejected'
                    ? new Date()
                    : idea.approvedDate,
              }
            : idea,
        );

        dispatch({ type: 'SET_IDEAS', payload: updatedIdeas });
        dispatch({ type: 'UPDATE_LAST_UPDATED' });

        // Refresh data from server to ensure consistency (skip for undo operations)
        if (!skipRefresh && loadIdeasRef.current) {
          setTimeout(async () => {
            try {
              await loadIdeasRef.current?.();
            } catch (error) {
              console.error('Failed to refresh ideas after status update:', error);
            }
          }, 1000);
        }

        return updatedIdea;
      } catch (error) {
        console.error(
          `Failed to update idea ${ideaId} status to ${newStatus}`,
          error,
        );
        throw error;
      }
    },
    [user?.user?.Id, user?.user?.Title],
  );

  const loadIdeaTrailEvents = useCallback(async () => {
    try {
      // Load real trail events from SharePoint
      const trailEvents = await ideaApi.getIdeaTrailEvents();
      dispatch({ type: "SET_IDEA_TRAIL_EVENTS", payload: trailEvents });
    } catch (error) {
      console.error("Failed to load idea trail events", error);
      // Fallback to empty array on error
      dispatch({ type: "SET_IDEA_TRAIL_EVENTS", payload: [] });
    }
  }, []);
  
  // Update the ref for loadIdeaTrailEvents
  useEffect(() => {
    loadIdeaTrailEventsRef.current = loadIdeaTrailEvents;
  }, [loadIdeaTrailEvents]);

  const createInitialTrailEvents = useCallback(async () => {
    try {
      // Check if trail events already exist
      const existingEvents = await ideaApi.getIdeaTrailEvents();
      if (existingEvents.length > 0) {
        console.log("Trail events already exist, skipping initial creation");
        return;
      }

      console.log("Creating initial trail events for existing ideas...");
      const ideas = stateRef.current.data.ideas;

      for (const idea of ideas) {
        try {
          // Create submission event
          await ideaApi.createIdeaTrailEvent({
            ideaId: idea.id,
            eventType: "submitted",
            title: "Idea Submitted",
            description: `Idea "${idea.title}" was submitted for review`,
            actor: idea.createdBy,
            actorId: 1, // Would need to get actual user ID
            previousStatus: undefined,
            newStatus: "Pending",
            metadata: {
              category: idea.category,
              priority: idea.priority,
            },
          });

          // Create approval/rejection event if applicable
          if (idea.status === "Approved" || idea.status === "Rejected") {
            await ideaApi.createIdeaTrailEvent({
              ideaId: idea.id,
              eventType: idea.status === "Approved" ? "approved" : "rejected",
              title: `Idea ${idea.status}`,
              description: `Idea "${idea.title}" was ${idea.status.toLowerCase()}`,
              actor: idea.approvedBy || "System",
              actorId: 2, // Would need to get actual user ID
              previousStatus: "Pending",
              newStatus: idea.status,
              metadata: {
                approvedBy: idea.approvedBy,
              },
            });
          }

          // Create implementation events if applicable
          if (idea.status === "In Progress" || idea.status === "Completed") {
            await ideaApi.createIdeaTrailEvent({
              ideaId: idea.id,
              eventType: "implementation_started",
              title: "Implementation Started",
              description: `Implementation of idea "${idea.title}" has begun`,
              actor: "System",
              actorId: 3,
              previousStatus: "Approved",
              newStatus: "In Progress",
            });

            if (idea.status === "Completed") {
              await ideaApi.createIdeaTrailEvent({
                ideaId: idea.id,
                eventType: "implementation_completed",
                title: "Implementation Completed",
                description: `Implementation of idea "${idea.title}" has been completed`,
                actor: "System",
                actorId: 3,
                previousStatus: "In Progress",
                newStatus: "Completed",
              });
            }
          }
        } catch (error) {
          console.error(
            `Failed to create trail events for idea ${idea.id}`,
            error,
          );
        }
      }

      console.log("Initial trail events creation completed");
      // Reload trail events
      if (loadIdeaTrailEventsRef.current) {
        await loadIdeaTrailEventsRef.current();
      }
    } catch (error) {
      console.error("Failed to create initial trail events", error);
    }
  }, []);

  return (
    <DataContext.Provider
      value={{
        state,
        dispatch,
        loadIdeas,
        loadTasks,
        loadDiscussions,
        loadApprovers,
        loadIdeaTrailEvents,
        createInitialTrailEvents,
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
    loadIdeaTrailEvents: context.loadIdeaTrailEvents,
    createInitialTrailEvents: context.createInitialTrailEvents,
    updateIdeaStatus: context.updateIdeaStatus,
  };
};
