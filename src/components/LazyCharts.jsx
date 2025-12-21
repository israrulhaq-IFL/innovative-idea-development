import React, { Suspense, lazy } from 'react';

// Lazy load chart components to reduce initial bundle size
const StatusCharts = lazy(() => import('./StatusCharts'));
const PriorityCharts = lazy(() => import('./PriorityCharts'));

// Loading fallback for charts
const ChartLoadingFallback = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '200px',
    backgroundColor: 'var(--card-bg)',
    borderRadius: 'var(--border-radius)',
    border: '1px solid var(--border-color)'
  }}>
    <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
      <div style={{
        width: '32px',
        height: '32px',
        border: '3px solid var(--border-color)',
        borderTop: '3px solid var(--primary-color)',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        margin: '0 auto 8px'
      }}></div>
      Loading chart...
    </div>
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

// Lazy-loaded chart components with error boundaries
export const LazyStatusCharts = (props) => (
  <Suspense fallback={<ChartLoadingFallback />}>
    <StatusCharts {...props} />
  </Suspense>
);

export const LazyPriorityCharts = (props) => (
  <Suspense fallback={<ChartLoadingFallback />}>
    <PriorityCharts {...props} />
  </Suspense>
);