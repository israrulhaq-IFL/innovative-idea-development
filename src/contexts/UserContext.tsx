// User Context for SharePoint User Management
// src/contexts/UserContext.tsx

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { userApi, CurrentUserInfo, SharePointUser } from "../services/userApi";
import { logError, logInfo } from "../utils/logger";

interface UserContextType {
  user: CurrentUserInfo | null;
  isLoading: boolean;
  error: string | null;
  refreshUser: () => Promise<void>;
  hasPermission: (permission: keyof CurrentUserInfo["permissions"]) => boolean;
  isApprover: boolean;
  isAdmin: boolean;
  isContributor: boolean;
  // Test mode functions (developer only)
  switchToContributor: () => void;
  switchToApprover: () => void;
  switchToAdmin: () => void;
  isTestMode: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<CurrentUserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTestMode, setIsTestMode] = useState(false);

  const fetchUser = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const userInfo = await userApi.getCurrentUserInfo();
      setUser(userInfo);

      logInfo("User context updated", {
        userId: userInfo.user.Id,
        userName: userInfo.user.Title,
        isAdmin: userInfo.isAdmin,
        isApprover: userInfo.isApprover,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load user information";
      setError(errorMessage);
      logError("Failed to fetch user in context", err);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    await fetchUser();
  };

  const hasPermission = (
    permission: keyof CurrentUserInfo["permissions"],
  ): boolean => {
    return user?.permissions[permission] || false;
  };

  // Test mode functions (developer only)
  const switchToContributor = () => {
    if (!user) return;
    setIsTestMode(true);
    const testUser: CurrentUserInfo = {
      ...user,
      isContributor: true,
      isApprover: false,
      isAdmin: false,
      role: "Contributor",
    };
    setUser(testUser);
    console.log("🔧 [TEST MODE] Switched to Contributor role");
  };

  const switchToApprover = () => {
    if (!user) return;
    setIsTestMode(true);
    const testUser: CurrentUserInfo = {
      ...user,
      isContributor: true,
      isApprover: true,
      isAdmin: false,
      role: "Approver",
    };
    setUser(testUser);
    console.log("🔧 [TEST MODE] Switched to Approver role");
  };

  const switchToAdmin = () => {
    if (!user) return;
    setIsTestMode(true);
    const testUser: CurrentUserInfo = {
      ...user,
      isContributor: true,
      isApprover: true,
      isAdmin: true,
      role: "Administrator",
    };
    setUser(testUser);
    console.log("🔧 [TEST MODE] Switched to Administrator role");
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const value: UserContextType = {
    user,
    isLoading,
    error,
    refreshUser,
    hasPermission,
    isApprover: user?.isApprover || false,
    isAdmin: user?.isAdmin || false,
    isContributor: user?.isContributor || false,
    switchToContributor,
    switchToApprover,
    switchToAdmin,
    isTestMode,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

// Helper hook for user display data
export const useUserDisplay = () => {
  const { user, isLoading } = useUser();

  if (!user || isLoading) {
    return {
      id: "",
      name: "Loading...",
      email: "",
      avatar: undefined,
      role: "",
      department: "",
      initials: "??",
    };
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return {
    id: user.user.Id.toString(),
    name: user.user.Title,
    email: user.user.Email || "",
    avatar: undefined, // SharePoint doesn't provide avatar URLs by default
    role: user.role || "User",
    department: user.department,
    initials: getInitials(user.user.Title),
  };
};
