import { ErrorClass } from '@prisma/client';

export interface ClassifiableError {
  status?: number;
  code?: string;
  retryAfterSeconds?: number;
}

const NETWORK_ERROR_CODES = new Set(['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'ECONNREFUSED']);
const PERMANENT_HTTP_STATUSES = new Set([400, 403, 404, 410, 422]);
const TRANSIENT_HTTP_STATUSES = new Set([408, 500, 502, 503, 504]);

export function classifyError(err: ClassifiableError): ErrorClass {
  if (err.status === 401) return 'TOKEN_EXPIRED';
  if (err.status === 429) return 'RATE_LIMIT';
  if (err.status && PERMANENT_HTTP_STATUSES.has(err.status)) return 'PERMANENT';
  if (err.status && TRANSIENT_HTTP_STATUSES.has(err.status)) return 'TRANSIENT';
  if (err.code && NETWORK_ERROR_CODES.has(err.code)) return 'TRANSIENT';
  return 'UNKNOWN';
}

export function isPermanent(errorClass: ErrorClass): boolean {
  return errorClass === 'TOKEN_EXPIRED' || errorClass === 'PERMANENT';
}

export function retryDelayMs(errorClass: ErrorClass, attempt: number, retryAfterSeconds?: number): number {
  if (errorClass === 'RATE_LIMIT' && retryAfterSeconds) {
    return Math.max(retryAfterSeconds * 1000, 60_000);
  }
  const base = 2 * 60 * 1000; // 2 minutes
  const max = 24 * 60 * 60 * 1000; // 24 hours
  const jitter = Math.random() * 30_000;
  return Math.min(base * Math.pow(2, attempt) + jitter, max);
}
