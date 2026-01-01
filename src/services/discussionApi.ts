import { sharePointApi, DEFAULT_CONFIG } from '../utils/secureApi';
import { logError, logInfo } from '../utils/logger';

const LISTS = DEFAULT_CONFIG.lists;

export interface DiscussionMessage {
  id: number;
  subject: string;
  body: string;
  taskId: number;
  ideaId?: number;
  isQuestion: boolean;
  author: {
    id: number;
    name: string;
    email?: string;
  };
  created: Date;
  modified: Date;
  attachments?: Array<{
    fileName: string;
    serverRelativeUrl: string;
  }>;
  parentItemId?: number | null;
}

export interface Discussion {
  id: number;
  taskId: number;
  taskTitle: string;
  ideaId?: number;
  ideaTitle?: string;
  participants: Array<{
    id: number;
    name: string;
    email?: string;
  }>;
  messages: DiscussionMessage[];
  lastActivity: Date;
  unreadCount: number;
}

class DiscussionApi {
  private listName = 'innovative_idea_discussions';

  /**
   * Get all discussions for a specific task
   * This includes the main discussion (folder) and all replies (items inside folder)
   * Using Microsoft's recommended approach: filter by ContentType
   */
  async getDiscussionsByTask(taskId: number): Promise<DiscussionMessage[]> {
    try {
      // Get both Discussion (threads) and Message (replies) content types for this task
      // Filter by ContentTypeId: 0x0120 prefix = Discussion, 0x0107 prefix = Message
      const endpoint = `/_api/web/lists/getbytitle('${this.listName}')/items?$select=ID,Title,Body,IsQuestion,TaskIdId,IdeaIdId,Author/Id,Author/Title,Author/EMail,Created,Modified,Attachments,ParentItemID,ContentTypeId&$expand=Author,AttachmentFiles&$filter=(TaskIdId eq ${taskId}) and (startswith(ContentTypeId,'0x0120') or startswith(ContentTypeId,'0x0107'))&$orderby=Created asc&$top=500`;
      
      const response = await sharePointApi.get<any>(endpoint);
      return response.d.results.map((item: any) => this.mapToDiscussionMessage(item));
    } catch (error) {
      logError('Failed to get discussions by task', error);
      throw error;
    }
  }

  /**
   * Get all discussions where the current user is a participant (based on task assignments)
   */
  async getMyDiscussions(userId: number): Promise<Discussion[]> {
    try {
      // First, get all tasks where user is assigned (using AssignedToId for multi-value field)
      // Note: We need to get ALL tasks and filter client-side because SharePoint 2016
      // doesn't properly expand multi-value user fields when filtered
      const tasksEndpoint = `/_api/web/lists/getbytitle('${LISTS.tasks}')/items?$select=ID,Title,IdeaIdId,AssignedToId,IdeaId/Title,AssignedTo/Id,AssignedTo/Title,AssignedTo/EMail&$expand=IdeaId,AssignedTo&$top=500`;
      
      const tasksResponse = await sharePointApi.get<any>(tasksEndpoint);
      const allTasks = tasksResponse.d.results;
      
      // Filter tasks where current user is in AssignedToId array
      const myTasks = allTasks.filter((task: any) => {
        const assignedIds = task.AssignedToId?.results || [];
        return assignedIds.includes(userId);
      });

      // Get discussions for each task
      const discussions: Discussion[] = [];
      
      for (const task of myTasks) {
        const messages = await this.getDiscussionsByTask(task.ID);
        
        if (messages.length > 0) {
          const lastActivity = messages.reduce((latest, msg) => {
            const msgDate = new Date(msg.modified);
            return msgDate > latest ? msgDate : latest;
          }, new Date(0));

          // Get all assignees from the expanded AssignedTo field
          const participants = task.AssignedTo?.results 
            ? task.AssignedTo.results.map((assignee: any) => ({
                id: assignee.Id,
                name: assignee.Title,
                email: assignee.EMail,
              }))
            : [];

          discussions.push({
            id: task.ID,
            taskId: task.ID,
            taskTitle: task.Title,
            ideaId: task.IdeaId?.Id || task.IdeaIdId,
            ideaTitle: task.IdeaId?.Title,
            participants,
            messages,
            lastActivity,
            unreadCount: 0, // TODO: Implement read tracking
          });
        }
      }

      // Sort by last activity
      return discussions.sort(
        (a, b) => b.lastActivity.getTime() - a.lastActivity.getTime()
      );
    } catch (error) {
      logError('Failed to get my discussions', error);
      throw error;
    }
  }

