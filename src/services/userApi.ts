// SharePoint User API Service
// src/services/userApi.ts

import { sharePointApi } from "../utils/secureApi";
import { logError, logInfo } from "../utils/logger";

export interface SharePointUser {
  Id: number;
  Title: string; // Display name
  Name: string; // Login name (domain\username)
  Email: string;
  IsSiteAdmin: boolean;
  UserId: {
    NameId: string;
    NameIdIssuer: string;
  };
}

export interface UserGroups {
  Id: number;
  Title: string;
  Description: string;
  OwnerTitle: string;
}

export interface UserPermissions {
  hasFullControl: boolean;
  hasDesign: boolean;
  hasEdit: boolean;
  hasContribute: boolean;
  hasRead: boolean;
  hasLimitedAccess: boolean;
  hasViewOnly: boolean;
}

export interface CurrentUserInfo {
  user: SharePointUser;
  groups: UserGroups[];
  permissions: UserPermissions;
  isApprover: boolean;
  isAdmin: boolean;
  isContributor: boolean;
  department?: string;
  role?: string;
}

// User API Service Class
export class UserApiService {
  // Get current user information
  async getCurrentUser(): Promise<SharePointUser> {
    try {
      const endpoint = "/_api/web/currentuser";
      const response = await sharePointApi.get<any>(endpoint);

      logInfo("Current user fetched", {
        userId: response.d.Id,
        userName: response.d.Title,
      });
      return response.d;
    } catch (error) {
      logError("Failed to fetch current user", error);
      throw error;
    }
  }

  // Get user's groups - try multiple approaches
  async getUserGroups(userId?: number): Promise<UserGroups[]> {
    try {
      // First try the standard approach
      const endpoint = userId
        ? `/_api/web/GetUserById(${userId})/Groups`
        : "/_api/web/currentuser/Groups";

      const response = await sharePointApi.get<any>(endpoint);
      const groups = response.d.results || [];

      if (groups.length > 0) {
        logInfo("User groups fetched via standard API", { groupCount: groups.length });
        return groups;
      }

      // If no groups returned, try alternative approach
      // Get current user login name first
      const currentUser = await this.getCurrentUser();
      const userLoginName = currentUser.Name;

      // Check if user is in specific groups by trying to access group info
      const knownGroups = [
        "Innovative Ideas - Contributors",
        "Innovative Ideas - Approvers",
        "Innovative Ideas - Administrators"
      ];

      const alternativeGroups: UserGroups[] = [];

      for (const groupName of knownGroups) {
        try {
          const groupEndpoint = `/_api/web/sitegroups/getbyname('${encodeURIComponent(groupName)}')/Users/getbyloginname('${encodeURIComponent(userLoginName)}')`;
          await sharePointApi.get<any>(groupEndpoint);
          // If we get here without error, user is in the group
          alternativeGroups.push({
            Id: 0, // We don't have the actual ID
            Title: groupName,
            Description: `App group: ${groupName}`,
            OwnerTitle: "System"
          });
          logInfo(`User confirmed in group: ${groupName}`);
        } catch (error) {
          // User is not in this group, continue
          logInfo(`User not in group: ${groupName}`);
        }
      }

      logInfo("User groups fetched via alternative method", { groupCount: alternativeGroups.length });
      return alternativeGroups;

    } catch (error) {
      logError("Failed to fetch user groups", error);
      // Return empty array as fallback
      return [];
    }
  }

  // Check if user has specific permissions
  async getUserPermissions(): Promise<UserPermissions> {
    try {
      const endpoint = "/_api/web/effectiveBasePermissions";
      const response = await sharePointApi.get<any>(endpoint);

      const permissions = response.d;

      // Parse SharePoint permission masks
      const hasFullControl = (permissions.High & 2147483647) === 2147483647;
      const hasDesign = (permissions.High & 32) !== 0;
      const hasEdit = (permissions.High & 8) !== 0;
      const hasContribute = (permissions.High & 4) !== 0;
      const hasRead = (permissions.High & 1) !== 0;
      const hasLimitedAccess = (permissions.Low & 1) !== 0;
      const hasViewOnly = (permissions.Low & 2) !== 0;

      const userPermissions: UserPermissions = {
        hasFullControl,
        hasDesign,
        hasEdit,
        hasContribute,
        hasRead,
        hasLimitedAccess,
        hasViewOnly,
      };

      logInfo("User permissions checked", userPermissions);
      return userPermissions;
    } catch (error) {
      logError("Failed to check user permissions", error);
      throw error;
    }
  }

  // Get complete user information including groups and permissions
  async getCurrentUserInfo(): Promise<CurrentUserInfo> {
    try {
      const [user, groups, permissions] = await Promise.all([
        this.getCurrentUser(),
        this.getUserGroups().catch(() => []), // Fallback to empty array if groups can't be fetched
        this.getUserPermissions(),
      ]);

      // Determine user role based on SharePoint groups
      const isAdmin =
        groups.some(
          (group) => group.Title === "Innovative Ideas - Administrators",
        ) ||
        user.IsSiteAdmin ||
        permissions.hasFullControl;

      const isApprover =
        groups.some(
          (group) => group.Title === "Innovative Ideas - Approvers",
        ) || isAdmin; // Admins are also approvers

      // All authenticated users are contributors - they can submit ideas
      // Only admin/approver roles are restricted to specific groups
      const isContributor = true; // All authenticated users can contribute ideas

      // Log group information for debugging admin/approver roles
      const adminGroups = groups.filter(
        (group) => group.Title === "Innovative Ideas - Administrators"
      );
      const approverGroups = groups.filter(
        (group) => group.Title === "Innovative Ideas - Approvers"
      );
      logInfo("Role assignment check", {
        foundAdminGroups: adminGroups.map(g => g.Title),
        foundApproverGroups: approverGroups.map(g => g.Title),
        isAdmin,
        isApprover,
        isContributor: true, // Always true for authenticated users
        totalGroups: groups.length
      });

      // Extract department/role from groups if available (exclude app-specific groups)
      const departmentGroup = groups.find(
        (group) =>
          !group.Title.includes("Innovative Ideas") && // Exclude app-specific groups
          (group.Title.toLowerCase().includes("department") ||
          group.Title.toLowerCase().includes("team") ||
          group.Title.toLowerCase().includes("division") ||
          group.Title.toLowerCase().includes("unit")),
      );

      const roleGroup = groups.find(
        (group) =>
          group.Title.toLowerCase().includes("role") ||
          group.Title.toLowerCase().includes("position"),
      );

      const userInfo: CurrentUserInfo = {
        user,
        groups,
        permissions,
        isApprover,
        isAdmin,
        isContributor,
        department: departmentGroup?.Title,
        role: isAdmin
          ? "Administrator"
          : isApprover
            ? "Approver"
            : isContributor
              ? "Contributor"
              : "User",
      };

      logInfo("Complete user info fetched", {
        userId: user.Id,
        userName: user.Title,
        isAdmin,
        isApprover,
        groupCount: groups.length,
      });

      return userInfo;
    } catch (error) {
      logError("Failed to get complete user info", error);
      throw error;
    }
  }

  // Check if user is in specific group
  async isUserInGroup(groupName: string): Promise<boolean> {
    try {
      const groups = await this.getUserGroups();
      return groups.some((group) =>
        group.Title.toLowerCase().includes(groupName.toLowerCase()),
      );
    } catch (error) {
      logError(`Failed to check if user is in group: ${groupName}`, error);
      return false;
    }
  }
}

// Export singleton instance
export const userApi = new UserApiService();
