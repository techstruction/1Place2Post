import { classifyError, isPermanent, retryDelayMs } from './error-classifier';

describe('Smart retry integration — error classifier in publish pipeline', () => {
  describe('permanent error handling', () => {
    it('401 is permanent — job should be BLOCKED', () => {
      const errorClass = classifyError({ status: 401 });
      expect(isPermanent(errorClass)).toBe(true);
      expect(errorClass).toBe('TOKEN_EXPIRED');
    });

    it('400 is permanent — job should be FAILED after exhaustion', () => {
      const errorClass = classifyError({ status: 400 });
      expect(isPermanent(errorClass)).toBe(true);
      expect(errorClass).toBe('PERMANENT');
    });
  });

  describe('transient error handling', () => {
    it('503 is transient — job should be retried', () => {
      const errorClass = classifyError({ status: 503 });
      expect(isPermanent(errorClass)).toBe(false);
    });

    it('429 retry delay respects Retry-After header', () => {
      const delay = retryDelayMs('RATE_LIMIT', 1, 120);
      expect(delay).toBeGreaterThanOrEqual(120_000);
    });

    it('transient retry delay grows exponentially', () => {
      const d0 = retryDelayMs('TRANSIENT', 0);
      const d1 = retryDelayMs('TRANSIENT', 1);
      const d2 = retryDelayMs('TRANSIENT', 2);
      expect(d1).toBeGreaterThan(d0);
      expect(d2).toBeGreaterThan(d1);
    });
  });
});
