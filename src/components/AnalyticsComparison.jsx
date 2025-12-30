import React, { useMemo } from "react";
import { FiAward, FiBarChart2, FiTrendingDown } from "react-icons/fi";
import StatusCharts from "./StatusCharts";
import PriorityCharts from "./PriorityCharts";
import styles from "./AnalyticsComparison.module.css";

const AnalyticsComparison = ({
  tasks,
  departments,
  permissions,
  chartType,
}) => {
  // Calculate department-wise analytics
  const departmentStats = useMemo(() => {
    const stats = {};

    departments.forEach((dept) => {
      const deptTasks = tasks.filter((task) => task.DepartmentId === dept.id);
      stats[dept.id] = {
        name: dept.name,
        total: deptTasks.length,
        completed: deptTasks.filter((t) => t.Status === "Completed").length,
        inProgress: deptTasks.filter((t) => t.Status === "In Progress").length,
        overdue: deptTasks.filter((t) => {
          if (!t.DueDate || t.Status === "Completed") return false;
          return new Date(t.DueDate) < new Date();
        }).length,
        completionRate:
          deptTasks.length > 0
            ? Math.round(
                (deptTasks.filter((t) => t.Status === "Completed").length /
                  deptTasks.length) *
                  100,
              )
            : 0,
        avgCompletionTime: 0, // Would need more complex calculation
        highPriority: deptTasks.filter((t) => {
          const priority = t.Priority || "";
          return (
            priority.includes("High") ||
            priority.includes("Critical") ||
            priority === "1" ||
            priority === "2"
          );
        }).length,
      };
    });

    return stats;
  }, [tasks, departments]);

  // Prepare data for comparison charts
  const comparisonData = useMemo(() => {
    const labels = Object.values(departmentStats).map((stat) => stat.name);
    const completionRates = Object.values(departmentStats).map(
      (stat) => stat.completionRate,
    );
    const totalTasks = Object.values(departmentStats).map((stat) => stat.total);
    const overdueTasks = Object.values(departmentStats).map(
      (stat) => stat.overdue,
    );

    return {
      labels,
      completionRates,
      totalTasks,
      overdueTasks,
    };
  }, [departmentStats]);

  // Find best and worst performers
  const performanceRanking = useMemo(() => {
    const sorted = Object.values(departmentStats)
      .map((stat) => ({
        name: stat.name,
        completionRate: stat.completionRate,
        totalTasks: stat.total,
        overdueCount: stat.overdue,
      }))
      .sort((a, b) => b.completionRate - a.completionRate);

    return {
      best: sorted[0],
      worst: sorted[sorted.length - 1],
      average:
        sorted.reduce((acc, curr) => acc + curr.completionRate, 0) /
        sorted.length,
    };
  }, [departmentStats]);

  // Find department with most overdue tasks
  const mostOverdueDepartment = useMemo(() => {
    const sortedByOverdue = Object.values(departmentStats)
      .map((stat) => ({
        name: stat.name,
        overdueCount: stat.overdue,
      }))
      .sort((a, b) => b.overdueCount - a.overdueCount);

    return sortedByOverdue[0];
  }, [departmentStats]);

  return (
    <div className={styles.comparison}>
      <div className={styles.header}>
        <h2>Department Comparison</h2>
        <p>Compare performance metrics across different departments</p>
      </div>

      {/* Performance Overview Cards */}
      <div className={styles.overviewCards}>
        <div className={styles.overviewCard}>
          <div className={styles.cardIcon}>
            <FiAward />
          </div>
          <div className={styles.cardContent}>
            <h3>Top Performer</h3>
            <p className={styles.cardValue}>
              {performanceRanking.best?.name || "N/A"}
            </p>
            <span className={styles.cardMetric}>
              {performanceRanking.best?.completionRate || 0}% completion rate
            </span>
          </div>
        </div>

        <div className={styles.overviewCard}>
          <div className={styles.cardIcon}>
            <FiBarChart2 />
          </div>
          <div className={styles.cardContent}>
            <h3>Average Rate</h3>
            <p className={styles.cardValue}>
              {Math.round(performanceRanking.average)}%
            </p>
            <span className={styles.cardMetric}>Across all departments</span>
          </div>
        </div>

        <div className={styles.overviewCard}>
          <div className={styles.cardIcon}>
            <FiTrendingDown />
          </div>
          <div className={styles.cardContent}>
            <h3>Focus Area</h3>
            <p className={styles.cardValue}>
              {performanceRanking.worst?.name || "N/A"}
            </p>
            <span className={styles.cardMetric}>
              {performanceRanking.worst?.completionRate || 0}% completion rate
            </span>
          </div>
        </div>
      </div>

      {/* Comparison Charts */}
      <div className={styles.chartsGrid}>
        <div className={styles.chartCard}>
          <h3>Completion Rate by Department</h3>
          <div className={styles.chartContainer}>
            <div className={styles.barChart}>
              {comparisonData.labels.map((label, index) => (
                <div key={label} className={styles.barGroup}>
                  <div className={styles.barLabel}>{label}</div>
                  <div className={styles.barContainer}>
                    <div
                      className={styles.bar}
                      style={{
                        width: `${comparisonData.completionRates[index]}%`,
                        backgroundColor: `hsl(${(index * 360) / comparisonData.labels.length}, 70%, 50%)`,
                      }}
                    >
                      <span className={styles.barValue}>
                        {comparisonData.completionRates[index]}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.chartCard}>
          <h3>Task Distribution</h3>
          <div className={styles.chartContainer}>
            <div className={styles.pieChart}>
              {comparisonData.labels.map((label, index) => {
                const percentage =
                  (comparisonData.totalTasks[index] /
                    comparisonData.totalTasks.reduce((a, b) => a + b, 0)) *
                  100;
                return (
                  <div key={label} className={styles.pieSegment}>
                    <div
                      className={styles.segmentColor}
                      style={{
                        backgroundColor: `hsl(${(index * 360) / comparisonData.labels.length}, 70%, 50%)`,
                      }}
                    />
                    <div className={styles.segmentInfo}>
                      <span className={styles.segmentLabel}>{label}</span>
                      <span className={styles.segmentValue}>
                        {comparisonData.totalTasks[index]} tasks (
                        {percentage.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className={styles.chartCard}>
          <h3>Overdue Tasks Comparison</h3>
          <div className={styles.chartContainer}>
            <div className={styles.overdueChart}>
              {comparisonData.labels.map((label, index) => (
                <div key={label} className={styles.overdueItem}>
                  <div className={styles.overdueLabel}>{label}</div>
                  <div className={styles.overdueBar}>
                    <div
                      className={styles.overdueFill}
                      style={{
                        width: `${Math.min(
                          (comparisonData.overdueTasks[index] /
                            Math.max(...comparisonData.overdueTasks, 1)) *
                            100,
                          100,
                        )}%`,
                        backgroundColor:
                          comparisonData.overdueTasks[index] > 0
                            ? "var(--danger-color, #dc3545)"
                            : "var(--success-color, #28a745)",
                      }}
                    />
                  </div>
                  <div className={styles.overdueCount}>
                    {comparisonData.overdueTasks[index]}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.chartCard}>
          <h3>Department Efficiency Matrix</h3>
          <div className={styles.matrix}>
            <div className={styles.matrixHeader}>
              <span>Department</span>
              <span>Tasks</span>
              <span>Completion</span>
              <span>Overdue</span>
            </div>
            {Object.values(departmentStats).map((stat, index) => (
              <div key={stat.name} className={styles.matrixRow}>
                <span className={styles.deptName}>{stat.name}</span>
                <span className={styles.metric}>{stat.total}</span>
                <span className={styles.metric}>{stat.completionRate}%</span>
                <span
                  className={styles.metric}
                  style={{
                    color:
                      stat.overdue > 0
                        ? "var(--danger-color, #dc3545)"
                        : "var(--success-color, #28a745)",
                  }}
                >
                  {stat.overdue}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.chartCard}>
          <h3>Comparison Insights</h3>
          <div className={styles.insightsList}>
            <div className={styles.insight}>
              <div
                className={styles.insightBadge}
                style={{ backgroundColor: "var(--success-color, #28a745)" }}
              >
                ✓
              </div>
              <div className={styles.insightText}>
                <strong>{performanceRanking.best?.name}</strong> leads with{" "}
                {performanceRanking.best?.completionRate}% completion rate
              </div>
            </div>

            <div className={styles.insight}>
              <div
                className={styles.insightBadge}
                style={{ backgroundColor: "var(--warning-color, #ffc107)" }}
              >
                ⚠
              </div>
              <div className={styles.insightText}>
                <strong>{mostOverdueDepartment?.name}</strong> has the most
                overdue tasks ({mostOverdueDepartment?.overdueCount || 0})
              </div>
            </div>

            <div className={styles.insight}>
              <div
                className={styles.insightBadge}
                style={{ backgroundColor: "var(--info-color, #17a2b8)" }}
              >
                📊
              </div>
              <div className={styles.insightText}>
                Overall team completion rate:{" "}
                <strong>{Math.round(performanceRanking.average)}%</strong>
              </div>
            </div>

            <div className={styles.insight}>
              <div
                className={styles.insightBadge}
                style={{ backgroundColor: "var(--primary-color)" }}
              >
                🎯
              </div>
              <div className={styles.insightText}>
                Best improvement opportunity: Focus on reducing overdue tasks in
                underperforming departments
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsComparison;
