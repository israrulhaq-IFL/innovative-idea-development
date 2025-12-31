// Jest configuration for Innovative Ideas Application
// jest.config.js

module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/src/__mocks__/fileMock.js',
    '^../config/environment.js$': '<rootDir>/src/__mocks__/environmentMock.js',
    '^../context/SharePointContext$': '<rootDir>/src/__mocks__/sharePointContextMock.js',
    '^../utils/secureApi$': '<rootDir>/src/__mocks__/secureApi.ts'
  },
  transform: {
    '^.+\\.(ts|tsx)$': 'babel-jest',
    '^.+\\.(js|jsx)$': 'babel-jest'
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.(ts|tsx|js)',
    '<rootDir>/src/**/?(*.)(test|spec).(ts|tsx|js)'
  ],
  extensionsToTreatAsEsm: ['.ts'],
  globals: {
    'ts-jest': {
      useESM: true,
    },
    'import.meta': {
      env: {
        VITE_LIST_IDEAS: 'innovative_ideas',
        VITE_LIST_TASKS: 'innovative_idea_tasks',
        VITE_LIST_DISCUSSIONS: 'innovative_idea_discussions',
        VITE_LIST_APPROVERS: 'innovative_idea_approvers',
        VITE_SHAREPOINT_BASE_URL: 'http://test.sharepoint.com',
      }
    }
  },
  collectCoverageFrom: [
    'src/**/*.(ts|tsx)',
    '!src/**/*.d.ts',
    '!src/main.tsx',
    '!src/vite-env.d.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 5,
      functions: 5,
      lines: 5,
      statements: 5
    }
  },
  transformIgnorePatterns: [
    'node_modules/(?!(sucrase)/)'
  ],
};