// Innovative Ideas API Service
// src/services/ideaApi.ts

import { sharePointApi, DEFAULT_CONFIG } from '../utils/secureApi';
import { logError, logInfo } from '../utils/logger';
import {
  Idea,
  Task,
  Discussion,
  ProcessedIdea,
  ProcessedTask,
  ProcessedDiscussion,
  IdeaTrailEvent,
} from '../types';

// List names
const LISTS = DEFAULT_CONFIG.lists;

// Field mappings for SharePoint 2016 compatibility
const IDEA_SELECT =
  'ID,Title,Description,Status,Category,Priority,Created,Modified,Author/Id,Author/Title,ApprovedBy/Id,ApprovedBy/Title,Attachments,AttachmentFiles';
const TASK_SELECT =
  'ID,Title,Body,Status,Priority,PercentComplete,DueDate,StartDate,AssignedTo/Id,AssignedTo/Title,AssignedTo/EMail';
const DISCUSSION_SELECT =
  'ID,Title,Body,Created,Modified,Author/Id,Author/Title';
const IDEA_TRAIL_SELECT =
  'ID,Idea/Id,Idea/Title,EventType,Title,Description,Actor/Id,Actor/Title,PreviousStatus,NewStatus,Comments,Metadata,Created';

// API Service Class
export class IdeaApiService {
  // Get all ideas
  async getIdeas(filter?: string): Promise<ProcessedIdea[]> {
    try {
      let endpoint = `/_api/web/lists/getbytitle('${LISTS.ideas}')/items?$select=${IDEA_SELECT}&$expand=Author,ApprovedBy,AttachmentFiles&$orderby=Created desc&$top=500`;

      if (filter) {
        endpoint += `&$filter=${filter}`;
      }

      const response = await sharePointApi.get<any>(endpoint);

      return response.d.results.map(this.processIdea);
    } catch (error) {
      logError('Failed to fetch ideas', error);
      throw error;
    }
  }

  // Upload attachments for an idea
  private async uploadAttachments(ideaId: number, attachments: File[]): Promise<void> {
    try {
      const uploadPromises = attachments.map(async (file) => {
        const endpoint = `/_api/web/lists/getbytitle('${LISTS.ideas}')/items(${ideaId})/AttachmentFiles/add(FileName='${file.name}')`;

        // For SharePoint 2016, we need to use FormData for file uploads
        const formData = new FormData();
        formData.append('file', file);

        await sharePointApi.post(endpoint, formData, {
          headers: {
            'Content-Type': undefined, // Let browser set content-type for FormData
          },
        });

        logInfo('Attachment uploaded successfully', { ideaId, fileName: file.name });
      });

      await Promise.all(uploadPromises);
    } catch (error) {
      logError('Failed to upload attachments', error);
      throw error;
    }
  }

  // Get single idea by ID
  async getIdeaById(id: number): Promise<ProcessedIdea | null> {
    try {
      const endpoint = `/_api/web/lists/getbytitle('${LISTS.ideas}')/items(${id})?$select=${IDEA_SELECT}&$expand=Author,ApprovedBy,AttachmentFiles`;

      const response = await sharePointApi.get<any>(endpoint);

      return this.processIdea(response.d);
    } catch (error) {
      logError(`Failed to fetch idea ${id}`, error);
      throw error;
    }
  }

  // Create new idea
  async createIdea(ideaData: {
    title: string;
    description: string;
    category: string;
    priority: string;
    status: string;
    attachments?: File[];
  }, user?: { id: number; name: string }): Promise<ProcessedIdea> {
    try {
      const endpoint = `/_api/web/lists/getbytitle('${LISTS.ideas}')/items`;

      const data = {
        __metadata: {
          type: 'SP.Data.Innovative_x005f_ideasListItem',
        },
        Title: ideaData.title,
        Description: ideaData.description,
        Status: ideaData.status,
        Category: ideaData.category,
        Priority: ideaData.priority,
      };

      const response = await sharePointApi.post<any>(endpoint, data);
      const newIdeaId = response.d.ID;

      logInfo('Idea created successfully', { id: newIdeaId });

      // Handle attachments if provided
      if (ideaData.attachments && ideaData.attachments.length > 0) {
        await this.uploadAttachments(newIdeaId, ideaData.attachments);
      }

      // Create trail event for idea creation
      try {
        await this.createIdeaTrailEvent({
          ideaId: newIdeaId,
          eventType: "submitted",
          title: "Idea Submitted",
          description: `Idea "${ideaData.title}" was submitted for review`,
          actor: user?.name || "Unknown User",
          actorId: user?.id || 0,
          previousStatus: undefined,
          newStatus: "Pending",
          metadata: {
            category: ideaData.category,
            priority: ideaData.priority,
            hasAttachments: ideaData.attachments && ideaData.attachments.length > 0
          }
        });
      } catch (trailError) {
        logError('Failed to create trail event for idea creation', trailError);
        // Don't fail the idea creation if trail event fails
      }

      // Fetch and return the complete idea
      return (await this.getIdeaById(newIdeaId)) as ProcessedIdea;
    } catch (error) {
      logError('Failed to create idea', error);
      throw error;
    }
  }

