/**
 * Jest Configuration — Boutique Backend
 */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: [
    'controller/**/*.js',
    'middleware/**/*.js',
    'utils/**/*.js',
    '!**/node_modules/**',
  ],
  coverageReporters: ['text', 'html'],
  coverageDirectory: 'coverage',
  testTimeout: 15000,
  // Clear mock state between tests
  clearMocks: true,
  restoreMocks: true,
};
