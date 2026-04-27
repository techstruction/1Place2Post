import { classifyError, isPermanent, retryDelayMs } from './error-classifier';

describe('classifyError', () => {
  it('classifies 401 as TOKEN_EXPIRED', () => {
    expect(classifyError({ status: 401 })).toBe('TOKEN_EXPIRED');
  });

  it('classifies 400 as PERMANENT', () => {
    expect(classifyError({ status: 400 })).toBe('PERMANENT');
  });

  it('classifies 403 as PERMANENT', () => {
    expect(classifyError({ status: 403 })).toBe('PERMANENT');
  });

  it('classifies 422 as PERMANENT', () => {
    expect(classifyError({ status: 422 })).toBe('PERMANENT');
  });

  it('classifies 429 as RATE_LIMIT', () => {
    expect(classifyError({ status: 429 })).toBe('RATE_LIMIT');
  });

  it('classifies 500 as TRANSIENT', () => {
    expect(classifyError({ status: 500 })).toBe('TRANSIENT');
  });

  it('classifies 503 as TRANSIENT', () => {
    expect(classifyError({ status: 503 })).toBe('TRANSIENT');
  });

  it('classifies network errors as TRANSIENT', () => {
    expect(classifyError({ code: 'ECONNRESET' })).toBe('TRANSIENT');
  });

  it('classifies unknown errors as UNKNOWN', () => {
    expect(classifyError({})).toBe('UNKNOWN');
  });
});

describe('isPermanent', () => {
  it('returns true for TOKEN_EXPIRED', () => {
    expect(isPermanent('TOKEN_EXPIRED')).toBe(true);
  });

  it('returns true for PERMANENT', () => {
    expect(isPermanent('PERMANENT')).toBe(true);
  });

  it('returns false for TRANSIENT', () => {
    expect(isPermanent('TRANSIENT')).toBe(false);
  });

  it('returns false for RATE_LIMIT', () => {
    expect(isPermanent('RATE_LIMIT')).toBe(false);
  });
});

describe('retryDelayMs', () => {
  it('returns at least retryAfterSeconds for RATE_LIMIT', () => {
    const delay = retryDelayMs('RATE_LIMIT', 1, 90);
    expect(delay).toBeGreaterThanOrEqual(90_000);
  });

  it('returns exponential delay for TRANSIENT that grows with attempt', () => {
    const delay0 = retryDelayMs('TRANSIENT', 0);
    const delay1 = retryDelayMs('TRANSIENT', 1);
    expect(delay1).toBeGreaterThan(delay0);
  });
});
