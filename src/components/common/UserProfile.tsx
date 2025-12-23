import React, { useState, useRef, useEffect } from "react";
import {
  User,
  Settings,
  LogOut,
  ChevronDown,
  Shield,
  Users,
} from "lucide-react";
import { useUser, useUserDisplay } from "../../contexts/UserContext";
import styles from "./UserProfile.module.css";

interface UserProfileProps {
  onLogout?: () => void;
  onSettings?: () => void;
  className?: string;
  isCompact?: boolean;
}

const UserProfile: React.FC<UserProfileProps> = ({
  onLogout,
  onSettings,
  className = "",
  isCompact = false,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, isLoading, error, isAdmin, isApprover, isContributor } =
    useUser();
  const userDisplay = useUserDisplay();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    setIsDropdownOpen(false);
    onLogout?.();
  };

  const handleSettings = () => {
    setIsDropdownOpen(false);
    onSettings?.();
  };

  if (isLoading) {
    return (
      <div className={`${styles.userProfile} ${className}`}>
        <div className={styles.userProfileButton}>
          <div className={`${styles.userProfileAvatar} ${styles.loading}`}>
            <div className={styles.loadingSpinner}></div>
          </div>
          <div className={styles.userProfileInfo}>
            <span className={styles.userProfileName}>Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${styles.userProfile} ${className}`}>
        <div className={styles.userProfileButton}>
          <div className={`${styles.userProfileAvatar} ${styles.error}`}>
            <User size={16} />
          </div>
          <div className={styles.userProfileInfo}>
            <span className={styles.userProfileName}>Error</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.userProfile} ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className={`${styles.userProfileButton} ${isCompact ? styles.compact : ""}`}
        aria-label="User profile menu"
      >
        {!isCompact && (
          <div className={styles.userProfileAvatar}>
            {userDisplay.avatar ? (
              <img src={userDisplay.avatar} alt={`${userDisplay.name} avatar`} />
            ) : (
              userDisplay.initials
            )}
          </div>
        )}
        <div className={styles.userProfileInfo}>
          <span className={`${styles.userProfileName} ${isCompact ? styles.compactName : ""}`}>
            {isCompact ? userDisplay.name.split(' ')[0] : userDisplay.name}
          </span>
          {!isCompact && (
            <div className={styles.userProfileBadges}>
              {isAdmin && (
                <span className={`${styles.userBadge} ${styles.adminBadge}`}>
                  <Shield size={10} />
                  Admin
                </span>
              )}
              {isApprover && !isAdmin && (
                <span className={`${styles.userBadge} ${styles.approverBadge}`}>
                  <Users size={10} />
                  Approver
                </span>
              )}
              {isContributor && !isAdmin && !isApprover && (
                <span
                  className={`${styles.userBadge} ${styles.contributorBadge}`}
                >
                  <User size={10} />
                  Contributor
                </span>
              )}
              {userDisplay.role && !isAdmin && !isApprover && !isContributor && (
                <span className={`${styles.userBadge} ${styles.roleBadge}`}>
                  {userDisplay.role}
                </span>
              )}
            </div>
          )}
        </div>
        {!isCompact && (
          <ChevronDown
            size={14}
            className={`${styles.userProfileChevron} ${isDropdownOpen ? "rotate-180" : ""}`}
          />
        )}
      </button>

      {isDropdownOpen && (
        <div className={styles.userProfileDropdown}>
          <div className={styles.userProfileHeader}>
            <div className={styles.userProfileHeaderContent}>
              <div className={styles.userProfileHeaderAvatar}>
                {userDisplay.avatar ? (
                  <img
                    src={userDisplay.avatar}
                    alt={`${userDisplay.name} avatar`}
                  />
                ) : (
                  userDisplay.initials
                )}
              </div>
              <div className={styles.userProfileHeaderInfo}>
                <div className={styles.userProfileHeaderName}>
                  {userDisplay.name}
                </div>
                <div className={styles.userProfileHeaderEmail}>
                  {userDisplay.email}
                </div>
                <div className={styles.userProfileHeaderRole}>
                  {userDisplay.role}
                  {userDisplay.department && ` • ${userDisplay.department}`}
                </div>
                <div className={styles.userPermissions}>
                  {isAdmin && (
                    <span className={styles.permissionBadge}>
                      Site Administrator
                    </span>
                  )}
                  {isApprover && !isAdmin && (
                    <span className={styles.permissionBadge}>Approver</span>
                  )}
                  {isContributor && !isAdmin && !isApprover && (
                    <span className={styles.permissionBadge}>Contributor</span>
                  )}
                  {user?.groups && user.groups.length > 0 && (
                    <span className={styles.groupCount}>
                      {user.groups.length} group
                      {user.groups.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className={styles.userProfileMenu}>
            <button
              onClick={handleSettings}
              className={styles.userProfileMenuItem}
            >
              <Settings size={16} className={styles.userProfileMenuIcon} />
              <span>Settings</span>
            </button>

            <button
              onClick={handleLogout}
              className={`${styles.userProfileMenuItem} ${styles.danger}`}
            >
              <LogOut size={16} className={styles.userProfileMenuIcon} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
