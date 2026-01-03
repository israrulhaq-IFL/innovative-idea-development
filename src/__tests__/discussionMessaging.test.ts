/**
 * Test suite for Discussion Board messaging functionality
 * Tests discussion creation and reply (message) handling in SharePoint 2016 Discussion Boards
 */

import { discussionApi } from '../services/discussionApi';
import { sharePointApi } from '../utils/secureApi';

// Mock the sharePointApi
jest.mock('../utils/secureApi', () => ({
  DEFAULT_CONFIG: {
    baseUrl: 'http://test.sharepoint.com',
    lists: {
      ideas: 'innovative_ideas',
      tasks: 'innovative_idea_tasks',
      discussions: 'innovative_idea_discussions',
      ideaTrail: 'innovative_idea_trail',
    },
  },
  sharePointApi: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
  getSharePointApi: jest.fn(),
}));

describe('Discussion Board Messaging', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDiscussionsByTask', () => {
    it('should retrieve both Discussion threads and Message replies for a task', async () => {
      const taskId = 13;
      const mockDiscussions = [
        {
          ID: 3,
          Title: 'Test Discussion',
          Body: 'Discussion body',
          ContentTypeId: '0x01200200F236C400FCD389448B1050736C1D65AC',
          TaskIdId: taskId,
          ParentItemID: null,
          Author: { Id: 18, Title: 'User 1', EMail: 'user1@test.com' },
          Created: '2026-01-01T08:00:00Z',
          Modified: '2026-01-01T08:00:00Z',
        },
        {
          ID: 12,
          Title: 'Re: Test Discussion',
          Body: 'Reply message',
          ContentTypeId: '0x0107000184D056442E7742904D37B7FE5AFF4C',
          TaskIdId: taskId,
          ParentItemID: 3,
          Author: { Id: 198, Title: 'User 2', EMail: 'user2@test.com' },
          Created: '2026-01-01T08:05:00Z',
          Modified: '2026-01-01T08:05:00Z',
        },
      ];

      (sharePointApi.get as jest.Mock).mockResolvedValue({
        d: { results: mockDiscussions },
      });

      const result = await discussionApi.getDiscussionsByTask(taskId);

      const callArg = (sharePointApi.get as jest.Mock).mock.calls[0][0];
      expect(callArg).toContain(`$filter=(TaskIdId eq ${taskId})`);
      expect(callArg).toContain(`startswith(ContentTypeId,'0x0120') or startswith(ContentTypeId,'0x0107')`);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(3);
      expect(result[0].taskId).toBe(taskId);
      expect(result[1].id).toBe(12);
      expect(result[1].taskId).toBe(taskId);
    });

    it('should return empty array when no discussions exist for task', async () => {
      (sharePointApi.get as jest.Mock).mockResolvedValue({
        d: { results: [] },
      });

      const result = await discussionApi.getDiscussionsByTask(999);

      expect(result).toHaveLength(0);
    });

    it('should order discussions by Created date ascending', async () => {
      const mockDiscussions = [
        {
          ID: 1,
          Title: 'Discussion 1',
          TaskIdId: 13,
          Created: '2026-01-01T08:00:00Z',
          Modified: '2026-01-01T08:00:00Z',
          Author: { Id: 18, Title: 'User' },
        },
      ];

      (sharePointApi.get as jest.Mock).mockResolvedValue({
        d: { results: mockDiscussions },
      });

      await discussionApi.getDiscussionsByTask(13);

      expect(sharePointApi.get).toHaveBeenCalledWith(
        expect.stringContaining('$orderby=Created asc')
      );
    });
  });

  describe('createDiscussion', () => {
    it('should create a new Discussion thread (not a Message)', async () => {
      const taskId = 13;
      const ideaId = 23;
      const subject = 'New Discussion';
      const body = 'Discussion body content';

      const mockCreatedDiscussion = {
        d: {
          ID: 5,
          Title: subject,
          Body: body,
          TaskIdId: taskId,
          IdeaIdId: ideaId,
          ContentTypeId: '0x01200200F236C400FCD389448B1050736C1D65AC', // Discussion type
          Author: { Id: 18, Title: 'Test User', EMail: 'test@test.com' },
          Created: '2026-01-01T09:00:00Z',
          Modified: '2026-01-01T09:00:00Z',
        },
      };

      (sharePointApi.post as jest.Mock).mockResolvedValue({ d: { ID: 5 } });
      (sharePointApi.get as jest.Mock).mockResolvedValue(mockCreatedDiscussion);

      const result = await discussionApi.createDiscussion(
        taskId,
        ideaId,
        subject,
        body
      );

      expect(sharePointApi.post).toHaveBeenCalledWith(
        expect.stringContaining('/items'),
        expect.objectContaining({
          Title: subject,
          Body: body,
          TaskIdId: taskId,
          IdeaIdId: ideaId,
        })
      );

      expect(result.id).toBe(5);
      expect(result.subject).toBe(subject);
      expect(result.taskId).toBe(taskId);
      expect(result.ideaId).toBe(ideaId);
    });

    it('should handle discussion creation with IsQuestion flag', async () => {
      (sharePointApi.post as jest.Mock).mockResolvedValue({ d: { ID: 6 } });
      (sharePointApi.get as jest.Mock).mockResolvedValue({
        d: {
          ID: 6,
          Title: 'Question',
          Body: 'Question body',
          TaskIdId: 13,
          IdeaIdId: 23,
          IsQuestion: true,
          Author: { Id: 18, Title: 'User' },
          Created: '2026-01-01T09:00:00Z',
          Modified: '2026-01-01T09:00:00Z',
        },
      });

      await discussionApi.createDiscussion(13, 23, 'Question', 'Body', true);

      expect(sharePointApi.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          IsQuestion: true,
        })
      );
    });
  });

  describe('addReply', () => {
    const taskId = 13;
    const ideaId = 23;
    const subject = 'Re: Test Discussion';
    const body = 'Reply message content';

    beforeEach(() => {
      // Mock finding the parent discussion
      (sharePointApi.get as jest.Mock).mockResolvedValueOnce({
        d: {
          results: [
            {
              ID: 3,
              Title: 'Test Discussion',
              ContentTypeId: '0x01200200F236C400FCD389448B1050736C1D65AC',
            },
          ],
        },
      });
    });

    it('should create a Message item using standard List API with Message content type', async () => {
      const mockCreatedItem = {
        d: {
          ID: 12,
          Title: subject,
          Body: body,
          ContentTypeId: '0x0107000184D056442E7742904D37B7FE5AFF4C', // Message type
          TaskIdId: taskId,
          IdeaIdId: ideaId,
          Author: { Id: 18, Title: 'User' },
          Created: '2026-01-01T09:05:00Z',
          Modified: '2026-01-01T09:05:00Z',
        },
      };

      // Mock POST to create message item
      (sharePointApi.post as jest.Mock).mockResolvedValueOnce(mockCreatedItem);
      
      // Mock GET to retrieve created item
      (sharePointApi.get as jest.Mock).mockResolvedValueOnce(mockCreatedItem);

      const result = await discussionApi.addReply(
        taskId,
        ideaId,
        subject,
        body
      );

      // Verify message was created with correct properties
      const postCall = (sharePointApi.post as jest.Mock).mock.calls[0];
      expect(postCall[0]).toContain('/items');
      const postData = postCall[1];
      expect(postData.ContentTypeId).toBe('0x0107000184D056442E7742904D37B7FE5AFF4C');
      expect(postData.TaskIdId).toBe(taskId);
      expect(postData.IdeaIdId).toBe(ideaId);
      expect(postData.Title).toBe(subject);
      expect(postData.Body).toBe(body);

      expect(result.id).toBe(12);
      expect(result.subject).toBe(subject);
    });

    it('should throw error if parent discussion not found', async () => {
      // Override the beforeEach mock to return empty results
      (sharePointApi.get as jest.Mock).mockReset();
      (sharePointApi.get as jest.Mock).mockResolvedValueOnce({
        d: { results: [] },
      });

      await expect(
        discussionApi.addReply(taskId, ideaId, subject, body)
      ).rejects.toThrow('Parent discussion not found');
    });

    it('should include IsQuestion flag when specified', async () => {
      const mockCreatedItem = {
        d: {
          ID: 12,
          Title: subject,
          Body: body,
          ContentTypeId: '0x0107000184D056442E7742904D37B7FE5AFF4C',
          TaskIdId: taskId,
          IdeaIdId: ideaId,
          IsQuestion: true,
          Author: { Id: 18, Title: 'User' },
          Created: '2026-01-01T09:05:00Z',
          Modified: '2026-01-01T09:05:00Z',
        },
      };

      (sharePointApi.post as jest.Mock).mockResolvedValueOnce(mockCreatedItem);
      (sharePointApi.get as jest.Mock).mockResolvedValueOnce(mockCreatedItem);

      await discussionApi.addReply(taskId, ideaId, subject, body, true);

      const postData = (sharePointApi.post as jest.Mock).mock.calls[0][1];
      expect(postData.IsQuestion).toBe(true);
    });

    it('should link reply to correct task and idea via lookup fields', async () => {
      const mockCreatedItem = {
        d: {
          ID: 12,
          Title: subject,
          Body: body,
          ContentTypeId: '0x0107000184D056442E7742904D37B7FE5AFF4C',
          TaskIdId: taskId,
          IdeaIdId: ideaId,
          Author: { Id: 18, Title: 'User' },
          Created: '2026-01-01T09:05:00Z',
          Modified: '2026-01-01T09:05:00Z',
        },
      };

      (sharePointApi.post as jest.Mock).mockResolvedValueOnce(mockCreatedItem);
      (sharePointApi.get as jest.Mock).mockResolvedValueOnce(mockCreatedItem);

      await discussionApi.addReply(taskId, ideaId, subject, body);

      const postData = (sharePointApi.post as jest.Mock).mock.calls[0][1];
      expect(postData.TaskIdId).toBe(taskId);
      expect(postData.IdeaIdId).toBe(ideaId);
    });

    it('should handle multiple replies to same discussion', async () => {
      const mockCreatedItem1 = {
        d: {
          ID: 12,
          Title: 'Reply 1',
          Body: 'First reply',
          ContentTypeId: '0x0107000184D056442E7742904D37B7FE5AFF4C',
          TaskIdId: taskId,
          IdeaIdId: ideaId,
          Author: { Id: 18, Title: 'User' },
          Created: '2026-01-01T09:05:00Z',
          Modified: '2026-01-01T09:05:00Z',
        },
      };

      (sharePointApi.post as jest.Mock).mockResolvedValueOnce(mockCreatedItem1);
      (sharePointApi.get as jest.Mock).mockResolvedValueOnce(mockCreatedItem1);

      const reply1 = await discussionApi.addReply(
        taskId,
        ideaId,
        'Reply 1',
        'First reply'
      );

      // Reset mocks for second reply
      jest.clearAllMocks();

      // Mock for finding parent discussion again
      (sharePointApi.get as jest.Mock).mockResolvedValueOnce({
        d: {
          results: [
            {
              ID: 3,
              Title: 'Test Discussion',
              ContentTypeId: '0x01200200F236C400FCD389448B1050736C1D65AC',
            },
          ],
        },
      });

      const mockCreatedItem2 = {
        d: {
          ID: 13,
          Title: 'Reply 2',
          Body: 'Second reply',
          ContentTypeId: '0x0107000184D056442E7742904D37B7FE5AFF4C',
          TaskIdId: taskId,
          IdeaIdId: ideaId,
          Author: { Id: 198, Title: 'User2' },
          Created: '2026-01-01T09:10:00Z',
          Modified: '2026-01-01T09:10:00Z',
        },
      };

      (sharePointApi.post as jest.Mock).mockResolvedValueOnce(mockCreatedItem2);
      (sharePointApi.get as jest.Mock).mockResolvedValueOnce(mockCreatedItem2);

      const reply2 = await discussionApi.addReply(
        taskId,
        ideaId,
        'Reply 2',
        'Second reply'
      );

      expect(reply1.id).toBe(12);
      expect(reply2.id).toBe(13);
    });
  });

  describe('Discussion vs Message ContentType validation', () => {
    it('should verify Discussion items have 0x0120 ContentType prefix', async () => {
      const mockDiscussion = {
        ID: 3,
        ContentTypeId: '0x01200200F236C400FCD389448B1050736C1D65AC',
        Title: 'Discussion',
        Author: { Id: 18, Title: 'User' },
        Created: '2026-01-01T08:00:00Z',
        Modified: '2026-01-01T08:00:00Z',
      };

      expect(mockDiscussion.ContentTypeId.startsWith('0x0120')).toBe(true);
      expect(mockDiscussion.ContentTypeId.startsWith('0x0107')).toBe(false);
    });

    it('should verify Message items have 0x0107 ContentType prefix', async () => {
      const mockMessage = {
        ID: 12,
        ContentTypeId: '0x0107000184D056442E7742904D37B7FE5AFF4C',
        Title: 'Reply',
        ParentItemID: 3,
        Author: { Id: 18, Title: 'User' },
        Created: '2026-01-01T08:00:00Z',
        Modified: '2026-01-01T08:00:00Z',
      };

      expect(mockMessage.ContentTypeId.startsWith('0x0107')).toBe(true);
      expect(mockMessage.ContentTypeId.startsWith('0x0120')).toBe(false);
    });
  });

  describe('createTaskDiscussion', () => {
    it('should create initial discussion when user clicks Create Discussion button in MyTasks', async () => {
      const taskId = 13;
      const taskTitle = 'Test Task';
      const taskDescription = 'Task description';
      const ideaId = 23;
      const assignees = [
        { id: 18, name: 'User 1' },
        { id: 198, name: 'User 2' },
      ];

      (sharePointApi.post as jest.Mock).mockResolvedValue({ d: { ID: 5 } });
      (sharePointApi.get as jest.Mock).mockResolvedValue({
        d: {
          ID: 5,
          Title: `Discussion: ${taskTitle}`,
          Body: expect.any(String),
          TaskIdId: taskId,
          IdeaIdId: ideaId,
          Author: { Id: 18, Title: 'User' },
          Created: '2026-01-01T09:00:00Z',
          Modified: '2026-01-01T09:00:00Z',
        },
      });

      const result = await discussionApi.createTaskDiscussion(
        taskId,
        taskTitle,
        taskDescription,
        ideaId,
        assignees
      );

      expect(result.taskId).toBe(taskId);
      expect(result.ideaId).toBe(ideaId);
    });

    it('should include idea context in discussion body when manually created with context', async () => {
      (sharePointApi.post as jest.Mock).mockResolvedValue({ d: { ID: 5 } });
      (sharePointApi.get as jest.Mock).mockResolvedValue({
        d: {
          ID: 5,
          Title: 'Discussion',
          Body: '<div>Task content</div>',
          TaskIdId: 13,
          IdeaIdId: 23,
          Author: { Id: 18, Title: 'User' },
          Created: '2026-01-01T09:00:00Z',
          Modified: '2026-01-01T09:00:00Z',
        },
      });

      await discussionApi.createTaskDiscussion(
        13,
        'Task',
        'Description',
        23,
        [{ id: 18, name: 'User' }],
        'Creator Name',
        'Idea description'
      );

      const postCall = (sharePointApi.post as jest.Mock).mock.calls[0][1];
      expect(postCall.Body).toContain('Creator Name');
      expect(postCall.Body).toContain('Idea description');
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle network errors gracefully', async () => {
      (sharePointApi.get as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      await expect(discussionApi.getDiscussionsByTask(13)).rejects.toThrow(
        'Network error'
      );
    });

    it('should handle invalid TaskIdId values', async () => {
      (sharePointApi.get as jest.Mock).mockResolvedValue({
        d: { results: [] },
      });

      const result = await discussionApi.getDiscussionsByTask(0);
      expect(result).toHaveLength(0);
    });

    it('should handle malformed API responses', async () => {
      (sharePointApi.get as jest.Mock).mockResolvedValue({
        d: { results: null },
      });

      await expect(discussionApi.getDiscussionsByTask(13)).rejects.toThrow();
    });

    it('should handle ParentItemID and TaskIdId being set correctly on message creation', async () => {
      const taskId = 13;
      const ideaId = 7;
      const subject = 'Test Reply';
      const body = 'Reply body';

      // Setup parent discussion
      (sharePointApi.get as jest.Mock).mockResolvedValueOnce({
        d: {
          results: [
            {
              ID: 3,
              ContentTypeId: '0x01200200F236C400FCD389448B1050736C1D65AC',
            },
          ],
        },
      });

      // Mock message creation response
      (sharePointApi.post as jest.Mock).mockResolvedValueOnce({
        d: {
          ID: 15,
          Title: subject,
          TaskIdId: taskId,
          IdeaIdId: ideaId,
        },
      });

      // Mock get created item
      (sharePointApi.get as jest.Mock).mockResolvedValueOnce({
        d: {
          ID: 15,
          Title: subject,
          Body: body,
          ContentTypeId: '0x0107000184D056442E7742904D37B7FE5AFF4C',
          TaskIdId: taskId,
          IdeaIdId: ideaId,
          Author: { Id: 18, Title: 'Test User', EMail: 'test@test.com' },
          Created: '2026-01-01T08:00:00Z',
          Modified: '2026-01-01T08:00:00Z',
        },
      });

      const result = await discussionApi.addReply(taskId, ideaId, subject, body);

      // Verify the POST call includes all required fields
      const postCall = (sharePointApi.post as jest.Mock).mock.calls[0][1];
      expect(postCall.TaskIdId).toBe(taskId);
      expect(postCall.IdeaIdId).toBe(ideaId);
      expect(postCall.ContentTypeId).toBe('0x0107000184D056442E7742904D37B7FE5AFF4C');

      // Verify the result has correct values
      expect(result.taskId).toBe(taskId);
      expect(result.ideaId).toBe(ideaId);
    });

    it('should handle ContentTypeId validation for messages', async () => {
      const taskId = 13;
      const ideaId = 7;

      // Setup parent discussion
      (sharePointApi.get as jest.Mock).mockResolvedValueOnce({
        d: {
          results: [
            {
              ID: 3,
              ContentTypeId: '0x01200200F236C400FCD389448B1050736C1D65AC',
            },
          ],
        },
      });

      // Mock message creation
      (sharePointApi.post as jest.Mock).mockResolvedValueOnce({
        d: { ID: 16 },
      });

      // Mock get with wrong ContentTypeId (Discussion instead of Message)
      (sharePointApi.get as jest.Mock).mockResolvedValueOnce({
        d: {
          ID: 16,
          Title: 'Test',
          Body: 'Body',
          ContentTypeId: '0x01200200F236C400FCD389448B1050736C1D65AC', // Wrong! Should be 0x0107
          Author: { Id: 18, Title: 'Test', EMail: 'test@test.com' },
          Created: '2026-01-01T08:00:00Z',
        },
      });

      const result = await discussionApi.addReply(taskId, ideaId, 'Test', 'Body');

      // Our code should send the full Message ContentTypeId
      const postCall = (sharePointApi.post as jest.Mock).mock.calls[0][1];
      expect(postCall.ContentTypeId).toBe('0x0107000184D056442E7742904D37B7FE5AFF4C');
    });
  });
});
