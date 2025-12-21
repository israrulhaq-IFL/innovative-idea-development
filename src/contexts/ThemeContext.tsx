import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
} from "react";

// Theme types
export type Theme = "light" | "dark";

export interface ThemeState {
  theme: Theme;
  isSystemTheme: boolean;
}

export interface ThemeContextType extends ThemeState {
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  setSystemTheme: (useSystem: boolean) => void;
}

// Theme actions
type ThemeAction =
  | { type: "TOGGLE_THEME" }
  | { type: "SET_THEME"; payload: Theme }
  | { type: "SET_SYSTEM_THEME"; payload: boolean }
  | { type: "SET_SYSTEM_THEME_VALUE"; payload: Theme };

// Theme reducer
const themeReducer = (state: ThemeState, action: ThemeAction): ThemeState => {
  switch (action.type) {
    case "TOGGLE_THEME": {
      const newTheme = state.theme === "light" ? "dark" : "light";
      localStorage.setItem("innovative-ideas-theme", newTheme);
      return { ...state, theme: newTheme, isSystemTheme: false };
    }

    case "SET_THEME": {
      localStorage.setItem("innovative-ideas-theme", action.payload);
      return { ...state, theme: action.payload, isSystemTheme: false };
    }

    case "SET_SYSTEM_THEME": {
      if (action.payload) {
        const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
          .matches
          ? "dark"
          : "light";
        localStorage.removeItem("innovative-ideas-theme");
        return { ...state, theme: systemTheme, isSystemTheme: true };
      } else {
        localStorage.setItem("innovative-ideas-theme", state.theme);
        return { ...state, isSystemTheme: false };
      }
    }

    case "SET_SYSTEM_THEME_VALUE":
      if (state.isSystemTheme) {
        return { ...state, theme: action.payload };
      }
      return state;

    default:
      return state;
  }
};

// Initial state
const getInitialThemeState = (): ThemeState => {
  const savedTheme = localStorage.getItem("innovative-ideas-theme") as Theme;
  const isSystemTheme = !savedTheme;

  if (savedTheme && (savedTheme === "light" || savedTheme === "dark")) {
    return { theme: savedTheme, isSystemTheme: false };
  }

  const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
  return { theme: systemTheme, isSystemTheme };
};

// Create context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Theme provider component
export const ThemeProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(themeReducer, getInitialThemeState());

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = (e: Event & { matches: boolean }) => {
      dispatch({
        type: "SET_SYSTEM_THEME_VALUE",
        payload: e.matches ? "dark" : "light",
      });
    };

    if (state.isSystemTheme) {
      mediaQuery.addEventListener("change", handleChange);
    }

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, [state.isSystemTheme]);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", state.theme);
  }, [state.theme]);

  const contextValue: ThemeContextType = {
    ...state,
    toggleTheme: () => dispatch({ type: "TOGGLE_THEME" }),
    setTheme: (theme: Theme) => dispatch({ type: "SET_THEME", payload: theme }),
    setSystemTheme: (useSystem: boolean) =>
      dispatch({ type: "SET_SYSTEM_THEME", payload: useSystem }),
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use theme context
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
