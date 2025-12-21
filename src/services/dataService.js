// Abstract data service layer for deployment flexibility
// This provides a unified interface regardless of backend (SharePoint or REST API)

import { CONFIG, validateConfig } from '../config/environment.js';
import SharePointService from '../services/sharePointService.js';

// Validate configuration on import
validateConfig();

class DataService {
  constructor() {
    // Initialize the appropriate service based on deployment type
    if (CONFIG.DEPLOYMENT.TYPE === 'sharepoint') {
      this.service = new SharePointService();
    } else if (CONFIG.DEPLOYMENT.TYPE === 'standalone') {
      // TODO: Implement REST API service
      throw new Error('Standalone API service not yet implemented. Use SharePoint deployment for now.');
    } else {
      throw new Error(`Unknown deployment type: ${CONFIG.DEPLOYMENT.TYPE}`);
    }
  }

  // Department management
  getDepartments() {
    return Object.keys(CONFIG.SHAREPOINT.LIST_CONFIG).map(key => ({
      id: key,
      name: CONFIG.SHAREPOINT.LIST_CONFIG[key].displayName,
      listName: CONFIG.SHAREPOINT.LIST_CONFIG[key].name
    }));
  }

  getDepartmentName(departmentId) {
    const dept = CONFIG.SHAREPOINT.LIST_CONFIG[departmentId];
    return dept ? dept.displayName : 'Unknown Department';
  }

  // Task operations
  async getTasks(departmentId = CONFIG.APP.DEFAULT_DEPARTMENT, options = {}) {
    try {
      return await this.service.getTasks(departmentId, options);
    } catch (error) {
      console.error(`Failed to get tasks for department ${departmentId}:`, error);
      throw error;
    }
  }

  async getTaskById(taskId, departmentId = CONFIG.APP.DEFAULT_DEPARTMENT) {
    try {
      return await this.service.getTaskById(taskId, departmentId);
    } catch (error) {
      console.error(`Failed to get task ${taskId}:`, error);
      throw error;
    }
  }

  async createTask(taskData, departmentId = CONFIG.APP.DEFAULT_DEPARTMENT) {
    try {
      return await this.service.createTask(taskData, departmentId);
    } catch (error) {
      console.error('Failed to create task:', error);
      throw error;
    }
  }

  async updateTask(taskId, updates, departmentId = CONFIG.APP.DEFAULT_DEPARTMENT) {
    try {
      return await this.service.updateTask(taskId, updates, departmentId);
    } catch (error) {
      console.error(`Failed to update task ${taskId}:`, error);
      throw error;
    }
  }

  async deleteTask(taskId, departmentId = CONFIG.APP.DEFAULT_DEPARTMENT) {
    try {
      return await this.service.deleteTask(taskId, departmentId);
    } catch (error) {
      console.error(`Failed to delete task ${taskId}:`, error);
      throw error;
    }
  }

  // Analytics operations
  async getTaskAnalytics(departmentId = CONFIG.APP.DEFAULT_DEPARTMENT, dateRange = null) {
    try {
      return await this.service.getTaskAnalytics(departmentId, dateRange);
    } catch (error) {
      console.error(`Failed to get analytics for department ${departmentId}:`, error);
      throw error;
    }
  }

  async getAssigneeAnalytics(departmentId = CONFIG.APP.DEFAULT_DEPARTMENT) {
    try {
      return await this.service.getAssigneeAnalytics(departmentId);
    } catch (error) {
      console.error(`Failed to get assignee analytics for department ${departmentId}:`, error);
      throw error;
    }
  }

  // List management
  async checkListExists(departmentId = CONFIG.APP.DEFAULT_DEPARTMENT) {
    try {
      return await this.service.checkListExists(departmentId);
    } catch (error) {
      console.error(`Failed to check list existence for department ${departmentId}:`, error);
      return false;
    }
  }

  // User and permissions
  async getCurrentUser() {
    try {
      return await this.service.getCurrentUser();
    } catch (error) {
      console.error('Failed to get current user:', error);
      throw error;
    }
  }

  async checkUserPermissions(departmentId = CONFIG.APP.DEFAULT_DEPARTMENT) {
    try {
      return await this.service.checkUserPermissions(departmentId);
    } catch (error) {
      console.error('Failed to check user permissions:', error);
      return { canRead: false, canWrite: false, canDelete: false };
    }
  }

  // Utility methods
  getDefaultDepartment() {
    return CONFIG.APP.DEFAULT_DEPARTMENT;
  }

  isSharePointDeployment() {
    return CONFIG.DEPLOYMENT.TYPE === 'sharepoint';
  }

  isStandaloneDeployment() {
    return CONFIG.DEPLOYMENT.TYPE === 'standalone';
  }

  getApiUrl() {
    return CONFIG.DEPLOYMENT.API_URL;
  }

  getSiteUrl() {
    return CONFIG.SHAREPOINT.SITE_URL;
  }
}

// Export singleton instance
const dataService = new DataService();
export default dataService;

// Export class for testing purposes
export { DataService };