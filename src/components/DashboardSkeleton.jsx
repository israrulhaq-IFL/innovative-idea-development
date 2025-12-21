import { SkeletonCard, SkeletonChart } from './Skeleton';
import styles from './DashboardSkeleton.module.css';

const DashboardSkeleton = () => {
  return (
    <div className={styles.dashboardSkeleton}>
      {/* Header skeleton */}
      <div className={styles.headerSkeleton}>
        <div className={styles.headerLeft}>
          <div className={styles.titleSkeleton}></div>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.controlsSkeleton}></div>
        </div>
      </div>

      {/* KPI Cards skeleton */}
      <div className={styles.kpiGrid}>
        <SkeletonCard className={styles.kpiCard} />
        <SkeletonCard className={styles.kpiCard} />
        <SkeletonCard className={styles.kpiCard} />
        <SkeletonCard className={styles.kpiCard} />
      </div>

      {/* Department columns skeleton */}
      <div className={styles.columnsGrid}>
        <div className={styles.columnSkeleton}>
          <div className={styles.columnHeaderSkeleton}></div>
          <div className={styles.columnKpiSkeleton}></div>
          <SkeletonChart className={styles.columnChart} />
          <SkeletonChart className={styles.columnChart} />
          <SkeletonCard className={styles.columnCard} />
        </div>

        <div className={styles.columnSkeleton}>
          <div className={styles.columnHeaderSkeleton}></div>
          <div className={styles.columnKpiSkeleton}></div>
          <SkeletonChart className={styles.columnChart} />
          <SkeletonChart className={styles.columnChart} />
          <SkeletonCard className={styles.columnCard} />
        </div>

        <div className={styles.columnSkeleton}>
          <div className={styles.columnHeaderSkeleton}></div>
          <div className={styles.columnKpiSkeleton}></div>
          <SkeletonChart className={styles.columnChart} />
          <SkeletonChart className={styles.columnChart} />
          <SkeletonCard className={styles.columnCard} />
        </div>
      </div>
    </div>
  );
};

export default DashboardSkeleton;