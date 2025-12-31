import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  X,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import {
  ReactFlow,
  Node,
  Edge,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  Handle,
  Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useIdeaData, IdeaTrailEvent } from "../contexts/DataContext";
import styles from "./IdeaTrailModal.module.css";

interface IdeaTrailModalProps {
  isOpen: boolean;
  onClose: () => void;
  idea?: {
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
  eventType?: string;
  previousStatus?: string;
  newStatus?: string;
  comments?: string;
  taskId?: number;
  discussionId?: number;
  metadata?: Record<string, any>;
}

interface WorkflowNodeData {
  checkpoint: TrailCheckpoint;
  onHover: (checkpoint: TrailCheckpoint | null) => void;
}

// Get event type icon/label
const getEventTypeLabel = (eventType?: string) => {
  switch (eventType) {
    case 'submitted': return '📝 Submitted';
    case 'reviewed': return '👁️ Reviewed';
    case 'approved': return '✅ Approved';
    case 'rejected': return '❌ Rejected';
    case 'implementation_started': return '🚀 Started';
    case 'implementation_completed': return '🎉 Completed';
    case 'status_changed': return '🔄 Status Changed';
    case 'commented': return '💬 Comment';
    case 'attachment_added': return '📎 Attachment';
    case 'task_created': return '📋 Task Created';
    default: return '📌 Event';
  }
};

// Custom Node Component
const WorkflowNode: React.FC<{ data: WorkflowNodeData }> = ({ data }) => {
  const { checkpoint, onHover } = data;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#10b981';
      case 'rejected':
        return '#ef4444';
      case 'current':
        return '#3b82f6';
      default:
        return '#6b7280';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)';
      case 'rejected':
        return 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)';
      case 'current':
        return 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)';
      default:
        return 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)';
    }
  };

  return (
    <div
      style={{
        padding: '16px',
        borderRadius: '12px',
        background: getStatusBgColor(checkpoint.status),
        border: `3px solid ${getStatusColor(checkpoint.status)}`,
        minWidth: '180px',
        maxWidth: '220px',
        textAlign: 'left',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        cursor: 'pointer',
        position: 'relative',
      }}
      onMouseEnter={() => onHover(checkpoint)}
      onMouseLeave={() => onHover(null)}
    >
      {/* All 4 positions with both source and target handles for snake pattern */}
      {/* Left handles */}
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        style={{
          background: getStatusColor(checkpoint.status),
          width: '10px',
          height: '10px',
          border: '2px solid white',
        }}
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left-source"
        style={{
          background: getStatusColor(checkpoint.status),
          width: '10px',
          height: '10px',
          border: '2px solid white',
          top: '50%',
        }}
      />

      {/* Top handles */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        style={{
          background: getStatusColor(checkpoint.status),
          width: '10px',
          height: '10px',
          border: '2px solid white',
        }}
      />

      {/* Right handles */}
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        style={{
          background: getStatusColor(checkpoint.status),
          width: '10px',
          height: '10px',
          border: '2px solid white',
        }}
      />
      <Handle
        type="target"
        position={Position.Right}
        id="right-target"
        style={{
          background: getStatusColor(checkpoint.status),
          width: '10px',
          height: '10px',
          border: '2px solid white',
          top: '50%',
        }}
      />

      {/* Bottom handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        style={{
          background: getStatusColor(checkpoint.status),
          width: '10px',
          height: '10px',
          border: '2px solid white',
        }}
      />

      {/* Event Type Badge */}
      <div style={{
        fontSize: '10px',
        fontWeight: '600',
        color: 'white',
        background: getStatusColor(checkpoint.status),
        padding: '3px 8px',
        borderRadius: '10px',
        marginBottom: '8px',
        display: 'inline-block',
      }}>
        {getEventTypeLabel(checkpoint.eventType)}
      </div>

      {/* Title */}
      <div style={{
        fontSize: '13px',
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: '6px',
        lineHeight: '1.3',
      }}>
        {checkpoint.title}
      </div>

      {/* Actor */}
      {checkpoint.actor && (
        <div style={{
          fontSize: '11px',
          color: '#4b5563',
          marginBottom: '4px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}>
          <span>👤</span> {checkpoint.actor}
        </div>
      )}

      {/* Status Change */}
      {checkpoint.previousStatus && checkpoint.newStatus && (
        <div style={{
          fontSize: '10px',
          color: '#6b7280',
          marginBottom: '4px',
          background: 'rgba(255,255,255,0.5)',
          padding: '3px 6px',
          borderRadius: '4px',
        }}>
          {checkpoint.previousStatus} → {checkpoint.newStatus}
        </div>
      )}

      {/* Timestamp */}
      <div style={{
        fontSize: '10px',
        color: '#6b7280',
        marginTop: '6px',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
      }}>
        <span>🕐</span> {checkpoint.timestamp.toLocaleString()}
      </div>
    </div>
  );
};

const nodeTypes = {
  workflowNode: WorkflowNode,
};

const IdeaTrailModal: React.FC<IdeaTrailModalProps> = ({ isOpen, onClose, idea }) => {
  const [hoveredCheckpoint, setHoveredCheckpoint] = useState<TrailCheckpoint | null>(null);
  const { data } = useIdeaData();

  // Get trail events for this specific idea and convert to checkpoints
  const checkpoints = useMemo(() => {
    if (!idea) return [];

    const ideaTrailEvents = data.ideaTrailEvents.filter(event => event.ideaId === idea.id);

    // Sort events by timestamp
    const sortedEvents = ideaTrailEvents.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    return sortedEvents.map((event, index): TrailCheckpoint => {
      // Determine status based on event type and position
      let status: TrailCheckpoint['status'] = 'completed';

      if (index === sortedEvents.length - 1) {
        // Last event is current if it's recent, otherwise completed
        const daysSince = (new Date().getTime() - event.timestamp.getTime()) / (1000 * 60 * 60 * 24);
        status = daysSince < 7 ? 'current' : 'completed';
      }

      // Override status based on event type
      if (event.eventType === 'rejected') {
        status = 'rejected';
      } else if (event.eventType === 'implementation_started' && index === sortedEvents.length - 1) {
        status = 'current';
      } else if (event.eventType === 'implementation_completed') {
        status = 'completed';
      }

      return {
        id: event.id.toString(),
        title: event.title,
        description: event.description,
        status,
        timestamp: event.timestamp,
        actor: event.actor,
        eventType: event.eventType,
        previousStatus: event.previousStatus,
        newStatus: event.newStatus,
        comments: event.comments,
        taskId: event.taskId,
        discussionId: event.discussionId,
        metadata: event.metadata,
      };
    });
  }, [data.ideaTrailEvents, idea?.id]);

  const handleHover = useCallback((checkpoint: TrailCheckpoint | null) => {
    setHoveredCheckpoint(checkpoint);
  }, []);

  // Create React Flow nodes and edges
  const { nodes, edges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const eventsPerRow = 3;

    checkpoints.forEach((checkpoint, index) => {
      const row = Math.floor(index / eventsPerRow);
      const isEvenRow = row % 2 === 0;
      const positionInRow = index % eventsPerRow;

      // Snake pattern: left to right on even rows, right to left on odd rows
      // Increased spacing for larger cards (280px width spacing, 200px height spacing)
      const x = isEvenRow
        ? positionInRow * 280 + 80
        : (eventsPerRow - 1 - positionInRow) * 280 + 80;
      const y = row * 200 + 80;

      nodes.push({
        id: checkpoint.id,
        type: 'workflowNode',
        position: { x, y },
        data: {
          checkpoint,
          onHover: handleHover,
        },
      });

      // Create edge to next checkpoint with proper handle connections for snake pattern
      if (index < checkpoints.length - 1) {
        const nextIndex = index + 1;
        const nextRow = Math.floor(nextIndex / eventsPerRow);
        const isRowChange = nextRow !== row;
        const nextIsEvenRow = nextRow % 2 === 0;

        let sourceHandle = 'right';
        let targetHandle = 'left';

        if (isRowChange) {
          // When moving to next row: use bottom of current → top of next
          sourceHandle = 'bottom';
          targetHandle = 'top';
        } else if (isEvenRow) {
          // Even row (left to right): right → left
          sourceHandle = 'right';
          targetHandle = 'left';
        } else {
          // Odd row (right to left): use left-source → right-target
          sourceHandle = 'left-source';
          targetHandle = 'right-target';
        }

        edges.push({
          id: `edge-${checkpoint.id}-${checkpoints[index + 1].id}`,
          source: checkpoint.id,
          target: checkpoints[index + 1].id,
          sourceHandle,
          targetHandle,
          type: 'smoothstep', // Smooth curved edges
          style: {
            stroke: '#6366f1', // Nice purple color
            strokeWidth: 3,
          },
          // No animated property = solid line (not dotted)
        });
      }
    });

    return { nodes, edges };
  }, [checkpoints, handleHover]);

  console.log('React Flow Data:', { nodes: nodes.length, edges: edges.length });
  console.log('Edges details:', edges);

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

  if (!isOpen) return null;
  if (!idea) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            <Eye size={24} />
            Idea Trail - {idea?.title || 'Loading...'}
          </h2>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.trailCanvas}>
            <div className={styles.reactFlowWrapper}>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                fitView
                attributionPosition="bottom-left"
                nodesDraggable={false}
                nodesConnectable={false}
                elementsSelectable={false}
              >
                <Controls />
                <MiniMap />
                <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
              </ReactFlow>
            </div>

            {/* Hover Card */}
            {hoveredCheckpoint && (
              <div className={styles.workflowHoverCard}>
                <div className={styles.workflowHoverHeader}>
                  <div className={styles.workflowHoverTitle}>
                    {hoveredCheckpoint.title}
                  </div>
                  <div className={styles.workflowHoverTimestamp}>
                    {hoveredCheckpoint.timestamp.toLocaleString()}
                  </div>
                </div>
                <div className={styles.workflowHoverContent}>
                  <p>{hoveredCheckpoint.description}</p>
                  {hoveredCheckpoint.actor && (
                    <p><strong>Actor:</strong> {hoveredCheckpoint.actor}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Legend */}
          <div className={styles.workflowLegend}>
            <div className={styles.legendItem}>
              <div className={`${styles.legendIcon} ${styles.completed}`}>
                <CheckCircle size={16} />
              </div>
              <span>Completed</span>
            </div>
            <div className={styles.legendItem}>
              <div className={`${styles.legendIcon} ${styles.rejected}`}>
                <XCircle size={16} />
              </div>
              <span>Rejected</span>
            </div>
            <div className={styles.legendItem}>
              <div className={`${styles.legendIcon} ${styles.pending}`}>
                <Clock size={16} />
              </div>
              <span>Pending/Current</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IdeaTrailModal;
