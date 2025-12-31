import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  X,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Calendar,
  FileText,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useIdeaData, IdeaTrailEvent } from "../contexts/DataContext";
import styles from "./IdeaTrailModal.module.css";

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
  status: "pending" | "completed" | "current" | "rejected";
  timestamp: Date;
  actor?: string;
  details?: string;
  actions?: Array<{
    label: string;
    action: () => void;
    type: "primary" | "secondary";
  }>;
}

const IdeaTrailModal: React.FC<IdeaTrailModalProps> = ({
  isOpen,
  onClose,
  idea,
}) => {
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { data, loadIdeaTrailEvents, loadTasks, loadDiscussions } =
    useIdeaData();

  // Load trail events, tasks, and discussions when modal opens
  useEffect(() => {
    if (isOpen && idea) {
      loadIdeaTrailEvents();
      loadTasks();
      loadDiscussions();
    }
  }, [isOpen, idea, loadIdeaTrailEvents, loadTasks, loadDiscussions]);

  // Get trail events for the current idea (including related tasks and discussions)
  const getTrailEvents = useCallback((): IdeaTrailEvent[] => {
    if (!idea) return [];

    // Get all trail events
    const allEvents = data.ideaTrailEvents;

    // Get tasks and discussions related to this idea
    const relatedTasks = data.tasks.filter((task) => task.ideaId === idea.id);
    const relatedDiscussions = data.discussions.filter(
      (discussion) =>
        discussion.taskId &&
        relatedTasks.some((task) => task.id === discussion.taskId),
    );

    // Filter events that are related to:
    // 1. The idea directly (ideaId matches)
    // 2. Tasks of this idea (taskId matches a related task)
    // 3. Discussions of tasks of this idea (discussionId matches a related discussion)
    return allEvents.filter(
      (event) =>
        event.ideaId === idea.id ||
        (event.taskId &&
          relatedTasks.some((task) => task.id === event.taskId)) ||
        (event.discussionId &&
          relatedDiscussions.some(
            (discussion) => discussion.id === event.discussionId,
          )),
    );
  }, [idea, data.ideaTrailEvents, data.tasks, data.discussions]);

  // Convert trail events to checkpoints with enhanced relationship data
  const generateTrailCheckpoints = useCallback((): TrailCheckpoint[] => {
    const events = getTrailEvents();

    return events.map((event) => {
      let status: "pending" | "completed" | "current" | "rejected" =
        "completed";
      let iconType: string = "completed";

      // Find related entities
      const relatedTask = event.taskId
        ? data.tasks.find((task) => task.id === event.taskId)
        : null;
      const relatedDiscussion = event.discussionId
        ? data.discussions.find(
            (discussion) => discussion.id === event.discussionId,
          )
        : null;

      switch (event.eventType) {
        case "submitted":
          status = "completed";
          iconType = "submitted";
          break;
        case "approved":
          status = "completed";
          iconType = "approved";
          break;
        case "rejected":
          status = "rejected";
          iconType = "rejected";
          break;
        case "implementation_started":
          status = "completed";
          iconType = "implementation";
          break;
        case "implementation_completed":
          status = "completed";
          iconType = "completed";
          break;
        case "task_created":
          status = "completed";
          iconType = "task";
          break;
        case "commented":
          status = "completed";
          iconType = "discussion";
          break;
        case "attachment_added":
          status = "completed";
          iconType = "attachment";
          break;
        case "status_changed":
          status = "completed";
          iconType = "status_change";
          break;
        default:
          status = "completed";
          iconType = "default";
      }

      // Enhanced title with relationship context
      let enhancedTitle = event.title;
      let enhancedDescription = event.description || "";

      if (relatedTask && event.eventType === "task_created") {
        enhancedTitle = `Task Created: ${relatedTask.title}`;
      } else if (relatedDiscussion && event.eventType === "commented") {
        enhancedTitle = `Discussion: ${relatedDiscussion.title}`;
      } else if (relatedTask && event.eventType === "commented") {
        enhancedTitle = `Comment on Task: ${relatedTask.title}`;
      }
      let relationshipDetails = "";

      if (relatedTask) {
        relationshipDetails += `Task: "${relatedTask.title}" (${relatedTask.status})`;
      }

      if (relatedDiscussion) {
        if (relationshipDetails) relationshipDetails += " • ";
        relationshipDetails += `Discussion: "${relatedDiscussion.title}"`;
      }

      if (relationshipDetails) {
        enhancedDescription += `\n${relationshipDetails}`;
      }

      // Add status change information
      if (event.previousStatus && event.newStatus) {
        enhancedDescription += `\nStatus: ${event.previousStatus} → ${event.newStatus}`;
      } else if (event.newStatus) {
        enhancedDescription += `\nStatus: ${event.newStatus}`;
      }

      return {
        id: event.id.toString(),
        title: enhancedTitle,
        description: enhancedDescription,
        status,
        timestamp: event.timestamp,
        actor: event.actor,
        details:
          event.comments || relationshipDetails || `${event.eventType} event`,
        actions: [],
      };
    });
  }, [getTrailEvents, data.tasks, data.discussions]);

  const checkpoints = generateTrailCheckpoints();

  // Handle mouse events for dragging
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === canvasRef.current) {
        setIsDragging(true);
        setDragStart({
          x: e.clientX - panOffset.x,
          y: e.clientY - panOffset.y,
        });
      }
    },
    [panOffset],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging) {
        const newOffset = {
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        };
        setPanOffset(newOffset);
      }
    },
    [isDragging, dragStart],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Zoom controls
  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.25, 2));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.25, 0.5));
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
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !idea) return null;

  // Create a vertical timeline layout instead of rows
  const sortedCheckpoints = [...checkpoints].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
  );

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
                className={styles.timelineContainer}
                style={{
                  transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
                  transformOrigin: "0 0",
                }}
              >
                <svg className={styles.timelineSvg}>
                  <defs>
                    <marker
                      id="arrowhead-completed"
                      markerWidth="10"
                      markerHeight="7"
                      refX="9"
                      refY="3.5"
                      orient="auto"
                    >
                      <polygon
                        points="0 0, 10 3.5, 0 7"
                        fill="#10b981"
                      />
                    </marker>
                    <marker
                      id="arrowhead-rejected"
                      markerWidth="10"
                      markerHeight="7"
                      refX="9"
                      refY="3.5"
                      orient="auto"
                    >
                      <polygon
                        points="0 0, 10 3.5, 0 7"
                        fill="#ef4444"
                      />
                    </marker>
                    <marker
                      id="arrowhead-pending"
                      markerWidth="10"
                      markerHeight="7"
                      refX="9"
                      refY="3.5"
                      orient="auto"
                    >
                      <polygon
                        points="0 0, 10 3.5, 0 7"
                        fill="#6b7280"
                      />
                    </marker>
                  </defs>

                  {sortedCheckpoints.map((checkpoint, index) => {
                    if (index === 0) return null;

                    const prevCheckpoint = sortedCheckpoints[index - 1];
                    const y1 = (index - 1) * 200 + 60; // Node center
                    const y2 = index * 200 + 60; // Node center
                    const x1 = 100; // Timeline center
                    const x2 = 100; // Timeline center

                    // Create curved path
                    const midY = (y1 + y2) / 2;
                    const curveOffset = 30;
                    const pathData = `M ${x1} ${y1} Q ${x1 + curveOffset} ${midY} ${x2} ${y2}`;

                    return (
                      <path
                        key={`connector-${index}`}
                        d={pathData}
                        stroke={
                          checkpoint.status === "rejected"
                            ? "#ef4444"
                            : checkpoint.status === "completed"
                            ? "#10b981"
                            : "#6b7280"
                        }
                        strokeWidth="3"
                        fill="none"
                        markerEnd={`url(#arrowhead-${
                          checkpoint.status === "rejected"
                            ? "rejected"
                            : checkpoint.status === "completed"
                            ? "completed"
                            : "pending"
                        })`}
                        className={styles.timelineConnector}
                      />
                    );
                  })}
                </svg>

                <div className={styles.timelineFlow}>
                  {sortedCheckpoints.map((checkpoint, index) => (
                    <div
                      key={checkpoint.id}
                      className={styles.timelineItem}
                      style={{ top: `${index * 200}px` }}
                    >
                      <div className={styles.timelineNode}>
                        <div
                          className={`${styles.timelineNodeIcon} ${styles[checkpoint.status]}`}
                        >
                          {checkpoint.id.includes("submitted") && (
                            <FileText size={24} />
                          )}
                          {checkpoint.id.includes("approved") && (
                            <CheckCircle size={24} />
                          )}
                          {checkpoint.id.includes("rejected") && (
                            <XCircle size={24} />
                          )}
                          {checkpoint.id.includes("implementation") && (
                            <Clock size={24} />
                          )}
                          {checkpoint.status === "current" && (
                            <Clock size={24} />
                          )}
                          {checkpoint.status === "pending" && (
                            <FileText size={24} />
                          )}
                          {checkpoint.status === "completed" &&
                            !checkpoint.id.includes("submitted") &&
                            !checkpoint.id.includes("approved") &&
                            !checkpoint.id.includes("rejected") &&
                            !checkpoint.id.includes("implementation") && (
                              <CheckCircle size={24} />
                            )}
                        </div>
                      </div>

                      <div className={styles.timelineCard}>
                        <div className={styles.timelineCardHeader}>
                          <div className={styles.timelineCardTitle}>
                            {checkpoint.status === "completed" && (
                              <CheckCircle size={16} />
                            )}
                            {checkpoint.status === "rejected" && (
                              <XCircle size={16} />
                            )}
                            {checkpoint.status === "current" && (
                              <Clock size={16} />
                            )}
                            {checkpoint.status === "pending" && (
                              <FileText size={16} />
                            )}
                            {checkpoint.title}
                          </div>
                          <div className={styles.timelineCardTimestamp}>
                            {checkpoint.timestamp &&
                            checkpoint.timestamp instanceof Date &&
                            !isNaN(checkpoint.timestamp.getTime())
                              ? checkpoint.timestamp.toLocaleString()
                              : "Date unavailable"}
                          </div>
                        </div>

                        {checkpoint.actor && (
                          <div className={styles.timelineCardActor}>
                            <User size={14} />
                            {checkpoint.actor}
                          </div>
                        )}

                        <div className={styles.timelineCardContent}>
                          {checkpoint.description.split('\n').map((line, i) => (
                            <div key={i} className={i === 0 ? styles.timelineCardDescription : styles.timelineCardDetail}>
                              {line}
                            </div>
                          ))}
                        </div>

                        {checkpoint.actions &&
                          checkpoint.actions.length > 0 && (
                            <div className={styles.timelineCardActions}>
                              {checkpoint.actions.map(
                                (action, actionIndex) => (
                                  <button
                                    key={actionIndex}
                                    className={`${styles.timelineAction} ${styles[action.type]}`}
                                    onClick={action.action}
                                  >
                                    {action.label}
                                  </button>
                                ),
                              )}
                            </div>
                          )}
                      </div>
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
                    {sortedCheckpoints.map((checkpoint, index) => (
                      <div
                        key={checkpoint.id}
                        className={styles.miniMapNode}
                        style={{
                          left: "50%",
                          top: `${(index / Math.max(sortedCheckpoints.length - 1, 1)) * 100}%`,
                          transform: "translate(-50%, -50%)",
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
                      height: `${Math.min(100, 100 / zoom)}%`,
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
