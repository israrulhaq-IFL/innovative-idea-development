import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SharePointService } from '../services/sharePointService';

// Mock fetch globally
global.fetch = vi.fn();

describe('SharePointService', () => {
  let service;

  beforeEach(() => {
    vi.clearAllMocks();
    // Create a new service instance with mocked URL
    service = new SharePointService();
    service.siteUrl = 'http://test.sharepoint.com';
  });

  describe('getCurrentUser', () => {
    it('should return user data on successful API call', async () => {
      const mockUser = {
        Id: 1,
        Title: 'Test User',
        Email: 'test@example.com',
        LoginName: 'test@example.com',
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ d: mockUser }),
      });

      const result = await service.getCurrentUser();

      expect(fetch).toHaveBeenCalledWith(
        'http://test.sharepoint.com/_api/web/currentuser',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Accept: 'application/json;odata=verbose',
          }),
        }),
      );
      expect(result).toEqual(mockUser);
    });

    it('should return mock data on API failure', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await service.getCurrentUser();

      expect(result).toEqual({
        Id: 1,
        Title: 'Demo User',
        Email: 'demo@company.com',
        LoginName: 'demo@company.com',
      });
    });
  });

  describe('getUserPermissions', () => {
    it('should mark HOD as view-all and read-only', async () => {
      service.getCurrentUserGroups = vi
        .fn()
        .mockResolvedValue([{ Title: 'HOD' }]);

      const result = await service.getUserPermissions();

      expect(result.userCategory).toBe('hod');
      expect(result.canViewAll).toBe(true);
      expect(result.canEdit).toBe(false);
      expect(result.allowedDepartments).toEqual([
        'infra',
        'erp',
        'ops',
        'network',
      ]);
      expect(result.canEditDepartments).toEqual([]);
    });

    it('should mark ITG management as view-all but edit-only for dept-manager memberships', async () => {
      service.getCurrentUserGroups = vi
        .fn()
        .mockResolvedValue([
          { Title: 'ITG Managers' },
          { Title: 'DCI Manager' },
        ]);

      const result = await service.getUserPermissions();

      expect(result.userCategory).toBe('manager');
      expect(result.canViewAll).toBe(true);
      expect(result.canEditDepartments).toEqual(['infra']);
      expect(result.canEdit).toBe(true);
    });

    it('should mark department member as view/edit that department only', async () => {
      service.getCurrentUserGroups = vi
        .fn()
        .mockResolvedValue([{ Title: 'ERP Member' }]);

      const result = await service.getUserPermissions();

      expect(result.userCategory).toBe('team_member');
      expect(result.canViewAll).toBe(false);
      expect(result.allowedDepartments).toEqual(['erp']);
      expect(result.canEditDepartments).toEqual(['erp']);
      expect(result.canEdit).toBe(true);
    });

    it('should prioritize department membership over monitoring for users with both roles', async () => {
      service.getCurrentUserGroups = vi
        .fn()
        .mockResolvedValue([
          { Title: 'dci' },
          { Title: 'designers' },
          { Title: 'monitorining server infrastructure visitors' },
        ]);

      const result = await service.getUserPermissions();

      expect(result.userCategory).toBe('team_member');
      expect(result.canViewAll).toBe(false);
      expect(result.allowedDepartments).toEqual(['infra']);
      expect(result.canEditDepartments).toEqual(['infra']);
      expect(result.canEdit).toBe(true);
      expect(result.department).toBe('infra');
    });

    it('should treat users with "erp" group as ERP department members with edit rights', async () => {
      service.getCurrentUserGroups = vi
        .fn()
        .mockResolvedValue([
          { Title: 'designers' },
          { Title: 'erp' },
          { Title: 'monitorining server infrastructure visitors' },
        ]);

      const result = await service.getUserPermissions();

      expect(result.userCategory).toBe('team_member');
      expect(result.canViewAll).toBe(false);
      expect(result.allowedDepartments).toEqual(['erp']);
      expect(result.canEditDepartments).toEqual(['erp']);
      expect(result.canEdit).toBe(true);
      expect(result.department).toBe('erp');
    });

    it('should treat users with "Operations" group as Operations department members with edit rights', async () => {
      service.getCurrentUserGroups = vi
        .fn()
        .mockResolvedValue([
          { Title: 'Designers' },
          { Title: 'Monitorining Server Infrastructure Visitors' },
          { Title: 'Operations' },
        ]);

      const result = await service.getUserPermissions();

      expect(result.userCategory).toBe('team_member');
      expect(result.canViewAll).toBe(false);
      expect(result.allowedDepartments).toEqual(['ops']);
      expect(result.canEditDepartments).toEqual(['ops']);
      expect(result.canEdit).toBe(true);
      expect(result.department).toBe('ops');
    });
  });

  describe('getDepartments', () => {
    it('should return all departments for users with canViewAll permission', async () => {
      const permissions = { canViewAll: true };

      const result = await service.getDepartments(permissions);

      expect(result).toEqual([
        {
          id: 'infra',
          name: 'Data Center & Cloud Infrastructure',
          listName: 'si_tasklist',
          guid: 'e41bb365-20be-4724-8ff8-18438d9c2354',
        },
        {
          id: 'erp',
          name: 'ERP & Software Development',
          listName: 'erp_tasklist',
          guid: '4693a94b-4a71-4821-b8c1-3a6fc8cdac69',
        },
        {
          id: 'ops',
          name: 'ITG Operations',
          listName: 'ops_tasklist',
          guid: '6eb2cec0-f94f-47ae-8745-5e48cd52ffd9',
        },
        {
          id: 'network',
          name: 'Networks & Security',
          listName: 'networks_tasklist',
          guid: '1965d5a7-b9f0-4066-b2c5-8d9b8a442537',
        },
      ]);
    });

    it('should return user department for restricted users', async () => {
      const permissions = { canViewAll: false, allowedDepartments: ['erp'] };

      const result = await service.getDepartments(permissions);

      // Should return only allowed departments
      expect(result).toEqual([
        {
          id: 'erp',
          name: 'ERP & Software Development',
          listName: 'erp_tasklist',
          guid: '4693a94b-4a71-4821-b8c1-3a6fc8cdac69',
        },
      ]);
    });

    it('should return default department for users without department', async () => {
      const permissions = { canViewAll: false, department: null };

      const result = await service.getDepartments(permissions);

      expect(result).toEqual([
        {
          id: 'infra',
          name: 'Data Center & Cloud Infrastructure',
          listName: 'si_tasklist',
          guid: 'e41bb365-20be-4724-8ff8-18438d9c2354',
        },
      ]);
    });
  });

  describe('getTasks', () => {
    it('should fetch tasks from SharePoint API', async () => {
      const mockTasks = [
        { Id: 1, Title: 'Task 1', Status: 'In Progress' },
        { Id: 2, Title: 'Task 2', Status: 'Completed' },
      ];

      // Mock checkListExists to return true
      fetch.mockResolvedValueOnce({
        ok: true,
      });

      // Mock getTasks API call
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ d: { results: mockTasks } }),
      });

      const result = await service.getTasks();

      expect(fetch).toHaveBeenCalledWith(
        "http://test.sharepoint.com/_api/web/lists(guid'e41bb365-20be-4724-8ff8-18438d9c2354')/items?$orderby=Created desc&$select=Id,Title,Body,Status,Priority,PercentComplete,AssignedTo/Title,StartDate,DueDate,Created,Modified,tonc,Attachments&$expand=AssignedTo",
        expect.any(Object),
      );
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('Id', 1);
      expect(result[0]).toHaveProperty(
        'Department',
        'Data Center & Cloud Infrastructure',
      );
    });

    it('should filter tasks by department when departmentFilter provided', async () => {
      fetch.mockRejectedValueOnce(new Error('API error'));

      const result = await service.getTasks(
        {
          canViewAll: true,
          allowedDepartments: ['infra', 'erp', 'ops', 'network'],
        },
        'erp',
      );

      // Should return filtered mock data
      expect(result.every((task) => task.DepartmentId === 'erp')).toBe(true);
    });

    it('should filter tasks by user permissions', async () => {
      fetch.mockRejectedValueOnce(new Error('API error'));

      const permissions = {
        canViewAll: false,
        allowedDepartments: ['network'],
      };
      const result = await service.getTasks(permissions);

      expect(
        result.every((task) =>
          permissions.allowedDepartments.includes(task.DepartmentId),
        ),
      ).toBe(true);
    });
  });

  describe('getAnalyticsData', () => {
    it('should calculate analytics from tasks', async () => {
      fetch.mockRejectedValueOnce(new Error('API error'));

      const result = await service.getAnalyticsData();

      expect(result).toHaveProperty('totalTasks');
      expect(result).toHaveProperty('completedTasks');
      expect(result).toHaveProperty('completionRate');
      expect(typeof result.totalTasks).toBe('number');
    });

    it('should return zero values when no tasks', async () => {
      // Mock empty tasks
      const originalGetTasks = service.getTasks;
      service.getTasks = vi.fn().mockResolvedValue([]);

      const result = await service.getAnalyticsData();

      expect(result.totalTasks).toBe(0);
      expect(result.completionRate).toBe(0);

      // Restore
      service.getTasks = originalGetTasks;
    });
  });

  describe('updateTaskStatus', () => {
    it('should update task status via API', async () => {
      // Mock checkListExists response
      fetch.mockResolvedValueOnce({
        ok: true,
      });

      // Mock getRequestDigest response
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            d: {
              GetContextWebInformation: {
                FormDigestValue: 'test-digest',
              },
            },
          }),
      });

      // Mock update response
      fetch.mockResolvedValueOnce({
        ok: true,
      });

      const result = await service.updateTaskStatus(1, 'Completed');

      expect(result).toBe(true);
      expect(fetch).toHaveBeenCalledTimes(3);

      // Check second call (getRequestDigest)
      expect(fetch).toHaveBeenNthCalledWith(
        2,
        'http://test.sharepoint.com/_api/contextinfo',
        expect.objectContaining({ method: 'POST' }),
      );

      // Check third call (update)
      expect(fetch).toHaveBeenNthCalledWith(
        3,
        "http://test.sharepoint.com/_api/web/lists(guid'e41bb365-20be-4724-8ff8-18438d9c2354')/items(1)",
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'X-RequestDigest': 'test-digest',
          }),
        }),
      );
    });

    it('should return true even on API failure (mock success)', async () => {
      fetch.mockRejectedValueOnce(new Error('API error'));

      const result = await service.updateTaskStatus(1, 'Completed');

      expect(result).toBe(true);
    });
  });
});