  // Update idea
  async updateIdea(id: number, updates: Partial<Idea>): Promise<ProcessedIdea> {
    try {
      const endpoint = `/_api/web/lists/getbytitle('${LISTS.ideas}')/items(${id})`;

      const data: any = {
        __metadata: {
          type: 'SP.Data.Innovative_x005f_ideasListItem',
        },
      };
      if (updates.title) data.Title = updates.title;
      if (updates.description) data.Description = updates.description;
      if (updates.status) data.Status = updates.status;
      if (updates.category) data.Category = updates.category;
      if (updates.priority) data.Priority = updates.priority;
      if (updates.approvedBy) data.ApprovedById = parseInt(updates.approvedBy);

      // Use MERGE method without ETag to avoid concurrency issues
      await sharePointApi.put<any>(endpoint, data);

      // Fetch updated item
      return (await this.getIdeaById(id)) as ProcessedIdea;
    } catch (error) {
      logError(`Failed to update idea ${id}`, error);
      throw error;
    }
  }

  // Get tasks for an idea
  async getTasksForIdea(ideaId: number): Promise<ProcessedTask[]> {
    try {
      const endpoint = `/_api/web/lists/getbytitle('${LISTS.tasks}')/items?$select=${TASK_SELECT}&$expand=AssignedTo&$filter=IdeaId eq ${ideaId}&$orderby=Created desc&$top=100`;

      const response = await sharePointApi.get<any>(endpoint);

      return response.d.results.map(this.processTask);
    } catch (error) {
      logError(`Failed to fetch tasks for idea ${ideaId}`, error);
      throw error;
    }
  }

  // Create task for idea
  async createTaskForIdea(
    ideaId: number,
    task: Omit<Task, 'id' | 'ideaId'>,
    user?: { id: number; name: string }
  ): Promise<ProcessedTask> {
    try {
      const endpoint = `/_api/web/lists/getbytitle('${LISTS.tasks}')/items`;

      const data = {
        __metadata: {
          type: 'SP.Data.Innovative_x005f_idea_x005f_tasksListItem',
        },
        Title: task.title,
        Body: task.description,
        Status: task.status,
        Priority: task.priority || 'Normal',
        PercentComplete: (task.percentComplete || 0) / 100, // SharePoint expects 0-1
        DueDate: task.dueDate,
        StartDate: task.startDate,
        AssignedToId: task.assignedTo?.map((userId) => parseInt(userId)),
        IdeaId: ideaId, // This would need a lookup field
      };

      const response = await sharePointApi.post<any>(endpoint, data);

      logInfo('Task created successfully', { id: response.d.ID, ideaId });

      // Create trail event for task creation
      try {
        await this.createIdeaTrailEvent({
          ideaId: ideaId,
          eventType: "task_created",
          title: "Task Created",
          description: `Task "${task.title}" was created for the idea`,
          actor: user?.name || "Unknown User",
          actorId: user?.id || 0,
          previousStatus: undefined,
          newStatus: undefined,
          metadata: {
            taskId: response.d.ID,
            taskTitle: task.title,
            assignedTo: task.assignedTo,
            priority: task.priority,
            dueDate: task.dueDate
          }
        });
      } catch (trailError) {
        logError('Failed to create trail event for task creation', trailError);
        // Don't fail the task creation if trail event fails
      }

      return this.processTask(response.d);
    } catch (error) {
      logError('Failed to create task', error);
      throw error;
    }
  }

