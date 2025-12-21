import React from 'react';
import { Bar, Pie, Line, Doughnut } from 'react-chartjs-2';
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
} from 'chart.js';
import styles from './PriorityCharts.module.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

const PriorityCharts = ({
  tasks,
  chartType = 'bar',
  title = 'Task Priority Distribution',
  compact = false,
  showLegend = true,
  showTitle = true,
  horizontal = false,
  onSegmentClick
}) => {
  const priorityCounts = tasks.reduce((acc, task) => {
    const rawPriority = task.Priority || 'Unknown'
    // Handle SharePoint priorities that may have numeric prefixes like "(1) High"
    const priorityMatch = rawPriority.match(/^\(\d+\)\s*(.+)$/)
    const extractedPriority = priorityMatch ? priorityMatch[1] : rawPriority
    // Map SharePoint priority names to display values
    const priorityMap = {
      'High': 'High',
      'Normal': 'Medium', // SharePoint "Normal" maps to display "Medium"
      'Low': 'Low',
      'Critical': 'Critical'
    }
    const priority = priorityMap[extractedPriority] || extractedPriority
    acc[priority] = (acc[priority] || 0) + 1
    return acc
  }, {})

  const labels = Object.keys(priorityCounts);
  const data = Object.values(priorityCounts);

  const colors = {
    'Low': '#28a745',
    'Medium': '#ffc107',
    'High': '#fd7e14',
    'Critical': '#dc3545',
    'Unknown': '#6c757d'
  };

  const backgroundColors = labels.map(label => colors[label] || '#6c757d');
  const borderColors = backgroundColors.map(color => color);

  const chartData = {
    labels,
    datasets: [{
      label: 'Tasks by Priority',
      data,
      backgroundColor: backgroundColors,
      borderColor: borderColors,
      borderWidth: 1,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: compact ? { top: 10, bottom: 10, left: 10, right: 10 } : { top: 20, bottom: 20, left: 20, right: 20 },
    },
    indexAxis: horizontal ? 'y' : 'x',
    interaction: {
      mode: 'nearest',
      intersect: true,
    },
    onClick: (event, elements) => {
      if (!onSegmentClick || !elements?.length) return;
      const el = elements[0];
      const index = el.index;
      const label = labels[index];
      if (!label) return;
      onSegmentClick({ label, value: priorityCounts[label] || 0 });
    },
    plugins: {
      legend: showLegend && !compact ? {
        position: 'bottom',
        labels: {
          padding: 12,
          usePointStyle: true,
          font: { size: 12 },
          color: 'var(--chart-text)',
        },
      } : { display: false },
      title: {
        display: showTitle && !compact,
        text: title,
        font: {
          size: 14,
          weight: 'bold',
        },
        padding: { top: 10, bottom: 10 },
        color: 'var(--chart-text)',
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const value = context.dataset.data[context.dataIndex] || 0;
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
            return `${context.label}: ${value} (${percentage}%)`;
          },
        },
        backgroundColor: 'var(--card-bg)',
        titleColor: 'var(--chart-text)',
        bodyColor: 'var(--chart-text)',
        borderColor: 'var(--border-color)',
        borderWidth: 1,
      },
    },
    scales: chartType === 'bar' ? {
      x: horizontal ? {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          color: 'var(--chart-text)',
          font: { size: 11 },
        },
        grid: {
          color: 'var(--border-color)',
          display: false
        },
      } : {
        ticks: {
          color: 'var(--chart-text)',
          font: { size: 11 },
        },
        grid: {
          color: 'var(--border-color)',
        },
      },
      y: horizontal ? {
        ticks: {
          color: 'var(--chart-text)',
          font: { size: 11 },
        },
        grid: {
          color: 'var(--border-color)',
        },
      } : {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          color: 'var(--chart-text)',
          font: { size: 11 },
        },
        grid: {
          color: 'var(--border-color)',
        },
      },
    } : undefined,
  };

  const renderChart = () => {
    switch (chartType) {
      case 'pie':
        return <Pie data={chartData} options={options} />;
      case 'line':
        return <Line data={chartData} options={options} />;
      case 'doughnut':
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
      <div className={styles.chartWrapper}>
        {renderChart()}
      </div>
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
              <span className={styles.compactStatLabel}>+{labels.length - 3} more</span>
            </div>
          )}
        </div>
      )}
      {showLegend && !compact && (
        <div className={styles.priorityLegend}>
          {labels.map((priority, index) => (
            <div key={priority} className={styles.legendItem}>
              <span
                className={styles.legendColor}
                style={{ backgroundColor: backgroundColors[index] }}
              ></span>
              <span className={styles.legendLabel}>{priority}</span>
              <span className={styles.legendCount}>({priorityCounts[priority]})</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PriorityCharts;