import { AxiosError } from 'axios';

/**
 * Extract a human-readable error message from an axios error or generic thrown value.
 */
export function getApiErrorMessage(err: unknown, fallback = 'An unexpected error occurred'): string {
  if (err instanceof AxiosError) {
    const data = err.response?.data;
    if (typeof data === 'object' && data !== null && 'message' in data) {
      const msg = (data as { message: string | string[] }).message;
      return Array.isArray(msg) ? msg.join('. ') : msg;
    }
    return err.message || fallback;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}
