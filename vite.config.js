import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react()
  ],
  // Configure base path for SharePoint deployment
  base: process.env.NODE_ENV === 'production' ? '/SiteAssets/modern_dashboard/' : '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React libraries
          'react-vendor': ['react', 'react-dom'],

          // Router and navigation
          'router': ['react-router-dom', 'react-helmet-async'],

          // Data fetching and caching
          'query-client': ['@tanstack/react-query'],

          // Charts and visualization (heavy - separate chunk)
          'charts': ['chart.js', 'react-chartjs-2', 'chartjs-plugin-datalabels'],

          // UI libraries and icons
          'ui-vendor': ['@fortawesome/fontawesome-free', 'react-icons'],

          // Utilities and helpers
          'utils': ['moment', 'clsx'],

          // Development-only chunks (will be tree-shaken in production)
          'dev-tools': process.env.NODE_ENV === 'development' ? ['@testing-library/react'] : []
        }
      }
    },
    // Enable source maps for better debugging
    sourcemap: process.env.NODE_ENV === 'development',
    // Optimize chunk size
    chunkSizeWarningLimit: 1000
  },
  css: {
    modules: {
      localsConvention: 'camelCaseOnly'
    }
  },
  server: {
    port: 3000,
    host: true
  },
  define: {
    // Enable console logging in development
    __DEV__: process.env.NODE_ENV === 'development'
  }
})