/**
 * env.ts runs module-level side-effects (throws on missing vars).
 * We test by:
 *   1. Mocking dotenv so it never reads from .env files (env is controlled by us)
 *   2. Using vi.resetModules() + dynamic import() to get a fresh module each time
 */
import { describe, it, expect, afterEach, vi, beforeAll } from 'vitest';

// Prevent dotenv from touching process.env during these tests
vi.mock('dotenv', () => ({ default: { config: vi.fn() } }));

const VALID = {
  SESSION_SECRET: 'test-session-secret-value',
  MONGODB_URI: 'mongodb://localhost:27017/test',
};

/** Temporarily override specific env vars, returning a restore function. */
function withEnv(overrides: Record<string, string | undefined>) {
  const saved: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(overrides)) {
    saved[k] = process.env[k];
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  return () => {
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  };
}

afterEach(() => {
  vi.resetModules();
});

describe('env validation — fail fast', () => {
  it('throws when SESSION_SECRET is missing', async () => {
    const restore = withEnv({ SESSION_SECRET: undefined, MONGODB_URI: VALID.MONGODB_URI });
    try {
      await expect(import('./env')).rejects.toThrow('SESSION_SECRET');
    } finally {
      restore();
    }
  });

  it('throws when MONGODB_URI is missing', async () => {
    const restore = withEnv({ SESSION_SECRET: VALID.SESSION_SECRET, MONGODB_URI: undefined });
    try {
      await expect(import('./env')).rejects.toThrow('MONGODB_URI');
    } finally {
      restore();
    }
  });

  it('throws listing both when both are missing', async () => {
    const restore = withEnv({ SESSION_SECRET: undefined, MONGODB_URI: undefined });
    try {
      await expect(import('./env')).rejects.toThrow(/SESSION_SECRET|MONGODB_URI/);
    } finally {
      restore();
    }
  });

  it('exports config without throwing when required vars are set', async () => {
    const restore = withEnv(VALID);
    try {
      const { config } = await import('./env');
      expect(config.sessionSecret).toBe(VALID.SESSION_SECRET);
      expect(config.mongodbUri).toBe(VALID.MONGODB_URI);
    } finally {
      restore();
    }
  });
});

describe('env defaults', () => {
  it('CLIENT_URL defaults to http://localhost:5174 when not set', async () => {
    const restore = withEnv({ ...VALID, CLIENT_URL: undefined });
    try {
      const { config } = await import('./env');
      expect(config.clientUrl).toBe('http://localhost:5174');
    } finally {
      restore();
    }
  });

  it('uses CLIENT_URL when set', async () => {
    const restore = withEnv({ ...VALID, CLIENT_URL: 'https://myapp.onrender.com' });
    try {
      const { config } = await import('./env');
      expect(config.clientUrl).toBe('https://myapp.onrender.com');
    } finally {
      restore();
    }
  });
});
