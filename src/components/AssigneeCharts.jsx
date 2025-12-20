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
import styles from './AssigneeCharts.module.css';

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

const AssigneeCharts = ({ tasks, chartType = 'bar', onBarClick }) => {
  const assigneeCounts = tasks.reduce((acc, task) => {
    // Handle AssignedTo field - it's already processed into an array of assignee objects
    let assigneeNames = ['Unassigned'];
    
    if (task.AssignedTo && Array.isArray(task.AssignedTo) && task.AssignedTo.length > 0) {
      // AssignedTo is an array of {Id, Title, Email} objects
      assigneeNames = task.AssignedTo.map(assignee => assignee.Title || 'Unknown');
    }
    
    // Count each assignee
    assigneeNames.forEach(name => {
      acc[name] = (acc[name] || 0) + 1;
    });
    
    return acc;
  }, {});

  // Sort by task count descending
  const sortedEntries = Object.entries(assigneeCounts)
    .sort(([,a], [,b]) => b - a);

  const labels = sortedEntries.map(([assignee]) => assignee);
  const data = sortedEntries.map(([,count]) => count);

  // Generate colors for assignees
  const generateColors = (count) => {
    const baseColors = [
      '#007bff', '#28a745', '#ffc107', '#dc3545', '#6f42c1',
      '#e83e8c', '#fd7e14', '#20c997', '#6c757d', '#17a2b8'
    ];

    const colors = [];
    for (let i = 0; i < count; i++) {
      colors.push(baseColors[i % baseColors.length]);
    }
    return colors;
  };

  const backgroundColors = generateColors(labels.length);
  const borderColors = backgroundColors.map(color => color);

  const chartData = {
    labels,
    datasets: [{
      label: 'Tasks by Assignee',
      data,
      backgroundColor: backgroundColors,
      borderColor: borderColors,
      borderWidth: 1,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y', // This makes it horizontal
    onClick: (event, elements) => {
      if (elements.length > 0 && onBarClick) {
        const dataIndex = elements[0].index;
        const assigneeName = labels[dataIndex];
        onBarClick(assigneeName);
      }
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
        },
      },
      title: {
        display: true,
        text: 'Assignee Workload',
        font: {
          size: 16,
          weight: 'bold',
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            return `${context.label}: ${context.parsed.x} tasks`;
          },
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
        title: {
          display: true,
          text: 'Number of Tasks'
        }
      },
      y: {
        title: {
          display: true,
          text: 'Assignee'
        },
        ticks: {
          maxRotation: 0,
          minRotation: 0,
        },
      },
    },
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
      <div className={styles.assigneeStats}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Total Assignees:</span>
          <span className={styles.statValue}>{labels.length}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Most Assigned:</span>
          <span className={styles.statValue}>
            {labels[0]} ({data[0]})
          </span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Unassigned:</span>
          <span className={styles.statValue}>
            {assigneeCounts['Unassigned'] || 0}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AssigneeCharts;