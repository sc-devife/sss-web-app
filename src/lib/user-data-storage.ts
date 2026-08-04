// Header displays userId/role without an API call, per that requirement —
// this is a client-only cache of the login response, not a source of truth
// (the httpOnly session cookie remains the actual auth boundary).
const USER_DATA_KEY = "userData";

export interface StoredUserData {
  userId: string;
  name: string;
  role: string;
}

export function setStoredUserData(data: StoredUserData): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(USER_DATA_KEY, JSON.stringify(data));
}

export function getStoredUserData(): StoredUserData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_DATA_KEY);
    return raw ? (JSON.parse(raw) as StoredUserData) : null;
  } catch {
    return null;
  }
}

export function clearStoredUserData(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(USER_DATA_KEY);
}
