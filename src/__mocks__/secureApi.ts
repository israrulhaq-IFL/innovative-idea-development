// Mock for secureApi.ts
// src/__mocks__/secureApi.ts

export const DEFAULT_CONFIG = {
  baseUrl: 'http://test.sharepoint.com',
  lists: {
    ideas: 'innovative_ideas',
    tasks: 'innovative_idea_tasks',
    discussions: 'innovative_idea_discussions',
    ideaTrail: 'innovative_idea_trail',
  },
};

export const sharePointApi = {
  get: jest.fn(),
  post: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
};