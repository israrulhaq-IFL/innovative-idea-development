// Secure API Client for SharePoint Integration
// src/utils/secureApi.ts

import { logError, logInfo } from './logger';
import { ApiResponse } from '../types';

// SharePoint API Configuration
export interface SharePointConfig {
  baseUrl: string;
  lists: {
    ideas: string;
    tasks: string;
    discussions: string;
    ideaTrail: string;
  };
}

// Default configuration
export const DEFAULT_CONFIG: SharePointConfig = {
  baseUrl: 'http://hospp16srv:36156',
  lists: {
    ideas: 'innovative_ideas',
    tasks: 'ino_ideas_tasks',
    discussions: 'innovative_idea_discussions',
    ideaTrail: 'innovative_idea_trail',
  },
};

// Get base URL from SharePoint context or fallback to default
const getBaseUrl = (): string => {
  // Check if SharePoint context is available
  const spContext = (window as any)._spPageContextInfo;
  if (spContext && spContext.webAbsoluteUrl) {
    return spContext.webAbsoluteUrl;
  }
  // Fallback to environment variable or default
  return import.meta.env?.VITE_SHAREPOINT_BASE_URL || DEFAULT_CONFIG.baseUrl;
};

// API Response types
export interface SharePointApiResponse<T> {
  d: T;
  'odata.metadata'?: string;
  'odata.nextLink'?: string;
}

// Secure API Client Class
export class SecureApiClient {
  private config: SharePointConfig;
  private requestQueue: Map<string, Promise<any>> = new Map();
  private rateLimitDelay = 100; // ms between requests

  constructor(config: SharePointConfig = DEFAULT_CONFIG) {
    // Use dynamic base URL if not explicitly provided
    this.config = {
      ...config,
      baseUrl: config.baseUrl || getBaseUrl(),
    };
  }

  // Update configuration (useful for dynamic SharePoint context)
  updateConfig(newConfig: Partial<SharePointConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // Get form digest for CSRF protection
  private async getFormDigest(): Promise<string> {
    try {
      const response = await fetch(`${this.config.baseUrl}/_api/contextinfo`, {
        method: 'POST',
        headers: {
          Accept: 'application/json;odata=verbose',
          'Content-Type': 'application/json;odata=verbose',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to get form digest: ${response.status}`);
      }

      const data = await response.json();
      return data.d.GetContextWebInformation.FormDigestValue;
    } catch (error) {
      logError('Failed to get SharePoint form digest', error);
      throw error;
    }
  }

  // Make authenticated request with retry logic
  private async makeRequest<T>(
    url: string,
    options: RequestInit = {},
    retryCount = 0,
  ): Promise<SharePointApiResponse<T>> {
    const maxRetries = 3;

    try {
      // Add form digest for POST/PUT/DELETE
      if (
        ['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method || 'GET')
      ) {
        const digest = await this.getFormDigest();
        options.headers = {
          ...options.headers,
          'X-RequestDigest': digest,
        };
      }

      // Default headers
      const defaultHeaders = {
        Accept: 'application/json;odata=verbose',
        'Content-Type': 'application/json;odata=verbose',
      };

      const response = await fetch(url, {
        ...options,
        headers: { ...defaultHeaders, ...options.headers },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Handle 204 No Content responses (common for MERGE operations)
      if (response.status === 204) {
        return { d: {} } as SharePointApiResponse<T>;
      }

      const data = await response.json();
      return data as SharePointApiResponse<T>;
    } catch (error) {
      if (retryCount < maxRetries) {
        logInfo(`Request failed, retrying (${retryCount + 1}/${maxRetries})`, {
          url,
          error,
        });
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * (retryCount + 1)),
        );
        return this.makeRequest<T>(url, options, retryCount + 1);
      }

      logError('Request failed after retries', { url, error });
      throw error;
    }
  }

  // Rate-limited request wrapper
  private async rateLimitedRequest<T>(
    url: string,
    options: RequestInit = {},
  ): Promise<SharePointApiResponse<T>> {
    // Simple rate limiting - wait for previous requests
    const now = Date.now();
    const lastRequest = this.requestQueue.get(url);

    if (lastRequest) {
      await lastRequest;
      await new Promise((resolve) => setTimeout(resolve, this.rateLimitDelay));
    }

    const request = this.makeRequest<T>(url, options);
    this.requestQueue.set(url, request);

    try {
      const result = await request;
      return result;
    } finally {
      this.requestQueue.delete(url);
    }
  }

  // GET request
  async get<T>(endpoint: string): Promise<SharePointApiResponse<T>> {
    const url = endpoint.startsWith('http')
      ? endpoint
      : `${this.config.baseUrl}${endpoint}`;
    return this.rateLimitedRequest<T>(url, { method: 'GET' });
  }

  // POST request
  async post<T>(
    endpoint: string,
    data: any,
  ): Promise<SharePointApiResponse<T>> {
    const url = endpoint.startsWith('http')
      ? endpoint
      : `${this.config.baseUrl}${endpoint}`;
    return this.rateLimitedRequest<T>(url, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // PUT request
  async put<T>(
    endpoint: string,
    data: any,
    etag?: string,
  ): Promise<SharePointApiResponse<T>> {
    const url = endpoint.startsWith('http')
      ? endpoint
      : `${this.config.baseUrl}${endpoint}`;

    const headers: Record<string, string> = {
      'X-HTTP-Method': 'MERGE',
      'If-Match': etag || '*', // Use "*" to bypass ETag concurrency control
    };

    return this.rateLimitedRequest<T>(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
  }

  // DELETE request
  async delete(endpoint: string): Promise<SharePointApiResponse<any>> {
    const url = endpoint.startsWith('http')
      ? endpoint
      : `${this.config.baseUrl}${endpoint}`;
    return this.rateLimitedRequest<any>(url, {
      method: 'POST',
      headers: { 'X-HTTP-Method': 'DELETE' },
    });
  }
}

// Singleton instance - lazy loaded to use correct base URL
let _sharePointApi: SecureApiClient | null = null;

export const getSharePointApi = (): SecureApiClient => {
  if (!_sharePointApi) {
    _sharePointApi = new SecureApiClient();
  }
  return _sharePointApi;
};

// For backward compatibility
export const sharePointApi = getSharePointApi();
