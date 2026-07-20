/**
 * Customer Controller Unit Tests
 * Covers CRUD + duplicate detection with mocked DB.
 */
'use strict';

jest.mock('../../config/db');
const pool = require('../../config/db');
const { addCustomer, getCustomers, updateCustomer, deleteCustomer } = require('../../controller/customerController');

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
  return res;
};

describe('customerController.addCustomer', () => {
  beforeEach(() => jest.clearAllMocks());

  test('TC-CUST-CTRL-001: returns 400 when name is missing', async () => {
    const req = makeReq({ body: { email: 'test@test.com', phone: '9999999999' } });
    const res = makeRes();
    await addCustomer(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Name is required' }));
  });

  test('TC-CUST-CTRL-002: returns 400 when duplicate phone or email exists', async () => {
    // Duplicate check returns existing customer
    pool.query.mockResolvedValueOnce({ rows: [{ id: 5 }] }); // duplicate found

    const req = makeReq({ body: { name: 'Jane', phone: '9876543210', email: 'jane@test.com' } });
    const res = makeRes();
    await addCustomer(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('already exists') }));
  });

  test('TC-CUST-CTRL-003: creates customer successfully when no duplicates', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [] }) // no duplicates
      .mockResolvedValueOnce({ rows: [{ id: 10, name: 'Jane Doe', boutique_id: 1 }] }); // insert result

    const req = makeReq({ body: { name: 'Jane Doe', phone: '9000000001', email: 'jane@boutique.com' } });
    const res = makeRes();
    await addCustomer(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.any(String) }));
  });

  test('TC-CUST-CTRL-004: creates customer even when only name is provided (no phone/email)', async () => {
    // No duplicate check needed (no phone or email provided)
    pool.query.mockResolvedValueOnce({ rows: [{ id: 11, name: 'Anonymous', boutique_id: 1 }] });

    const req = makeReq({ body: { name: 'Anonymous' } });
    const res = makeRes();
    await addCustomer(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('TC-CUST-CTRL-005: returns 500 on unexpected DB error', async () => {
    pool.query.mockRejectedValueOnce(new Error('Connection timeout'));

    const req = makeReq({ body: { name: 'Error Customer', phone: '8888888888' } });
    const res = makeRes();
    await addCustomer(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('customerController.getCustomers', () => {
  beforeEach(() => jest.clearAllMocks());

  test('TC-CUST-CTRL-006: returns all customers for the boutique', async () => {
    const customers = [
      { id: 1, name: 'Alice', boutique_id: 1, orders_count: 2 },
      { id: 2, name: 'Bob', boutique_id: 1, orders_count: 0 },
    ];
    pool.query.mockResolvedValueOnce({ rows: customers });

    const req = makeReq({ query: {} });
    const res = makeRes();
    await getCustomers(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(customers);
  });

  test('TC-CUST-CTRL-007: returns paginated results when page and limit are provided', async () => {
    const allCustomers = Array.from({ length: 25 }, (_, i) => ({ id: i + 1, name: `Customer ${i + 1}` }));
    pool.query.mockResolvedValueOnce({ rows: allCustomers });

    const req = makeReq({ query: { page: '2', limit: '10' } });
    const res = makeRes();
    await getCustomers(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const response = res.json.mock.calls[0][0];
    expect(response.customers).toHaveLength(10); // page 2, items 11-20
    expect(response.meta.page).toBe(2);
    expect(response.meta.total).toBe(25);
  });
});

describe('customerController.deleteCustomer', () => {
  beforeEach(() => jest.clearAllMocks());

  test('TC-CUST-CTRL-008: deletes customer scoped to boutique_id', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
    const req = makeReq({ params: { id: '1' } });
    const res = makeRes();
    await deleteCustomer(req, res);

    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('boutique_id=$2'),
      ['1', 1]
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('TC-CUST-CTRL-009: returns 404 when customer not found', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });
    const req = makeReq({ params: { id: '999' } });
    const res = makeRes();
    await deleteCustomer(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});
