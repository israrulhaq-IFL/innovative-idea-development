import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence, PanInfo, useMotionValue, useTransform } from "framer-motion";
import { CheckCircle, XCircle, Eye, Download, User, Calendar, FileText, Paperclip } from "lucide-react";
import { useIdeaData } from "../contexts/DataContext";
import { useUser } from "../contexts/UserContext";
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
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [pendingAction, setPendingAction] = useState<{idea: Idea, action: 'approve' | 'reject'} | null>(null);

  // Motion values for drag tilting
  const dragX = useMotionValue(0);
  const dragRotate = useTransform(dragX, [-300, 300], [-15, 15]);

  // Filter and sort pending ideas by creation date (FIFO - oldest first)
  const pendingIdeas = useMemo(() => {
    if (!data?.ideas || !Array.isArray(data.ideas)) return [];

    const filtered = data.ideas
      .filter((idea: any) => idea.status === "Pending Approval" || idea.Status === "Pending Approval");

    console.log('All ideas:', data.ideas.map(i => ({ id: i.id, status: i.status })));
    console.log('Filtered pending ideas:', filtered.map(i => ({ id: i.id, status: i.status })));

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

  const handleDragStart = (idea: Idea) => {
    console.log('Drag started for idea:', idea.id);
  };

  const handleDragEnd = async (idea: Idea, event: any, info: PanInfo) => {
    console.log('Drag ended for idea:', idea.id, 'Offset:', info.offset, 'Point:', info.point);

    const { offset } = info;
    const swipeThreshold = 40; // Reduced threshold for easier triggering

    console.log('Swipe check - offset.x:', offset.x, 'threshold:', swipeThreshold, 'abs(offset.x) > threshold:', Math.abs(offset.x) > swipeThreshold);

    if (Math.abs(offset.x) > swipeThreshold) {
      if (offset.x > 0) {
        console.log('Swiping right - Approving idea:', idea.id);
        setPendingAction({ idea, action: 'approve' });
      } else {
        console.log('Swiping left - Rejecting idea:', idea.id);
        setPendingAction({ idea, action: 'reject' });
      }
    } else {
      console.log('Swipe not far enough');
    }
  };

  const handleExpand = (idea: Idea) => {
    setSelectedIdea(idea);
    setIsExpanded(true);
  };

  const handleClose = () => {
    setIsExpanded(false);
    setSelectedIdea(null);
  };

  const handleApprove = async () => {
    if (!selectedIdea) return;
    setPendingAction({ idea: selectedIdea, action: 'approve' });
    handleClose();
  };

  const handleReject = async () => {
    if (!selectedIdea) return;
    setPendingAction({ idea: selectedIdea, action: 'reject' });
    handleClose();
  };

  const downloadAttachment = (attachment: any) => {
    // Implement download logic
    window.open(attachment.serverRelativeUrl, '_blank');
  };

  const handleConfirmAction = async () => {
    if (!pendingAction || !updateIdeaStatus) return;
    const { idea, action } = pendingAction;
    await updateIdeaStatus(parseInt(idea.id), action === 'approve' ? "Approved" : "Rejected");
    setPendingAction(null);
  };

  const handleCancelAction = () => {
    setPendingAction(null);
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
              <motion.div
                key={idea.id}
                className={styles.ideaCard}
                style={{
                  x: index === 0 ? dragX : 0,
                  rotate: index === 0 ? dragRotate : index * 0.5,
                  zIndex: pendingIdeas.length - index,
                }}
                drag={index === 0 ? "x" : false}
                dragConstraints={index === 0 ? { left: -300, right: 300 } : false}
                onDragStart={() => handleDragStart(idea)}
                onDragEnd={(event, info) => handleDragEnd(idea, event, info)}
                whileHover={index === 0 ? { scale: 1.02 } : {}}
                whileDrag={index === 0 ? { scale: 1.05 } : {}}
                dragElastic={index === 0 ? 0.2 : 0}
                dragTransition={index === 0 ? { bounceStiffness: 300, bounceDamping: 30 } : {}}
                initial={{ opacity: 0, y: 50 + index * 8 }}
                animate={{ opacity: 1, y: index * 8 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
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
                    <span className={`${styles.tag} ${styles.priority} ${styles[`priority${idea.priority}`]}`}>
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

                <div className={styles.swipeIndicators} style={{ marginTop: '20px' }}>
                  <div className={styles.rejectIndicator}>
                    <XCircle size={24} />
                    <span>Reject</span>
                  </div>
                  <div className={styles.approveIndicator}>
                    <CheckCircle size={24} />
                    <span>Approve</span>
                  </div>
                </div>
              </motion.div>
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

              <div className={styles.modalActions}>
                <button
                  className={`${styles.actionButton} ${styles.reject}`}
                  onClick={handleReject}
                  style={{ marginRight: '20px' }}
                >
                  <XCircle size={18} />
                  Reject
                </button>
                <button
                  className={`${styles.actionButton} ${styles.approve}`}
                  onClick={handleApprove}
                >
                  <CheckCircle size={18} />
                  Approve
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {pendingAction && (
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
                <h3>Confirm {pendingAction.action === 'approve' ? 'Approval' : 'Rejection'}</h3>
              </div>
              <div className={styles.confirmationBody}>
                <p>Are you sure you want to <strong>{pendingAction.action}</strong> the idea:</p>
                <h4>{pendingAction.idea.title}</h4>
                <p>{pendingAction.idea.description.length > 150 ? `${pendingAction.idea.description.substring(0, 150)}...` : pendingAction.idea.description}</p>
              </div>
              <div className={styles.confirmationActions}>
                <button
                  className={`${styles.actionButton} ${styles.cancel}`}
                  onClick={handleCancelAction}
                  style={{ marginRight: '20px' }}
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
