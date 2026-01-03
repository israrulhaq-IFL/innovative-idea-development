import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  XCircle,
  Eye,
  Download,
  User,
  Calendar,
  FileText,
  Paperclip,
  List,
  LayoutGrid,
  MessageCircle,
  Send,
  Lock,
  Unlock,
} from 'lucide-react';
import { useIdeaData } from "../contexts/DataContext";
import { useUser } from "../contexts/UserContext";
import { useToast } from "../components/common/Toast";
import { discussionApi, DiscussionMessage } from "../services/discussionApi";
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
  const { data, loading, loadIdeas, updateIdeaStatus } = useIdeaData();
  const { user } = useUser();
  const { addToast } = useToast();
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [animatingCard, setAnimatingCard] = useState<string | null>(null);
  const [isReloading, setIsReloading] = useState(false);
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [pendingIdeas, setPendingIdeas] = useState<Idea[]>([]);
  const [viewMode, setViewMode] = useState<'stack' | 'list'>('stack');
  const [selectedListIdea, setSelectedListIdea] = useState<Idea | null>(null);
  const [showDiscussionPanel, setShowDiscussionPanel] = useState(false);
  const [discussions, setDiscussions] = useState<DiscussionMessage[]>([]);
  const [discussionMessage, setDiscussionMessage] = useState('');
  const [isDiscussionLocked, setIsDiscussionLocked] = useState(false);
  const [discussionExists, setDiscussionExists] = useState(false);
  const [loadingDiscussions, setLoadingDiscussions] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState<{
    fileName: string;
    url: string;
    type: 'image' | 'pdf' | 'other';
  } | null>(null);
  const [lastAction, setLastAction] = useState<{
    ideaId: string;
    action: 'approve' | 'reject';
    originalStatus: string;
    timestamp: Date;
    ideaTitle: string;
    idea: Idea; // Store full idea object for undo
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
            timestamp: new Date(parsed.timestamp),
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

  // Initialize pending ideas from server data and maintain local state
  React.useEffect(() => {
    if (data?.ideas && Array.isArray(data.ideas)) {
      const filtered = data.ideas
        .filter(
          (idea: any) =>
            idea.status === 'Pending Approval' ||
            idea.Status === 'Pending Approval',
        )
        .sort(
          (a: any, b: any) =>
            new Date(a.createdDate || a.created || a.Created).getTime() -
            new Date(b.createdDate || b.created || b.Created).getTime(),
        )
        .map((idea: any) => ({
          id: idea.id || idea.ID,
          title: idea.title || idea.Title,
          description: idea.description || idea.Description,
          status: idea.status || idea.Status,
          priority: idea.priority || idea.Priority,
          category: idea.category || idea.Category,
          createdBy: idea.createdBy || idea.Author?.Title || idea.CreatedBy,
          created: idea.createdDate || idea.created || idea.Created,
          modified: idea.modified || idea.Modified,
          attachments: idea.attachments || [],
        }));

      // Only update if not currently animating to prevent flickering
      if (!animatingCard) {
        setPendingIdeas(filtered);
      }

      // Clear any lingering animation states when data is refreshed (but not during animation)
      if (!animatingCard) {
        setIsProcessingAction(false);
      }
    }
  }, [data?.ideas, animatingCard]);

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
      ideaTitle: idea.title,
      idea, // Store full idea object for undo
    };
    setLastAction(actionData);

    // Set processing state
    setIsProcessingAction(true);

    // Start animation immediately
    setAnimatingCard(idea.id);

    try {
      // Update status and show toast with undo option
      setTimeout(async () => {
        const newStatus = action === 'approve' ? 'Approved' : 'Rejected';
        await updateIdeaStatus(parseInt(idea.id), newStatus, true); // Skip refresh to prevent flickering

        // Immediately remove from local state to prevent reloading/flickering
        setPendingIdeas((prev) => prev.filter((i) => i.id !== idea.id));

        // Show toast with undo option
        addToast({
          type: action === 'approve' ? 'success' : 'error',
          title: `Idea ${action === 'approve' ? 'Approved' : 'Rejected'}`,
          message: `"${idea.title}" has been ${action === 'approve' ? 'approved' : 'rejected'}`,
          duration: 4000, // Reduced duration since no action button needed
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
        duration: 5000,
      });
    }
  };

  const handleUndo = async () => {
    if (!lastAction) {
      addToast({
        type: 'warning',
        title: 'Nothing to Undo',
        message: 'No recent action to undo.',
        duration: 3000,
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
        duration: 2000,
      });

      // Revert the status (skip server refresh to prevent overwriting local state)
      await updateIdeaStatus(parseInt(ideaId), originalStatus, true);

      // If reverting to "Pending Approval", add the idea back to local state
      if (originalStatus === "Pending Approval" && lastAction.idea) {
        setPendingIdeas((prev) => {
          // Check if idea is already in the list (avoid duplicates)
          const exists = prev.some((i) => i.id === ideaId);
          if (!exists) {
            // Add the idea back at the beginning of the list
            return [lastAction.idea, ...prev];
          }
          return prev;
        });
      }

      // Clear animation state for the restored idea
      setAnimatingCard(null);
      setIsProcessingAction(false);

      // Show success confirmation
      addToast({
        type: 'success',
        title: 'Action Undone',
        message: `"${ideaTitle}" status reverted to ${originalStatus}.`,
        duration: 4000,
      });

      // Clear last action
      setLastAction(null);
    } catch (error) {
      console.error('Error during undo:', error);
      addToast({
        type: 'error',
        title: 'Undo Failed',
        message: `Failed to revert "${ideaTitle}". Please try again.`,
        duration: 5000,
      });
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
    if (!selectedIdea || isProcessingAction) return;
    await handleCardAction(selectedIdea, 'approve');
    handleClose();
  };

  const handleReject = async () => {
    if (!selectedIdea || isProcessingAction) return;
    await handleCardAction(selectedIdea, 'reject');
    handleClose();
  };

  const handleReload = async () => {
    if (isReloading) return;
    
    setIsReloading(true);
    try {
      await loadIdeas();
      addToast({
        type: 'success',
        title: 'Refreshed',
        message: 'Approval cards reloaded successfully',
        duration: 3000,
      });
    } catch (error) {
      console.error('Error reloading ideas:', error);
      addToast({
        type: 'error',
        title: 'Reload Failed',
        message: 'Failed to reload approval cards. Please try again.',
        duration: 4000,
      });
    } finally {
      setIsReloading(false);
    }
  };

  const handleAttachmentClick = (attachment: any) => {
    const fileName = attachment.fileName.toLowerCase();
    const fileExtension = fileName.split('.').pop();
    
    // Determine file type
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
    const pdfExtensions = ['pdf'];
    
    if (imageExtensions.includes(fileExtension || '')) {
      // Preview image
      setPreviewAttachment({
        fileName: attachment.fileName,
        url: attachment.serverRelativeUrl,
        type: 'image'
      });
    } else if (pdfExtensions.includes(fileExtension || '')) {
      // Preview PDF inline
      setPreviewAttachment({
        fileName: attachment.fileName,
        url: attachment.serverRelativeUrl,
        type: 'pdf'
      });
    } else {
      // Download other file types
      const link = document.createElement('a');
      link.href = attachment.serverRelativeUrl;
      link.download = attachment.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const closePreview = () => {
    setPreviewAttachment(null);
  };

  // Load discussions for selected idea
  const loadDiscussionsForIdea = async (ideaId: string) => {
    try {
      setLoadingDiscussions(true);
      
      // Check if discussion exists
      const hasDiscussion = await discussionApi.hasIdeaDiscussions(parseInt(ideaId));
      setDiscussionExists(hasDiscussion);
      
      if (hasDiscussion) {
        const messages = await discussionApi.getDiscussionsByIdea(parseInt(ideaId));
        setDiscussions(messages);
        
        // Check lock status
        const locked = await discussionApi.getIdeaDiscussionLockStatus(parseInt(ideaId));
        setIsDiscussionLocked(locked);
      } else {
        setDiscussions([]);
        setIsDiscussionLocked(false);
      }
    } catch (error) {
      console.error('Failed to load discussions:', error);
      addToast({
        type: 'error',
        title: 'Load Failed',
        message: 'Failed to load discussions',
        duration: 3000,
      });
    } finally {
      setLoadingDiscussions(false);
    }
  };

  // Toggle discussion panel
  const handleToggleDiscussion = async () => {
    const idea = viewMode === 'list' ? selectedListIdea : selectedIdea;
    if (!idea) return;

    if (!showDiscussionPanel) {
      await loadDiscussionsForIdea(idea.id);
    }
    setShowDiscussionPanel(!showDiscussionPanel);
  };

  // Create new discussion
  const handleCreateDiscussion = async () => {
    const idea = viewMode === 'list' ? selectedListIdea : selectedIdea;
    if (!idea) return;

    try {
      setSendingMessage(true);
      const ideaId = parseInt(idea.id);
      
      // Create initial discussion with a default message
      await discussionApi.createDiscussionForIdea(
        ideaId,
        `Discussion for: ${idea.title}`,
        'Discussion created by approver',
        false
      );

      // Reload discussions
      await loadDiscussionsForIdea(idea.id);
      
      addToast({
        type: 'success',
        title: 'Discussion Created',
        message: 'You can now start the conversation',
        duration: 3000,
      });
    } catch (error) {
      console.error('Failed to create discussion:', error);
      addToast({
        type: 'error',
        title: 'Creation Failed',
        message: 'Failed to create discussion. Please try again.',
        duration: 4000,
      });
    } finally {
      setSendingMessage(false);
    }
  };

  // Send discussion message
  const handleSendMessage = async () => {
    const idea = viewMode === 'list' ? selectedListIdea : selectedIdea;
    if (!idea || !discussionMessage.trim() || sendingMessage) return;

    try {
      setSendingMessage(true);
      const ideaId = parseInt(idea.id);
      
      // Add reply to existing discussion
      await discussionApi.addReplyToIdeaDiscussion(
        ideaId,
        `Re: ${idea.title}`,
        discussionMessage,
        false
      );

      // Reload discussions
      await loadDiscussionsForIdea(idea.id);
      setDiscussionMessage('');
      
      addToast({
        type: 'success',
        title: 'Message Sent',
        message: 'Your message has been sent',
        duration: 3000,
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      addToast({
        type: 'error',
        title: 'Send Failed',
        message: 'Failed to send message. Please try again.',
        duration: 4000,
      });
    } finally {
      setSendingMessage(false);
    }
  };

  // Toggle discussion lock
  const handleToggleLock = async () => {
    const idea = viewMode === 'list' ? selectedListIdea : selectedIdea;
    if (!idea) return;

    try {
      const newLockStatus = !isDiscussionLocked;
      await discussionApi.updateDiscussionLockStatus(parseInt(idea.id), newLockStatus);
      setIsDiscussionLocked(newLockStatus);
      
      addToast({
        type: 'success',
        title: newLockStatus ? 'Discussion Locked' : 'Discussion Unlocked',
        message: newLockStatus 
          ? 'Discussion has been locked' 
          : 'Discussion has been unlocked',
        duration: 3000,
      });
    } catch (error) {
      console.error('Failed to toggle lock:', error);
      addToast({
        type: 'error',
        title: 'Lock Failed',
        message: 'Failed to change lock status',
        duration: 4000,
      });
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Idea Approvals</h1>
        <p className={styles.subtitle}>
          Review and approve innovative ideas from your team
        </p>
        
        {/* View Toggle Buttons */}
        <div className={styles.viewToggle}>
          <button
            className={`${styles.viewToggleButton} ${viewMode === 'stack' ? styles.active : ''}`}
            onClick={() => setViewMode('stack')}
            title="Stack View"
          >
            <LayoutGrid size={20} />
            <span>Stack View</span>
          </button>
          <button
            className={`${styles.viewToggleButton} ${viewMode === 'list' ? styles.active : ''}`}
            onClick={() => setViewMode('list')}
            title="List View"
          >
            <List size={20} />
            <span>List View</span>
          </button>
        </div>

        <button
          className={styles.reloadButton}
          onClick={handleReload}
          disabled={isReloading || loading.ideas}
          title="Reload approval cards"
        >
          <motion.div
            animate={{ rotate: isReloading ? 360 : 0 }}
            transition={{ duration: 1, repeat: isReloading ? Infinity : 0, ease: "linear" }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
            </svg>
          </motion.div>
          <span>{isReloading ? 'Reloading...' : 'Reload'}</span>
        </button>
      </div>

      {/* Undo Status Indicator - Positioned as overlay */}
      <AnimatePresence>
        {lastAction && (
          <motion.div
            className={styles.undoIndicator}
            initial={{ opacity: 0, scale: 0.8, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className={styles.undoInfo}>
              <span className={styles.undoText}>
                Last action:{' '}
                {lastAction.action === 'approve' ? 'Approved' : 'Rejected'} "
                {lastAction.ideaTitle}"
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

      <div className={styles.statsBar}>
        <div className={styles.statItem}>
          <div className={styles.statNumber}>{pendingIdeas.length}</div>
          <div className={styles.statLabel}>Pending Approvals</div>
        </div>
      </div>

      <div className={styles.mainContent}>
        {loading.ideas ? (
          <div className={styles.loadingState}>
            <div className={styles.loadingSpinner}></div>
            <p>Loading pending ideas...</p>
          </div>
        ) : pendingIdeas.length === 0 ? (
          <div className={styles.emptyState}>
            <CheckCircle size={64} className={styles.emptyIcon} />
            <h3 className={styles.emptyTitle}>All Caught Up!</h3>
            <p className={styles.emptyMessage}>
              No pending ideas to review at the moment.
            </p>
          </div>
        ) : viewMode === 'stack' ? (
          <div className={styles.cardStack}>
            {pendingIdeas.map((idea, index) => (
              <div
                key={`button-container-${idea.id}`}
                className={styles.cardContainer}
              >
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
                  initial={{ opacity: 0, y: 50, scale: 0.9 }}
                  animate={
                    animatingCard === idea.id && lastAction?.ideaId === idea.id
                      ? lastAction.action === 'approve'
                        ? { opacity: 0, x: 400, rotate: 20, scale: 0.8 }
                        : { opacity: 0, x: -400, rotate: -20, scale: 0.8 }
                      : {
                          opacity: 1,
                          x: 0,
                          y: 0,
                          rotate: 0,
                          scale: 1,
                        }
                  }
                  transition={{
                    duration: animatingCard === idea.id ? 0.8 : 0.4,
                    delay: animatingCard === idea.id ? 0 : index * 0.1,
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
                        <span>
                          {new Date(idea.created).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
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
                        : idea.description}
                    </p>

                    <div className={styles.cardTags}>
                      <span className={`${styles.tag} ${styles.category}`}>
                        {idea.category}
                      </span>
                      <span
                        className={`${styles.tag} ${styles.priority} ${idea.priority === 'Critical' ? styles.priorityCritical : idea.priority === 'High' ? styles.priorityHigh : idea.priority === 'Medium' ? styles.priorityMedium : styles.priorityLow}`}
                      >
                        {idea.priority}
                      </span>
                    </div>

                    {idea.attachments && idea.attachments.length > 0 && (
                      <div className={styles.attachments}>
                        <Paperclip size={14} />
                        <span>
                          {idea.attachments.length} attachment
                          {idea.attachments.length > 1 ? 's' : ''}
                        </span>
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
          </div>
        ) : (
          /* List View - Split Screen Layout */
          <div className={styles.splitView}>
            {/* Left Panel - Ideas List */}
            <div className={styles.listPanel}>
              <div className={styles.listHeader}>
                <h3>Pending Ideas ({pendingIdeas.length})</h3>
              </div>
              <div className={styles.ideaList}>
                {pendingIdeas.map((idea) => (
                  <div
                    key={idea.id}
                    className={`${styles.ideaListItem} ${selectedListIdea?.id === idea.id ? styles.active : ''}`}
                    onClick={() => setSelectedListIdea(idea)}
                  >
                    <div className={styles.ideaListItemHeader}>
                      <h4 className={styles.ideaListItemTitle}>{idea.title}</h4>
                      <span className={`${styles.listPriority} ${styles[`priority${idea.priority}`]}`}>
                        {idea.priority}
                      </span>
                    </div>
                    <p className={styles.ideaListItemMeta}>
                      <User size={14} /> {idea.createdBy} • <Calendar size={14} /> {new Date(idea.created).toLocaleDateString()}
                    </p>
                    <p className={styles.ideaListItemDescription}>
                      {idea.description.length > 100 ? `${idea.description.substring(0, 100)}...` : idea.description}
                    </p>
                    <div className={styles.ideaListItemFooter}>
                      <span className={styles.categoryBadge}>{idea.category}</span>
                      {idea.attachments && idea.attachments.length > 0 && (
                        <span className={styles.attachmentBadge}>
                          <Paperclip size={12} /> {idea.attachments.length}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Panel - Detail View */}
            <div className={styles.detailPanel}>
              {selectedListIdea ? (
                <div className={styles.detailContent}>
                  <div className={styles.detailHeader}>
                    <h2>{selectedListIdea.title}</h2>
                    <div className={styles.detailMeta}>
                      <span><User size={16} /> {selectedListIdea.createdBy}</span>
                      <span><Calendar size={16} /> {new Date(selectedListIdea.created).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className={styles.detailBody}>
                    <div className={styles.detailSection}>
                      <h3>Description</h3>
                      <p>{selectedListIdea.description}</p>
                    </div>

                    <div className={styles.detailTags}>
                      <div className={styles.tagGroup}>
                        <label>Category:</label>
                        <span className={styles.tagValue}>{selectedListIdea.category}</span>
                      </div>
                      <div className={styles.tagGroup}>
                        <label>Priority:</label>
                        <span className={`${styles.tagValue} ${styles[`priority${selectedListIdea.priority}`]}`}>
                          {selectedListIdea.priority}
                        </span>
                      </div>
                    </div>

                    {selectedListIdea.attachments && selectedListIdea.attachments.length > 0 && (
                      <div className={styles.detailSection}>
                        <h3>Attachments ({selectedListIdea.attachments.length})</h3>
                        <div className={styles.attachmentList}>
                          {selectedListIdea.attachments.map((attachment, index) => (
                            <div key={index} className={styles.attachmentItem}>
                              <Paperclip size={16} />
                              <span>{attachment.fileName}</span>
                              <button
                                onClick={() => handleAttachmentClick(attachment)}
                                className={styles.attachmentViewButton}
                              >
                                View
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Discussion Panel */}
                    <div className={styles.discussionSection}>
                      {!discussionExists ? (
                        // Show "Create Discussion" button when no discussion exists
                        <button
                          className={styles.createDiscussionButton}
                          onClick={handleCreateDiscussion}
                          disabled={sendingMessage}
                        >
                          <MessageCircle size={20} />
                          <span>{sendingMessage ? 'Creating...' : 'Create Discussion'}</span>
                        </button>
                      ) : (
                        <>
                          <div className={styles.discussionHeader}>
                            <button
                              className={styles.discussionToggle}
                              onClick={handleToggleDiscussion}
                            >
                              <MessageCircle size={20} />
                              <span>Discussion ({discussions.length})</span>
                            </button>
                            {showDiscussionPanel && discussionExists && (
                              <button
                                className={styles.lockButton}
                                onClick={handleToggleLock}
                                title={isDiscussionLocked ? 'Unlock Discussion' : 'Lock Discussion'}
                              >
                                {isDiscussionLocked ? <Lock size={18} /> : <Unlock size={18} />}
                                <span>{isDiscussionLocked ? 'Locked' : 'Unlocked'}</span>
                              </button>
                            )}
                          </div>

                          {showDiscussionPanel && (
                            <div className={styles.discussionPanel}>
                              {loadingDiscussions ? (
                                <div className={styles.discussionLoading}>
                                  <div className={styles.loadingSpinner}></div>
                                  <p>Loading discussion...</p>
                                </div>
                              ) : (
                                <>
                                  <div className={styles.discussionMessages}>
                                    {discussions.map((msg) => (
                                      <div key={msg.id} className={styles.discussionMessage}>
                                        <div className={styles.messageHeader}>
                                          <div className={styles.messageAuthor}>
                                            <User size={14} />
                                            <strong>{msg.author.name}</strong>
                                          </div>
                                          <div className={styles.messageTime}>
                                            {new Date(msg.created).toLocaleString('en-US', {
                                              month: 'short',
                                              day: 'numeric',
                                              hour: '2-digit',
                                              minute: '2-digit'
                                            })}
                                          </div>
                                        </div>
                                        <div 
                                          className={styles.messageBody}
                                          dangerouslySetInnerHTML={{ __html: msg.body }}
                                        />
                                      </div>
                                    ))}
                                  </div>

                                  {!isDiscussionLocked && (
                                    <div className={styles.discussionInput}>
                                      <textarea
                                        className={styles.messageTextarea}
                                        placeholder="Type your message or question..."
                                        value={discussionMessage}
                                        onChange={(e) => setDiscussionMessage(e.target.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendMessage();
                                          }
                                        }}
                                        disabled={sendingMessage}
                                      />
                                      <button
                                        className={styles.sendButton}
                                        onClick={handleSendMessage}
                                        disabled={!discussionMessage.trim() || sendingMessage}
                                      >
                                        <Send size={18} />
                                        <span>{sendingMessage ? 'Sending...' : 'Send'}</span>
                                      </button>
                                    </div>
                                  )}

                                  {isDiscussionLocked && (
                                    <div className={styles.discussionLockedMessage}>
                                      <Lock size={16} />
                                      <span>This discussion has been locked</span>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  <div className={styles.detailActions}>
                    <button
                      className={styles.rejectActionButton}
                      onClick={() => handleCardAction(selectedListIdea, 'reject')}
                      disabled={isProcessingAction}
                    >
                      <XCircle size={20} />
                      Reject
                    </button>
                    <button
                      className={styles.approveActionButton}
                      onClick={() => handleCardAction(selectedListIdea, 'approve')}
                      disabled={isProcessingAction}
                    >
                      <CheckCircle size={20} />
                      Approve
                    </button>
                  </div>
                </div>
              ) : (
                <div className={styles.detailEmpty}>
                  <Eye size={64} />
                  <h3>Select an Idea</h3>
                  <p>Choose an idea from the list to view details and take action</p>
                </div>
              )}
            </div>
          </div>
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
                  <span>
                    {new Date(selectedIdea.created).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                <div className={styles.metaItem}>
                  <span className={`${styles.tag} ${styles.category}`}>
                    {selectedIdea.category}
                  </span>
                </div>
                <div className={styles.metaItem}>
                  <span
                    className={`${styles.tag} ${styles.priority} ${styles[`priority${selectedIdea.priority}`]}`}
                  >
                    {selectedIdea.priority}
                  </span>
                </div>
              </div>

              <div className={styles.modalBody}>
                <div className={styles.description}>
                  <h3>Description</h3>
                  <p>{selectedIdea.description}</p>
                </div>

                {selectedIdea.attachments &&
                  selectedIdea.attachments.length > 0 && (
                    <div className={styles.attachments}>
                      <h3>Attachments</h3>
                      <div className={styles.attachmentList}>
                        {selectedIdea.attachments.map((attachment, index) => {
                          const fileName = attachment.fileName.toLowerCase();
                          const fileExtension = fileName.split('.').pop();
                          const isPreviewable = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'pdf'].includes(fileExtension || '');
                          
                          return (
                            <div key={index} className={styles.attachmentItem}>
                              <FileText size={16} />
                              <span>{attachment.fileName}</span>
                              <button
                                className={styles.downloadButton}
                                onClick={() => handleAttachmentClick(attachment)}
                                title={isPreviewable ? 'Preview' : 'Download'}
                              >
                                {isPreviewable ? <Eye size={14} /> : <Download size={14} />}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
              </div>

              <div
                className={styles.modalActions}
                style={{
                  display: 'flex',
                  gap: '20px',
                  justifyContent: 'center',
                }}
              >
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

      {/* Attachment Preview Modal */}
      <AnimatePresence>
        {previewAttachment && (
          <motion.div
            className={styles.modalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closePreview}
            style={{ zIndex: 10000 }}
          >
            <motion.div
              className={styles.previewModal}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '90vw',
                height: '90vh',
                maxWidth: '1200px',
                background: 'white',
                borderRadius: '12px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <div style={{
                padding: '16px 24px',
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
                  {previewAttachment.fileName}
                </h3>
                <button
                  onClick={closePreview}
                  style={{
                    border: 'none',
                    background: 'none',
                    fontSize: '28px',
                    cursor: 'pointer',
                    color: '#6b7280',
                    padding: '0 8px',
                    lineHeight: 1
                  }}
                >
                  ×
                </button>
              </div>
              <div style={{
                flex: 1,
                overflow: 'auto',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: previewAttachment.type === 'pdf' ? '0' : '20px',
                background: '#f9fafb'
              }}>
                {previewAttachment.type === 'image' && (
                  <img
                    src={previewAttachment.url}
                    alt={previewAttachment.fileName}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain'
                    }}
                  />
                )}
                {previewAttachment.type === 'pdf' && (
                  <iframe
                    src={`${previewAttachment.url}#toolbar=1&navpanes=0&view=FitH`}
                    title={previewAttachment.fileName}
                    style={{
                      width: '100%',
                      height: '100%',
                      border: 'none'
                    }}
                  />
                )}
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
                <h3 style={{ color: '#ffffffff', fontWeight: '600' }}>
                  Confirm{' '}
                  {pendingAction.action === 'approve'
                    ? 'Approval'
                    : 'Rejection'}
                </h3>
              </div>
              <div className={styles.confirmationBody}>
                <p style={{ color: '#f0f0f0ff', fontWeight: '500' }}>
                  Are you sure you want to{' '}
                  <strong
                    style={{
                      color: 'hsla(120, 72%, 70%, 1.00)',
                      fontWeight: '600',
                    }}
                  >
                    {pendingAction.action}
                  </strong>{' '}
                  the idea:
                </p>
                <h4 style={{ color: '#ffffffff', fontWeight: '600' }}>
                  {pendingAction.idea.title}
                </h4>
                <p style={{ color: '#ffffffff', fontWeight: '400' }}>
                  {pendingAction.idea.description.length > 150
                    ? `${pendingAction.idea.description.substring(0, 150)}...`
                    : pendingAction.idea.description}
                </p>
              </div>
              <div
                className={styles.confirmationActions}
                style={{
                  display: 'flex',
                  gap: '20px',
                  justifyContent: 'center',
                }}
              >
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
