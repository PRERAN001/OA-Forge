import { OASession, Submission } from '@/types/oa';

// In-memory server-side session store fallback
const globalSessions: Record<string, OASession> = {};

export function saveSessionServer(session: OASession) {
  globalSessions[session.id] = session;
}

export function getSessionServer(id: string): OASession | undefined {
  return globalSessions[id];
}

// Client-side local storage helpers
const STORAGE_KEY = 'aura_oa_sessions';

export function saveSessionLocal(session: OASession): void {
  if (typeof window === 'undefined') return;
  try {
    const existingStr = localStorage.getItem(STORAGE_KEY);
    const sessions: Record<string, OASession> = existingStr
      ? JSON.parse(existingStr)
      : {};
    sessions[session.id] = session;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch (e) {
    console.error('Failed to save session to localStorage', e);
  }
}

export function getSessionLocal(id: string): OASession | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const existingStr = localStorage.getItem(STORAGE_KEY);
    if (!existingStr) return undefined;
    const sessions: Record<string, OASession> = JSON.parse(existingStr);
    return sessions[id];
  } catch (e) {
    console.error('Failed to read session from localStorage', e);
    return undefined;
  }
}

export function getAllSessionsLocal(): OASession[] {
  if (typeof window === 'undefined') return [];
  try {
    const existingStr = localStorage.getItem(STORAGE_KEY);
    if (!existingStr) return [];
    const sessions: Record<string, OASession> = JSON.parse(existingStr);
    return Object.values(sessions).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (e) {
    return [];
  }
}
