// Jest setup file for Innovative Ideas Application
import '@testing-library/jest-dom';

declare global {
  var SP: {
    ClientContext: jest.MockedFunction<any>;
    Web: jest.MockedFunction<any>;
    List: jest.MockedFunction<any>;
    ListItem: jest.MockedFunction<any>;
  };
}

export {};

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock window.ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock window.IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock SharePoint context
global.SP = {
  ClientContext: jest.fn(),
  Web: jest.fn(),
  List: jest.fn(),
  ListItem: jest.fn(),
};

// Mock jQuery
(global as any).$ = {
  ajax: jest.fn(),
  getJSON: jest.fn(),
  post: jest.fn(),
};

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
(global as any).localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
(global as any).sessionStorage = sessionStorageMock;

// Mock console methods for cleaner test output
global.console = {
  ...console,
  // Keep log and warn for debugging, but suppress in CI
  log: jest.fn(),
  warn: jest.fn(),
  error: console.error,
  info: jest.fn(),
};

// Cleanup after each test
afterEach(() => {
  jest.clearAllMocks();
});
