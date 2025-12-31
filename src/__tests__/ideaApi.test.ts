import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { IdeaApiService } from '../services/ideaApi';
import { sharePointApi } from '../utils/secureApi';

// Mock the secureApi module
jest.mock('../utils/secureApi', () => ({
  sharePointApi: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
  },
  DEFAULT_CONFIG: {
    baseUrl: 'http://test.sharepoint.com',
    lists: {
      ideas: 'innovative_ideas',
      tasks: 'ino_ideas_tasks',
      discussions: 'innovative_idea_discussions',
      ideaTrail: 'innovative_idea_trail',
    },
  },
}));

// Mock logger
jest.mock('../utils/logger', () => ({
  logError: jest.fn(),
  logInfo: jest.fn(),
}));

describe('IdeaApiService - Trail Logging', () => {
  let ideaApi;
  let mockSharePointApi;

  beforeEach(() => {
    jest.clearAllMocks();
    ideaApi = new IdeaApiService();
    mockSharePointApi = sharePointApi;

    // Mock successful API responses
    mockSharePointApi.get.mockResolvedValue({
      d: {
        results: [],
        ListItemEntityTypeFullName: 'SP.Data.Innovative_x005f_ideasListItem',
      },
    });

    mockSharePointApi.post.mockResolvedValue({
      d: { ID: 1 },
    });

    mockSharePointApi.put.mockResolvedValue({
      d: { ID: 1 },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Idea Creation Trail Logging', () => {
    it('should create trail event when idea is created', async () => {
      const ideaData = {
        title: 'Test Idea',
        description: 'Test Description',
        category: 'Technology',
        priority: 'High',
        status: 'Pending',
      };

      const user = { id: 1, name: 'Test User' };

      // Mock the idea creation response
      mockSharePointApi.post.mockResolvedValueOnce({
        d: { ID: 123 },
      });

      // Mock getIdeaById response
      mockSharePointApi.get.mockResolvedValueOnce({
        d: {
          ID: 123,
          Title: 'Test Idea',
          Description: 'Test Description',
          Status: 'Pending',
          Category: 'Technology',
          Priority: 'High',
          Created: new Date().toISOString(),
          Modified: new Date().toISOString(),
          Author: { Id: 1, Title: 'Test User' },
        },
      });

      await ideaApi.createIdea(ideaData, user);

      // Verify trail event was created
      expect(mockSharePointApi.post).toHaveBeenCalledWith(
        '/_api/web/lists/getbytitle(\'innovative_idea_trail\')/items',
        expect.objectContaining({
          __metadata: {
            type: 'SP.Data.Innovative_x005f_idea_x005f_trailListItem',
          },
          IdeaId: 123,
          EventType: 'submitted',
          Title: 'Idea Submitted',
          Description: 'Idea "Test Idea" was submitted for review',
          ActorId: 1,
          NewStatus: 'Pending',
        })
      );
    });
  });

  describe('Idea Approval/Rejection Trail Logging', () => {
    it('should create trail event when idea is approved', async () => {
      const ideaId = 123;
      const newStatus = 'Approved';
      const user = { id: 1, name: 'Approver User' };

      // Mock current idea data
      const currentIdea = {
        id: 123,
        title: 'Test Idea',
        status: 'Pending',
        approvedBy: undefined,
      };

      // Mock getIdeaById for current idea (first call)
      mockSharePointApi.get.mockResolvedValueOnce({
        d: {
          ID: 123,
          Title: 'Test Idea',
          Status: 'Pending',
          ApprovedBy: null,
        },
      });

      // Mock the update and trail creation
      mockSharePointApi.put.mockResolvedValueOnce({});
      mockSharePointApi.post.mockResolvedValueOnce({ d: { ID: 1 } });

      // Mock getIdeaById for the updated idea (second call)
      mockSharePointApi.get.mockResolvedValueOnce({
        d: {
          ID: 123,
          Title: 'Test Idea',
          Status: 'Approved',
          ApprovedBy: { Id: 1, Title: 'Approver User' },
        },
      });

      await ideaApi.updateIdea(ideaId, { status: newStatus, approvedBy: user.id.toString() }, user);

      // Verify trail event was created for approval
      expect(mockSharePointApi.post).toHaveBeenCalledWith(
        '/_api/web/lists/getbytitle(\'innovative_idea_trail\')/items',
        expect.objectContaining({
          IdeaId: 123,
          EventType: 'approved',
          Title: 'Idea Approved',
          Description: 'Idea "Test Idea" status changed to Approved',
          ActorId: 1,
          PreviousStatus: 'Pending',
          NewStatus: 'Approved',
        })
      );
    });

    it('should create trail event when idea is rejected', async () => {
      const ideaId = 124;
      const newStatus = 'Rejected';
      const user = { id: 2, name: 'Approver User' };

      // Mock getIdeaById for current idea (first call)
      mockSharePointApi.get.mockResolvedValueOnce({
        d: {
          ID: 124,
          Title: 'Rejected Idea',
          Status: 'Pending',
          ApprovedBy: null,
        },
      });

      // Mock the update and trail creation
      mockSharePointApi.put.mockResolvedValueOnce({});
      mockSharePointApi.post.mockResolvedValueOnce({ d: { ID: 2 } });

      // Mock getIdeaById for the updated idea (second call)
      mockSharePointApi.get.mockResolvedValueOnce({
        d: {
          ID: 124,
          Title: 'Rejected Idea',
          Status: 'Rejected',
          ApprovedBy: { Id: 2, Title: 'Approver User' },
        },
      });

      await ideaApi.updateIdea(ideaId, { status: newStatus, approvedBy: user.id.toString() }, user);

      // Verify trail event was created for rejection
      expect(mockSharePointApi.post).toHaveBeenCalledWith(
        '/_api/web/lists/getbytitle(\'innovative_idea_trail\')/items',
        expect.objectContaining({
          IdeaId: 124,
          EventType: 'rejected',
          Title: 'Idea Rejected',
          Description: 'Idea "Rejected Idea" status changed to Rejected',
          ActorId: 2,
          PreviousStatus: 'Pending',
          NewStatus: 'Rejected',
        })
      );
    });
  });

  describe('Idea Updates Trail Logging', () => {
    it('should create trail event when idea title is updated', async () => {
      const ideaId = 125;
      const updates = { title: 'Updated Idea Title' };
      const user = { id: 3, name: 'Editor User' };

      // Mock current idea
      mockSharePointApi.get.mockResolvedValueOnce({
        d: {
          ID: 125,
          Title: 'Original Title',
          Description: 'Original Description',
          Status: 'Pending',
          Category: 'Technology',
          Priority: 'Medium',
        },
      });

      // Mock the update
      mockSharePointApi.put.mockResolvedValueOnce({});

      // Mock getIdeaById for updated idea
      mockSharePointApi.get.mockResolvedValueOnce({
        d: {
          ID: 125,
          Title: 'Updated Idea Title',
          Description: 'Original Description',
          Status: 'Pending',
          Category: 'Technology',
          Priority: 'Medium',
        },
      });

      await ideaApi.updateIdea(ideaId, updates, user);

      // Verify trail event was created
      expect(mockSharePointApi.post).toHaveBeenCalledWith(
        '/_api/web/lists/getbytitle(\'innovative_idea_trail\')/items',
        expect.objectContaining({
          IdeaId: 125,
          EventType: 'status_changed',
          Title: 'Idea Updated',
          Description: 'Idea "Original Title" title was updated',
          ActorId: 3,
        })
      );
    });

    it('should create trail event when multiple idea fields are updated', async () => {
      const ideaId = 126;
      const updates = {
        title: 'New Title',
        description: 'New Description',
        category: 'Process Improvement',
        priority: 'Critical',
      };
      const user = { id: 4, name: 'Editor User' };

      // Mock current idea
      mockSharePointApi.get.mockResolvedValueOnce({
        d: {
          ID: 126,
          Title: 'Old Title',
          Description: 'Old Description',
          Status: 'Pending',
          Category: 'Technology',
          Priority: 'Low',
        },
      });

      // Mock the update
      mockSharePointApi.put.mockResolvedValueOnce({});

      // Mock getIdeaById for updated idea
      mockSharePointApi.get.mockResolvedValueOnce({
        d: {
          ID: 126,
          Title: 'New Title',
          Description: 'New Description',
          Status: 'Pending',
          Category: 'Process Improvement',
          Priority: 'Critical',
        },
      });

      await ideaApi.updateIdea(ideaId, updates, user);

      // Verify trail event was created with multiple changes
      expect(mockSharePointApi.post).toHaveBeenCalledWith(
        '/_api/web/lists/getbytitle(\'innovative_idea_trail\')/items',
        expect.objectContaining({
          IdeaId: 126,
          EventType: 'status_changed',
          Title: 'Idea Updated',
          Description: 'Idea "Old Title" was updated (title, description, category, priority)',
          ActorId: 4,
          Metadata: expect.stringContaining('"changes":["title","description","category","priority"]'),
        })
      );
    });
  });

  describe('Task Creation Trail Logging', () => {
    it('should create trail event when task is created for idea', async () => {
      const ideaId = 200;
      const taskData = {
        title: 'Test Task',
        description: 'Task Description',
        status: 'Not Started',
        priority: 'High',
        percentComplete: 0,
        assignedTo: ['user1', 'user2'],
        startDate: new Date('2025-01-01'),
        dueDate: new Date('2025-01-15'),
      };
      const user = { id: 5, name: 'Task Creator' };

      // Mock list info
      mockSharePointApi.get.mockResolvedValueOnce({
        d: {
          ListItemEntityTypeFullName: 'SP.Data.Ino_x005f_ideas_x005f_tasksListItem',
        },
      });

      // Mock task creation
      mockSharePointApi.post.mockResolvedValueOnce({
        d: { ID: 300 },
      });

      // Mock getTaskById
      mockSharePointApi.get.mockResolvedValueOnce({
        d: {
          ID: 300,
          Title: 'Test Task',
          Body: 'Task Description',
          Status: 'Not Started',
          Priority: 'High',
          PercentComplete: 0,
          IdeaId: { Id: 200, Title: 'Parent Idea' },
        },
      });

      await ideaApi.createTaskForIdea(ideaId, taskData, user);

      // Verify trail event was created
      expect(mockSharePointApi.post).toHaveBeenCalledWith(
        '/_api/web/lists/getbytitle(\'innovative_idea_trail\')/items',
        expect.objectContaining({
          IdeaId: 200,
          TaskId: 300,
          EventType: 'task_created',
          Title: 'Task Created',
          Description: 'Task "Test Task" was created for the idea',
          ActorId: 5,
        })
      );
    });
  });

  describe('Task Updates Trail Logging', () => {
    it('should create trail event when task status is updated', async () => {
      const taskId = 300;
      const updates = { status: 'In Progress' };
      const user = { id: 6, name: 'Task Updater' };

      // Mock current task
      mockSharePointApi.get.mockResolvedValueOnce({
        d: {
          ID: 300,
          Title: 'Test Task',
          Status: 'Not Started',
          PercentComplete: 0,
          IdeaId: { Id: 200 },
        },
      });

      // Mock task update
      mockSharePointApi.put.mockResolvedValueOnce({});

      // Mock getTaskById for updated task
      mockSharePointApi.get.mockResolvedValueOnce({
        d: {
          ID: 300,
          Title: 'Test Task',
          Status: 'In Progress',
          PercentComplete: 0,
          IdeaId: { Id: 200 },
        },
      });

      await ideaApi.updateTask(taskId, updates, user);

      // Verify trail event was created
      expect(mockSharePointApi.post).toHaveBeenCalledWith(
        '/_api/web/lists/getbytitle(\'innovative_idea_trail\')/items',
        expect.objectContaining({
          IdeaId: 200,
          TaskId: 300,
          EventType: 'status_changed',
          Title: 'Task Updated',
          Description: 'Task "Test Task" status changed from Not Started to In Progress',
          ActorId: 6,
          PreviousStatus: 'Not Started',
          NewStatus: 'In Progress',
        })
      );
    });

    it('should create trail event when task progress is updated', async () => {
      const taskId = 301;
      const updates = { percentComplete: 50 };
      const user = { id: 7, name: 'Progress Updater' };

      // Mock current task
      mockSharePointApi.get.mockResolvedValueOnce({
        d: {
          ID: 301,
          Title: 'Progress Task',
          Status: 'In Progress',
          PercentComplete: 0.25, // Decimal value as stored in SharePoint
          IdeaId: { Id: 201 },
        },
      });

      // Mock task update
      mockSharePointApi.put.mockResolvedValueOnce({});

      // Mock getTaskById for updated task
      mockSharePointApi.get.mockResolvedValueOnce({
        d: {
          ID: 301,
          Title: 'Progress Task',
          Status: 'In Progress',
          PercentComplete: 0.5, // 50% as decimal
          IdeaId: { Id: 201 },
        },
      });

      await ideaApi.updateTask(taskId, updates, user);

      // Verify trail event was created
      expect(mockSharePointApi.post).toHaveBeenCalledWith(
        '/_api/web/lists/getbytitle(\'innovative_idea_trail\')/items',
        expect.objectContaining({
          IdeaId: 201,
          TaskId: 301,
          EventType: 'status_changed',
          Title: 'Task Updated',
          Description: 'Task "Progress Task" progress updated from 25% to 50%',
          ActorId: 7,
        })
      );
    });

    it('should create trail event when both status and progress are updated', async () => {
      const taskId = 302;
      const updates = { status: 'Completed', percentComplete: 100 };
      const user = { id: 8, name: 'Task Completer' };

      // Mock current task
      mockSharePointApi.get.mockResolvedValueOnce({
        d: {
          ID: 302,
          Title: 'Complete Task',
          Status: 'In Progress',
          PercentComplete: 0.75, // 75% as decimal
          IdeaId: { Id: 202 },
        },
      });

      // Mock task update
      mockSharePointApi.put.mockResolvedValueOnce({});

      // Mock getTaskById for updated task
      mockSharePointApi.get.mockResolvedValueOnce({
        d: {
          ID: 302,
          Title: 'Complete Task',
          Status: 'Completed',
          PercentComplete: 1.0, // 100% as decimal
          IdeaId: { Id: 202 },
        },
      });

      await ideaApi.updateTask(taskId, updates, user);

      // Verify trail event was created
      expect(mockSharePointApi.post).toHaveBeenCalledWith(
        '/_api/web/lists/getbytitle(\'innovative_idea_trail\')/items',
        expect.objectContaining({
          IdeaId: 202,
          TaskId: 302,
          EventType: 'status_changed',
          Title: 'Task Updated',
          Description: 'Task "Complete Task" status changed from In Progress to Completed and progress updated to 100%',
          ActorId: 8,
          PreviousStatus: 'In Progress',
          NewStatus: 'Completed',
        })
      );
    });
  });

  describe('Discussion Creation Trail Logging', () => {
    it('should create trail event when discussion is created for task', async () => {
      const taskId = 400;
      const discussionData = {
        title: 'Task Discussion',
        body: 'This is a discussion about the task progress.',
        author: 'Discussion Author',
        message: 'This is a discussion about the task progress.',
        timestamp: new Date(),
      };
      const user = { id: 9, name: 'Discussion Author' };

      // Mock current task to get idea ID
      mockSharePointApi.get.mockResolvedValueOnce({
        d: {
          ID: 400,
          Title: 'Parent Task',
          IdeaId: { Id: 203 },
        },
      });

      // Mock discussion creation
      mockSharePointApi.post.mockResolvedValueOnce({
        d: { ID: 500 },
      });

      // Mock get discussion response
      mockSharePointApi.get.mockResolvedValueOnce({
        d: {
          ID: 500,
          Title: 'Task Discussion',
          Body: 'This is a discussion about the task progress.',
          Created: new Date().toISOString(),
          Author: { Id: 9, Title: 'Discussion Author' },
        },
      });

      await ideaApi.createDiscussionForTask(taskId, discussionData, user);

      // Verify trail event was created
      expect(mockSharePointApi.post).toHaveBeenCalledWith(
        '/_api/web/lists/getbytitle(\'innovative_idea_trail\')/items',
        expect.objectContaining({
          IdeaId: 203,
          TaskId: 400,
          DiscussionId: 500,
          EventType: 'commented',
          Title: 'Discussion Added',
          Description: 'Discussion "Task Discussion" was added to task "Parent Task"',
          ActorId: 9,
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should not fail idea creation if trail event creation fails', async () => {
      const ideaData = {
        title: 'Test Idea',
        description: 'Test Description',
        category: 'Technology',
        priority: 'High',
        status: 'Pending',
      };
      const user = { id: 1, name: 'Test User' };

      // Mock idea creation success
      mockSharePointApi.post.mockResolvedValueOnce({
        d: { ID: 123 },
      });

      // Mock getIdeaById success
      mockSharePointApi.get.mockResolvedValueOnce({
        d: {
          ID: 123,
          Title: 'Test Idea',
          Description: 'Test Description',
          Status: 'Pending',
          Category: 'Technology',
          Priority: 'High',
          Created: new Date().toISOString(),
          Modified: new Date().toISOString(),
          Author: { Id: 1, Title: 'Test User' },
        },
      });

      // Mock trail event creation failure
      mockSharePointApi.post.mockRejectedValueOnce(new Error('Trail creation failed'));

      // Should still succeed despite trail failure
      const result = await ideaApi.createIdea(ideaData, user);
      expect(result.id).toBe(123);
      expect(result.title).toBe('Test Idea');
    });

    it('should not fail task update if trail event creation fails', async () => {
      const taskId = 300;
      const updates = { status: 'In Progress' };
      const user = { id: 6, name: 'Task Updater' };

      // Mock current task
      mockSharePointApi.get.mockResolvedValueOnce({
        d: {
          ID: 300,
          Title: 'Test Task',
          Status: 'Not Started',
          PercentComplete: 0,
          IdeaId: { Id: 200 },
        },
      });

      // Mock task update success
      mockSharePointApi.put.mockResolvedValueOnce({});

      // Mock getTaskById success
      mockSharePointApi.get.mockResolvedValueOnce({
        d: {
          ID: 300,
          Title: 'Test Task',
          Status: 'In Progress',
          PercentComplete: 0,
          IdeaId: { Id: 200 },
        },
      });

      // Mock trail event creation failure
      mockSharePointApi.post.mockRejectedValueOnce(new Error('Trail creation failed'));

      // Should still succeed despite trail failure
      const result = await ideaApi.updateTask(taskId, updates, user);
      expect(result.id).toBe(300);
      expect(result.status).toBe('In Progress');
    });
  });

  describe('Trail Event Processing', () => {
    it('should properly process trail events from SharePoint', () => {
      const rawEvent = {
        ID: 1,
        Idea: { Id: 100, Title: 'Test Idea' },
        Task: { Id: 200, Title: 'Test Task' },
        Discussion: { Id: 300, Title: 'Test Discussion' },
        EventType: 'task_created',
        Title: 'Task Created',
        Description: 'Task was created',
        Actor: { Id: 5, Title: 'Test User' },
        Created: '2025-12-31T10:00:00Z',
        PreviousStatus: 'Not Started',
        NewStatus: 'In Progress',
        Comments: 'Task created successfully',
        Metadata: JSON.stringify({
          taskTitle: 'Test Task',
          assignedTo: ['user1'],
          priority: 'High',
        }),
      };

      const processedEvent = ideaApi.processIdeaTrailEvent(rawEvent);

      expect(processedEvent).toEqual({
        id: 1,
        ideaId: 100,
        taskId: 200,
        discussionId: 300,
        eventType: 'task_created',
        title: 'Task Created',
        description: 'Task was created',
        actor: 'Test User',
        actorId: 5,
        timestamp: new Date('2025-12-31T10:00:00Z'),
        previousStatus: 'Not Started',
        newStatus: 'In Progress',
        comments: 'Task created successfully',
        metadata: {
          taskTitle: 'Test Task',
          assignedTo: ['user1'],
          priority: 'High',
        },
      });
    });

    it('should handle missing optional fields in trail events', () => {
      const rawEvent = {
        ID: 2,
        Idea: { Id: 101 },
        EventType: 'submitted',
        Title: 'Idea Submitted',
        Description: 'Idea was submitted',
        Actor: { Id: 6, Title: 'Submitter' },
        Created: '2025-12-31T11:00:00Z',
      };

      const processedEvent = ideaApi.processIdeaTrailEvent(rawEvent);

      expect(processedEvent).toEqual({
        id: 2,
        ideaId: 101,
        taskId: undefined,
        discussionId: undefined,
        eventType: 'submitted',
        title: 'Idea Submitted',
        description: 'Idea was submitted',
        actor: 'Submitter',
        actorId: 6,
        timestamp: new Date('2025-12-31T11:00:00Z'),
        previousStatus: undefined,
        newStatus: undefined,
        comments: undefined,
        metadata: {},
      });
    });
  });
});