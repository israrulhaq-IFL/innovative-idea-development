import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// Simple plugin to exclude SharePoint asset folders from build output
const excludeSharePointAssetsPlugin = () => {
  return {
    name: 'exclude-sharepoint-assets',
    generateBundle(options, bundle) {
      // Remove any SharePoint asset files from the bundle
      Object.keys(bundle).forEach(fileName => {
        // For Innovative Ideas, we don't have specific SharePoint assets to exclude yet
        // This can be updated when specific asset folders are identified
        if (fileName.includes('assets/ppts/') || 
            fileName.includes('assets/IMS_Policy_and_procedures/') || 
            fileName.includes('assets/hse_team_pics/')) {
          delete bundle[fileName];
          console.log(`[SharePoint Assets] Excluded ${fileName} from build`);
        }
      });
    }
  };
};

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    excludeSharePointAssetsPlugin()
  ],

  // Set base path for production vs development
  base: mode === 'production' ? '/innovativeIdeas/dist/' : './',

  // Enable public directory for assets
  publicDir: 'public',

  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    chunkSizeWarningLimit: 3000, // Increase limit for larger chunks

    // Reduce CSS file splitting
    cssCodeSplit: false, // Bundle all CSS into one file

    rollupOptions: {
      output: {
        // Minimal chunking to avoid load order issues
        manualChunks: (id) => {
          // PDF.js worker - keep separate (it's loaded async anyway)
          if (id.includes('node_modules/pdfjs-dist')) {
            return 'vendor-pdf';
          }

          // Everything else goes into main vendor bundle
          // This avoids circular dependency issues between React and React-dependent libs
          if (id.includes('node_modules')) {
            return 'vendor';
          }

          // All app source code in one chunk
          if (id.includes('/src/')) {
            return 'app';
          }
        },
      },

      // Handle known SharePoint REST API warnings
      onwarn(warning, warn) {
        // Suppress specific warnings that are known to be safe
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE') {
          return;
        }

        // Suppress eval warnings from SharePoint API calls (controlled context)
        if (warning.code === 'EVAL' && warning.message.includes('SharePoint')) {
          return;
        }

        // Suppress mixed dynamic/static import warning for api.tsx
        // This file is used everywhere so it's intentionally in the main bundle
        if (warning.code === 'MIXED_EXTERNAL_IMPORTS' ||
            (warning.message && warning.message.includes('dynamic import will not move module'))) {
          return;
        }

        warn(warning);
      }
    },

    // Security: Configure minification for SharePoint compatibility
    minify: 'terser',
    terserOptions: {
      compress: {
        // Keep function names for SharePoint compatibility
        keep_fnames: true,
        // Don't drop console.warn/console.error for debugging
        drop_console: false,
        drop_debugger: true,
      },
      mangle: {
        // Keep function names for SharePoint debugging
        keep_fnames: true,
      }
    },
  },

  server: {
    port: 3000,
    host: true, // Allow external connections for testing
    compress: true,
  },

  // Path resolution
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  // CSS handling - consolidate CSS files
  css: {
    modules: {
      localsConvention: 'camelCase',
    },
    // Extract CSS into fewer files
    devSourcemap: false,
  },

  // Dependency optimization
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'chart.js/auto'],
  },
}));