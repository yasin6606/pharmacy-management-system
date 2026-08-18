/**
 * Global test setup — runs before each Jest suite.
 * Ensures env defaults so modules that read env at import time do not throw.
 */
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-not-for-production';
process.env.JWT_EXPIRES_IN = '1h';
// Force memory rate limiter in tests
delete process.env.REDIS_URL;
