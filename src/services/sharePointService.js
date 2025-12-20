// SharePoint REST API Service for task management dashboard
class SharePointService {
  constructor() {
    this.siteUrl = window.location.origin;

    // Department-specific task list configuration
    this.departments = {
      'infra': {
        name: 'Data Center & Cloud Infrastructure',
        listName: 'si_tasklist',
        guid: 'e41bb365-20be-4724-8ff8-18438d9c2354'
      },
      'erp': {
        name: 'ERP & Software Development',
        listName: 'erp_tasklist',
        guid: '4693a94b-4a71-4821-b8c1-3a6fc8cdac69'
      },
      'ops': {
        name: 'ITG Operations',
        listName: 'ops_tasklist',
        guid: '6eb2cec0-f94f-47ae-8745-5e48cd52ffd9'
      },
      'network': {
        name: 'Networks & Security',
        listName: 'networks_tasklist',
        guid: '1965d5a7-b9f0-4066-b2c5-8d9b8a442537'
      }
    };

    // Default department (can be changed based on user permissions)
    this.defaultDepartment = 'infra';

    this.listExists = null; // Cache for list existence check
    this.checkingList = null; // Promise for ongoing list check
  }

  normalizeGroupName(name) {
    return String(name || '')
      .toLowerCase()
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  groupMatchesAny(groupNames, patterns) {
    return groupNames.some((groupName) => {
      return patterns.some((pattern) => {
        // Use word boundaries for more precise matching
        const regex = new RegExp(`\\b${this.escapeRegExp(pattern)}\\b`, 'i');
        return regex.test(groupName);
      });
    });
  }

  // Helper function to escape special regex characters
  escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Get list GUID for a specific department
  getListGuid(departmentId = null) {
    const deptId = departmentId || this.defaultDepartment;
    const department = this.departments[deptId];
    return department ? department.guid : null;
  }

  // Get list name for a specific department
  getListName(departmentId = null) {
    const deptId = departmentId || this.defaultDepartment;
    const department = this.departments[deptId];
    return department ? department.listName : this.departments[this.defaultDepartment].listName;
  }

  // Get department name for display
  getDepartmentName(departmentId = null) {
    const deptId = departmentId || this.defaultDepartment;
    const department = this.departments[deptId];
    return department ? department.name : this.departments[this.defaultDepartment].name;
  }

  // Check if SharePoint list exists for a specific department
  async checkListExists(departmentId = null) {
    const listName = this.getListName(departmentId);
    const listGuid = this.getListGuid(departmentId);

    // Use department-specific cache key
    const cacheKey = `listExists_${listName}`;
    if (this[cacheKey] !== undefined) {
      return this[cacheKey];
    }

    // If already checking, wait for the result
    if (this.checkingList) {
      return this.checkingList;
    }

    // Start checking
    this.checkingList = this._checkListExistsInternal(listName, listGuid);
    try {
      const result = await this.checkingList;
      this[cacheKey] = result;
      return result;
    } finally {
      this.checkingList = null;
    }
  }

  async _checkListExistsInternal(listName, listGuid) {
    try {
      const apiUrl = listGuid
        ? `${this.siteUrl}/_api/web/lists(guid'${listGuid}')`
        : `${this.siteUrl}/_api/web/lists/getbytitle('${encodeURIComponent(listName)}')`;

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json;odata=verbose',
          'Content-Type': 'application/json;odata=verbose'
        },
        credentials: 'same-origin'
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to check if list exists:', error);
      return false;
    }
  }

  // Get request digest for POST operations
  async getRequestDigest() {
    try {
      const response = await fetch(`${this.siteUrl}/_api/contextinfo`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json;odata=verbose',
          'Content-Type': 'application/json;odata=verbose'
        },
        credentials: 'same-origin'
      });

      if (!response.ok) {
        throw new Error('Failed to get request digest');
      }

