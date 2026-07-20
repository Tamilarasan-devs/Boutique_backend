/**
 * Mock for config/db.js — replaces the real PostgreSQL pool with a Jest mock.
 * Each test can configure the return values via mockResolvedValue/mockReturnValue.
 *
 * Usage in tests:
 *   jest.mock('../../config/db');
 *   const pool = require('../../config/db');
 *   pool.query.mockResolvedValue({ rows: [...], rowCount: 1 });
 */
const pool = {
  query: jest.fn(),
  connect: jest.fn(),
  end: jest.fn(),
  on: jest.fn(),
};

module.exports = pool;