  // Get discussions for a task
  async getDiscussionsForTask(taskId: number): Promise<ProcessedDiscussion[]> {
    try {
      const endpoint = `/_api/web/lists/getbytitle('${LISTS.discussions}')/items?$select=${DISCUSSION_SELECT}&$expand=Author&$filter=TaskId eq ${taskId}&$orderby=Created desc&$top=200`;

      const response = await sharePointApi.get<any>(endpoint);

      return response.d.results.map(this.processDiscussion);
    } catch (error) {
      logError(`Failed to fetch discussions for task ${taskId}`, error);
      throw error;
    }
  }

  // Create discussion for task
  async createDiscussionForTask(
    taskId: number,
    discussion: Omit<Discussion, 'id' | 'taskId'>,
  ): Promise<ProcessedDiscussion> {
    try {
      const endpoint = `/_api/web/lists/getbytitle('${LISTS.discussions}')/items`;

      const data = {
        __metadata: {
          type: 'SP.Data.Innovative_x005f_idea_x005f_discussionsListItem',
        },
        Title: discussion.title,
        Body: discussion.body,
        TaskId: taskId, // This would need a lookup field
      };

      const response = await sharePointApi.post<any>(endpoint, data);

      logInfo('Discussion created successfully', { id: response.d.ID, taskId });
      return this.processDiscussion(response.d);
    } catch (error) {
      logError('Failed to create discussion', error);
      throw error;
    }
  }

  // Process raw SharePoint idea data
  private processIdea(raw: any): ProcessedIdea {
    const createdDate = raw.Created ? new Date(raw.Created) : new Date();
    const modifiedDate = raw.Modified ? new Date(raw.Modified) : createdDate;

    // Validate dates
    if (isNaN(createdDate.getTime())) {
      logError('Invalid created date for idea', {
        rawCreated: raw.Created,
        ideaId: raw.ID,
      });
    }
    if (isNaN(modifiedDate.getTime())) {
      logError('Invalid modified date for idea', {
        rawModified: raw.Modified,
        ideaId: raw.ID,
      });
    }

    // Extract category and priority from SharePoint fields first
    let category = raw.Category || 'Other';
    let priority = raw.Priority || 'Medium';
    let description = raw.Description || '';

    // For backward compatibility: if SharePoint fields are null/empty,
    // try to extract from description metadata
    if (
      (!raw.Category || raw.Category === null) &&
      (!raw.Priority || raw.Priority === null)
    ) {
      const descLines = description.split('\n');
      const metadataStart = descLines.findIndex((line) => line === '---');
      if (metadataStart !== -1) {
        // Extract metadata and clean description
        const metadata = descLines.slice(metadataStart + 1);
        description = descLines.slice(0, metadataStart).join('\n');

        metadata.forEach((line: string) => {
          if (line.startsWith('Category: ')) {
            category = line.replace('Category: ', '');
          } else if (line.startsWith('Priority: ')) {
            priority = line.replace('Priority: ', '');
          }
        });
      }
    }

    return {
      id: raw.ID,
      title: raw.Title,
      description,
      status: raw.Status,
      category,
      priority,
      created: createdDate,
      modified: modifiedDate,
      createdBy: {
        id: raw.Author?.Id,
        name: raw.Author?.Title,
        email: raw.Author?.EMail,
      },
      approvedBy: raw.ApprovedBy
        ? {
            id: raw.ApprovedBy.Id,
            name: raw.ApprovedBy.Title,
            email: raw.ApprovedBy.EMail,
          }
        : undefined,
      attachments: raw.AttachmentFiles?.results?.map((file: any) => ({
        fileName: file.FileName,
        serverRelativeUrl: file.ServerRelativeUrl,
      })) || [],
    };
  }

  // Process raw SharePoint task data
  private processTask(raw: any): ProcessedTask {
    const createdDate = raw.Created ? new Date(raw.Created) : new Date();
    const modifiedDate = raw.Modified ? new Date(raw.Modified) : createdDate;

    // Validate dates
    if (isNaN(createdDate.getTime())) {
      logError('Invalid created date for task', {
        rawCreated: raw.Created,
        taskId: raw.ID,
      });
    }
    if (isNaN(modifiedDate.getTime())) {
      logError('Invalid modified date for task', {
        rawModified: raw.Modified,
        taskId: raw.ID,
      });
    }

    return {
      id: raw.ID,
      title: raw.Title,
      description: raw.Body,
      status: raw.Status,
      priority: raw.Priority,
      percentComplete: (raw.PercentComplete || 0) * 100, // Convert to percentage
      dueDate: raw.DueDate ? new Date(raw.DueDate) : undefined,
      startDate: raw.StartDate ? new Date(raw.StartDate) : undefined,
      assignedTo:
        raw.AssignedTo?.results?.map((user: any) => ({
          id: user.Id,
          name: user.Title,
          email: user.EMail,
          source: 'AD', // Assuming AD users
        })) || [],
      created: createdDate,
      modified: modifiedDate,
      ideaId: raw.IdeaId, // Would need lookup field
    };
  }

