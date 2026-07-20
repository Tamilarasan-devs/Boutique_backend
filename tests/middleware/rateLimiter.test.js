/**
 * Rate Limiter Middleware Unit Tests
 */
'use strict';

const { authLimiter } = require('../../middleware/rateLimiter');

const makeReq = (ip = '127.0.0.1') => ({
  ip,
  headers: {},
});

const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.set = jest.fn().mockReturnValue(res);
  return res;
};

describe('authLimiter middleware', () => {
  test('TC-RL-001: allows request under the limit', () => {
    const req = makeReq('10.0.0.1');
    const res = makeRes();
    const next = jest.fn();

    authLimiter(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  test('TC-RL-002: blocks requests over the limit (429)', () => {
    const req = makeReq('10.0.0.2');
    const res = makeRes();
    const next = jest.fn();

    // Send 16 requests (limit is 15)
    for (let i = 0; i < 16; i++) {
      authLimiter(req, makeRes(), jest.fn());
    }

    authLimiter(req, res, next);

    expect(res.status).toHaveBeenCalledWith(429);
    expect(next).not.toHaveBeenCalled();
  });

  test('TC-RL-003: different IPs have independent rate limits', () => {
    const req1 = makeReq('192.168.1.1');
    const req2 = makeReq('192.168.1.2');
    const next1 = jest.fn();
    const next2 = jest.fn();

    // Exhaust limit for IP1
    for (let i = 0; i < 16; i++) {
      authLimiter(req1, makeRes(), jest.fn());
    }
    authLimiter(req1, makeRes(), next1);

    // IP2 should still pass
    authLimiter(req2, makeRes(), next2);

    expect(next2).toHaveBeenCalledTimes(1);
  });
});
