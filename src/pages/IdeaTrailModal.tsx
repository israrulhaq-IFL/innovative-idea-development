import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Eye, CheckCircle, XCircle, Clock, User, Calendar, FileText, ZoomIn, ZoomOut } from 'lucide-react';
import styles from './IdeaTrailModal.module.css';

interface IdeaTrailModalProps {
  isOpen: boolean;
  onClose: () => void;
  idea: {
    id: number;
    title: string;
    description: string;
    status: string;
    created: Date;
    modified: Date;
    createdBy: {
      id: number;
      name: string;
      email?: string;
    };
    approvedBy?: {
      id: number;
      name: string;
      email?: string;
    };
    category: string;
    priority: string;
    attachments?: Array<{
      fileName: string;
      serverRelativeUrl: string;
    }>;
  } | null;
}

interface TrailCheckpoint {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'completed' | 'current' | 'rejected';
  timestamp: Date;
  actor?: string;
  details?: string;
  actions?: Array<{
    label: string;
    action: () => void;
    type: 'primary' | 'secondary';
  }>;
}

const IdeaTrailModal: React.FC<IdeaTrailModalProps> = ({ isOpen, onClose, idea }) => {
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate trail checkpoints based on idea data
  const generateTrailCheckpoints = useCallback((): TrailCheckpoint[] => {
    if (!idea) return [];

    // Helper function to safely get a valid Date
    const getValidDate = (date: Date | undefined | null, fallback: Date = new Date()): Date => {
      if (date && date instanceof Date && !isNaN(date.getTime())) {
        return date;
      }
      return fallback;
    };

    const now = new Date();
    const createdDate = getValidDate(idea.created, now);
    const modifiedDate = getValidDate(idea.modified, createdDate);

    const checkpoints: TrailCheckpoint[] = [
      {
        id: 'submitted',
        title: 'Idea Submitted',
        description: 'Idea was submitted for initial review',
        status: 'completed',
        timestamp: createdDate,
        actor: idea.createdBy?.name || 'Unknown',
        details: `Submitted by ${idea.createdBy?.name || 'Unknown'} in ${idea.category} category with ${idea.priority} priority`
      },
      {
        id: 'initial-review',
        title: 'Initial Review',
        description: 'Idea undergoes initial screening and validation',
        status: idea.status === 'Pending Approval' ? 'current' : 'completed',
        timestamp: createdDate,
        details: 'System validates idea completeness and assigns to appropriate reviewer'
      },
      {
        id: 'approval-review',
        title: 'Approval Review',
        description: 'Idea is reviewed by designated approver',
        status: idea.status === 'Approved' ? 'completed' :
               idea.status === 'Rejected' ? 'rejected' :
               idea.status === 'Pending Approval' ? 'current' : 'pending',
        timestamp: modifiedDate,
        actor: idea.approvedBy?.name,
        details: idea.approvedBy ?
          `${idea.approvedBy.name} reviewed the idea and ${idea.status.toLowerCase()} it` :
          'Awaiting approval review'
      }
    ];

    // Add additional checkpoints based on status
    if (idea.status === 'Approved') {
      checkpoints.push({
        id: 'implementation-planning',
        title: 'Implementation Planning',
        description: 'Planning phase for approved idea execution',
        status: idea.status === 'In Progress' ? 'current' : 'pending',
        timestamp: modifiedDate,
        details: 'Creating implementation roadmap and resource allocation'
      });

      if (idea.status === 'In Progress' || idea.status === 'Completed') {
        checkpoints.push({
          id: 'implementation',
          title: 'Implementation',
          description: 'Idea is being implemented',
          status: idea.status === 'Completed' ? 'completed' : 'current',
          timestamp: modifiedDate,
          details: 'Active development and execution of the approved idea'
        });
      }

      if (idea.status === 'Completed') {
        checkpoints.push({
          id: 'completion-review',
          title: 'Completion Review',
          description: 'Final review and closure of implemented idea',
          status: 'completed',
          timestamp: modifiedDate,
          details: 'Idea successfully implemented and marked as completed'
        });
      }
    }

    return checkpoints;
  }, [idea]);

  const checkpoints = generateTrailCheckpoints();

  // Handle mouse events for dragging
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  }, [panOffset]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      const newOffset = {
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      };
      setPanOffset(newOffset);
    }
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Zoom controls
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 2));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.5));
  };

  // Reset zoom and pan on modal open
  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setPanOffset({ x: 0, y: 0 });
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !idea) return null;

  // Group checkpoints into rows of 3
  const checkpointRows: TrailCheckpoint[][] = [];
  for (let i = 0; i < checkpoints.length; i += 3) {
    checkpointRows.push(checkpoints.slice(i, i + 3));
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            <Eye size={24} />
            Idea Trail - {idea.title}
          </h2>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.trailCanvas}>
            <div
              ref={canvasRef}
              className={styles.canvasViewport}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <div
                ref={containerRef}
                className={styles.trailContainer}
                style={{
                  transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
                  transformOrigin: '0 0'
                }}
              >
                <div className={styles.trailFlow}>
                  {checkpointRows.map((row, rowIndex) => (
                    <div key={rowIndex} className={styles.flowRow}>
                      {row.map((checkpoint, colIndex) => (
                        <div key={checkpoint.id} className={styles.checkpoint}>
                          <div className={`${styles.checkpointNode} ${styles[checkpoint.status]}`}>
                            {checkpoint.status === 'completed' && <CheckCircle size={32} />}
                            {checkpoint.status === 'rejected' && <XCircle size={32} />}
                            {checkpoint.status === 'current' && <Clock size={32} />}
                            {checkpoint.status === 'pending' && <FileText size={32} />}
                          </div>

                          {colIndex < row.length - 1 && (
                            <div className={`${styles.checkpointConnector} ${styles[checkpoint.status]}`} />
                          )}

                          <div className={styles.checkpointCard}>
                            <div className={styles.checkpointTitle}>
                              {checkpoint.status === 'completed' && <CheckCircle size={18} />}
                              {checkpoint.status === 'rejected' && <XCircle size={18} />}
                              {checkpoint.status === 'current' && <Clock size={18} />}
                              {checkpoint.status === 'pending' && <FileText size={18} />}
                              {checkpoint.title}
                            </div>

                            <div className={styles.checkpointMeta}>
                              <div className={styles.checkpointMetaItem}>
                                <Calendar size={14} />
                                {checkpoint.timestamp && checkpoint.timestamp instanceof Date && !isNaN(checkpoint.timestamp.getTime())
                                  ? `${checkpoint.timestamp.toLocaleDateString()} ${checkpoint.timestamp.toLocaleTimeString()}`
                                  : 'Date unavailable'}
                              </div>
                              {checkpoint.actor && (
                                <div className={styles.checkpointMetaItem}>
                                  <User size={14} />
                                  {checkpoint.actor}
                                </div>
                              )}
                            </div>

                            <div className={styles.checkpointContent}>
                              {checkpoint.description}
                              {checkpoint.details && (
                                <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#6b7280' }}>
                                  {checkpoint.details}
                                </div>
                              )}
                            </div>

                            {checkpoint.actions && checkpoint.actions.length > 0 && (
                              <div className={styles.checkpointActions}>
                                {checkpoint.actions.map((action, actionIndex) => (
                                  <button
                                    key={actionIndex}
                                    className={`${styles.checkpointAction} ${styles[action.type]}`}
                                    onClick={action.action}
                                  >
                                    {action.label}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Mini-map */}
            <div className={styles.miniMap}>
              <div className={styles.miniMapViewport}>
                <div className={styles.miniMapContent}>
                  <div className={styles.miniMapTrail}>
                    {checkpoints.map((checkpoint, index) => (
                      <div
                        key={checkpoint.id}
                        className={styles.miniMapNode}
                        style={{
                          left: `${(index % 3) * 33.33 + 16.67}%`,
                          top: `${Math.floor(index / 3) * 50 + 25}%`
                        }}
                      />
                    ))}
                  </div>
                  <div
                    className={styles.miniMapViewportIndicator}
                    style={{
                      left: `${Math.max(0, -panOffset.x / 12)}%`,
                      top: `${Math.max(0, -panOffset.y / 10)}%`,
                      width: `${Math.min(100, 100 / zoom)}%`,
                      height: `${Math.min(100, 100 / zoom)}%`
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Zoom Controls */}
            <div className={styles.zoomControls}>
              <button className={styles.zoomButton} onClick={handleZoomIn}>
                <ZoomIn size={20} />
              </button>
              <button className={styles.zoomButton} onClick={handleZoomOut}>
                <ZoomOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IdeaTrailModal;