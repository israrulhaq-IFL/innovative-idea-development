import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIdeaData } from '../contexts/DataContext';
import { useUser } from '../contexts/UserContext';
import { discussionApi, Discussion } from '../services/discussionApi';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { MessageCircle, Search, Clock, Users, AlertCircle, Send, Paperclip, X } from 'lucide-react';
import styles from './DiscussionPanel.module.css';

const DiscussionPanel: React.FC = () => {
  const navigate = useNavigate();
  const { data, loading: dataLoading } = useIdeaData();
  const { user } = useUser();
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [selectedDiscussion, setSelectedDiscussion] = useState<Discussion | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);

  // Load discussions
  useEffect(() => {
    loadDiscussions();
  }, [user]);

  const loadDiscussions = async () => {
    if (!user?.user?.Id) return;
    
    try {
      setLoading(true);
      const myDiscussions = await discussionApi.getMyDiscussions(user.user.Id);
      setDiscussions(myDiscussions);
    } catch (error) {
      console.error('Failed to load discussions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter discussions
  const filteredDiscussions = useMemo(() => {
    if (!searchQuery.trim()) return discussions;
    
    const query = searchQuery.toLowerCase();
    return discussions.filter(d => 
      d.taskTitle.toLowerCase().includes(query) ||
      d.ideaTitle?.toLowerCase().includes(query) ||
      d.messages.some(m => m.body.toLowerCase().includes(query))
    );
  }, [discussions, searchQuery]);

  // Handle send reply
  const handleSendReply = async () => {
    if (!selectedDiscussion || !replyText.trim()) return;
    
    try {
      setSending(true);
      const subject = `Re: ${selectedDiscussion.taskTitle}`;
      
      const newMessage = await discussionApi.addReply(
        selectedDiscussion.taskId,
        selectedDiscussion.ideaId || 0,
        subject,
        replyText,
        false
      );

      // Upload attachment if selected
      if (selectedFile) {
        await discussionApi.uploadAttachment(newMessage.id, selectedFile.name, selectedFile);
      }

      // Reload discussions
      await loadDiscussions();
      
      // Update selected discussion
      const updated = discussions.find(d => d.taskId === selectedDiscussion.taskId);
      if (updated) {
        const messages = await discussionApi.getDiscussionsByTask(updated.taskId);
        setSelectedDiscussion({ ...updated, messages });
      }

      setReplyText('');
      setSelectedFile(null);
    } catch (error) {
      console.error('Failed to send reply:', error);
      alert('Failed to send reply. Please try again.');
    } finally {
      setSending(false);
    }
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // Format date
  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <LoadingSpinner size="lg" message="Loading discussions..." />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <MessageCircle size={32} />
          <div>
            <h1>Task Discussions</h1>
            <p>Collaborate with your team on assigned tasks</p>
          </div>
        </div>
        <div className={styles.headerStats}>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{discussions.length}</span>
            <span className={styles.statLabel}>Active Discussions</span>
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className={styles.mainLayout}>
        {/* Discussions List */}
        <div className={styles.discussionsList}>
          <div className={styles.listHeader}>
            <h2>Your Discussions</h2>
            <div className={styles.searchBox}>
              <Search size={18} />
              <input
                type="text"
                placeholder="Search discussions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.listContent}>
            {filteredDiscussions.length === 0 ? (
              <div className={styles.emptyState}>
                <AlertCircle size={48} />
                <p>No discussions found</p>
                <span>You'll see discussions here when you're assigned to tasks</span>
              </div>
            ) : (
              filteredDiscussions.map((discussion) => (
                <div
                  key={discussion.id}
                  className={`${styles.discussionCard} ${
                    selectedDiscussion?.id === discussion.id ? styles.selected : ''
                  }`}
                  onClick={() => setSelectedDiscussion(discussion)}
                >
                  <div className={styles.discussionHeader}>
                    <h3>{discussion.taskTitle}</h3>
                    {discussion.ideaTitle && (
                      <span className={styles.ideaBadge}>{discussion.ideaTitle}</span>
                    )}
                  </div>
                  <div className={styles.discussionMeta}>
                    <div className={styles.metaItem}>
                      <MessageCircle size={14} />
                      <span>{discussion.messages.length} messages</span>
                    </div>
                    <div className={styles.metaItem}>
                      <Users size={14} />
                      <span>{discussion.participants.length} participants</span>
                    </div>
                    <div className={styles.metaItem}>
                      <Clock size={14} />
                      <span>{formatDate(discussion.lastActivity)}</span>
                    </div>
                  </div>
                  {discussion.unreadCount > 0 && (
                    <div className={styles.unreadBadge}>{discussion.unreadCount}</div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Discussion Thread */}
        <div className={styles.threadPanel}>
          {!selectedDiscussion ? (
            <div className={styles.emptyState}>
              <MessageCircle size={64} />
              <h3>No Discussion Selected</h3>
              <p>Select a discussion from the list to view messages and participate</p>
            </div>
          ) : (
            <>
              <div className={styles.threadHeader}>
                <div>
                  <h2>{selectedDiscussion.taskTitle}</h2>
                  {selectedDiscussion.ideaTitle && (
                    <p className={styles.ideaLink}>
                      Idea: {selectedDiscussion.ideaTitle}
                    </p>
                  )}
                </div>
                <div className={styles.participants}>
                  <Users size={16} />
                  <span>{selectedDiscussion.participants.map(p => p.name).join(', ')}</span>
                </div>
              </div>

              <div className={styles.messagesContainer}>
                {selectedDiscussion.messages.map((message) => (
                  <div key={message.id} className={styles.message}>
                    <div className={styles.messageHeader}>
                      <div className={styles.messageAuthor}>
                        <strong>{message.author.name}</strong>
                        <span className={styles.messageTime}>
                          {formatDate(message.created)}
                        </span>
                      </div>
                      {message.isQuestion && (
                        <span className={styles.questionBadge}>Question</span>
                      )}
                    </div>
                    <div 
                      className={styles.messageBody}
                      dangerouslySetInnerHTML={{ __html: message.body }}
                    />
                    {message.attachments && message.attachments.length > 0 && (
                      <div className={styles.attachments}>
                        {message.attachments.map((att, idx) => (
                          <a
                            key={idx}
                            href={att.serverRelativeUrl}
                            className={styles.attachment}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Paperclip size={14} />
                            {att.fileName}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className={styles.replyBox}>
                {selectedFile && (
                  <div className={styles.selectedFile}>
                    <Paperclip size={14} />
                    <span>{selectedFile.name}</span>
                    <button onClick={() => setSelectedFile(null)}>
                      <X size={14} />
                    </button>
                  </div>
                )}
                <div className={styles.replyInput}>
                  <textarea
                    placeholder="Type your reply..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    disabled={sending}
                  />
                  <div className={styles.replyActions}>
                    <label className={styles.attachButton}>
                      <Paperclip size={18} />
                      <input
                        type="file"
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                      />
                    </label>
                    <button
                      className={styles.sendButton}
                      onClick={handleSendReply}
                      disabled={!replyText.trim() || sending}
                    >
                      <Send size={18} />
                      {sending ? 'Sending...' : 'Send'}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiscussionPanel;
