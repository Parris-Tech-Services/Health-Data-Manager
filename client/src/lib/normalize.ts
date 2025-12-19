import { format } from 'date-fns';

// Hardcoded for Josh's context
export const DEFAULT_TIMEZONE = 'Australia/Melbourne';
export const DEFAULT_PERSON = 'Josh';

export function normalizeTimestamp(isoString: string): string {
  // Ensure we are working with a consistent ISO string
  return new Date(isoString).toISOString();
}

export function generateId(source: string, person: string, ts: string): string {
  return `${source}|${person}|${ts}`;
}

export function getDateKey(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'yyyy-MM-dd');
}

export async function computeSha256(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