  /**
   * Create a new discussion thread for a task
   */
  async createDiscussion(
    taskId: number,
    ideaId: number,
    subject: string,
    body: string,
    isQuestion = false
  ): Promise<DiscussionMessage> {
    try {
      const endpoint = `/_api/web/lists/getbytitle('${this.listName}')/items`;
      const data = {
        __metadata: { type: 'SP.Data.Innovative_x005f_idea_x005f_discussionsListItem' },
        Title: subject,
        Body: body,
        TaskIdId: taskId,
        IdeaIdId: ideaId,
        IsQuestion: isQuestion,
      };

      const response = await sharePointApi.post<any>(endpoint, data);
      const itemId = response.d.ID;

      // Get the created item with all details - use TaskIdId/IdeaIdId instead of expanding lookup fields
      const getEndpoint = `/_api/web/lists/getbytitle('${this.listName}')/items(${itemId})?$select=ID,Title,Body,IsQuestion,TaskIdId,IdeaIdId,Author/Id,Author/Title,Author/EMail,Created,Modified,Attachments&$expand=Author`;
      const createdItem = await sharePointApi.get<any>(getEndpoint);

      return this.mapToDiscussionMessage(createdItem.d);
    } catch (error) {
      logError('Failed to create discussion', error);
      throw error;
    }
  }

  /**
   * Add a reply to an existing discussion
   * For SharePoint 2016 Discussion Boards, we use the standard List API with Message content type.
   * The message is linked to the discussion via TaskIdId field.
   */
  async addReply(
    taskId: number,
    ideaId: number,
    subject: string,
    body: string,
    isQuestion = false
  ): Promise<DiscussionMessage> {
    try {
      // Verify that a parent discussion exists for this task
      const discussionsEndpoint = `/_api/web/lists/getbytitle('${this.listName}')/items?$select=ID,Title,ContentTypeId&$filter=(TaskIdId eq ${taskId}) and startswith(ContentTypeId,'0x0120')&$top=1`;
      const discussionsResponse = await sharePointApi.get<any>(discussionsEndpoint);
      
      if (!discussionsResponse.d.results || discussionsResponse.d.results.length === 0) {
        throw new Error('Parent discussion not found for this task');
      }
      
      const parentDiscussion = discussionsResponse.d.results[0];
      
      logInfo('[DiscussionApi] Creating message reply for discussion:', { 
        taskId, 
        ideaId,
        parentDiscussionId: parentDiscussion.ID,
        subject
      });
      
      // Create the message using standard List API with Message content type
      // This is the correct approach for SharePoint 2016 Discussion Boards
      const endpoint = `/_api/web/lists/getbytitle('${this.listName}')/items`;
      const data = {
        __metadata: { type: 'SP.Data.Innovative_x005f_idea_x005f_discussionsListItem' },
        ContentTypeId: '0x0107000184D056442E7742904D37B7FE5AFF4C', // Message content type (full ID from list)
        Title: subject,
        Body: body,
        TaskIdId: taskId,
        IdeaIdId: ideaId,
        IsQuestion: isQuestion,
      };
      
      logInfo('[DiscussionApi] Posting message with data:', data);

      const response = await sharePointApi.post<any>(endpoint, data);
      const itemId = response.d.ID;
      
      logInfo('[DiscussionApi] Message created successfully with ID:', itemId);

      // Get the created item with all details
      const getEndpoint = `/_api/web/lists/getbytitle('${this.listName}')/items(${itemId})?$select=ID,Title,Body,IsQuestion,TaskIdId,IdeaIdId,Author/Id,Author/Title,Author/EMail,Created,Modified,Attachments,ParentItemID,ContentTypeId&$expand=Author`;
      const createdItem = await sharePointApi.get<any>(getEndpoint);

      return this.mapToDiscussionMessage(createdItem.d);
    } catch (error) {
      logError('Failed to add reply to discussion', error);
      throw error;
    }
  }

  /**
   * Upload attachment to a discussion message
   */
  async uploadAttachment(
    messageId: number,
    fileName: string,
    file: File
  ): Promise<void> {
    try {
      const endpoint = `/_api/web/lists/getbytitle('${this.listName}')/items(${messageId})/AttachmentFiles/add(FileName='${fileName}')`;
      
      await sharePointApi.postFile(endpoint, file);
      logInfo('Attachment uploaded successfully');
    } catch (error) {
      logError('Failed to upload attachment', error);
      throw error;
    }
  }

