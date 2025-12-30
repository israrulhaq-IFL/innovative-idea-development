// Approved Ideas Page Component
// src/pages/ApprovedIdeasPage.tsx
// Page for admins to view approved ideas and create tasks

import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useUser } from "../contexts/UserContext";
import { useIdeaData } from "../contexts/DataContext";
import LoadingSpinner from "../components/common/LoadingSpinner";
import StatusBar from "../components/common/StatusBar";
import GenericFormPage from "./GenericFormPage";
import TaskCreationModal from "../components/TaskCreationModal";
import { logInfo, logError } from "../utils/logger";
import styles from "../styles/pages/ApprovedIdeasPage.module.css";

interface IdeaCard {
  id: number;
  title: string;
  description: string;
  status: string;
  category: string;
  priority: string;
  createdBy: string;
  createdDate: Date;
  approvedBy?: string;
  approvedDate?: Date;
}

const ApprovedIdeasPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin } = useUser();
  const { data, loading, error } = useIdeaData();
  const [searchTerm, setSearchTerm] = useState("");
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedIdeaForTask, setSelectedIdeaForTask] = useState<{id: number, title: string} | null>(null);

  // Redirect non-admin users
  useEffect(() => {
    if (!isAdmin) {
      navigate("/");
    }
  }, [isAdmin, navigate]);

  // Filter approved ideas
  const approvedIdeas = useMemo(() => {
    return (data.ideas || []).filter(idea => idea.status === "Approved");
  }, [data.ideas]);

  // Filter ideas based on search term
  const filteredIdeas = useMemo(() => {
    if (!searchTerm.trim()) {
      return approvedIdeas;
    }

    const term = searchTerm.toLowerCase();
    return approvedIdeas.filter(idea =>
      idea.title.toLowerCase().includes(term) ||
      idea.description.toLowerCase().includes(term) ||
      (idea.category && idea.category.toLowerCase().includes(term)) ||
      idea.createdBy.toLowerCase().includes(term)
    );
  }, [approvedIdeas, searchTerm]);

  const handleCreateTask = (ideaId: number) => {
    const idea = approvedIdeas.find(i => i.id === ideaId);
    if (idea) {
      setSelectedIdeaForTask({ id: idea.id, title: idea.title });
      setIsTaskModalOpen(true);
    }
  };

  const handleBack = () => {
    navigate("/admin");
  };

  if (!isAdmin) {
    return null; // Will redirect
  }

  if (loading.ideas) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <LoadingSpinner size="lg" message="Loading approved ideas..." />
      </div>
    );
  }

  if (error.ideas) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <StatusBar status="error" message="Failed to load approved ideas. Please try again." />
        </div>
      </div>
    );
  }

  return (
    <>
      <GenericFormPage
      title="Approved Ideas"
      onBack={handleBack}
      showControlPanel={false}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={styles.pageContainer}
      >
        {/* Search Bar */}
        <div className={styles.searchSection}>
          <div className={styles.searchContainer}>
            <i className={`fas fa-search ${styles.searchIcon}`}></i>
            <input
              type="text"
              placeholder="Search approved ideas by title, description, category, or creator..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className={styles.clearButton}
                aria-label="Clear search"
              >
                <i className="fas fa-times"></i>
              </button>
            )}
          </div>
          <div className={styles.resultsCount}>
            {filteredIdeas.length} of {approvedIdeas.length} approved ideas
          </div>
        </div>

        {/* Ideas Grid */}
        <div className={styles.ideasGrid}>
          {filteredIdeas.length > 0 ? (
            filteredIdeas.map((idea) => (
              <motion.div
                key={idea.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className={styles.ideaCard}
              >
                <div className={styles.cardHeader}>
                  <div className={styles.ideaMeta}>
                    <span className={`${styles.statusBadge} ${styles.approved}`}>
                      <i className="fas fa-check-circle"></i>
                      Approved
                    </span>
                    <span className={`${styles.priorityBadge} ${styles[idea.priority.toLowerCase()]}`}>
                      {idea.priority}
                    </span>
                  </div>
                  <div className={styles.category}>
                    {idea.category || "No Category"}
                  </div>
                </div>

                <div className={styles.cardContent}>
                  <h3 className={styles.ideaTitle}>{idea.title}</h3>
                  <p className={styles.ideaDescription}>
                    {idea.description.length > 150
                      ? `${idea.description.substring(0, 150)}...`
                      : idea.description
                    }
                  </p>

                  <div className={styles.ideaDetails}>
                    <div className={styles.detailItem}>
                      <i className="fas fa-user"></i>
                      <span>{idea.createdBy}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <i className="fas fa-calendar"></i>
                      <span>{idea.createdDate.toLocaleDateString()}</span>
                    </div>
                    {idea.approvedBy && (
                      <div className={styles.detailItem}>
                        <i className="fas fa-check"></i>
                        <span>Approved by {idea.approvedBy}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className={styles.cardActions}>
                  <button
                    onClick={() => handleCreateTask(idea.id)}
                    className={styles.createTaskButton}
                  >
                    <i className="fas fa-plus"></i>
                    Add Task
                  </button>
                </div>
              </motion.div>
            ))
          ) : (
            <div className={styles.emptyState}>
              <i className="fas fa-lightbulb"></i>
              <h3>No approved ideas found</h3>
              <p>
                {searchTerm
                  ? "Try adjusting your search terms"
                  : "There are no approved ideas yet. Ideas need to be approved before tasks can be created."
                }
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </GenericFormPage>

    <TaskCreationModal
      isOpen={isTaskModalOpen}
      onClose={() => {
        setIsTaskModalOpen(false);
        setSelectedIdeaForTask(null);
      }}
      preSelectedIdeaId={selectedIdeaForTask?.id.toString()}
      preSelectedIdeaTitle={selectedIdeaForTask?.title}
    />
    </>
  );
};

export default ApprovedIdeasPage;