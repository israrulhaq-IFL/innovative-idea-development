/**
 * Test Suite: Task Discussion Creation Workflow
 * Tests the manual creation of discussion threads for tasks via Create Discussion button
 * Note: Discussions are no longer automatically created when tasks are assigned
 */

import { discussionApi } from '../services/discussionApi';
import { ideaApi } from '../services/ideaApi';
import { sharePointApi } from '../utils/secureApi';

// Mock the dependencies
jest.mock('../utils/secureApi');
jest.mock('../utils/logger');

describe('Task Discussion Creation Workflow', () => {
  const mockSharePointApi = sharePointApi as jest.Mocked<typeof sharePointApi>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createTaskDiscussion', () => {
    it('should successfully create a discussion thread when user clicks Create Discussion button', async () => {
      // Arrange
      const taskId = 13;
      const taskTitle = 'Test Task for Idea';
      const taskDescription = 'Task description for testing';
      const ideaId = 23;
      const assignees = [
        { id: 18, name: 'Israr ul Haq' },
        { id: 198, name: 'Minahil Nadeem' }
      ];
      const ideaCreator = 'John Doe';
      const ideaDescription = 'Original idea description';

      // Mock the POST response for creating discussion
      mockSharePointApi.post.mockResolvedValueOnce({
        d: {
          ID: 1,
          Title: `Discussion: ${taskTitle}`,
          Body: expect.any(String),
          TaskIdId: taskId,
          IdeaIdId: ideaId,
          IsQuestion: false
        }
      });

      // Mock the GET response for retrieving created discussion
      mockSharePointApi.get.mockResolvedValueOnce({
        d: {
          ID: 1,
          Title: `Discussion: ${taskTitle}`,
          Body: expect.any(String),
          TaskId: { Id: taskId },
          IdeaId: { Id: ideaId },
          IsQuestion: false,
          Author: {
            Id: 1,
            Title: 'Admin User',
            EMail: 'admin@company.com'
          },
          Created: new Date().toISOString(),
          Modified: new Date().toISOString(),
          Attachments: false
        }
      });

      // Act
      const result = await discussionApi.createTaskDiscussion(
        taskId,
        taskTitle,
        taskDescription,
        ideaId,
        assignees,
        ideaCreator,
        ideaDescription
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(result.taskId).toBe(taskId);
      expect(result.ideaId).toBe(ideaId);
      expect(mockSharePointApi.post).toHaveBeenCalledTimes(1);
      expect(mockSharePointApi.get).toHaveBeenCalledTimes(1);
    });

    it('should include idea context in discussion body when manually created with full context', async () => {
      // Arrange
      const taskId = 13;
      const taskTitle = 'Test Task';
      const taskDescription = 'Task desc';
      const ideaId = 23;
      const assignees = [{ id: 18, name: 'User 1' }];
      const ideaCreator = 'Idea Creator';
      const ideaDescription = 'Original idea description';

      let capturedBody = '';
      mockSharePointApi.post.mockImplementation(async (endpoint, data: any) => {
        capturedBody = data.Body;
        return {
          d: { ID: 1, Title: data.Title, Body: data.Body }
        };
      });

      mockSharePointApi.get.mockResolvedValueOnce({
        d: {
          ID: 1,
          Title: 'Discussion: Test Task',
          Body: capturedBody,
          TaskId: { Id: taskId },
          IdeaId: { Id: ideaId },
          IsQuestion: false,
          Author: { Id: 1, Title: 'Admin', EMail: 'admin@test.com' },
          Created: new Date().toISOString(),
          Modified: new Date().toISOString(),
          Attachments: false
        }
      });

      // Act
      await discussionApi.createTaskDiscussion(
        taskId,
        taskTitle,
        taskDescription,
        ideaId,
        assignees,
        ideaCreator,
        ideaDescription
      );

      // Assert
      expect(capturedBody).toContain('📋 Task Created');
      expect(capturedBody).toContain('💡 Original Idea');
      expect(capturedBody).toContain(ideaCreator);
      expect(capturedBody).toContain(ideaDescription);
      expect(capturedBody).toContain('User 1');
    });

    it('should work without idea context when not provided', async () => {
      // Arrange
      const taskId = 13;
      const taskTitle = 'Test Task';
      const taskDescription = 'Task desc';
      const ideaId = 23;
      const assignees = [{ id: 18, name: 'User 1' }];

      let capturedBody = '';
      mockSharePointApi.post.mockImplementation(async (endpoint, data: any) => {
        capturedBody = data.Body;
        return {
          d: { ID: 1, Title: data.Title, Body: data.Body }
        };
      });

      mockSharePointApi.get.mockResolvedValueOnce({
        d: {
          ID: 1,
          Title: 'Discussion: Test Task',
          Body: capturedBody,
          TaskId: { Id: taskId },
          IdeaId: { Id: ideaId },
          IsQuestion: false,
          Author: { Id: 1, Title: 'Admin', EMail: 'admin@test.com' },
          Created: new Date().toISOString(),
          Modified: new Date().toISOString(),
          Attachments: false
        }
      });

      // Act
      await discussionApi.createTaskDiscussion(
        taskId,
        taskTitle,
        taskDescription,
        ideaId,
        assignees
      );

      // Assert
      expect(capturedBody).toContain('📋 Task Created');
      expect(capturedBody).not.toContain('💡 Original Idea');
      expect(capturedBody).toContain('User 1');
    });

    it('should handle multiple assignees correctly', async () => {
      // Arrange
      const assignees = [
        { id: 1, name: 'User 1' },
        { id: 2, name: 'User 2' },
        { id: 3, name: 'User 3' }
      ];

      let capturedBody = '';
      mockSharePointApi.post.mockImplementation(async (endpoint, data: any) => {
        capturedBody = data.Body;
        return {
          d: { ID: 1, Title: data.Title, Body: data.Body }
        };
      });

      mockSharePointApi.get.mockResolvedValueOnce({
        d: {
          ID: 1,
          Title: 'Discussion: Test',
          Body: capturedBody,
          TaskId: { Id: 1 },
          IdeaId: { Id: 1 },
          IsQuestion: false,
          Author: { Id: 1, Title: 'Admin', EMail: 'admin@test.com' },
          Created: new Date().toISOString(),
          Modified: new Date().toISOString(),
          Attachments: false
        }
      });

      // Act
      await discussionApi.createTaskDiscussion(
        1,
        'Test Task',
        'Desc',
        1,
        assignees
      );

      // Assert
      expect(capturedBody).toContain('User 1, User 2, User 3');
    });

    it('should throw error when SharePoint API fails', async () => {
      // Arrange
      mockSharePointApi.post.mockRejectedValueOnce(
        new Error('SharePoint API Error: 401 Unauthorized')
      );

      // Act & Assert
      await expect(
        discussionApi.createTaskDiscussion(
          1,
          'Test Task',
          'Desc',
          1,
          [{ id: 1, name: 'User 1' }]
        )
      ).rejects.toThrow('SharePoint API Error');
    });
  });

  describe('Trail Entry Creation', () => {
    it('should create trail entry for discussion creation', async () => {
      // Arrange
      const ideaId = 23;
      const eventType = 'commented';
      const currentUser = { id: 1, name: 'Admin User' };
      const description = 'Discussion thread created for task: Test Task';

      // Mock POST for creating trail entry
      mockSharePointApi.post.mockResolvedValueOnce({
        d: {
          ID: 55,
          Title: 'Discussion Created',
          EventType: eventType,
          Description: description
        }
      });

      // Mock GET for retrieving all trail events (after creation to find the created one)
      mockSharePointApi.get.mockResolvedValueOnce({
        d: {
          results: [{
            ID: 55,
            Title: 'Discussion Created',
            EventType: eventType,
            Description: description,
            Idea: { Id: ideaId, Title: 'Test Idea' },
            Task: null,
            Discussion: null,
            Actor: { Id: 1, Title: 'Admin User' },
            Created: new Date().toISOString(),
            PreviousStatus: null,
            NewStatus: null,
            Comments: null,
            Metadata: '{}'
          }]
        }
      });

      // Act
      const result = await ideaApi.createIdeaTrailEvent({
        ideaId,
        eventType,
        title: 'Discussion Created',
        description,
        actor: currentUser.name,
        actorId: currentUser.id
      });

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe(55);
      expect(mockSharePointApi.post).toHaveBeenCalledWith(
        expect.stringContaining('innovative_idea_trail'),
        expect.objectContaining({
          EventType: eventType,
          Description: description,
          IdeaId: ideaId
        })
      );
    });
  });

  describe('End-to-End Manual Discussion Creation', () => {
    it('should create discussion with full context when user manually initiates it', async () => {
      // Arrange
      const taskId = 13;
      const taskTitle = 'Task for: Test Idea';
      const taskDescription = 'Test task description';
      const ideaId = 23;
      const assignees = [
        { id: 18, name: 'User 1' },
        { id: 198, name: 'User 2' }
      ];
      const ideaCreator = 'John Doe';
      const ideaDescription = 'Original idea description';

      // Mock discussion creation POST
      mockSharePointApi.post.mockResolvedValueOnce({
        d: {
          ID: 1,
          Title: `Discussion: ${taskTitle}`,
          TaskIdId: taskId,
          IdeaIdId: ideaId
        }
      });

      // Mock GET to retrieve created discussion
      mockSharePointApi.get.mockResolvedValueOnce({
        d: {
          ID: 1,
          Title: `Discussion: ${taskTitle}`,
          Body: expect.any(String),
          TaskId: { Id: taskId },
          IdeaId: { Id: ideaId },
          IsQuestion: false,
          Author: { Id: 1, Title: 'Admin', EMail: 'admin@test.com' },
          Created: new Date().toISOString(),
          Modified: new Date().toISOString(),
          Attachments: false
        }
      });

      // Act
      const discussion = await discussionApi.createTaskDiscussion(
        taskId,
        taskTitle,
        taskDescription,
        ideaId,
        assignees,
        ideaCreator,
        ideaDescription
      );

      // Assert
      expect(discussion).toBeDefined();
      expect(discussion.id).toBe(1);
      expect(discussion.taskId).toBe(taskId);
      expect(discussion.ideaId).toBe(ideaId);
      expect(mockSharePointApi.post).toHaveBeenCalledTimes(1);
      expect(mockSharePointApi.get).toHaveBeenCalledTimes(1);
    });

    it('should handle discussion creation failure gracefully when manually created', async () => {
      // Arrange
      const taskId = 13;
      const taskTitle = 'Test Task';
      const taskDescription = 'Test desc';
      const ideaId = 23;
      const assignees = [{ id: 18, name: 'User 1' }];

      // Mock failed discussion creation (POST fails)
      mockSharePointApi.post.mockRejectedValueOnce(
        new Error('Discussion creation failed: SharePoint API Error')
      );

      // Act & Assert
      await expect(
        discussionApi.createTaskDiscussion(
          taskId,
          taskTitle,
          taskDescription,
          ideaId,
          assignees
        )
      ).rejects.toThrow('SharePoint API Error');
    });
  });

  describe('getMyDiscussions', () => {
    it('should retrieve discussions for user assigned tasks', async () => {
      // Arrange
      const userId = 18;

      // Mock tasks response - need AssignedToId.results array for multi-value lookup
      mockSharePointApi.get
        .mockResolvedValueOnce({
          d: {
            results: [
              {
                ID: 13,
                Title: 'Task 1',
                IdeaIdId: 23,
                IdeaId: { Id: 23, Title: 'Idea 1' },
                AssignedToId: { results: [18] }, // Multi-value lookup field
                AssignedTo: { results: [
                  { Id: 18, Title: 'User 1', EMail: 'user1@test.com' }
                ]}
              }
            ]
          }
        })
        // Mock discussions response
        .mockResolvedValueOnce({
          d: {
            results: [
              {
                ID: 1,
                Title: 'Discussion: Task 1',
                Body: 'Discussion body',
                TaskIdId: 13,
                IdeaIdId: 23,
                ContentTypeId: '0x01200200F236C400FCD389448B1050736C1D65AC',
                IsQuestion: false,
                Author: { Id: 1, Title: 'Admin', EMail: 'admin@test.com' },
                Created: new Date().toISOString(),
                Modified: new Date().toISOString(),
                Attachments: false
              }
            ]
          }
        })
        // Mock idea status response (fetched to check if locked)
        .mockResolvedValueOnce({
          d: {
            Status: 'In Progress'
          }
        });

      // Act
      const discussions = await discussionApi.getMyDiscussions(userId);

      // Assert
      expect(discussions).toBeDefined();
      expect(discussions.length).toBe(1);
      expect(discussions[0].taskId).toBe(13);
      expect(discussions[0].messages.length).toBe(1);
      expect(mockSharePointApi.get).toHaveBeenCalledTimes(3); // tasks, discussions, idea status
    });

    it('should return empty array when user has no assigned tasks', async () => {
      // Arrange
      const userId = 999;

      mockSharePointApi.get.mockResolvedValueOnce({
        d: { results: [] }
      });

      // Act
      const discussions = await discussionApi.getMyDiscussions(userId);

      // Assert
      expect(discussions).toBeDefined();
      expect(discussions.length).toBe(0);
    });
  });
});
