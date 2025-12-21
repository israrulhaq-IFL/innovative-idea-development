import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import { useIdeaData } from "../contexts/DataContext";
import { useUser } from "../contexts/UserContext";
import LoadingSpinner from "../components/common/LoadingSpinner";
import StatusBar from "../components/common/StatusBar";
import { ProcessedIdea } from "../contexts/DataContext";
import styles from "../components/common/IdeaDetail.module.css";

const IdeaDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { ideas, loading, error } = useIdeaData();
  const { user } = useUser();
  const [idea, setIdea] = useState<ProcessedIdea | null>(null);

  useEffect(() => {
    if (ideas.length > 0 && id) {
      const foundIdea = ideas.find(i => i.id.toString() === id);
      if (foundIdea) {
        setIdea(foundIdea);
      } else {
        navigate("/dashboard");
      }
    }
  }, [ideas, id, navigate]);

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

  if (!idea) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-8">
            <p className="text-gray-500">Idea not found.</p>
            <button
              onClick={() => navigate("/dashboard")}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={styles.container}
    >
      <div className={styles.header}>
        <button
          onClick={() => navigate("/dashboard")}
          className={styles.backButton}
        >
          ← Back to Dashboard
        </button>
        <h1 className={styles.title}>{idea.title}</h1>
        <div className={styles.headerMeta}>
          <span className={styles.category}>{idea.category}</span>
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
          <span
            className={`${styles.priority} ${
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
      </div>

      <div className={styles.content}>
        <div className={styles.mainSection}>
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Description</h2>
            <p className={styles.description}>{idea.description}</p>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Details</h2>
            <div className={styles.detailsGrid}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Submitted by:</span>
                <span className={styles.detailValue}>{idea.createdBy.name}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Date submitted:</span>
                <span className={styles.detailValue}>
                  {idea.created && !isNaN(idea.created.getTime())
                    ? idea.created.toLocaleDateString()
                    : 'Date unavailable'}
                </span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Category:</span>
                <span className={styles.detailValue}>{idea.category}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Priority:</span>
                <span className={styles.detailValue}>{idea.priority}</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.trailSection}>
          <h2 className={styles.sectionTitle}>Idea Trail</h2>
          <div className={styles.trailContainer}>
            <div className={styles.trailItem}>
              <div className={styles.trailIcon}>
                <span className={styles.iconSubmitted}>📝</span>
              </div>
              <div className={styles.trailContent}>
                <h3 className={styles.trailTitle}>Idea Submitted</h3>
                <p className={styles.trailDescription}>
                  Idea was submitted by {idea.createdBy.name} on{' '}
                  {idea.created && !isNaN(idea.created.getTime())
                    ? idea.created.toLocaleDateString()
                    : 'unknown date'}
                </p>
                <span className={styles.trailDate}>
                  {idea.created && !isNaN(idea.created.getTime())
                    ? idea.created.toLocaleString()
                    : 'Date unavailable'}
                </span>
              </div>
            </div>

            {idea.status !== "Pending Approval" && (
              <div className={styles.trailItem}>
                <div className={styles.trailIcon}>
                  <span className={styles.iconReviewed}>👁️</span>
                </div>
                <div className={styles.trailContent}>
                  <h3 className={styles.trailTitle}>
                    {idea.status === "Approved" ? "Idea Approved" :
                     idea.status === "Rejected" ? "Idea Rejected" :
                     "Status Updated"}
                  </h3>
                  <p className={styles.trailDescription}>
                    Idea status changed to "{idea.status}"
                  </p>
                  <span className={styles.trailDate}>
                    {idea.modified && !isNaN(idea.modified.getTime())
                      ? idea.modified.toLocaleString()
                      : 'Date unavailable'}
                  </span>
                </div>
              </div>
            )}

            {idea.status === "In Progress" && (
              <div className={styles.trailItem}>
                <div className={styles.trailIcon}>
                  <span className={styles.iconProgress}>⚡</span>
                </div>
                <div className={styles.trailContent}>
                  <h3 className={styles.trailTitle}>Implementation Started</h3>
                  <p className={styles.trailDescription}>
                    Work has begun on implementing this idea
                  </p>
                  <span className={styles.trailDate}>
                    {idea.modified && !isNaN(idea.modified.getTime())
                      ? idea.modified.toLocaleString()
                      : 'Date unavailable'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default IdeaDetailPage;
