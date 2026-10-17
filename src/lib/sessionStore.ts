import { OASession, Submission } from '@/types/oa';

// In-memory server-side session store fallback
const globalSessions: Record<string, OASession> = {};

export function saveSessionServer(session: OASession) {
  globalSessions[session.id] = session;
}

export function getSessionServer(id: string): OASession | null | undefined {
  return globalSessions[id] ?? null;
}

// Client-side local storage helpers (strictly scoped to user email to prevent leakage)
if (typeof window !== 'undefined') {
  try {
    // Purge legacy global key that leaked assessments across accounts
    localStorage.removeItem('roundzero_oa_sessions');
  } catch {}
}

function getStorageKey(userEmail?: string): string {
  if (userEmail) {
    return `roundzero_oa_sessions_${encodeURIComponent(userEmail.toLowerCase().trim())}`;
  }
  return 'roundzero_oa_guest_sessions';
}

export function saveSessionLocal(session: OASession): void {
  if (typeof window === 'undefined') return;
  try {
    const key = getStorageKey(session.userEmail);
    const existingStr = localStorage.getItem(key);
    const sessions: Record<string, OASession> = existingStr
      ? JSON.parse(existingStr)
      : {};
    sessions[session.id] = session;
    localStorage.setItem(key, JSON.stringify(sessions));
  } catch (e) {
    console.error('Failed to save session to localStorage', e);
  }
}

export function getSessionLocal(id: string, userEmail?: string): OASession | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const key = getStorageKey(userEmail);
    const existingStr = localStorage.getItem(key);
    if (!existingStr) return undefined;
    const sessions: Record<string, OASession> = JSON.parse(existingStr);
    return sessions[id];
  } catch (e) {
    console.error('Failed to read session from localStorage', e);
    return undefined;
  }
}

export function getAllSessionsLocal(userEmail?: string): OASession[] {
  if (typeof window === 'undefined') return [];
  try {
    const key = getStorageKey(userEmail);
    const existingStr = localStorage.getItem(key);
    if (!existingStr) return [];
    const sessions: Record<string, OASession> = JSON.parse(existingStr);
    return Object.values(sessions).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (e) {
    return [];
  }
}
