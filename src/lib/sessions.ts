export interface UserSessionInfo {
  sessionId: string;
  deviceInfo: string | null;
  ipAddress: string | null;
  createdAt: string;
  lastAccessed: string | null;
  isCurrent: boolean;
}
