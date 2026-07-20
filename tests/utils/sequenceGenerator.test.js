/**
 * Sequence Generator Utility Unit Tests
 * Verifies the generateDisplayId function with a mocked DB pool.
 */
'use strict';

// Mock DB before importing module
jest.mock('../../config/db');
const pool = require('../../config/db');
const { generateDisplayId } = require('../../utils/sequenceGenerator');

describe('generateDisplayId', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('TC-SEQ-001: generates formatted ID with correct prefix and zero-padded number', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ next_value: 1 }] });
    const id = await generateDisplayId(1, 'order', 'ORD');
    expect(id).toBe('ORD-001');
  });

  test('TC-SEQ-002: pads numbers to 3 digits (e.g. 42 → 042)', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ next_value: 42 }] });
    const id = await generateDisplayId(1, 'order', 'ORD');
    expect(id).toBe('ORD-042');
  });

  test('TC-SEQ-003: handles large sequence numbers without padding', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ next_value: 1000 }] });
    const id = await generateDisplayId(1, 'invoice', 'INV');
    expect(id).toBe('INV-1000');
  });

  test('TC-SEQ-004: uses correct prefix for different entity types', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ next_value: 5 }] });
    const id = await generateDisplayId(2, 'lead', 'LEAD');
    expect(id).toBe('LEAD-005');
  });

  test('TC-SEQ-005: passes correct SQL parameters to pool.query', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ next_value: 1 }] });
    await generateDisplayId(3, 'payment', 'PAY');

    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO boutique_sequences'),
      [3, 'payment']
    );
  });

  test('TC-SEQ-006: throws error when DB query fails', async () => {
    pool.query.mockRejectedValueOnce(new Error('DB connection failed'));
    await expect(generateDisplayId(1, 'order', 'ORD')).rejects.toThrow('DB connection failed');
  });
});