  // Process raw SharePoint discussion data
  private processDiscussion(raw: any): ProcessedDiscussion {
    const createdDate = raw.Created ? new Date(raw.Created) : new Date();
    const modifiedDate = raw.Modified ? new Date(raw.Modified) : createdDate;

    // Validate dates
    if (isNaN(createdDate.getTime())) {
      logError('Invalid created date for discussion', {
        rawCreated: raw.Created,
        discussionId: raw.ID,
      });
    }
    if (isNaN(modifiedDate.getTime())) {
      logError('Invalid modified date for discussion', {
        rawModified: raw.Modified,
        discussionId: raw.ID,
      });
    }

    return {
      id: raw.ID,
      title: raw.Title,
      body: raw.Body,
      created: createdDate,
      modified: modifiedDate,
      createdBy: {
        id: raw.Author?.Id,
        name: raw.Author?.Title,
        email: raw.Author?.EMail,
      },
      taskId: raw.TaskId, // Would need lookup field
    };
  }

  // Idea Trail Events API
  async getIdeaTrailEvents(ideaId?: number): Promise<IdeaTrailEvent[]> {
    try {
      let endpoint = `/_api/web/lists/getbytitle('${LISTS.ideaTrail}')/items?$select=${IDEA_TRAIL_SELECT}&$expand=Actor,Idea&$orderby=Created desc&$top=1000`;

      if (ideaId) {
        endpoint += `&$filter=Idea/Id eq ${ideaId}`;
      }

      const response = await sharePointApi.get<any>(endpoint);
      return response.d.results.map(this.processIdeaTrailEvent);
    } catch (error) {
      logError('Failed to fetch idea trail events', error);
      throw error;
    }
  }

  async createIdeaTrailEvent(event: Omit<IdeaTrailEvent, 'id' | 'timestamp'>): Promise<IdeaTrailEvent> {
    try {
      const itemData = {
        IdeaId: event.ideaId, // Lookup field - provide the ID of the related item
        EventType: event.eventType,
        Title: event.title,
        Description: event.description,
        ActorId: event.actorId,
        PreviousStatus: event.previousStatus,
        NewStatus: event.newStatus,
        Comments: event.comments,
        Metadata: JSON.stringify(event.metadata || {}),
      };

      const endpoint = `/_api/web/lists/getbytitle('${LISTS.ideaTrail}')/items`;
      const response = await sharePointApi.post<any>(endpoint, itemData);

      // Fetch the created item to return complete data
      const createdEvent = await this.getIdeaTrailEvents().then(events =>
        events.find(e => e.id === response.d.ID)
      );

      if (!createdEvent) {
        throw new Error('Failed to retrieve created trail event');
      }

      return createdEvent;
    } catch (error) {
      logError('Failed to create idea trail event', error);
      throw error;
    }
  }

  private processIdeaTrailEvent(raw: any): IdeaTrailEvent {
    const createdDate = raw.Created ? new Date(raw.Created) : new Date();

    let metadata = {};
    try {
      metadata = raw.Metadata ? JSON.parse(raw.Metadata) : {};
    } catch (e) {
      logError('Failed to parse trail event metadata', e);
    }

    return {
      id: raw.ID,
      ideaId: raw.Idea?.Id || 0,
      eventType: raw.EventType,
      title: raw.Title,
      description: raw.Description,
      actor: raw.Actor?.Title || 'Unknown',
      actorId: raw.Actor?.Id || 0,
      timestamp: createdDate,
      previousStatus: raw.PreviousStatus,
      newStatus: raw.NewStatus,
      comments: raw.Comments,
      metadata,
    };
  }
}

// Singleton instance
export const ideaApi = new IdeaApiService();