      const data = await response.json();
      return data.d.GetContextWebInformation.FormDigestValue;
    } catch (error) {
      console.error('Failed to get request digest:', error);
      throw error;
    }
  }

  // Get current user information
  async getCurrentUser() {
    try {
      const response = await fetch(`${this.siteUrl}/_api/web/currentuser`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json;odata=verbose',
          'Content-Type': 'application/json;odata=verbose'
        },
        credentials: 'same-origin'
      });

      if (!response.ok) {
        throw new Error('Failed to get current user');
      }

      const data = await response.json();
      const user = data.d;
      return {
        Id: user.Id,
        Title: user.Title,
        Email: user.Email,
        LoginName: user.LoginName
      };
    } catch (error) {
      console.error('Failed to get current user:', error);
      // Return mock data for development
      return {
        Id: 1,
        Title: 'Demo User',
        Email: 'demo@company.com',
        LoginName: 'demo@company.com'
      };
    }
  }

  // Get user permissions based on SharePoint groups
  async getUserPermissions() {
    try {
      console.log('🔐 Getting user permissions based on SharePoint groups...');

      // Get current user's group memberships
      const userGroups = await this.getCurrentUserGroups();
      const groupNames = userGroups.map((g) => this.normalizeGroupName(g.Title));

      console.log('👤 User groups:', groupNames);

      const ALL_DEPARTMENTS = ['infra', 'erp', 'ops', 'network'];
      const DEPT_RULES = {
        infra: {
          memberPatterns: ['dci', 'dci member', 'dci team', 'dci dept member', 'data center member', 'datacenter member'],
          managerPatterns: ['dci manager', 'dci dept manager', 'data center manager', 'datacenter manager', 'infra manager']
        },
        erp: {
          memberPatterns: ['erp', 'erp member', 'erp team', 'erp dept member', 'software development member'],
          managerPatterns: ['erp manager', 'erp managers', 'erp dept manager', 'software manager', 'software development manager']
        },
        ops: {
          memberPatterns: ['ops', 'operations', 'operations member', 'ops member', 'ops team', 'ops dept member', 'itg operations member'],
          managerPatterns: ['operations manager', 'ops manager', 'ops dept manager', 'itg operations manager']
        },
        network: {
          memberPatterns: ['network', 'networks', 'network member', 'networks member', 'network team', 'network dept member', 'security member'],
          managerPatterns: ['network manager', 'networks manager', 'network dept manager', 'security manager']
        }
      };

      const isHod = this.groupMatchesAny(groupNames, ['hod', 'head of department', 'hod member']);
      const isItgManager = this.groupMatchesAny(groupNames, ['itg manager', 'itg managers', 'itg management', 'management member', 'itg dept manager']);
      const isMonitoring = this.groupMatchesAny(groupNames, ['monitoring', 'monitorining', 'monitor', 'monitoring member', 'monitorining member', 'monitor member', 'itg monitoring', 'server infrastructure visitors', 'infrastructure visitors']);

      const deptMember = {};
      const deptManager = {};
      for (const deptId of ALL_DEPARTMENTS) {
        const rules = DEPT_RULES[deptId];
        deptMember[deptId] = this.groupMatchesAny(groupNames, rules.memberPatterns);
        deptManager[deptId] =
          this.groupMatchesAny(groupNames, rules.managerPatterns) ||
          (deptMember[deptId] && this.groupMatchesAny(groupNames, [`${deptId} manager`, 'manager']));

        console.log(`🔍 ${deptId} membership check:`, {
          groupNames,
          memberPatterns: rules.memberPatterns,
          managerPatterns: rules.managerPatterns,
          isMember: deptMember[deptId],
          isManager: deptManager[deptId]
        });
      }

      const permissions = {
        isManagement: isItgManager,
        isExecutive: isHod,
        isMonitoring: isMonitoring,
        department: null,
        canViewAll: isHod || isItgManager || isMonitoring,
        canEdit: false,
        canEditDepartments: [],
        userCategory: 'limited',
        allowedDepartments: [],
        rawGroupNames: groupNames
      };

      if (isHod) {
        permissions.userCategory = 'hod';
        permissions.allowedDepartments = [...ALL_DEPARTMENTS];
        permissions.canEditDepartments = [];
        permissions.canEdit = false;
        console.log('👑 User is HOD - can view all, edit none');
        return permissions;
      }

      if (isItgManager) {
        permissions.userCategory = 'manager';
        permissions.allowedDepartments = [...ALL_DEPARTMENTS];
        permissions.canEditDepartments = []; // ITG Managers have view-only access by default

        // But if they also have department-specific manager roles, they can edit those departments
        for (const deptId of ALL_DEPARTMENTS) {
          if (deptManager[deptId]) {
            permissions.canEditDepartments.push(deptId);
          }
        }

        permissions.canEdit = permissions.canEditDepartments.length > 0;
        permissions.department = permissions.canEditDepartments.length === 1 ? permissions.canEditDepartments[0] : null;
        console.log('👔 User is ITG Manager - can view all departments, edit departments:', permissions.canEditDepartments);
        return permissions;
      }

      // Check for department membership first (prioritize over monitoring)
      for (const deptId of ALL_DEPARTMENTS) {
        if (deptMember[deptId] || deptManager[deptId]) {
          permissions.allowedDepartments.push(deptId);
        }
      }

      if (permissions.allowedDepartments.length > 0) {
        permissions.userCategory = 'team_member';
        permissions.canViewAll = false; // Department members should only see their departments
        permissions.canEditDepartments = [...permissions.allowedDepartments];
        permissions.canEdit = true;
        permissions.department = permissions.allowedDepartments.length === 1 ? permissions.allowedDepartments[0] : null;
        console.log('👷 User is team member - allowed departments:', permissions.allowedDepartments);
        console.log('📊 Final permissions:', permissions);
        return permissions;
      }

      // If no department membership, check for monitoring access
      if (isMonitoring) {
        permissions.userCategory = 'monitoring';
        permissions.allowedDepartments = [...ALL_DEPARTMENTS];
        permissions.canEditDepartments = [];
        permissions.canEdit = false;
        permissions.department = null;
        console.log('👁️ User is in Monitoring - can view all departments, edit none');
        return permissions;
      }

      // Fallback: no department access
      permissions.userCategory = 'limited';
      permissions.allowedDepartments = []; // No departments allowed
      permissions.canEditDepartments = [];
      permissions.canEdit = false;
      console.log('⚠️ User has limited access - no department access granted');
      console.log('📊 Final permissions:', permissions);
      return permissions;
    } catch (error) {
      console.error('Failed to get user permissions:', error);
      return {
        isManagement: false,
        isExecutive: false,
        department: null,
        canViewAll: false,
        canEdit: false,
        canEditDepartments: [],
        userCategory: 'limited',
        allowedDepartments: [], // No departments allowed on error
        rawGroupNames: []
      };
    }
  }

  // Get SharePoint site groups
  async getSiteGroups() {
    try {
      console.log('🔐 Getting SharePoint site groups...');

      const response = await fetch(`${this.siteUrl}/_api/web/sitegroups`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json;odata=verbose',
          'Content-Type': 'application/json;odata=verbose'
        },
        credentials: 'same-origin'
      });

      if (!response.ok) {
        throw new Error('Failed to get site groups');
      }

      const data = await response.json();
      const groups = data.d.results.map(group => ({
        Id: group.Id,
        Title: group.Title,
        Description: group.Description,
        OwnerTitle: group.OwnerTitle,
        LoginName: group.LoginName
      }));

      console.log('✅ Found site groups:', groups);
      return groups;
    } catch (error) {
      console.error('Failed to get site groups:', error);
      // Return mock groups for development
      return [
        {
          Id: 1,
          Title: 'ITG Owners',
          Description: 'Site owners with full control',
          OwnerTitle: 'System Account',
          LoginName: 'ITG Owners'
        },
        {
          Id: 2,
          Title: 'ITG Members',
          Description: 'Site members with contribute permissions',
          OwnerTitle: 'System Account',
          LoginName: 'ITG Members'
        },
        {
          Id: 3,
          Title: 'ITG Visitors',
          Description: 'Site visitors with read permissions',
          OwnerTitle: 'System Account',
          LoginName: 'ITG Visitors'
        }
      ];
    }
  }

  // Get users in a specific group
  async getGroupUsers(groupId) {
    try {
      console.log(`👥 Getting users for group ID: ${groupId}`);

      const response = await fetch(`${this.siteUrl}/_api/web/sitegroups(${groupId})/users`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json;odata=verbose',
          'Content-Type': 'application/json;odata=verbose'
        },
        credentials: 'same-origin'
      });

      if (!response.ok) {
        throw new Error('Failed to get group users');
      }

      const data = await response.json();
      const users = data.d.results.map(user => ({
        Id: user.Id,
        Title: user.Title,
        Email: user.Email,
        LoginName: user.LoginName,
        IsSiteAdmin: user.IsSiteAdmin
      }));

      console.log(`✅ Found ${users.length} users in group:`, users);
      return users;
    } catch (error) {
      console.error('Failed to get group users:', error);
      // Return mock users for development
      return [
        {
          Id: 1,
          Title: 'John Doe',
          Email: 'john.doe@company.com',
          LoginName: 'john.doe@company.com',
          IsSiteAdmin: false
        },
        {
          Id: 2,
          Title: 'Jane Smith',
          Email: 'jane.smith@company.com',
          LoginName: 'jane.smith@company.com',
          IsSiteAdmin: false
        }
      ];
    }
  }

  // Get current user's group memberships
  async getCurrentUserGroups() {
    try {
      console.log('👤 Getting current user group memberships...');

      const response = await fetch(`${this.siteUrl}/_api/web/currentuser/groups`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json;odata=verbose',
          'Content-Type': 'application/json;odata=verbose'
        },
        credentials: 'same-origin'
      });

      if (!response.ok) {
        throw new Error('Failed to get user groups');
      }

      const data = await response.json();
      const groups = data.d.results.map(group => ({
        Id: group.Id,
        Title: group.Title,
        Description: group.Description,
        OwnerTitle: group.OwnerTitle,
        LoginName: group.LoginName
      }));

      console.log('✅ Current user is member of groups:', groups);
      return groups;
    } catch (error) {
      console.error('Failed to get current user groups:', error);
      // Return mock groups for development
      return [
        {
          Id: 2,
          Title: 'ITG Members',
          Description: 'Site members with contribute permissions',
          OwnerTitle: 'System Account',
          LoginName: 'ITG Members'
        }
      ];
    }
  }

  // Get departments based on user permissions
  async getDepartments(userPermissions) {
    try {
      // Return departments from our configuration
      const allDepartments = Object.entries(this.departments).map(([id, dept]) => ({
        id: id,
        name: dept.name,
        listName: dept.listName,
        guid: dept.guid
      }));

      if (userPermissions.canViewAll) {
        return allDepartments;
      } else if (userPermissions.allowedDepartments && userPermissions.allowedDepartments.length > 0) {
        return allDepartments.filter((d) => userPermissions.allowedDepartments.includes(d.id));
      } else {
        return [allDepartments[0]]; // Default to first department
      }
    } catch (error) {
      console.error('Failed to get departments:', error);
      return [{
        id: this.defaultDepartment,
        name: this.departments[this.defaultDepartment].name,
        listName: this.departments[this.defaultDepartment].listName
      }];
    }
  }

  // Get tasks from SharePoint list
  async getTasks(permissions = {}, departmentFilter = null, departmentId = null) {
    // Determine which departments this user can access
    const allDepartmentIds = ['infra', 'erp', 'ops', 'network'];
    const allowedDepartments = permissions.canViewAll
      ? allDepartmentIds
      : (permissions.allowedDepartments && permissions.allowedDepartments.length > 0)
          ? permissions.allowedDepartments
          : ['infra'];

    const requestedDepartmentId = departmentId || departmentFilter;
    if (requestedDepartmentId && !allowedDepartments.includes(requestedDepartmentId)) {
      console.log(`🚫 User does not have access to department: ${requestedDepartmentId}`);
      return [];
    }

    // If a specific department is requested, fetch only that one; otherwise fetch all allowed.
    const departmentsToFetch = requestedDepartmentId ? [requestedDepartmentId] : allowedDepartments;

    console.log('🔍 Fetching tasks for departments:', departmentsToFetch);
    console.log('👤 User permissions:', {
      canViewAll: permissions.canViewAll,
      allowedDepartments: permissions.allowedDepartments,
      userCategory: permissions.userCategory
    });

    const allTasks = [];

    // Fetch tasks from each allowed department
    for (const dept of departmentsToFetch) {
      try {
        const listName = this.getListName(dept);
        console.log(`📋 Fetching from ${dept} list: ${listName}`);

        // Check if list exists first
        const listExists = await this.checkListExists(dept);
        if (!listExists) {
          console.log(`📋 List does not exist for ${dept}, using mock data`);
          const mockTasks = this.getMockTasks(permissions, departmentFilter, dept);
          allTasks.push(...mockTasks);
          continue;
        }

        // Use GUID instead of title for more reliable access
        const listGuid = this.getListGuid(dept);
        const apiUrl = listGuid
          ? `${this.siteUrl}/_api/web/lists(guid'${listGuid}')/items?$orderby=Created desc&$select=Id,Title,Body,Status,Priority,PercentComplete,AssignedTo/Title,StartDate,DueDate,Created,Modified,tonc,Attachments&$expand=AssignedTo`
          : `${this.siteUrl}/_api/web/lists/getbytitle('${encodeURIComponent(listName)}')/items?$orderby=Created desc&$select=Id,Title,Body,Status,Priority,PercentComplete,AssignedTo/Title,StartDate,DueDate,Created,Modified,tonc,Attachments&$expand=AssignedTo`;

        console.log('🌐 API URL:', apiUrl);

        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json;odata=verbose',
            'Content-Type': 'application/json;odata=verbose'
          },
          credentials: 'same-origin'
        });

        if (!response.ok) {
          console.error('❌ API Response:', response.status, response.statusText);
          throw new Error(`Failed to get tasks from ${dept}: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        let tasks = data.d.results.map(task => {
          // Handle AssignedTo field properly - can be single user or multiple users
          let assigneeName = 'Unassigned';
          let allAssignees = [];

          if (task.AssignedTo) {
            if (task.AssignedTo.results) {
              // Multiple assignees case
              allAssignees = task.AssignedTo.results.map(user => ({
                Id: user.Id,
                Title: user.Title,
                Email: user.Email || user.EMail
              }));
              assigneeName = allAssignees.length > 0 ? allAssignees[0].Title : 'Unassigned';
            } else if (task.AssignedTo.Title) {
              // Single assignee case
              const assignee = {
                Id: task.AssignedTo.Id,
                Title: task.AssignedTo.Title,
                Email: task.AssignedTo.Email || task.AssignedTo.EMail
              };
              allAssignees = [assignee];
              assigneeName = task.AssignedTo.Title;
            }
          }

          return {
            Id: task.Id,
            Title: task.Title,
            Description: task.Body || task.Description || '',
            Status: task.Status,
            Priority: task.Priority,
            PercentComplete: task.PercentComplete || 0,
            AssignedTo: allAssignees,
            AssignedToId: allAssignees.map(a => a.Id),
            StartDate: task.StartDate,
            DueDate: task.DueDate,
            Created: task.Created,
            Modified: task.Modified,
            Remarks: task.tonc || '',
            DepartmentId: dept,
            Department: this.getDepartmentName(dept),
            Attachments: task.Attachments || false
          };
        });

        allTasks.push(...tasks);
        console.log(`✅ Loaded ${tasks.length} tasks from ${dept}`);

      } catch (error) {
        console.error(`Failed to get tasks from ${dept}:`, error);
        // Return mock data for this department
        const mockTasks = this.getMockTasks(permissions, departmentFilter, dept);
        allTasks.push(...mockTasks);
      }
    }

    console.log(`📊 Total tasks loaded: ${allTasks.length}`);
    return allTasks;
  }

  // Get analytics data
  async getAnalyticsData(permissions = {}, departmentFilter = null, departmentId = null) {
    try {
      let tasks = await this.getTasks(permissions, departmentFilter, departmentId);

      const analytics = {
        totalTasks: tasks.length,
        completedTasks: tasks.filter(t => t.Status === 'Completed').length,
        inProgressTasks: tasks.filter(t => t.Status === 'In Progress').length,
        overdueTasks: tasks.filter(t => {
          if (!t.DueDate || t.Status === 'Completed') return false;
          return new Date(t.DueDate) < new Date();
        }).length,
        completionRate: tasks.length > 0 ?
          Math.round((tasks.filter(t => t.Status === 'Completed').length / tasks.length) * 100) : 0,
        avgCompletionTime: this.calculateAverageCompletionTime(tasks)
      };

      return analytics;
    } catch (error) {
      console.error('Failed to get analytics:', error);
      return {
        totalTasks: 0,
        completedTasks: 0,
        inProgressTasks: 0,
        overdueTasks: 0,
        completionRate: 0,
        avgCompletionTime: 0
      };
    }
  }

  // Calculate average completion time in days
  calculateAverageCompletionTime(tasks) {
    const completedTasks = tasks.filter(t => t.Status === 'Completed' && t.Created && t.Modified);

    if (completedTasks.length === 0) return 0;

    const totalDays = completedTasks.reduce((sum, task) => {
      const created = new Date(task.Created);
      const modified = new Date(task.Modified);
      const diffTime = modified - created;
      const diffDays = diffTime / (1000 * 60 * 60 * 24);
      return sum + diffDays;
    }, 0);

    return Math.round(totalDays / completedTasks.length);
  }

  // Mock data for development
  getMockTasks(permissions = {}, departmentFilter = null, departmentId = null) {
    const statuses = ['Not Started', 'In Progress', 'Completed', 'On Hold', 'Cancelled'];
    const priorities = ['Low', 'Medium', 'High', 'Critical'];
    const mockAssignees = [
      { Id: 1, Title: 'John Doe', Email: 'john.doe@company.com' },
      { Id: 2, Title: 'Jane Smith', Email: 'jane.smith@company.com' },
      { Id: 3, Title: 'Bob Johnson', Email: 'bob.johnson@company.com' },
      { Id: 4, Title: 'Alice Brown', Email: 'alice.brown@company.com' },
      null
    ];

    // Use department names from our configuration
    const departmentNames = Object.values(this.departments).map(dept => dept.name);

    let tasks = Array.from({ length: 25 }, (_, i) => {
      const created = new Date();
      created.setDate(created.getDate() - Math.floor(Math.random() * 90));

      const dueDate = new Date(created);
      dueDate.setDate(dueDate.getDate() + Math.floor(Math.random() * 30) + 1);

      // Use the specified department or pick a random one from our configured departments
      const deptId = departmentId || Object.keys(this.departments)[Math.floor(Math.random() * Object.keys(this.departments).length)];
      const dept = this.getDepartmentName(deptId);

      const assignee = mockAssignees[Math.floor(Math.random() * mockAssignees.length)];

      return {
        Id: i + 1,
        Title: `Task ${i + 1}: ${['Update documentation', 'Fix bug in module', 'Implement new feature', 'Code review', 'Database optimization'][Math.floor(Math.random() * 5)]}`,
        Body: `Description for task ${i + 1}`,
        Status: statuses[Math.floor(Math.random() * statuses.length)],
        Priority: priorities[Math.floor(Math.random() * priorities.length)],
        PercentComplete: Math.random(),
        AssignedTo: assignee ? assignee : null, // Keep as single object for mock data
        AssignedToId: assignee ? [assignee.Id] : [],
        StartDate: created.toISOString(),
        DueDate: dueDate.toISOString(),
        Created: created.toISOString(),
        Modified: created.toISOString(),
        tonc: `Remarks for task ${i + 1}`,
        DepartmentId: deptId,
        Department: dept,
        Attachments: Math.random() > 0.8 // 20% chance of having attachments
      };
    });

    // Filter by department if specified
    if (departmentFilter) {
      tasks = tasks.filter(task => task.DepartmentId === departmentFilter);
    }

    // Filter by permissions
    if (!permissions.canViewAll && permissions.allowedDepartments && permissions.allowedDepartments.length > 0) {
      tasks = tasks.filter(task => permissions.allowedDepartments.includes(task.DepartmentId));
    }

    return tasks;
  }

  // Update task status
  async updateTaskStatus(taskId, newStatus, departmentId = null) {
    const listName = this.getListName(departmentId);
    const listGuid = this.getListGuid(departmentId);

    // Check if list exists first
    const listExists = await this.checkListExists(departmentId);
    if (!listExists) {
      return true; // Return success for mock
    }

    try {
      const digest = await this.getRequestDigest();

      const apiUrl = listGuid
        ? `${this.siteUrl}/_api/web/lists(guid'${listGuid}')/items(${taskId})`
        : `${this.siteUrl}/_api/web/lists/getbytitle('${encodeURIComponent(listName)}')/items(${taskId})`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Accept': 'application/json;odata=verbose',
          'Content-Type': 'application/json;odata=verbose',
          'X-RequestDigest': digest,
          'X-HTTP-Method': 'MERGE',
          'If-Match': '*'
        },
        credentials: 'same-origin',
        body: JSON.stringify({
          Status: newStatus
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update task status');
      }

      return true;
    } catch (error) {
      console.error('Failed to update task status:', error);
      // For mock, just return success
      return true;
    }
  }
}

// Export singleton instance
const sharePointService = new SharePointService();
export default sharePointService;
