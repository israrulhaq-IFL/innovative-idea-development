import React from "react";
import { Bar, Pie, Line, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from "chart.js";
import styles from "./StatusCharts.module.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
);

const StatusCharts = ({
  tasks,
  chartType = "bar",
  title = "Task Status Distribution",
  compact = false,
  showLegend = true,
  showTitle = true,
  showStats = true,
  onSegmentClick,
}) => {
  const statusCounts = tasks.reduce((acc, task) => {
    const status = task.Status || "Unknown";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const labels = Object.keys(statusCounts);
  const data = Object.values(statusCounts);

  const colors = {
    "Not Started": "#6c757d",
    "In Progress": "#ffc107",
    Completed: "#28a745",
    "On Hold": "#fd7e14",
    Cancelled: "#dc3545",
    Unknown: "#6c757d",
  };

  const backgroundColors = labels.map((label) => colors[label] || "#6c757d");
  const borderColors = backgroundColors.map((color) => color);

  const chartData = {
    labels,
    datasets: [
      {
        label: "Tasks by Status",
        data,
        backgroundColor: backgroundColors,
        borderColor: borderColors,
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: compact
        ? { top: 10, bottom: 10, left: 10, right: 10 }
        : { top: 20, bottom: 20, left: 20, right: 20 },
    },
    interaction: {
      mode: "nearest",
      intersect: true,
    },
    onClick: (event, elements) => {
      if (!onSegmentClick || !elements?.length) return;
      const el = elements[0];
      const index = el.index;
      const label = labels[index];
      if (!label) return;
      onSegmentClick({ label, value: statusCounts[label] || 0 });
    },
    plugins: {
      legend:
        showLegend && !compact
          ? {
              position: "bottom",
              labels: {
                padding: 16,
                usePointStyle: true,
                font: { size: 12 },
                color: "var(--chart-text)",
              },
            }
          : { display: false },
      title: {
        display: showTitle && !compact,
        text: title,
        font: {
          size: 14,
          weight: "bold",
        },
        padding: { top: 10, bottom: 10 },
        color: "var(--chart-text)",
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const value =
              typeof context.parsed === "number"
                ? context.parsed
                : (context.parsed?.y ?? 0);
            const percentage =
              total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";
            return `${context.label}: ${value} (${percentage}%)`;
          },
        },
        backgroundColor: "var(--card-bg)",
        titleColor: "var(--chart-text)",
        bodyColor: "var(--chart-text)",
        borderColor: "var(--border-color)",
        borderWidth: 1,
      },
    },
    cutout: chartType === "doughnut" ? (compact ? "50%" : "62%") : undefined,
    scales:
      chartType === "bar"
        ? {
            x: {
              ticks: {
                color: "var(--chart-text)",
                font: { size: 11 },
              },
              grid: {
                color: "var(--border-color)",
              },
            },
            y: {
              beginAtZero: true,
              ticks: {
                stepSize: 1,
                color: "var(--chart-text)",
                font: { size: 11 },
              },
              grid: {
                color: "var(--border-color)",
              },
            },
          }
        : undefined,
  };

  const renderChart = () => {
    switch (chartType) {
      case "pie":
        return <Pie data={chartData} options={options} />;
      case "line":
        return <Line data={chartData} options={options} />;
      case "doughnut":
        return <Doughnut data={chartData} options={options} />;
      default:
        return <Bar data={chartData} options={options} />;
    }
  };

  if (tasks.length === 0) {
    return (
      <div className={styles.chartContainer}>
        <div className={styles.noData}>
          <p>No task data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.chartContainer}>
      <div className={styles.chartWrapper}>{renderChart()}</div>
      {compact && (
        <div className={styles.compactStats}>
          {labels.slice(0, 3).map((label, index) => (
            <div key={label} className={styles.compactStat}>
              <span
                className={styles.compactStatColor}
                style={{ backgroundColor: backgroundColors[index] }}
              ></span>
              <span className={styles.compactStatLabel}>{label}</span>
              <span className={styles.compactStatValue}>{data[index]}</span>
            </div>
          ))}
          {labels.length > 3 && (
            <div className={styles.compactStat}>
              <span className={styles.compactStatLabel}>
                +{labels.length - 3} more
              </span>
            </div>
          )}
        </div>
      )}
      {showStats && !compact && (
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Total Tasks:</span>
            <span className={styles.statValue}>{tasks.length}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Unique Statuses:</span>
            <span className={styles.statValue}>{labels.length}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatusCharts;
