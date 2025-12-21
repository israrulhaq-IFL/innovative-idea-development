import React, { createContext, useContext, useReducer, ReactNode } from "react";

// UI State types
export interface UIState {
  sidebarOpen: boolean;
  modalOpen: boolean;
  modalContent: ReactNode | null;
  loading: boolean;
  loadingMessage: string;
}

// Actions
type UIAction =
  | { type: "SET_SIDEBAR_OPEN"; payload: boolean }
  | { type: "SET_MODAL_OPEN"; payload: boolean }
  | { type: "SET_MODAL_CONTENT"; payload: ReactNode | null }
  | { type: "SET_LOADING"; payload: { loading: boolean; message?: string } };

// Initial state
const initialState: UIState = {
  sidebarOpen: false,
  modalOpen: false,
  modalContent: null,
  loading: false,
  loadingMessage: "Loading...",
};

// Reducer
const uiReducer = (state: UIState, action: UIAction): UIState => {
  switch (action.type) {
    case "SET_SIDEBAR_OPEN":
      return { ...state, sidebarOpen: action.payload };

    case "SET_MODAL_OPEN":
      return { ...state, modalOpen: action.payload };

    case "SET_MODAL_CONTENT":
      return { ...state, modalContent: action.payload };

    case "SET_LOADING":
      return {
        ...state,
        loading: action.payload.loading,
        loadingMessage: action.payload.message || "Loading...",
      };

    default:
      return state;
  }
};

// Context
const UIContext = createContext<
  | {
      state: UIState;
      dispatch: React.Dispatch<UIAction>;
    }
  | undefined
>(undefined);

// Provider
export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(uiReducer, initialState);

  return (
    <UIContext.Provider value={{ state, dispatch }}>
      {children}
    </UIContext.Provider>
  );
};

// Hook
export const useUI = () => {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error("useUI must be used within a UIProvider");
  }
  return {
    ...context.state,
    setSidebarOpen: (open: boolean) =>
      context.dispatch({ type: "SET_SIDEBAR_OPEN", payload: open }),
    setModalOpen: (open: boolean) =>
      context.dispatch({ type: "SET_MODAL_OPEN", payload: open }),
    setModalContent: (content: ReactNode | null) =>
      context.dispatch({ type: "SET_MODAL_CONTENT", payload: content }),
    setLoading: (loading: boolean, message?: string) =>
      context.dispatch({ type: "SET_LOADING", payload: { loading, message } }),
  };
};
