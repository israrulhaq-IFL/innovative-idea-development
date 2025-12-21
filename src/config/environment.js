// Environment configuration for deployment flexibility
// This file centralizes all environment-specific settings

// Lazy initialization to avoid build-time issues
let _config = null;

export const getConfig = () => {
  if (!_config) {
    _config = {
      // SharePoint Configuration
      SHAREPOINT: {
        SITE_URL: import.meta.env.VITE_SHAREPOINT_URL || (typeof window !== 'undefined' ? window.location.origin : ''),
        LIST_CONFIG: {
          infra: {
            name: 'si_tasklist',
            guid: 'e41bb365-20be-4724-8ff8-18438d9c2354',
            displayName: 'Data Center & Cloud Infrastructure'
          },
          erp: {
            name: 'erp_tasklist',
            guid: '4693a94b-4a71-4821-b8c1-3a6fc8cdac69',
            displayName: 'ERP & Software Development'
          },
          ops: {
            name: 'ops_tasklist',
            guid: '6eb2cec0-f94f-47ae-8745-5e48cd52ffd9',
            displayName: 'ITG Operations'
          },
          network: {
            name: 'networks_tasklist',
            guid: '1965d5a7-b9f0-4066-b2c5-8d9b8a442537',
            displayName: 'Networks & Security'
          }
        }
      },

      // Deployment Configuration
      DEPLOYMENT: {
        TYPE: import.meta.env.VITE_DEPLOYMENT_TYPE || 'sharepoint', // 'sharepoint' | 'standalone'
        BASE_PATH: import.meta.env.VITE_BASE_PATH || '/SiteAssets/modern_dashboard/',
        API_URL: import.meta.env.VITE_API_URL,
        DOCUMENT_LIBRARY: import.meta.env.VITE_DOCUMENT_LIBRARY || 'SiteAssets',
        SUBFOLDER: import.meta.env.VITE_SUBFOLDER || 'modern_dashboard'
      },

      // Application Configuration
      APP: {
        NAME: 'Modern ITG Dashboard',
        VERSION: '1.0.1',
        DEFAULT_DEPARTMENT: 'infra',
        CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
        MAX_RETRY_ATTEMPTS: 3
      },

      // Feature Flags (for gradual rollouts)
      FEATURES: {
        ENABLE_ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
        ENABLE_OFFLINE_MODE: import.meta.env.VITE_ENABLE_OFFLINE_MODE === 'true',
        ENABLE_DEBUG_LOGGING: import.meta.env.VITE_ENABLE_DEBUG_LOGGING === 'true'
      }
    };
  }
  return _config;
};

// For backward compatibility
export const CONFIG = getConfig();

// Environment validation
export const validateConfig = () => {
  const config = getConfig();
  const errors = [];

  if (config.DEPLOYMENT.TYPE === 'standalone' && !config.DEPLOYMENT.API_URL) {
    errors.push('VITE_API_URL is required for standalone deployment');
  }

  if (config.DEPLOYMENT.TYPE === 'sharepoint' && !config.SHAREPOINT.SITE_URL) {
    errors.push('SharePoint site URL is required');
  }

  if (errors.length > 0) {
    console.error('Configuration validation failed:', errors);
    throw new Error(`Invalid configuration: ${errors.join(', ')}`);
  }

  return true;
};

// Development helpers
export const isDevelopment = import.meta.env.DEV;
export const isProduction = import.meta.env.PROD;
export const isSharePoint = () => getConfig().DEPLOYMENT.TYPE === 'sharepoint';
export const isStandalone = () => getConfig().DEPLOYMENT.TYPE === 'standalone';