import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { useIdeaData, ProcessedIdea } from "../contexts/DataContext";
import { useUser } from "../contexts/UserContext";
import LoadingSpinner from "../components/common/LoadingSpinner";
import StatusBar from "../components/common/StatusBar";
import IdeaTrailModal from './IdeaTrailModal';
import styles from '../components/common/IdeaDetail.module.css';

const IdeaDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, loading, error, loadIdeas, loadIdeaTrailEvents } = useIdeaData();
  const { user } = useUser();
  const [idea, setIdea] = useState<ProcessedIdea | null>(null);
  const [isTrailModalOpen, setIsTrailModalOpen] = useState(false);
  const trailLoadedRef = useRef(false);
  const ideasLoadedRef = useRef(false);

  // Get ideas from data safely
  const ideas = data?.ideas || [];

  // Load ideas if not already loaded
  useEffect(() => {
    if (!ideasLoadedRef.current && ideas.length === 0 && !loading.ideas) {
      ideasLoadedRef.current = true;
      loadIdeas();
    }
  }, [ideas.length, loading.ideas, loadIdeas]);

  useEffect(() => {
    // Only process after loading is complete
    if (loading.ideas) return;
    
    if (ideas.length > 0 && id) {
      const foundIdea = ideas.find((i) => i.id.toString() === id);
      if (foundIdea) {
        // Convert plain Idea to ProcessedIdea
        const processedIdea: ProcessedIdea = {
          id: foundIdea.id,
          title: foundIdea.title,
          description: foundIdea.description,
          // Map status "Pending" to "Pending Approval" if needed
          status: foundIdea.status === 'Pending' ? 'Pending Approval' : foundIdea.status as any,
          category: foundIdea.category,
          priority: foundIdea.priority,
          created: foundIdea.createdDate,
          modified: foundIdea.createdDate, // Fallback as modified date isn't in simple Idea
          createdBy: {
            id: 0, // Placeholder
            name: foundIdea.createdBy,
            email: ''
          },
          approvedBy: foundIdea.approvedBy ? {
            id: 0,
            name: foundIdea.approvedBy
          } : undefined
        };
        setIdea(processedIdea);
      } else {
        // Only navigate away if loading is complete and idea still not found
        setIdea(null);
      }
    } else if (!loading.ideas && id) {
      // Loading complete but no ideas or idea not found
      setIdea(null);
    }
  }, [ideas, id, loading.ideas]);

  useEffect(() => {
    // Load trail events when component mounts - only once
    if (!trailLoadedRef.current) {
      trailLoadedRef.current = true;
      loadIdeaTrailEvents();
    }
  }, []);

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
              onClick={() => navigate('/')}
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
          onClick={() => navigate('/')}
          style={{
            background: '#f3f4f6',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            padding: '8px 16px',
            fontSize: '14px',
            color: '#374151',
            cursor: 'pointer',
            marginBottom: '16px'
          }}
        >
          ← Back to Dashboard
        </button>

        <div className={styles.titleSection}>
          <h1 className={styles.title}>{idea.title}</h1>
          <span className={`${styles.statusBadge} ${
            idea.status === 'Approved' ? styles.statusApproved :
            idea.status === 'Pending Approval' ? styles.statusPending :
            idea.status === 'Rejected' ? styles.statusRejected :
            idea.status === 'In Progress' ? styles.statusInProgress :
            styles.statusCompleted
          }`}>
            {idea.status}
          </span>
        </div>

        <div className={styles.metaGrid}>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Category</span>
            <span className={styles.categoryBadge}>{idea.category}</span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Priority</span>
            <span className={`${styles.priorityBadge} ${
              idea.priority === 'Critical' ? styles.priorityCritical :
              idea.priority === 'High' ? styles.priorityHigh :
              idea.priority === 'Medium' ? styles.priorityMedium :
              styles.priorityLow
            }`}>
              {idea.priority}
            </span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Submitted by</span>
            <span className={styles.metaValue}>{idea.createdBy.name}</span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Date submitted</span>
            <span className={styles.metaValue}>
              {idea.created && !isNaN(idea.created.getTime())
                ? idea.created.toLocaleDateString()
                : "Date unavailable"}
            </span>
          </div>
        </div>
      </div>

      <div className={styles.description}>
        <h2 className={styles.descriptionTitle}>Description</h2>
        <p className={styles.descriptionContent}>{idea.description}</p>
      </div>
      <div className={styles.timelineSection}>
        <div className={styles.timelineTitle}>
          <span className={styles.timelineIcon}>📋</span>
          Idea Trail
          <button
            onClick={() => setIsTrailModalOpen(true)}
            style={{
              marginLeft: 'auto',
              padding: '0.5rem 1rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <span>👁️</span>
            View Full Trail
          </button>
        </div>

        <div className={styles.timeline}>
          <div className={`${styles.timelineItem} ${styles.completed}`}>
            <div className={styles.timelineDot}></div>
            <div className={styles.timelineContent}>
              <div className={styles.timelineHeader}>
                <h3 className={styles.timelineEvent}>Idea Submitted</h3>
                <span className={styles.timelineDate}>
                  {idea.created && !isNaN(idea.created.getTime())
                    ? idea.created.toLocaleDateString()
                    : "Date unavailable"}
                </span>
              </div>
              <p className={styles.timelineDetails}>
                Idea was submitted by {idea.createdBy.name}
              </p>
              <div className={styles.timelineMeta}>
                <div className={styles.timelineUser}>
                  <div className={styles.timelineUserAvatar}>
                    {idea.createdBy.name.charAt(0).toUpperCase()}
                  </div>
                  {idea.createdBy.name}
                </div>
              </div>
            </div>
          </div>

          {idea.status !== 'Pending Approval' && (
            <div className={`${styles.timelineItem} ${
              idea.status === 'Approved' ? styles.completed :
              idea.status === 'Rejected' ? styles.rejected :
              styles.current
            }`}>
              <div className={styles.timelineDot}></div>
              <div className={styles.timelineContent}>
                <div className={styles.timelineHeader}>
                  <h3 className={styles.timelineEvent}>
                    {idea.status === 'Approved' ? 'Idea Approved' :
                     idea.status === 'Rejected' ? 'Idea Rejected' :
                     'Status Updated'}
                  </h3>
                  <span className={styles.timelineDate}>
                    {idea.modified && !isNaN(idea.modified.getTime())
                      ? idea.modified.toLocaleDateString()
                      : "Date unavailable"}
                  </span>
                </div>
                <p className={styles.timelineDetails}>
                  Idea status changed to "{idea.status}"
                </p>
              </div>
            </div>
          )}

          {idea.status === 'In Progress' && (
            <div className={`${styles.timelineItem} ${styles.current}`}>
              <div className={styles.timelineDot}></div>
              <div className={styles.timelineContent}>
                <div className={styles.timelineHeader}>
                  <h3 className={styles.timelineEvent}>Implementation Started</h3>
                  <span className={styles.timelineDate}>
                    {idea.modified && !isNaN(idea.modified.getTime())
                      ? idea.modified.toLocaleDateString()
                      : "Date unavailable"}
                  </span>
                </div>
                <p className={styles.timelineDetails}>
                  Work has begun on implementing this idea
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={styles.actionsSection}>
        <h2 className={styles.actionsTitle}>Actions</h2>
        <div className={styles.actionsGrid}>
          <button
            onClick={() => setIsTrailModalOpen(true)}
            className={`${styles.actionButton} ${styles.actionPrimary}`}
          >
            <span>👁️</span>
            View Full Trail
          </button>
          <button
            onClick={() => navigate('/')}
            className={`${styles.actionButton} ${styles.actionSecondary}`}
          >
            <span>←</span>
            Back to Dashboard
          </button>
        </div>
      </div>

      <IdeaTrailModal
        isOpen={isTrailModalOpen}
        onClose={() => setIsTrailModalOpen(false)}
        idea={idea}
      />
    </motion.div>
  );
};

export default IdeaDetailPage;
