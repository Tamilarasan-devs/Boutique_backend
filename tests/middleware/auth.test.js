/**
 * Auth Middleware Unit Tests
 * Tests verifyToken and requireRole independently from the database.
 */
'use strict';

const jwt = require('jsonwebtoken');

// Set up JWT secret before importing the module
process.env.JWT_SECRET = 'test_jwt_secret_for_unit_tests_min_32_chars';

const { verifyToken, requireRole } = require('../../middleware/auth');

// ─── Helpers ─────────────────────────────────────────────────────────────────
const makeReq = (overrides = {}) => ({
  headers: {},
  query: {},
  ...overrides,
});

const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const makeNext = () => jest.fn();

const signToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

// ─── verifyToken ─────────────────────────────────────────────────────────────
describe('verifyToken middleware', () => {
  test('TC-MW-AUTH-001: calls next() with valid Bearer token', () => {
    const token = signToken({ id: 1, email: 'owner@test.com', role: 'owner', boutique_id: 1 });
    const req = makeReq({ headers: { authorization: `Bearer ${token}` } });
    const res = makeRes();
    const next = makeNext();

    verifyToken(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user).toMatchObject({ id: 1, email: 'owner@test.com', role: 'owner' });
    expect(res.status).not.toHaveBeenCalled();
  });

  test('TC-MW-AUTH-002: returns 401 when no token provided', () => {
    const req = makeReq();
    const res = makeRes();
    const next = makeNext();

    verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
    expect(next).not.toHaveBeenCalled();
  });

  test('TC-MW-AUTH-003: returns 401 for invalid token', () => {
    const req = makeReq({ headers: { authorization: 'Bearer tampered.jwt.token' } });
    const res = makeRes();
    const next = makeNext();

    verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('TC-MW-AUTH-004: returns 401 for expired token', () => {
    const token = jwt.sign(
      { id: 1, email: 'test@test.com', role: 'owner', boutique_id: 1 },
      process.env.JWT_SECRET,
      { expiresIn: '-1s' } // already expired
    );
    const req = makeReq({ headers: { authorization: `Bearer ${token}` } });
    const res = makeRes();
    const next = makeNext();

    verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('TC-MW-AUTH-005: accepts token from query parameter', () => {
    const token = signToken({ id: 2, email: 'staff@test.com', role: 'sales_staff', boutique_id: 1 });
    const req = makeReq({ query: { token } });
    const res = makeRes();
    const next = makeNext();

    verifyToken(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user.role).toBe('sales_staff');
  });
});

// ─── requireRole ─────────────────────────────────────────────────────────────
describe('requireRole middleware', () => {
  test('TC-MW-ROLE-001: allows access for matching role', () => {
    const req = makeReq();
    req.user = { id: 1, role: 'owner', boutique_id: 1 };
    const res = makeRes();
    const next = makeNext();

    requireRole('owner')(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  test('TC-MW-ROLE-002: allows access for any matching role in list', () => {
    const req = makeReq();
    req.user = { id: 2, role: 'manager', boutique_id: 1 };
    const res = makeRes();
    const next = makeNext();

    requireRole('owner', 'manager')(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  test('TC-MW-ROLE-003: returns 403 for non-matching role', () => {
    const req = makeReq();
    req.user = { id: 3, role: 'sales_staff', boutique_id: 1 };
    const res = makeRes();
    const next = makeNext();

    requireRole('owner')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test('TC-MW-ROLE-004: returns 401 when user not authenticated', () => {
    const req = makeReq(); // no req.user
    const res = makeRes();
    const next = makeNext();

    requireRole('owner')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});
