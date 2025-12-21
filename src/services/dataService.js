// Abstract data service layer for deployment flexibility
// This provides a unified interface regardless of backend (SharePoint or REST API)

import { getConfig } from '../config/environment.js';
import getSharePointService from './sharePointService.js';

class DataService {
  constructor() {
    // Get config lazily to avoid initialization issues
    const CONFIG = getConfig();

    // Initialize the appropriate service based on deployment type
    if (CONFIG.DEPLOYMENT.TYPE === 'sharepoint') {
      this.service = getSharePointService();
    } else if (CONFIG.DEPLOYMENT.TYPE === 'standalone') {
      // TODO: Implement REST API service
      throw new Error('Standalone API service not yet implemented. Use SharePoint deployment for now.');
    } else {
      throw new Error(`Unknown deployment type: ${CONFIG.DEPLOYMENT.TYPE}`);
    }
  }

  // Department management
  getDepartments() {
    const CONFIG = getConfig();
    return Object.keys(CONFIG.SHAREPOINT.LIST_CONFIG).map(key => ({
      id: key,
      name: CONFIG.SHAREPOINT.LIST_CONFIG[key].displayName,
      listName: CONFIG.SHAREPOINT.LIST_CONFIG[key].name
    }));
  }

  getDepartmentName(departmentId) {
    const CONFIG = getConfig();
    const dept = CONFIG.SHAREPOINT.LIST_CONFIG[departmentId];
    return dept ? dept.displayName : 'Unknown Department';
  }

  // Task operations
  async getTasks(departmentId = getConfig().APP.DEFAULT_DEPARTMENT, options = {}) {
    try {
      // SharePointService expects: (permissions, departmentFilter, departmentId)
      return await this.service.getTasks((options && options.permissions) || {}, null, departmentId);
    } catch (error) {
      console.error(`Failed to get tasks for department ${departmentId}:`, error);
      throw error;
    }
  }

  async getTaskById(taskId, departmentId = getConfig().APP.DEFAULT_DEPARTMENT) {
    try {
      return await this.service.getTaskById(taskId, departmentId);
    } catch (error) {
      console.error(`Failed to get task ${taskId}:`, error);
      throw error;
    }
  }

  async createTask(taskData, departmentId = getConfig().APP.DEFAULT_DEPARTMENT) {
    try {
      return await this.service.createTask(taskData, departmentId);
    } catch (error) {
      console.error('Failed to create task:', error);
      throw error;
    }
  }

  async updateTask(taskId, updates, departmentId = getConfig().APP.DEFAULT_DEPARTMENT) {
    try {
      return await this.service.updateTask(taskId, updates, departmentId);
    } catch (error) {
      console.error(`Failed to update task ${taskId}:`, error);
      throw error;
    }
  }

  async updateTaskStatus(taskId, newStatus, departmentId = getConfig().APP.DEFAULT_DEPARTMENT) {
    try {
      return await this.service.updateTaskStatus(taskId, newStatus, departmentId);
    } catch (error) {
      console.error(`Failed to update task ${taskId} status:`, error);
      throw error;
    }
  }

  async deleteTask(taskId, departmentId = getConfig().APP.DEFAULT_DEPARTMENT) {
    try {
      return await this.service.deleteTask(taskId, departmentId);
    } catch (error) {
      console.error(`Failed to delete task ${taskId}:`, error);
      throw error;
    }
  }

  // Analytics operations
  async getTaskAnalytics(departmentId = getConfig().APP.DEFAULT_DEPARTMENT, dateRange = null) {
    try {
      return await this.service.getTaskAnalytics(departmentId, dateRange);
    } catch (error) {
      console.error(`Failed to get analytics for department ${departmentId}:`, error);
      throw error;
    }
  }

  async getAssigneeAnalytics(departmentId = getConfig().APP.DEFAULT_DEPARTMENT) {
    try {
      return await this.service.getAssigneeAnalytics(departmentId);
    } catch (error) {
      console.error(`Failed to get assignee analytics for department ${departmentId}:`, error);
      throw error;
    }
  }

  // List management
  async checkListExists(departmentId = getConfig().APP.DEFAULT_DEPARTMENT) {
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

  async checkUserPermissions(departmentId = getConfig().APP.DEFAULT_DEPARTMENT) {
    try {
      return await this.service.checkUserPermissions(departmentId);
    } catch (error) {
      console.error('Failed to check user permissions:', error);
      return { canRead: false, canWrite: false, canDelete: false };
    }
  }

  // Utility methods
  getDefaultDepartment() {
    return getConfig().APP.DEFAULT_DEPARTMENT;
  }

  isSharePointDeployment() {
    return getConfig().DEPLOYMENT.TYPE === 'sharepoint';
  }

  isStandaloneDeployment() {
    return getConfig().DEPLOYMENT.TYPE === 'standalone';
  }

  getApiUrl() {
    return getConfig().DEPLOYMENT.API_URL;
  }

  async getSiteGroups() {
    try {
      return await this.service.getSiteGroups();
    } catch (error) {
      console.error('Failed to get site groups:', error);
      return [];
    }
  }

  async getCurrentUserGroups() {
    try {
      return await this.service.getCurrentUserGroups();
    } catch (error) {
      console.error('Failed to get current user groups:', error);
      return [];
    }
  }
}

// Export singleton instance (lazy initialization)
let _dataService = null;

const getDataService = () => {
  if (!_dataService) {
    _dataService = new DataService();
  }
  return _dataService;
};

// Export the getter function as default
export default getDataService;

// Export class for testing purposes
export { DataService };