const STORAGE_KEY_PREFIX = "unilake_session_";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Session IDs reach us from the URL and from localStorage, so they can be truncated,
 * hand-edited or left over from an older build. Only `/generate` and `/regenerate`
 * validate the format server-side — on GET and PATCH a malformed ID goes straight to
 * the database and comes back as a 500, not a 404 (§13.1).
 *
 * Checking the shape first turns that into an immediate, honest "start again".
 */
export function isValidSessionId(id: string | null | undefined): id is string {
  return !!id && UUID_PATTERN.test(id);
}

interface StoredSession {
  sessionId: string;
  wsRoomToken: string;
  comicId: string;
  createdAt: string; // ISO timestamp
}

export function saveSession(comicId: string, data: StoredSession): void {
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${comicId}`, JSON.stringify(data));
  } catch (error) {
    console.error("Failed to save session to localStorage:", error);
  }
}

export function getSession(comicId: string): StoredSession | null {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${comicId}`);
    if (!raw) return null;

    const data = JSON.parse(raw) as StoredSession;

    // Never hand a malformed ID back to a caller — it would 500 on the first request.
    if (!isValidSessionId(data?.sessionId)) {
      clearSession(comicId);
      return null;
    }

    // 24-hour TTL check
    const createdAt = new Date(data.createdAt).getTime();
    const now = Date.now();
    const ageMs = now - createdAt;
    
    // If older than 24 hours, clear it and return null
    if (ageMs > 24 * 60 * 60 * 1000) {
      clearSession(comicId);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Failed to parse session from localStorage:", error);
    return null;
  }
}

export function clearSession(comicId: string): void {
  try {
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}${comicId}`);
  } catch (error) {
    console.error("Failed to remove session from localStorage:", error);
  }
}
