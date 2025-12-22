import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, Eye, Download, User, Calendar, FileText, Paperclip } from "lucide-react";
import { useIdeaData } from "../contexts/DataContext";
import { useUser } from "../contexts/UserContext";
import { useToast } from "../components/common/Toast";
import styles from "./ApproverDashboard.module.css";

interface Idea {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  createdBy: string;
  created: string;
  modified: string;
  attachments?: Array<{
    fileName: string;
    serverRelativeUrl: string;
  }>;
}

const ApproverDashboard: React.FC = () => {
  const { data, loading, updateIdeaStatus } = useIdeaData();
  const { user } = useUser();
  const { addToast } = useToast();
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [animatingCard, setAnimatingCard] = useState<string | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [lastAction, setLastAction] = useState<{
    ideaId: string;
    action: 'approve' | 'reject';
    originalStatus: string;
    timestamp: Date;
    ideaTitle: string;
  } | null>(() => {
    // Load lastAction from localStorage on component mount
    try {
      const saved = localStorage.getItem('approverDashboard_lastAction');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Only restore if it's from the last 5 minutes
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        if (new Date(parsed.timestamp) > fiveMinutesAgo) {
          return {
            ...parsed,
            timestamp: new Date(parsed.timestamp)
          };
        }
      }
    } catch (error) {
      console.warn('Failed to load lastAction from localStorage:', error);
    }
    return null;
  });

  // Keyboard shortcut for undo (Ctrl+Z)
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'z' && lastAction) {
        event.preventDefault();
        handleUndo();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [lastAction]);
  const pendingIdeas = useMemo(() => {
    if (!data?.ideas || !Array.isArray(data.ideas)) return [];

    const filtered = data.ideas
      .filter((idea: any) => idea.status === "Pending Approval" || idea.Status === "Pending Approval");

    return filtered
      .sort((a: any, b: any) => new Date(a.created || a.Created).getTime() - new Date(b.created || b.Created).getTime())
      .map((idea: any) => ({
        id: idea.id || idea.ID,
        title: idea.title || idea.Title,
        description: idea.description || idea.Description,
        status: idea.status || idea.Status,
        priority: idea.priority || idea.Priority,
        category: idea.category || idea.Category,
        createdBy: idea.createdBy || idea.Author?.Title || idea.CreatedBy,
        created: idea.created || idea.Created,
        modified: idea.modified || idea.Modified,
        attachments: idea.attachments || []
      }));
  }, [data?.ideas]);

  const handleCardAction = async (idea: Idea, action: 'approve' | 'reject') => {
    if (isProcessingAction) return; // Prevent multiple simultaneous actions

    // Store the original status for undo
    const originalStatus = idea.status;

    // Store last action for undo immediately (before any async operations)
    const actionData = {
      ideaId: idea.id,
      action,
      originalStatus,
      timestamp: new Date(),
      ideaTitle: idea.title
    };
    setLastAction(actionData);

    // Set processing state
    setIsProcessingAction(true);

    // Start animation immediately
    setAnimatingCard(idea.id);

    try {
      // Update status and show toast with undo option
      setTimeout(async () => {
        const newStatus = action === 'approve' ? "Approved" : "Rejected";
        await updateIdeaStatus(parseInt(idea.id), newStatus);

        // Show toast with undo option
        addToast({
          type: action === 'approve' ? 'success' : 'error',
          title: `Idea ${action === 'approve' ? 'Approved' : 'Rejected'}`,
          message: `"${idea.title}" has been ${action === 'approve' ? 'approved' : 'rejected'}`,
          duration: 4000 // Reduced duration since no action button needed
        });

        setAnimatingCard(null);
        setIsProcessingAction(false);
      }, 800); // Match animation duration
    } catch (error) {
      console.error('Error during approval action:', error);
      setIsProcessingAction(false);
      setAnimatingCard(null);
      setLastAction(null); // Clear last action on error

      addToast({
        type: 'error',
        title: 'Action Failed',
        message: `Failed to ${action} "${idea.title}". Please try again.`,
        duration: 5000
      });
    }
  };

  const handleUndo = async () => {
    if (!lastAction) {
      addToast({
        type: 'warning',
        title: 'Nothing to Undo',
        message: 'No recent action to undo.',
        duration: 3000
      });
      return;
    }

    const { ideaId, originalStatus, action, ideaTitle } = lastAction;

    try {
      // Show loading state
      addToast({
        type: 'info',
        title: 'Undoing Action',
        message: `Reverting "${ideaTitle}"...`,
        duration: 2000
      });

      // Revert the status (skip server refresh to prevent overwriting local state)
      await updateIdeaStatus(parseInt(ideaId), originalStatus, true);

      // Show success confirmation
      addToast({
        type: 'success',
        title: 'Action Undone',
        message: `"${ideaTitle}" status reverted to ${originalStatus}.`,
        duration: 4000
      });

      // Clear last action
      setLastAction(null);
    } catch (error) {
      console.error('Error during undo:', error);
      addToast({
        type: 'error',
        title: 'Undo Failed',
        message: `Failed to revert "${ideaTitle}". Please try again.`,
        duration: 5000
      });
    }
  };  const handleExpand = (idea: Idea) => {
    setSelectedIdea(idea);
    setIsExpanded(true);
  };

  const handleClose = () => {
    setIsExpanded(false);
    setSelectedIdea(null);
  };

  const handleApprove = async () => {
    if (!selectedIdea || isProcessingAction) return;
    await handleCardAction(selectedIdea, 'approve');
    handleClose();
  };

  const handleReject = async () => {
    if (!selectedIdea || isProcessingAction) return;
    await handleCardAction(selectedIdea, 'reject');
    handleClose();
  };

  const downloadAttachment = (attachment: any) => {
    // Implement download logic
    window.open(attachment.serverRelativeUrl, '_blank');
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <motion.h1
          className={styles.title}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          Idea Approvals
        </motion.h1>
        <motion.p
          className={styles.subtitle}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Review and approve innovative ideas from your team
        </motion.p>

        {/* Undo Status Indicator */}
        <AnimatePresence>
          {lastAction && (
            <motion.div
              className={styles.undoIndicator}
              initial={{ opacity: 0, scale: 0.8, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <div className={styles.undoInfo}>
                <span className={styles.undoText}>
                  Last action: {lastAction.action === 'approve' ? 'Approved' : 'Rejected'} "{lastAction.ideaTitle}"
                </span>
                <button
                  className={styles.undoButton}
                  onClick={handleUndo}
                  title="Undo last action (Ctrl+Z)"
                >
                  Undo (Ctrl+Z)
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className={styles.statsBar}>
        <motion.div
          className={styles.statItem}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <div className={styles.statNumber}>{pendingIdeas.length}</div>
          <div className={styles.statLabel}>Pending Approvals</div>
        </motion.div>
      </div>

      <div className={styles.mainContent}>
        {loading.ideas ? (
          <motion.div
            className={styles.loadingState}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className={styles.loadingSpinner}></div>
            <p>Loading pending ideas...</p>
          </motion.div>
        ) : pendingIdeas.length === 0 ? (
          <motion.div
            className={styles.emptyState}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <CheckCircle size={64} className={styles.emptyIcon} />
            <h3 className={styles.emptyTitle}>All Caught Up!</h3>
            <p className={styles.emptyMessage}>No pending ideas to review at the moment.</p>
          </motion.div>
        ) : (
          <motion.div className={styles.cardStack} layout>
            {pendingIdeas.map((idea, index) => (
              <div key={`button-container-${idea.id}`} className={styles.cardContainer}>
                {/* Left side reject button */}
                {index === 0 && (
                  <button
                    className={`${styles.sideButton} ${styles.rejectButton}`}
                    onClick={() => handleCardAction(idea, 'reject')}
                    disabled={animatingCard !== null || isProcessingAction}
                  >
                    <XCircle size={24} />
                    <span>Reject</span>
                  </button>
                )}

                <motion.div
                  className={styles.ideaCard}
                  data-animating={animatingCard === idea.id ? "true" : "false"}
                  style={{
                    zIndex: pendingIdeas.length - index,
                  }}
                  initial={{ opacity: 0, y: 50 + index * 8, rotate: 0 }}
                  animate={
                    animatingCard === idea.id && lastAction?.ideaId === idea.id
                      ? lastAction.action === 'approve'
                        ? { opacity: 0, x: 400, rotate: 20, scale: 0.8 }
                        : { opacity: 0, x: -400, rotate: -20, scale: 0.8 }
                      : {
                          opacity: 1,
                          y: index * 8,
                          rotate: index === 0 ? 0 : index * 0.5,
                          x: 0,
                          scale: 1
                        }
                  }
                  transition={{ 
                    duration: animatingCard === idea.id ? 0.8 : 0.6, 
                    delay: animatingCard === idea.id ? 0 : index * 0.1 
                  }}
                  layout={false}
                >

                <div className={styles.cardHeader}>
                  <div className={styles.cardMeta}>
                    <div className={styles.creator}>
                      <User size={14} />
                      <span>{idea.createdBy}</span>
                    </div>
                    <div className={styles.date}>
                      <Calendar size={14} />
                      <span>{new Date(idea.created).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <button
                    className={styles.expandButton}
                    onClick={() => handleExpand(idea)}
                    title="View Details"
                    disabled={animatingCard !== null}
                  >
                    <Eye size={16} />
                  </button>
                </div>

                <div className={styles.cardContent}>
                  <h3 className={styles.cardTitle}>{idea.title}</h3>
                  <p className={styles.cardDescription}>
                    {idea.description.length > 150
                      ? `${idea.description.substring(0, 150)}...`
                      : idea.description
                    }
                  </p>

                  <div className={styles.cardTags}>
                    <span className={`${styles.tag} ${styles.category}`}>{idea.category}</span>
                    <span className={`${styles.tag} ${styles.priority} ${idea.priority === 'Critical' ? styles.priorityCritical : idea.priority === 'High' ? styles.priorityHigh : idea.priority === 'Medium' ? styles.priorityMedium : styles.priorityLow}`}>
                      {idea.priority}
                    </span>
                  </div>

                  {idea.attachments && idea.attachments.length > 0 && (
                    <div className={styles.attachments}>
                      <Paperclip size={14} />
                      <span>{idea.attachments.length} attachment{idea.attachments.length > 1 ? 's' : ''}</span>
                    </div>
                  )}
                </div>
              </motion.div>

                {/* Right side approve button */}
                {index === 0 && (
                  <button
                    className={`${styles.sideButton} ${styles.approveButton}`}
                    onClick={() => handleCardAction(idea, 'approve')}
                    disabled={animatingCard !== null || isProcessingAction}
                  >
                    <CheckCircle size={24} />
                    <span>Approve</span>
                  </button>
                )}
              </div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Expanded Detail Modal */}
      <AnimatePresence>
        {isExpanded && selectedIdea && (
          <motion.div
            className={styles.modalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          >
            <motion.div
              className={styles.modalContent}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>{selectedIdea.title}</h2>
                <button className={styles.closeButton} onClick={handleClose}>
                  ×
                </button>
              </div>

              <div className={styles.modalMeta}>
                <div className={styles.metaItem}>
                  <User size={16} />
                  <span>{selectedIdea.createdBy}</span>
                </div>
                <div className={styles.metaItem}>
                  <Calendar size={16} />
                  <span>{new Date(selectedIdea.created).toLocaleDateString()}</span>
                </div>
                <div className={styles.metaItem}>
                  <span className={`${styles.tag} ${styles.category}`}>{selectedIdea.category}</span>
                </div>
                <div className={styles.metaItem}>
                  <span className={`${styles.tag} ${styles.priority} ${styles[`priority${selectedIdea.priority}`]}`}>
                    {selectedIdea.priority}
                  </span>
                </div>
              </div>

              <div className={styles.modalBody}>
                <div className={styles.description}>
                  <h3>Description</h3>
                  <p>{selectedIdea.description}</p>
                </div>

                {selectedIdea.attachments && selectedIdea.attachments.length > 0 && (
                  <div className={styles.attachments}>
                    <h3>Attachments</h3>
                    <div className={styles.attachmentList}>
                      {selectedIdea.attachments.map((attachment, index) => (
                        <div key={index} className={styles.attachmentItem}>
                          <FileText size={16} />
                          <span>{attachment.fileName}</span>
                          <button
                            className={styles.downloadButton}
                            onClick={() => downloadAttachment(attachment)}
                          >
                            <Download size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className={styles.modalActions} style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
                <button
                  className={`${styles.actionButton} ${styles.reject}`}
                  onClick={handleReject}
                  disabled={isProcessingAction}
                >
                  <XCircle size={18} />
                  {isProcessingAction ? 'Processing...' : 'Reject'}
                </button>
                <button
                  className={`${styles.actionButton} ${styles.approve}`}
                  onClick={handleApprove}
                  disabled={isProcessingAction}
                >
                  <CheckCircle size={18} />
                  {isProcessingAction ? 'Processing...' : 'Approve'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {false && pendingAction && (
          <motion.div
            className={styles.modalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCancelAction}
          >
            <motion.div
              className={styles.confirmationModal}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.confirmationHeader}>
                <h3 style={{ color: '#ffffffff', fontWeight: '600' }}>Confirm {pendingAction.action === 'approve' ? 'Approval' : 'Rejection'}</h3>
              </div>
              <div className={styles.confirmationBody}>
                <p style={{ color: '#f0f0f0ff', fontWeight: '500' }}>Are you sure you want to <strong style={{ color: 'hsla(120, 72%, 70%, 1.00)', fontWeight: '600' }}>{pendingAction.action}</strong> the idea:</p>
                <h4 style={{ color: '#ffffffff', fontWeight: '600' }}>{pendingAction.idea.title}</h4>
                <p style={{ color: '#ffffffff', fontWeight: '400' }}>{pendingAction.idea.description.length > 150 ? `${pendingAction.idea.description.substring(0, 150)}...` : pendingAction.idea.description}</p>
              </div>
              <div className={styles.confirmationActions} style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
                <button
                  className={`${styles.actionButton} ${styles.cancel}`}
                  onClick={handleCancelAction}
                >
                  Cancel
                </button>
                <button
                  className={`${styles.actionButton} ${pendingAction.action === 'approve' ? styles.approve : styles.reject}`}
                  onClick={handleConfirmAction}
                >
                  {pendingAction.action === 'approve' ? 'Approve' : 'Reject'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ApproverDashboard;