  /**
   * Get attachments for a discussion message
   */
  async getAttachments(messageId: number) {
    try {
      const endpoint = `/_api/web/lists/getbytitle('${this.listName}')/items(${messageId})/AttachmentFiles`;
      const response = await sharePointApi.get<any>(endpoint);

      return response.d.results.map((att: any) => ({
        fileName: att.FileName,
        serverRelativeUrl: att.ServerRelativeUrl,
      }));
    } catch (error) {
      logError('Failed to get attachments', error);
      throw error;
    }
  }

  /**
   * Delete a discussion message
   */
  async deleteMessage(messageId: number): Promise<void> {
    try {
      const endpoint = `/_api/web/lists/getbytitle('${this.listName}')/items(${messageId})`;
      await sharePointApi.delete(endpoint);
      logInfo('Discussion message deleted successfully');
    } catch (error) {
      logError('Failed to delete message', error);
      throw error;
    }
  }

  /**
   * Auto-create discussion when task is created
   */
  async createTaskDiscussion(
    taskId: number,
    taskTitle: string,
    taskDescription: string,
    ideaId: number,
    assignees: Array<{ id: number; name: string }>,
    ideaCreator?: string,
    ideaDescription?: string
  ): Promise<DiscussionMessage> {
    try {
      logInfo('[DiscussionApi] createTaskDiscussion called', { taskId, taskTitle, ideaId, assigneeCount: assignees.length });
      
      const assigneeNames = assignees.map((a) => a.name).join(', ');
      const subject = `Discussion: ${taskTitle}`;
      
      let body = `<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 15px; border-radius: 8px; color: white; margin-bottom: 15px;">
        <h3 style="margin: 0 0 10px 0;">📋 Task Created</h3>
        <p style="margin: 5px 0;"><strong>Title:</strong> ${taskTitle}</p>
        <p style="margin: 5px 0;"><strong>Assigned To:</strong> ${assigneeNames}</p>
      </div>`;
      
      if (ideaCreator && ideaDescription) {
        body += `<div style="background: #f7fafc; border-left: 4px solid #667eea; padding: 15px; margin-bottom: 15px; border-radius: 4px;">
          <h4 style="margin: 0 0 10px 0; color: #667eea;">💡 Original Idea</h4>
          <p style="margin: 5px 0; color: #2d3748;"><strong style="color: #2d3748;">Created by:</strong> ${ideaCreator}</p>
          <p style="margin: 5px 0; color: #2d3748;"><strong style="color: #2d3748;">Description:</strong> ${ideaDescription}</p>
        </div>`;
      }
      
      body += `<div style="background: #fff; padding: 15px; border-radius: 4px; border: 1px solid #e2e8f0;">
        <h4 style="margin: 0 0 10px 0; color: #2d3748;">📝 Task Details</h4>
        <p style="margin: 5px 0; color: #2d3748;">${taskDescription}</p>
      </div>
      <div style="margin-top: 15px; padding: 10px; background: #edf2f7; border-radius: 4px;">
        <p style="margin: 0; font-size: 14px; color: #4a5568;">💬 This discussion thread is for collaborating on this task. Feel free to ask questions, share updates, and upload relevant files.</p>
      </div>`;

      logInfo('[DiscussionApi] Calling createDiscussion', { taskId, ideaId, subject });
      const result = await this.createDiscussion(taskId, ideaId, subject, body, false);
      logInfo('[DiscussionApi] createTaskDiscussion successful', { discussionId: result.id });
      return result;
    } catch (error) {
      logError('[DiscussionApi] createTaskDiscussion failed', error);
      throw error;
    }
  }

  /**
   * Map SharePoint item to DiscussionMessage
   */
  private mapToDiscussionMessage(item: any): DiscussionMessage {
    return {
      id: item.ID,
      subject: item.Title,
      body: item.Body || '',
      taskId: item.TaskId?.Id || item.TaskIdId || 0,
      ideaId: item.IdeaId?.Id || item.IdeaIdId || 0,
      isQuestion: item.IsQuestion || false,
      author: {
        id: item.Author?.Id || 0,
        name: item.Author?.Title || 'Unknown',
        email: item.Author?.EMail,
      },
      created: new Date(item.Created),
      modified: new Date(item.Modified),
      attachments: item.AttachmentFiles?.results?.map((att: any) => ({
        fileName: att.FileName,
        serverRelativeUrl: att.ServerRelativeUrl,
      })) || [],
      parentItemId: item.ParentItemID || null,
    };
  }
}

export const discussionApi = new DiscussionApi();
