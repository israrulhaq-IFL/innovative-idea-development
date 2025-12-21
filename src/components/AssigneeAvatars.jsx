import React, { useState, useRef, useEffect } from 'react';
import styles from './AssigneeAvatars.module.css';

const AssigneeAvatars = ({ assignees, maxVisible = 3, showTooltip = true }) => {
  const [hoveredAssignee, setHoveredAssignee] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0, arrowDirection: 'top' });
  const containerRef = useRef(null);

  const handleMouseEnter = (assignee, event) => {
    if (!showTooltip) return;

    const rect = event.target.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();
    const tooltipWidth = 200; // Approximate tooltip width
    const tooltipHeight = 80; // Approximate tooltip height
    const offset = 10; // Space between avatar and tooltip

    // Calculate position relative to container - prioritize above positioning
    let left = rect.left - containerRect.left + rect.width / 2; // Center above avatar
    let top = rect.top - containerRect.top - tooltipHeight - offset - 15; // Above avatar with extra space
    let arrowDirection = 'top';

    // Get container dimensions
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;

    // Check if tooltip fits above the avatar
    const tooltipFitsAbove = top >= 10 && left - tooltipWidth / 2 >= 30 && left + tooltipWidth / 2 <= containerWidth - 10;

    if (!tooltipFitsAbove) {
      // Try positioning below the avatar
      top = rect.top - containerRect.top + rect.height + offset;
      arrowDirection = 'bottom';

      // Check if tooltip fits below
      const tooltipFitsBelow = top + tooltipHeight <= containerHeight - 10 &&
                              left - tooltipWidth / 2 >= 30 &&
                              left + tooltipWidth / 2 <= containerWidth - 10;

      if (!tooltipFitsBelow) {
        // If neither above nor below works, force above positioning with horizontal adjustment
        top = Math.max(10, rect.top - containerRect.top - tooltipHeight - offset);
        arrowDirection = 'top';

        // Adjust horizontal position to fit within bounds
        if (left - tooltipWidth / 2 < 30) {
          left = 30 + tooltipWidth / 2;
        } else if (left + tooltipWidth / 2 > containerWidth - 10) {
          left = containerWidth - 10 - tooltipWidth / 2;
        }
      }
    }

    setTooltipPosition({ top, left, arrowDirection });
    setHoveredAssignee(assignee);
  };

  const handleMouseLeave = () => {
    setHoveredAssignee(null);
  };

  if (!assignees || assignees.length === 0) {
    return (
      <div className={styles.container} ref={containerRef}>
        <div
          className={`${styles.avatar} ${styles.unassigned}`}
          title="Unassigned"
          onMouseEnter={(e) => handleMouseEnter({ Title: 'Unassigned', Email: 'No assignee assigned' }, e)}
          onMouseLeave={handleMouseLeave}
        >
          <span className={styles.initials}>?</span>
        </div>
        {hoveredAssignee && (
          <div
            className={styles.tooltip}
            style={{
              top: `${tooltipPosition.top}px`,
              left: `${tooltipPosition.left}px`,
              transform: 'translateX(-50%)'
            }}
          >
            <div className={styles.tooltipContent}>
              <div className={styles.tooltipName}>{hoveredAssignee.Title}</div>
              <div className={styles.tooltipEmail}>{hoveredAssignee.Email}</div>
            </div>
            <div className={styles.tooltipArrow}></div>
          </div>
        )}
      </div>
    );
  }

  const visibleAssignees = assignees.slice(0, maxVisible);
  const remainingCount = assignees.length - maxVisible;

  return (
    <div className={styles.container} ref={containerRef}>
      {visibleAssignees.map((assignee, index) => (
        <div
          key={assignee.Id || index}
          className={`${styles.avatar} ${styles.assigned}`}
          onMouseEnter={(e) => handleMouseEnter(assignee, e)}
          onMouseLeave={handleMouseLeave}
          style={{
            backgroundColor: getAvatarColor(assignee.Title),
            zIndex: maxVisible - index,
            animationDelay: `${index * 50}ms`
          }}
        >
          <span className={styles.initials}>
            {getInitials(assignee.Title)}
          </span>
          <div className={styles.avatarGlow}></div>
        </div>
      ))}
      {remainingCount > 0 && (
        <div
          className={`${styles.avatar} ${styles.more}`}
          onMouseEnter={(e) => handleMouseEnter({
            Title: `${remainingCount} more assignee${remainingCount > 1 ? 's' : ''}`,
            Email: 'Click to see all assignees'
          }, e)}
          onMouseLeave={handleMouseLeave}
        >
          <span className={styles.initials}>+{remainingCount}</span>
        </div>
      )}

      {hoveredAssignee && (
        <div
          className={`${styles.tooltip} ${styles[`tooltip${tooltipPosition.arrowDirection}`]}`}
          style={{
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
            transform: 'translateX(-50%)'
          }}
        >
          <div className={styles.tooltipContent}>
            <div className={styles.tooltipName}>{hoveredAssignee.Title}</div>
            {hoveredAssignee.Email && (
              <div className={styles.tooltipEmail}>{hoveredAssignee.Email}</div>
            )}
          </div>
          <div className={styles.tooltipArrow}></div>
        </div>
      )}
    </div>
  );
};

// Helper function to get initials from name
const getInitials = (name) => {
  if (!name) return '?';
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
};

// Helper function to generate consistent colors based on name
const getAvatarColor = (name) => {
  if (!name) return '#6c757d';
  const colors = [
    '#007bff', '#28a745', '#ffc107', '#dc3545',
    '#6f42c1', '#e83e8c', '#fd7e14', '#20c997',
    '#6c757d', '#17a2b8', '#343a40', '#6610f2',
    '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4',
    '#ffeaa7', '#dda0dd', '#98d8c8', '#f7dc6f'
  ];
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

export default AssigneeAvatars;