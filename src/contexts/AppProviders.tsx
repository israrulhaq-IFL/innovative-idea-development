import React, { ReactNode } from "react";
import { ThemeProvider } from "./ThemeContext";
import { DataProvider } from "./DataContext";
import { UIProvider } from "./UIContext";
import { UserProvider } from "./UserContext";
import { ToastProvider } from "../components/common/Toast";
import { NotificationProvider } from "./NotificationContext";

interface AppProvidersProps {
  children: ReactNode;
}

/**
 * Combined providers component that wraps all application contexts
 * Provides centralized state management for theme, data, UI state, user, toast, and notifications
 */
export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <ThemeProvider>
      <UserProvider>
        <DataProvider>
          <UIProvider>
            <NotificationProvider>
              <ToastProvider>{children}</ToastProvider>
            </NotificationProvider>
          </UIProvider>
        </DataProvider>
      </UserProvider>
    </ThemeProvider>
  );
};
