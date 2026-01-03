import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useIdeaData , Idea } from "../contexts/DataContext";
import { useUser } from "../contexts/UserContext";
import LoadingSpinner from "../components/common/LoadingSpinner";
import StatusBar from "../components/common/StatusBar";
import { MessageCircle } from 'lucide-react';
import { discussionApi } from '../services/discussionApi';

import IdeaTrailModal from './IdeaTrailModal';
import styles from '../components/common/MyIdeas.module.css';

const MyIdeas: React.FC = () => {
  const navigate = useNavigate();
  const { data, loading, error, loadIdeas, loadIdeaTrailEvents } =
    useIdeaData();
  const { user, isAdmin, isApprover, isContributor } = useUser();
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [isTrailModalOpen, setIsTrailModalOpen] = useState(false);
  const [discussionCount, setDiscussionCount] = useState(0);
  const [loadingDiscussions, setLoadingDiscussions] = useState(false);

  useEffect(() => {
    // Load ideas data and trail events when component mounts
    loadIdeas();
    loadIdeaTrailEvents();
  }, [loadIdeas, loadIdeaTrailEvents]);

  // Filter to show only the current user's ideas
  const myIdeas = useMemo(() => {
    if (!user?.user?.Title) return [];
    return data.ideas.filter((idea) => idea.createdBy === user.user.Title);
  }, [data.ideas, user]);

  // Load discussion count for selected idea
  const loadDiscussionCount = async (ideaId: string) => {
    try {
      setLoadingDiscussions(true);
      const hasDiscussions = await discussionApi.hasIdeaDiscussions(parseInt(ideaId));
      if (hasDiscussions) {
        const messages = await discussionApi.getDiscussionsByIdea(parseInt(ideaId));
        setDiscussionCount(messages.length);
      } else {
        setDiscussionCount(0);
      }
    } catch (error) {
      console.error('Failed to load discussion count:', error);
      setDiscussionCount(0);
    } finally {
      setLoadingDiscussions(false);
    }
  };

  // Set first idea as selected when ideas load
  useEffect(() => {
    if (myIdeas.length > 0 && !selectedIdea) {
      setSelectedIdea(myIdeas[0]);
    }
  }, [myIdeas, selectedIdea]);

  // Load discussion count when selected idea changes
  useEffect(() => {
    if (selectedIdea) {
      loadDiscussionCount(selectedIdea.id);
    }
  }, [selectedIdea?.id]);

  // Calculate statistics for user's ideas
  const stats = useMemo(() => {
    const totalIdeas = myIdeas.length;
    const pendingIdeas = myIdeas.filter(
      (idea) => idea.status === 'Pending Approval',
    ).length;
    const approvedIdeas = myIdeas.filter(
      (idea) => idea.status === 'Approved',
    ).length;
    const inProgressIdeas = myIdeas.filter(
      (idea) => idea.status === 'In Progress',
    ).length;
    const rejectedIdeas = myIdeas.filter(
      (idea) => idea.status === 'Rejected',
    ).length;

    return {
      totalIdeas,
      pendingIdeas,
      approvedIdeas,
      inProgressIdeas,
      rejectedIdeas,
    };
  }, [myIdeas]);

  const handleIdeaClick = (idea: Idea) => {
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
              onClick={() => navigate('/idea/new')}
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
                You haven't submitted any ideas yet. Start by submitting your
                first idea!
              </p>
              <button
                onClick={() => navigate('/idea/new')}
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
                    selectedIdea?.id === idea.id
                      ? styles.compactCardSelected
                      : ""
                  }`}
                >
                  <div className={styles.compactCardHeader}>
                    <h4 className={styles.compactCardTitle}>{idea.title}</h4>
                    {/* HIDDEN: Status badge - Uncomment to enable
                    <div className={styles.compactStatusBadge}>
                      <span
                        className={`${styles.status} ${
                          idea.status === 'Approved'
                            ? styles.statusApproved
                            : idea.status === 'Pending Approval'
                              ? styles.statusPending
                              : idea.status === 'Rejected'
                                ? styles.statusRejected
                                : idea.status === 'In Progress'
                                  ? styles.statusInProgress
                                  : styles.statusDefault
                        }`}
                      >
                        {idea.status}
                      </span>
                    </div>
                    */}
                  </div>

                  <p className={styles.compactCardDescription}>
                    {idea.description.length > 100
                      ? `${idea.description.substring(0, 100)}...`
                      : idea.description}
                  </p>

                  <div className={styles.compactCardMeta}>
                    <span className={styles.compactCategory}>
                      {idea.category}
                    </span>
                    <span
                      className={`${styles.compactPriority} ${
                        idea.priority === 'Critical'
                          ? styles.priorityCritical
                          : idea.priority === 'High'
                            ? styles.priorityHigh
                            : idea.priority === 'Medium'
                              ? styles.priorityMedium
                              : styles.priorityLow
                      }`}
                    >
                      {idea.priority}
                    </span>
                  </div>

                  <div className={styles.compactCardDate}>
                    {idea.createdDate && idea.createdDate instanceof Date && !isNaN(idea.createdDate.getTime())
                      ? idea.createdDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                      : "Date unavailable"}
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
                  {/* HIDDEN: Status and Priority Badges - Uncomment to enable
                  <div className={styles.detailStatusBadges}>
                    <span
                      className={`${styles.status} ${
                        selectedIdea.status === 'Approved'
                          ? styles.statusApproved
                          : selectedIdea.status === 'Pending Approval'
                            ? styles.statusPending
                            : selectedIdea.status === 'Rejected'
                              ? styles.statusRejected
                              : selectedIdea.status === 'In Progress'
                                ? styles.statusInProgress
                                : styles.statusDefault
                      }`}
                    >
                      {selectedIdea.status}
                    </span>
                    <span
                      className={`${styles.priority} ${
                        selectedIdea.priority === 'Critical'
                          ? styles.priorityCritical
                          : selectedIdea.priority === 'High'
                            ? styles.priorityHigh
                            : selectedIdea.priority === 'Medium'
                              ? styles.priorityMedium
                              : styles.priorityLow
                      }`}
                    >
                      {selectedIdea.priority}
                    </span>
                  </div>
                  */}
                </div>
              </div>

              <div className={styles.detailContent}>
                <div className={styles.detailSection}>
                  <h3 className={styles.detailSectionTitle}>Description</h3>
                  <p className={styles.detailDescription}>
                    {selectedIdea.description}
                  </p>
                </div>

                <div className={styles.detailSection}>
                  <h3 className={styles.detailSectionTitle}>Details</h3>
                  <div className={styles.detailGrid}>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Category:</span>
                      <span className={styles.detailValue}>
                        {selectedIdea.category}
                      </span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Priority:</span>
                      <span className={styles.detailValue}>
                        {selectedIdea.priority}
                      </span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Created:</span>
                      <span className={styles.detailValue}>
                        {selectedIdea.createdDate && selectedIdea.createdDate instanceof Date && !isNaN(selectedIdea.createdDate.getTime())
                          ? selectedIdea.createdDate.toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                          : "Date unavailable"}
                      </span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Last Modified:</span>
                      <span className={styles.detailValue}>
                        {selectedIdea.approvedDate && selectedIdea.approvedDate instanceof Date && !isNaN(selectedIdea.approvedDate.getTime())
                          ? selectedIdea.approvedDate.toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                          : "Date unavailable"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Discussion Notification Section */}
                <div className={styles.detailSection}>
                  <h3 className={styles.detailSectionTitle}>Discussions from Approver</h3>
                  {loadingDiscussions ? (
                    <div style={{ padding: '1rem', textAlign: 'center', color: '#6b7280' }}>
                      Loading discussions...
                    </div>
                  ) : discussionCount > 0 ? (
                    <div
                      style={{
                        padding: '1rem',
                        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(124, 58, 237, 0.1) 100%)',
                        border: '2px solid #8b5cf6',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div
                          style={{
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <MessageCircle size={32} style={{ color: '#8b5cf6' }} />
                          <span
                            style={{
                              position: 'absolute',
                              top: '-8px',
                              right: '-8px',
                              background: '#ef4444',
                              color: 'white',
                              fontSize: '0.75rem',
                              fontWeight: 'bold',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              minWidth: '24px',
                              textAlign: 'center',
                              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                            }}
                          >
                            {discussionCount}
                          </span>
                        </div>
                        <div>
                          <h4 style={{ margin: '0 0 0.25rem 0', color: '#7c3aed', fontSize: '1.1rem', fontWeight: '600' }}>
                            {discussionCount} {discussionCount === 1 ? 'Message' : 'Messages'} from Approver
                          </h4>
                          <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>
                            The approver has started a discussion about your idea
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => navigate(`/discussions?ideaId=${selectedIdea.id}`)}
                        style={{
                          padding: '0.75rem 1.5rem',
                          background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '0.95rem',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          transition: 'all 0.3s ease',
                          whiteSpace: 'nowrap',
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.3)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <MessageCircle size={18} />
                        View Discussion
                      </button>
                    </div>
                  ) : (
                    <div
                      style={{
                        padding: '2rem',
                        textAlign: 'center',
                        color: '#9ca3af',
                        background: '#f9fafb',
                        borderRadius: '8px',
                        border: '1px dashed #e5e7eb',
                      }}
                    >
                      <MessageCircle size={48} style={{ color: '#d1d5db', margin: '0 auto 0.5rem' }} />
                      <p style={{ margin: 0, fontSize: '0.95rem' }}>No discussions from approver yet</p>
                    </div>
                  )}
                </div>

                {/* HIDDEN: Idea Trail Section - Uncomment to enable
                <div className={styles.detailSection}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "1rem",
                    }}
                  >
                    <h3 className={styles.detailSectionTitle}>Idea Trail</h3>
                    <button
                      onClick={() => setIsTrailModalOpen(true)}
                      style={{
                        padding: "0.5rem 1rem",
                        background:
                          "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontSize: "0.9rem",
                        fontWeight: "500",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        transition: "all 0.3s ease",
                      }}
                      onMouseOver={(e) =>
                        (e.currentTarget.style.transform = "scale(1.05)")
                      }
                      onMouseOut={(e) =>
                        (e.currentTarget.style.transform = "scale(1)")
                      }
                    >
                      <span>👁️</span>
                      View Full Trail
                    </button>
                  </div>
                  <div className={styles.trailContainer}>
                    <div className={styles.trailItem}>
                      <div className={styles.trailIcon}>📝</div>
                      <div className={styles.trailContent}>
                        <h4 className={styles.trailTitle}>Idea Submitted</h4>
                        <p className={styles.trailDescription}>
                          Idea was submitted for review
                        </p>
                        <span className={styles.trailDate}>
                          {selectedIdea.createdDate &&
                          !isNaN(selectedIdea.createdDate.getTime())
                            ? selectedIdea.createdDate.toLocaleString()
                            : "Date unavailable"}
                        </span>
                      </div>
                    </div>

                    {selectedIdea.status !== 'Pending Approval' && (
                      <div className={styles.trailItem}>
                        <div className={styles.trailIcon}>
                          {selectedIdea.status === 'Approved' ? '✅' :
                           selectedIdea.status === "Rejected"
                              ? "❌"
                              : "⚡"}
                        </div>
                        <div className={styles.trailContent}>
                          <h4 className={styles.trailTitle}>
                            {selectedIdea.status === 'Approved' ? 'Idea Approved' :
                             selectedIdea.status === "Rejected"
                                ? "Idea Rejected"
                                : "Status Updated"}
                          </h4>
                          <p className={styles.trailDescription}>
                            Idea status changed to "{selectedIdea.status}"
                          </p>
                          <span className={styles.trailDate}>
                            {selectedIdea.approvedDate &&
                            !isNaN(selectedIdea.approvedDate.getTime())
                              ? selectedIdea.approvedDate.toLocaleString()
                              : "Date unavailable"}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                */}
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

      <IdeaTrailModal
        isOpen={isTrailModalOpen}
        onClose={() => setIsTrailModalOpen(false)}
        idea={selectedIdea}
      />
    </motion.div>
  );
};

export default MyIdeas;
