import styles from './Skeleton.module.css';

const Skeleton = ({
  width = '100%',
  height = '1rem',
  borderRadius = '4px',
  className = '',
  variant = 'text'
}) => {
  const skeletonClasses = [
    styles.skeleton,
    styles[variant],
    className
  ].filter(Boolean).join(' ');

  return (
    <div
      className={skeletonClasses}
      style={{
        width,
        height,
        borderRadius
      }}
    />
  );
};

// Predefined skeleton components for common UI patterns
export const SkeletonText = ({ lines = 1, className = '' }) => (
  <div className={`${styles.skeletonText} ${className}`}>
    {Array.from({ length: lines }, (_, i) => (
      <Skeleton
        key={i}
        height="1rem"
        width={i === lines - 1 ? '60%' : '100%'}
        className={styles.textLine}
      />
    ))}
  </div>
);

export const SkeletonCard = ({ className = '' }) => (
  <div className={`${styles.skeletonCard} ${className}`}>
    <Skeleton height="1.5rem" width="70%" className={styles.cardTitle} />
    <Skeleton height="8rem" className={styles.cardContent} />
    <div className={styles.cardFooter}>
      <Skeleton height="0.75rem" width="40%" />
      <Skeleton height="0.75rem" width="30%" />
    </div>
  </div>
);

export const SkeletonChart = ({ className = '' }) => (
  <div className={`${styles.skeletonChart} ${className}`}>
    <Skeleton height="2rem" width="60%" className={styles.chartTitle} />
    <Skeleton height="12rem" className={styles.chartArea} />
    <div className={styles.chartStats}>
      <Skeleton height="0.75rem" width="50%" />
      <Skeleton height="0.75rem" width="40%" />
      <Skeleton height="0.75rem" width="45%" />
    </div>
  </div>
);

export const SkeletonTable = ({ rows = 5, columns = 4, className = '' }) => (
  <div className={`${styles.skeletonTable} ${className}`}>
    <div className={styles.tableHeader}>
      {Array.from({ length: columns }, (_, i) => (
        <Skeleton key={i} height="1.25rem" width="100%" />
      ))}
    </div>
    {Array.from({ length: rows }, (_, rowIndex) => (
      <div key={rowIndex} className={styles.tableRow}>
        {Array.from({ length: columns }, (_, colIndex) => (
          <Skeleton
            key={colIndex}
            height="1rem"
            width="100%"
          />
        ))}
      </div>
    ))}
  </div>
);

export default Skeleton;