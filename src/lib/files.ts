// Client-safe (NEXT_PUBLIC_*) base URL for rendering images the backend
// already stored — separate from lib/backend.ts's API_BASE_URL constant
// since that file is server-only (imports next/headers).
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/sss";

// Backend returns paths like "/files/<uuid>.jpg"; this turns that into a
// fully-qualified URL an <img> tag can load directly.
export function resolveFileUrl(path: string): string {
  if (!path) return path;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${API_BASE_URL}${path}`;
}
