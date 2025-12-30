import { SkeletonCard, SkeletonChart, SkeletonTable } from "./Skeleton";
import styles from "./AnalyticsSkeleton.module.css";

const AnalyticsSkeleton = () => {
  return (
    <div className={styles.analyticsSkeleton}>
      {/* Header skeleton */}
      <div className={styles.headerSkeleton}>
        <div className={styles.titleSkeleton}></div>
        <div className={styles.controlsSkeleton}></div>
      </div>

      {/* Overview cards skeleton */}
      <div className={styles.overviewGrid}>
        <SkeletonCard className={styles.overviewCard} />
        <SkeletonCard className={styles.overviewCard} />
        <SkeletonCard className={styles.overviewCard} />
        <SkeletonCard className={styles.overviewCard} />
      </div>

      {/* Charts section skeleton */}
      <div className={styles.chartsSection}>
        <div className={styles.sectionTitleSkeleton}></div>
        <div className={styles.chartsGrid}>
          <SkeletonChart className={styles.chartSkeleton} />
          <SkeletonChart className={styles.chartSkeleton} />
          <SkeletonChart className={styles.chartSkeleton} />
          <SkeletonChart className={styles.chartSkeleton} />
        </div>
      </div>

      {/* Trends section skeleton */}
      <div className={styles.trendsSection}>
        <div className={styles.sectionTitleSkeleton}></div>
        <div className={styles.trendsGrid}>
          <SkeletonChart className={styles.trendChart} />
          <SkeletonChart className={styles.trendChart} />
        </div>
      </div>

      {/* Comparison section skeleton */}
      <div className={styles.comparisonSection}>
        <div className={styles.sectionTitleSkeleton}></div>
        <div className={styles.comparisonGrid}>
          <SkeletonTable className={styles.comparisonTable} />
          <SkeletonCard className={styles.insightsCard} />
        </div>
      </div>
    </div>
  );
};

export default AnalyticsSkeleton;
