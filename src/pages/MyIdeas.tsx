import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useIdeaData } from "../contexts/DataContext";
import { useUser } from "../contexts/UserContext";
import LoadingSpinner from "../components/common/LoadingSpinner";
import StatusBar from "../components/common/StatusBar";
import { ProcessedIdea } from "../contexts/DataContext";
import styles from "../components/common/MyIdeas.module.css";

const MyIdeas: React.FC = () => {
  const navigate = useNavigate();
  const { data, loading, error, loadIdeas } = useIdeaData();
  const { user, isAdmin, isApprover, isContributor } = useUser();
  const [selectedIdea, setSelectedIdea] = useState<ProcessedIdea | null>(null);

  useEffect(() => {
    // Load ideas data when component mounts
    loadIdeas();
  }, [loadIdeas]);

  useEffect(() => {
    // Load ideas data when component mounts
    loadIdeas();
  }, [loadIdeas]);

  // Filter to show only the current user's ideas
  const myIdeas = useMemo(() => {
    if (!user?.user?.Title) return [];
    return data.ideas.filter(idea => idea.createdBy === user.user.Title);
  }, [data.ideas, user]);

  // Set first idea as selected when ideas load
  useEffect(() => {
    if (myIdeas.length > 0 && !selectedIdea) {
      setSelectedIdea(myIdeas[0]);
    }
  }, [myIdeas, selectedIdea]);

  // Calculate statistics for user's ideas
  const stats = useMemo(() => {
    const totalIdeas = myIdeas.length;
    const pendingIdeas = myIdeas.filter(
      (idea) => idea.status === "Pending Approval",
    ).length;
    const approvedIdeas = myIdeas.filter(
      (idea) => idea.status === "Approved",
    ).length;
    const inProgressIdeas = myIdeas.filter(
      (idea) => idea.status === "In Progress",
    ).length;
    const rejectedIdeas = myIdeas.filter(
      (idea) => idea.status === "Rejected",
    ).length;

    return {
      totalIdeas,
      pendingIdeas,
      approvedIdeas,
      inProgressIdeas,
      rejectedIdeas,
    };
  }, [myIdeas]);

  const handleIdeaClick = (idea: ProcessedIdea) => {
    navigate(`/idea/${idea.id}`);
  };

  if (loading.ideas) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error.ideas) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <StatusBar status="error" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={styles.splitContainer}
    >
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>My Ideas</h1>
        <p className={styles.subtitle}>
          Track and manage all your submitted ideas
        </p>
      </div>

      {/* Statistics Cards */}
      <div className={styles.statsGrid}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={styles.statCard}
        >
          <div className={styles.statIcon}>📝</div>
          <div className={styles.statContent}>
            <h3 className={styles.statNumber}>{stats.totalIdeas}</h3>
            <p className={styles.statLabel}>Total Ideas</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={styles.statCard}
        >
          <div className={styles.statIcon}>⏳</div>
          <div className={styles.statContent}>
            <h3 className={styles.statNumber}>{stats.pendingIdeas}</h3>
            <p className={styles.statLabel}>Pending Approval</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={styles.statCard}
        >
          <div className={styles.statIcon}>✅</div>
          <div className={styles.statContent}>
            <h3 className={styles.statNumber}>{stats.approvedIdeas}</h3>
            <p className={styles.statLabel}>Approved</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className={styles.statCard}
        >
          <div className={styles.statIcon}>⚡</div>
          <div className={styles.statContent}>
            <h3 className={styles.statNumber}>{stats.inProgressIdeas}</h3>
            <p className={styles.statLabel}>In Progress</p>
          </div>
        </motion.div>
      </div>

      {/* Split Screen Layout */}
      <div className={styles.splitLayout}>
        {/* Left Panel - Compact Idea List */}
        <div className={styles.leftPanel}>
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>Your Ideas</h2>
            <button
              onClick={() => navigate("/idea/new")}
              className={styles.submitButton}
            >
              + New Idea
            </button>
          </div>

          {myIdeas.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>💡</div>
              <h3 className={styles.emptyTitle}>No ideas yet</h3>
              <p className={styles.emptyMessage}>
                You haven't submitted any ideas yet. Start by submitting your first idea!
              </p>
              <button
                onClick={() => navigate("/idea/new")}
                className={styles.submitButton}
              >
                Submit Your First Idea
              </button>
            </div>
          ) : (
            <div className={styles.compactCardsList}>
              {myIdeas.map((idea, index) => (
                <motion.div
                  key={idea.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * index }}
                  onClick={() => setSelectedIdea(idea)}
                  className={`${styles.compactCard} ${
                    selectedIdea?.id === idea.id ? styles.compactCardSelected : ''
                  }`}
                >
                  <div className={styles.compactCardHeader}>
                    <h4 className={styles.compactCardTitle}>{idea.title}</h4>
                    <div className={styles.compactStatusBadge}>
                      <span
                        className={`${styles.status} ${
                          idea.status === "Approved"
                            ? styles.statusApproved
                            : idea.status === "Pending Approval"
                              ? styles.statusPending
                              : idea.status === "Rejected"
                                ? styles.statusRejected
                                : idea.status === "In Progress"
                                  ? styles.statusInProgress
                                  : styles.statusDefault
                        }`}
                      >
                        {idea.status}
                      </span>
                    </div>
                  </div>

                  <p className={styles.compactCardDescription}>
                    {idea.description.length > 100
                      ? `${idea.description.substring(0, 100)}...`
                      : idea.description}
                  </p>

                  <div className={styles.compactCardMeta}>
                    <span className={styles.compactCategory}>{idea.category}</span>
                    <span
                      className={`${styles.compactPriority} ${
                        idea.priority === "Critical"
                          ? styles.priorityCritical
                          : idea.priority === "High"
                            ? styles.priorityHigh
                            : idea.priority === "Medium"
                              ? styles.priorityMedium
                              : styles.priorityLow
                      }`}
                    >
                      {idea.priority}
                    </span>
                  </div>

                  <div className={styles.compactCardDate}>
                    {idea.created && !isNaN(idea.created.getTime())
                      ? idea.created.toLocaleDateString()
                      : 'Date unavailable'}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Right Panel - Detailed Idea View */}
        <div className={styles.rightPanel}>
          {selectedIdea ? (
            <div className={styles.detailView}>
              <div className={styles.detailHeader}>
                <div className={styles.detailTitleSection}>
                  <h2 className={styles.detailTitle}>{selectedIdea.title}</h2>
                  <div className={styles.detailStatusBadges}>
                    <span
                      className={`${styles.status} ${
                        selectedIdea.status === "Approved"
                          ? styles.statusApproved
                          : selectedIdea.status === "Pending Approval"
                            ? styles.statusPending
                            : selectedIdea.status === "Rejected"
                              ? styles.statusRejected
                              : selectedIdea.status === "In Progress"
                                ? styles.statusInProgress
                                : styles.statusDefault
                      }`}
                    >
                      {selectedIdea.status}
                    </span>
                    <span
                      className={`${styles.priority} ${
                        selectedIdea.priority === "Critical"
                          ? styles.priorityCritical
                          : selectedIdea.priority === "High"
                            ? styles.priorityHigh
                            : selectedIdea.priority === "Medium"
                              ? styles.priorityMedium
                              : styles.priorityLow
                      }`}
                    >
                      {selectedIdea.priority}
                    </span>
                  </div>
                </div>
              </div>

              <div className={styles.detailContent}>
                <div className={styles.detailSection}>
                  <h3 className={styles.detailSectionTitle}>Description</h3>
                  <p className={styles.detailDescription}>{selectedIdea.description}</p>
                </div>

                <div className={styles.detailSection}>
                  <h3 className={styles.detailSectionTitle}>Details</h3>
                  <div className={styles.detailGrid}>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Category:</span>
                      <span className={styles.detailValue}>{selectedIdea.category}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Priority:</span>
                      <span className={styles.detailValue}>{selectedIdea.priority}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Created:</span>
                      <span className={styles.detailValue}>
                        {selectedIdea.created && !isNaN(selectedIdea.created.getTime())
                          ? selectedIdea.created.toLocaleString()
                          : 'Date unavailable'}
                      </span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Last Modified:</span>
                      <span className={styles.detailValue}>
                        {selectedIdea.modified && !isNaN(selectedIdea.modified.getTime())
                          ? selectedIdea.modified.toLocaleString()
                          : 'Date unavailable'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className={styles.detailSection}>
                  <h3 className={styles.detailSectionTitle}>Idea Trail</h3>
                  <div className={styles.trailContainer}>
                    <div className={styles.trailItem}>
                      <div className={styles.trailIcon}>📝</div>
                      <div className={styles.trailContent}>
                        <h4 className={styles.trailTitle}>Idea Submitted</h4>
                        <p className={styles.trailDescription}>
                          Idea was submitted for review
                        </p>
                        <span className={styles.trailDate}>
                          {selectedIdea.created && !isNaN(selectedIdea.created.getTime())
                            ? selectedIdea.created.toLocaleString()
                            : 'Date unavailable'}
                        </span>
                      </div>
                    </div>

                    {selectedIdea.status !== "Pending Approval" && (
                      <div className={styles.trailItem}>
                        <div className={styles.trailIcon}>
                          {selectedIdea.status === "Approved" ? "✅" :
                           selectedIdea.status === "Rejected" ? "❌" : "⚡"}
                        </div>
                        <div className={styles.trailContent}>
                          <h4 className={styles.trailTitle}>
                            {selectedIdea.status === "Approved" ? "Idea Approved" :
                             selectedIdea.status === "Rejected" ? "Idea Rejected" :
                             "Status Updated"}
                          </h4>
                          <p className={styles.trailDescription}>
                            Idea status changed to "{selectedIdea.status}"
                          </p>
                          <span className={styles.trailDate}>
                            {selectedIdea.modified && !isNaN(selectedIdea.modified.getTime())
                              ? selectedIdea.modified.toLocaleString()
                              : 'Date unavailable'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.noSelection}>
              <div className={styles.noSelectionIcon}>👆</div>
              <h3 className={styles.noSelectionTitle}>Select an Idea</h3>
              <p className={styles.noSelectionMessage}>
                Click on an idea from the list to view its details
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default MyIdeas;