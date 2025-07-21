// Test setup file
process.env.NODE_ENV = 'test';
process.env.DB_PATH = './data/test.db';
process.env.LOG_LEVEL = 'error';

// Suppress console logs during tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}; 