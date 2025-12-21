import React, { createContext, useContext, useReducer, ReactNode } from "react";

// Notification types
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}

export interface NotificationState {
  notifications: Notification[];
}

// Actions
type NotificationAction =
  | {
      type: "ADD_NOTIFICATION";
      payload: Omit<Notification, "id" | "timestamp" | "read">;
    }
  | { type: "MARK_AS_READ"; payload: string }
  | { type: "MARK_ALL_AS_READ" }
  | { type: "REMOVE_NOTIFICATION"; payload: string }
  | { type: "CLEAR_ALL" };

// Initial state
const initialState: NotificationState = {
  notifications: [],
};

// Reducer
const notificationReducer = (
  state: NotificationState,
  action: NotificationAction,
): NotificationState => {
  switch (action.type) {
    case "ADD_NOTIFICATION": {
      const notification: Notification = {
        ...action.payload,
        id: Date.now().toString(),
        timestamp: new Date(),
        read: false,
      };
      return {
        ...state,
        notifications: [notification, ...state.notifications],
      };
    }

    case "MARK_AS_READ": {
      return {
        ...state,
        notifications: state.notifications.map((notification) =>
          notification.id === action.payload
            ? { ...notification, read: true }
            : notification,
        ),
      };
    }

    case "MARK_ALL_AS_READ": {
      return {
        ...state,
        notifications: state.notifications.map((notification) => ({
          ...notification,
          read: true,
        })),
      };
    }

    case "REMOVE_NOTIFICATION": {
      return {
        ...state,
        notifications: state.notifications.filter(
          (notification) => notification.id !== action.payload,
        ),
      };
    }

    case "CLEAR_ALL": {
      return {
        ...state,
        notifications: [],
      };
    }

    default:
      return state;
  }
};

// Context
const NotificationContext = createContext<
  | {
      state: NotificationState;
      dispatch: React.Dispatch<NotificationAction>;
    }
  | undefined
>(undefined);

// Provider
export const NotificationProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState);

  return (
    <NotificationContext.Provider value={{ state, dispatch }}>
      {children}
    </NotificationContext.Provider>
  );
};

// Hook
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotification must be used within a NotificationProvider",
    );
  }

  return {
    notifications: context.state.notifications,
    unreadCount: context.state.notifications.filter((n) => !n.read).length,
    addNotification: (
      notification: Omit<Notification, "id" | "timestamp" | "read">,
    ) => context.dispatch({ type: "ADD_NOTIFICATION", payload: notification }),
    markAsRead: (id: string) =>
      context.dispatch({ type: "MARK_AS_READ", payload: id }),
    markAllAsRead: () => context.dispatch({ type: "MARK_ALL_AS_READ" }),
    removeNotification: (id: string) =>
      context.dispatch({ type: "REMOVE_NOTIFICATION", payload: id }),
    clearAll: () => context.dispatch({ type: "CLEAR_ALL" }),
  };
};
