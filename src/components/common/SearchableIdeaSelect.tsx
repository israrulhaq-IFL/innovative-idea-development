// Searchable Idea Select Component
// src/components/common/SearchableIdeaSelect.tsx

import React, { useState, useEffect, useRef, useCallback } from "react";
import { sharePointApi } from "../../utils/secureApi";
import { logInfo, logError } from "../../utils/logger";
import styles from "./SearchableIdeaSelect.module.css";

interface IdeaOption {
  id: number;
  title: string;
  status: string;
  category: string;
  priority: string;
  created: string;
  createdBy: string;
}

interface SearchableIdeaSelectProps {
  id?: string;
  label?: string;
  value?: string;
  onChange?: (ideaId: string, ideaTitle?: string) => void;
  onIdeaSelect?: (idea: IdeaOption) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  preSelectedIdeaId?: string;
  className?: string;
  ideas?: IdeaOption[]; // Optional prop to pass ideas externally
}

const SearchableIdeaSelect: React.FC<SearchableIdeaSelectProps> = ({
  id,
  label,
  value,
  onChange,
  onIdeaSelect,
  placeholder = "Search by title, category, or status...",
  disabled = false,
  required = false,
  preSelectedIdeaId,
  className = "",
  ideas: externalIdeas,
}) => {
  const [searchText, setSearchText] = useState("");
  const [ideas, setIdeas] = useState<IdeaOption[]>([]);
  const [filteredIdeas, setFilteredIdeas] = useState<IdeaOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [selectedIdea, setSelectedIdea] = useState<IdeaOption | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load ideas on mount or when external ideas change
  useEffect(() => {
    if (externalIdeas && externalIdeas.length > 0) {
      // Use external ideas if provided
      setIdeas(externalIdeas);
      logInfo(`[SearchableIdeaSelect] Using ${externalIdeas.length} external ideas`);
    } else {
      // Load ideas from SharePoint if no external ideas provided
      loadIdeas();
    }
  }, [externalIdeas]);

  // Load pre-selected idea if provided
  useEffect(() => {
    if (preSelectedIdeaId && !selectedIdea) {
      loadPreSelectedIdea(preSelectedIdeaId);
    }
  }, [preSelectedIdeaId, selectedIdea]);

  // Update selected idea when value changes
  useEffect(() => {
    if (value && ideas.length > 0) {
      const idea = ideas.find((i) => i.id.toString() === value);
      setSelectedIdea(idea || null);
    } else {
      setSelectedIdea(null);
    }
  }, [value, ideas]);

  // Filter ideas based on search text
  useEffect(() => {
    if (searchText.length === 0) {
      setFilteredIdeas(ideas.slice(0, 10)); // Show first 10
    } else {
      const filtered = ideas.filter(
        (idea) =>
          idea.title.toLowerCase().includes(searchText.toLowerCase()) ||
          (idea.category && idea.category.toLowerCase().includes(searchText.toLowerCase())) ||
          (idea.priority && idea.priority.toLowerCase().includes(searchText.toLowerCase())) ||
          idea.status.toLowerCase().includes(searchText.toLowerCase()) ||
          idea.createdBy.toLowerCase().includes(searchText.toLowerCase()),
      );
      setFilteredIdeas(filtered.slice(0, 20)); // Limit to 20 results
    }
    setHighlightedIndex(-1);
  }, [searchText, ideas]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadIdeas = async () => {
    setIsLoading(true);
    try {
      logInfo("[SearchableIdeaSelect] Loading ideas for search");

      const endpoint =
        "/_api/web/lists/getbytitle('innovative_ideas')/items" +
        "?$select=ID,Title,Status,Category,Priority,Created,Author/Title" +
        "&$expand=Author" +
        "&$orderby=Created desc" +
        "&$top=100";

      const response = await sharePointApi.get(endpoint);

      if (
        response &&
        response.data &&
        response.data.d &&
        response.data.d.results
      ) {
        const loadedIdeas: IdeaOption[] = response.data.d.results.map(
          (item: any) => ({
            id: item.ID,
            title: item.Title,
            status: item.Status,
            category: item.Category,
            priority: item.Priority,
            created: item.Created,
            createdBy: item.Author?.Title || "Unknown",
          }),
        );

        setIdeas(loadedIdeas);
        logInfo(`[SearchableIdeaSelect] Loaded ${loadedIdeas.length} ideas`);
      }
    } catch (error) {
      logError("[SearchableIdeaSelect] Failed to load ideas:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPreSelectedIdea = async (ideaId: string) => {
    try {
      logInfo(`[SearchableIdeaSelect] Loading pre-selected idea: ${ideaId}`);

      const apiClient = new SecureApiClient({
        baseURL: "",
        headers: {
          Accept: "application/json;odata=verbose",
          "Content-Type": "application/json;odata=verbose",
        },
      });

      const endpoint =
        `/_api/web/lists/getbytitle('innovative_ideas')/items(${ideaId})` +
        "?$select=ID,Title,Status,Category,Priority,Created,Author/Title" +
        "&$expand=Author";

      const response = await apiClient.get(endpoint);

      if (response && response.data && response.data.d) {
        const idea: IdeaOption = {
          id: response.data.d.ID,
          title: response.data.d.Title,
          status: response.data.d.Status,
          category: response.data.d.Category,
          priority: response.data.d.Priority,
          created: response.data.d.Created,
          createdBy: response.data.d.Author?.Title || "Unknown",
        };

        setSelectedIdea(idea);
        logInfo(
          `[SearchableIdeaSelect] Loaded pre-selected idea: ${idea.title}`,
        );
      }
    } catch (error) {
      logError(
        "[SearchableIdeaSelect] Failed to load pre-selected idea:",
        error,
      );
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchText(query);
    setShowDropdown(true);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce search
    searchTimeoutRef.current = setTimeout(() => {
      // Filter is handled in useEffect
    }, 300);
  };

  const handleSelectIdea = (idea: IdeaOption) => {
    setSelectedIdea(idea);
    setSearchText("");
    setShowDropdown(false);
    onChange?.(idea.id.toString(), idea.title);
    onIdeaSelect?.(idea);
    logInfo(
      `[SearchableIdeaSelect] Selected idea: ${idea.title} (ID: ${idea.id})`,
    );
  };

  const handleRemoveIdea = () => {
    setSelectedIdea(null);
    setSearchText("");
    onChange("", "");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || filteredIdeas.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredIdeas.length - 1 ? prev + 1 : prev,
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredIdeas.length) {
          handleSelectIdea(filteredIdeas[highlightedIndex]);
        }
        break;
      case "Escape":
        setShowDropdown(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  const handleFocus = () => {
    if (!selectedIdea) {
      setShowDropdown(true);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className={`${styles.container} ${className}`} ref={containerRef}>
      <label htmlFor={id} className={styles.label}>
        {label} {required && <span className={styles.required}>*</span>}
      </label>

      <div className={styles.inputWrapper}>
        {/* Selected idea chip */}
        {selectedIdea && (
          <div className={styles.selectedIdea}>
            <i className="fas fa-lightbulb"></i>
            <div className={styles.ideaInfo}>
              <span className={styles.ideaTitle}>{selectedIdea.title}</span>
              <span className={styles.ideaMeta}>
                {selectedIdea.category || "No Category"} • {selectedIdea.status} •{" "}
                {formatDate(selectedIdea.created)}
              </span>
            </div>
            {!disabled && (
              <button
                type="button"
                className={styles.removeButton}
                onClick={handleRemoveIdea}
                aria-label="Remove selected idea"
              >
                <i className="fas fa-times"></i>
              </button>
            )}
          </div>
        )}

        {/* Search input - only show when no idea selected */}
        {!selectedIdea && (
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
              aria-controls={`${id}-dropdown`}
              aria-expanded={showDropdown}
            />
            {isLoading && (
              <i className={`fas fa-spinner fa-spin ${styles.loadingIcon}`}></i>
            )}
          </div>
        )}

        {/* Dropdown */}
        {showDropdown && !selectedIdea && (
          <div id={`${id}-dropdown`} className={styles.dropdown} role="listbox">
            {isLoading ? (
              <div className={styles.loadingItem}>
                <i className="fas fa-spinner fa-spin"></i> Loading ideas...
              </div>
            ) : filteredIdeas.length > 0 ? (
              filteredIdeas.map((idea, index) => (
                <div
                  key={idea.id}
                  className={`${styles.ideaItem} ${
                    index === highlightedIndex ? styles.highlighted : ""
                  }`}
                  onClick={() => handleSelectIdea(idea)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  role="option"
                  aria-selected={index === highlightedIndex}
                >
                  <div className={styles.ideaIcon}>
                    <i className="fas fa-lightbulb"></i>
                  </div>
                  <div className={styles.ideaDetails}>
                    <span className={styles.ideaTitle}>{idea.title}</span>
                    <span className={styles.ideaMeta}>
                      {idea.category || "No Category"} • {idea.status} • {idea.priority || "No Priority"} •{" "}
                      {formatDate(idea.created)}
                    </span>
                    <span className={styles.ideaAuthor}>
                      by {idea.createdBy}
                    </span>
                  </div>
                </div>
              ))
            ) : searchText.length >= 2 ? (
              <div className={styles.noResults}>
                <i className="fas fa-search"></i> No ideas found
              </div>
            ) : (
              <div className={styles.hint}>
                <i className="fas fa-info-circle"></i> Type at least 2
                characters to search
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchableIdeaSelect;
