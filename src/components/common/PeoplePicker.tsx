// People Picker Component - SharePoint-style search and select
// src/components/common/PeoplePicker.tsx

import React, { useState, useEffect, useRef, useCallback } from "react";
import { sharePointApi } from "../../utils/secureApi";
import { logInfo, logError } from "../../utils/logger";
import styles from "./PeoplePicker.module.css";

interface SharePointUser {
  Id: number;
  Title: string;
  Email: string;
  LoginName?: string;
}

// Response from ClientPeoplePickerSearchUser
interface PeoplePickerResult {
  Key: string; // Login name
  DisplayText: string; // Display name
  EntityData: {
    Email?: string;
    Title?: string;
    SPUserID?: string;
    Department?: string;
  };
  IsResolved: boolean;
  Description?: string; // Often contains email or job title
}

interface SelectedUser {
  id: number;
  name: string;
  email: string;
}

interface PeoplePickerProps {
  id: string;
  label: string;
  value?: SelectedUser | null; // For backward compatibility
  selectedUsers?: SelectedUser[]; // For multiple selection
  onChange?: (user: SelectedUser | null) => void; // For backward compatibility
  onSelectionChange?: (users: SelectedUser[]) => void; // For multiple selection
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  multiple?: boolean;
}

const PeoplePicker: React.FC<PeoplePickerProps> = ({
  id,
  label,
  value,
  selectedUsers = [],
  onChange,
  onSelectionChange,
  placeholder = "Search for a person...",
  disabled = false,
  required = false,
  className = "",
  multiple = false,
}) => {
  // Use the appropriate value based on mode
  const currentUsers = multiple ? selectedUsers : (value ? [value] : []);
  const isMultiple = multiple;
  const [searchText, setSearchText] = useState("");
  const [suggestions, setSuggestions] = useState<PeoplePickerResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search users using SharePoint's site users API (more reliable than People Picker API)
  const searchUsers = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      logInfo(`[PeoplePicker] Searching site users for: ${query}`);

      // Use site users API - more reliable than ClientPeoplePickerSearchUser
      const endpoint =
        "/_api/web/siteusers" +
        "?$select=Id,Title,Email,LoginName" +
        "&$filter=PrincipalType eq 1" +
        "&$orderby=Title asc" +
        "&$top=100";

      const response = await sharePointApi.get(endpoint);

      if (
        response &&
        response.d &&
        response.d.results
      ) {
        logInfo(`[PeoplePicker] Site users API returned ${response.d.results.length} total users`);

        // Client-side filter and convert to PeoplePickerResult format
        const queryLower = query.toLowerCase();
        const users = response.d.results
          .filter(
            (user: SharePointUser) =>
              user.Title &&
              !user.Title.includes("NT AUTHORITY") &&
              !user.Title.includes("System Account") &&
              user.Title !== "Everyone" &&
              (user.Title.toLowerCase().includes(queryLower) ||
                (user.Email &&
                  user.Email.toLowerCase().includes(queryLower))),
          )
          .slice(0, 15)
          .map(
            (user: SharePointUser): PeoplePickerResult => ({
              Key: user.LoginName || user.Email || user.Title,
              DisplayText: user.Title,
              EntityData: {
                Email: user.Email,
                SPUserID: user.Id.toString(),
              },
              IsResolved: true,
              Description: user.Email,
            }),
          );

        logInfo(`[PeoplePicker] Found ${users.length} matching users`, { users });
        setSuggestions(users);
      } else {
        logInfo(`[PeoplePicker] No valid response from site users API`, { response });
        setSuggestions([]);
      }
    } catch (error) {
      logError("[PeoplePicker] Site users search failed:", error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Resolve a user to get their SharePoint User ID (needed for Person fields)
  const resolveUser = useCallback(
    async (user: PeoplePickerResult): Promise<number | null> => {
      // If we already have the SPUserID from fallback, use it
      if (user.EntityData.SPUserID) {
        return parseInt(user.EntityData.SPUserID);
      }

      try {
        logInfo(`[PeoplePicker] Resolving user to get SP ID: ${user.Key}`);

        // Use EnsureUser to get/create the user in the site and get their ID
        const endpoint = "/_api/web/ensureuser";
        const response = await sharePointApi.post(endpoint, {
          logonName: user.Key,
        });

        if (
          response &&
          response.data &&
          response.data.d &&
          response.data.d.Id
        ) {
          logInfo(`[PeoplePicker] Resolved user ID: ${response.data.d.Id}`);
          return response.data.d.Id;
        }
      } catch (error) {
        logError("[PeoplePicker] Failed to resolve user:", error);
      }

      return null;
    },
    [],
  );

  // Handle search input change with debounce
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchText(query);
    setShowSuggestions(true);
    setHighlightedIndex(-1);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce search
    searchTimeoutRef.current = setTimeout(() => {
      searchUsers(query);
    }, 300);
  };

  // Handle user selection - resolve to get SharePoint User ID
  const handleSelectUser = async (user: PeoplePickerResult) => {
    setIsLoading(true);
    setShowSuggestions(false);

    try {
      // Resolve the user to get their SharePoint User ID
      const userId = await resolveUser(user);

      if (userId) {
        const selectedUser: SelectedUser = {
          id: userId,
          name: user.DisplayText,
          email: user.EntityData.Email || user.Description || "",
        };

        if (isMultiple) {
          // Check if user is already selected
          const isAlreadySelected = currentUsers.some(u => u.id === selectedUser.id);
          if (!isAlreadySelected) {
            const newUsers = [...currentUsers, selectedUser];
            onSelectionChange?.(newUsers);
            logInfo(`[PeoplePicker] Added user: ${user.DisplayText} (ID: ${userId})`);
          }
        } else {
          // Single selection mode
          onChange?.(selectedUser);
          logInfo(`[PeoplePicker] Selected user: ${user.DisplayText} (ID: ${userId})`);
        }
      } else {
        logError(`[PeoplePicker] Could not resolve user ID for: ${user.DisplayText}`);
      }
    } catch (error) {
      logError("[PeoplePicker] Error selecting user:", error);
    } finally {
      setSearchText("");
      setSuggestions([]);
      setIsLoading(false);
    }
  };

  // Handle removing selected user
  const handleRemoveUser = (userId: number) => {
    if (isMultiple) {
      const newUsers = currentUsers.filter(u => u.id !== userId);
      onSelectionChange?.(newUsers);
    } else {
      onChange?.(null);
    }
    setSearchText("");
    inputRef.current?.focus();
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev,
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          void handleSelectUser(suggestions[highlightedIndex]);
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  // Handle input focus
  const handleFocus = () => {
    if (searchText.length >= 2) {
      setShowSuggestions(true);
    }
  };

  return (
    <div
      className={`${styles.peoplePickerContainer} ${className}`}
      ref={containerRef}
    >
      <label htmlFor={id} className={styles.label}>
        {label} {required && <span className={styles.required}>*</span>}
      </label>

      <div className={styles.inputWrapper}>
        {/* Selected users chips - show in multiple mode */}
        {isMultiple && currentUsers.length > 0 && (
          <div className={styles.selectedUsersList}>
            {currentUsers.map((user) => (
              <div key={user.id} className={styles.selectedUserChip}>
                <i className="fas fa-user"></i>
                <span className={styles.userName}>{user.name}</span>
                {user.email && (
                  <span className={styles.userEmail}>({user.email})</span>
                )}
                {!disabled && (
                  <button
                    type="button"
                    className={styles.removeButton}
                    onClick={() => handleRemoveUser(user.id)}
                    aria-label={`Remove ${user.name}`}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Selected user chip - show in single mode */}
        {!isMultiple && value && (
          <div className={styles.selectedUser}>
            <i className="fas fa-user"></i>
            <span className={styles.userName}>{value.name}</span>
            {value.email && (
              <span className={styles.userEmail}>({value.email})</span>
            )}
            {!disabled && (
              <button
                type="button"
                className={styles.removeButton}
                onClick={() => handleRemoveUser(value.id)}
                aria-label="Remove selected user"
              >
                <i className="fas fa-times"></i>
              </button>
            )}
          </div>
        )}

        {/* Search input - always show in multiple mode, only show when no user selected in single mode */}
        {isMultiple || !value ? (
          <div className={styles.searchInputContainer}>
            <i className={`fas fa-search ${styles.searchIcon}`}></i>
            <input
              ref={inputRef}
              type="text"
              id={id}
              className={styles.searchInput}
              value={searchText}
              onChange={handleSearchChange}
              onKeyDown={handleKeyDown}
              onFocus={handleFocus}
              placeholder={placeholder}
              disabled={disabled}
              autoComplete="off"
              aria-autocomplete="list"
              aria-controls={`${id}-suggestions`}
              aria-expanded={showSuggestions}
            />
            {isLoading && (
              <i className={`fas fa-spinner fa-spin ${styles.loadingIcon}`}></i>
            )}
          </div>
        ) : null}

        {/* Suggestions dropdown */}
        {showSuggestions && (
          <ul
            id={`${id}-suggestions`}
            className={styles.suggestions}
            role="listbox"
          >
            {isLoading ? (
              <li className={styles.loadingItem}>
                <i className="fas fa-spinner fa-spin"></i> Searching...
              </li>
            ) : suggestions.length > 0 ? (
              suggestions.map((user, index) => (
                <li
                  key={user.Key}
                  className={`${styles.suggestionItem} ${
                    index === highlightedIndex ? styles.highlighted : ""
                  }`}
                  onClick={() => void handleSelectUser(user)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  role="option"
                  aria-selected={index === highlightedIndex}
                >
                  <div className={styles.userAvatar}>
                    <i className="fas fa-user"></i>
                  </div>
                  <div className={styles.userInfo}>
                    <span className={styles.suggestionName}>
                      {user.DisplayText}
                    </span>
                    {(user.EntityData.Email || user.Description) && (
                      <span className={styles.suggestionEmail}>
                        {user.EntityData.Email || user.Description}
                      </span>
                    )}
                  </div>
                </li>
              ))
            ) : searchText.length >= 2 ? (
              <li className={styles.noResults}>
                <i className="fas fa-user-slash"></i> No users found
              </li>
            ) : (
              <li className={styles.hint}>
                <i className="fas fa-info-circle"></i> Type at least 2
                characters to search
              </li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
};

export default PeoplePicker;
