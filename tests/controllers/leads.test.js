/**
 * Lead Controller Unit Tests
 * All DB calls are mocked — no real database connection needed.
 */
'use strict';

jest.mock('../../config/db');
jest.mock('../../utils/sequenceGenerator');

const pool = require('../../config/db');
const { generateDisplayId } = require('../../utils/sequenceGenerator');
const { getLeads, addLead, updateLeadStatus, updateLead, deleteLead } = require('../../controller/leadController');

// ─── Helpers ────────────────────────────────────────────────────────────────
const mockUser = { id: 1, boutique_id: 1, role: 'owner' };

const makeReq = (overrides = {}) => ({
  user: mockUser,
  body: {},
  params: {},
  query: {},
  ...overrides,
});

const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

// ─── Tests ──────────────────────────────────────────────────────────────────
describe('leadController.getLeads', () => {
  beforeEach(() => jest.clearAllMocks());

  test('TC-LEAD-CTRL-001: returns leads for the authenticated boutique', async () => {
    const mockLeads = [
      { id: 1, name: 'Alice', status: 'New', boutique_id: 1 },
      { id: 2, name: 'Bob', status: 'Contacted', boutique_id: 1 },
    ];
    pool.query.mockResolvedValueOnce({ rows: mockLeads });

    const req = makeReq();
    const res = makeRes();
    await getLeads(req, res);

    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('WHERE boutique_id = $1'),
      [1]
    );
    expect(res.json).toHaveBeenCalledWith(mockLeads);
  });

  test('TC-LEAD-CTRL-002: returns 500 on DB error', async () => {
    pool.query.mockRejectedValueOnce(new Error('DB Error'));

    const req = makeReq();
    const res = makeRes();
    await getLeads(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('leadController.addLead', () => {
  beforeEach(() => jest.clearAllMocks());

  test('TC-LEAD-CTRL-003: creates a lead with generated display_id', async () => {
    generateDisplayId.mockResolvedValueOnce('LEAD-001');
    const newLead = {
      id: 1, name: 'Charlie', phone: '9876543210', source: 'Instagram',
      requirement: 'Saree', status: 'New', value: 5000, display_id: 'LEAD-001', boutique_id: 1,
    };
    pool.query.mockResolvedValueOnce({ rows: [newLead] });

    const req = makeReq({
      body: { name: 'Charlie', phone: '9876543210', source: 'Instagram', requirement: 'Saree', value: 5000 },
    });
    const res = makeRes();
    await addLead(req, res);

    expect(generateDisplayId).toHaveBeenCalledWith(1, 'lead', 'LEAD');
    expect(res.json).toHaveBeenCalledWith(newLead);
  });

  test('TC-LEAD-CTRL-004: returns 500 if DB insert fails', async () => {
    generateDisplayId.mockResolvedValueOnce('LEAD-002');
    pool.query.mockRejectedValueOnce(new Error('Insert failed'));

    const req = makeReq({ body: { name: 'Dave', phone: '9999999999' } });
    const res = makeRes();
    await addLead(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('leadController.updateLeadStatus', () => {
  beforeEach(() => jest.clearAllMocks());

  test('TC-LEAD-CTRL-005: updates lead status with boutique scoping', async () => {
    const updatedLead = { id: 1, status: 'Won', boutique_id: 1 };
    pool.query.mockResolvedValueOnce({ rows: [updatedLead] });

    const req = makeReq({ params: { id: '1' }, body: { status: 'Won' } });
    const res = makeRes();
    await updateLeadStatus(req, res);

    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('boutique_id = $3'),
      ['Won', '1', 1]
    );
    expect(res.json).toHaveBeenCalledWith(updatedLead);
  });

  test('TC-LEAD-CTRL-006: returns 404 when lead not found', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const req = makeReq({ params: { id: '999' }, body: { status: 'Won' } });
    const res = makeRes();
    await updateLeadStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe('leadController.deleteLead', () => {
  beforeEach(() => jest.clearAllMocks());

  test('TC-LEAD-CTRL-007: deletes lead with boutique scoping', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });

    const req = makeReq({ params: { id: '1' } });
    const res = makeRes();
    await deleteLead(req, res);

    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('boutique_id = $2'),
      ['1', 1]
    );
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ msg: expect.any(String) }));
  });

  test('TC-LEAD-CTRL-008: returns 404 if lead not found', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const req = makeReq({ params: { id: '999' } });
    const res = makeRes();
    await deleteLead(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});
