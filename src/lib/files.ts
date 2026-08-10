// Client-safe (NEXT_PUBLIC_*) base URL for rendering images the backend
// already stored — separate from lib/backend.ts's API_BASE_URL constant
// since that file is server-only (imports next/headers).
// typeof-guarded: bundlers without a Next.js-style env-var DefinePlugin
// (e.g. esbuild bundling this in isolation, as design-sync does) don't
// polyfill a global `process`, so a bare `process.env.*` read throws
// ReferenceError at module-evaluation time. Behaviorally identical in the
// real app, where `process` always exists.
const API_BASE_URL = (typeof process !== "undefined" ? process.env.NEXT_PUBLIC_API_BASE_URL : undefined) ?? "http://localhost:8080/sss";

// Backend returns paths like "/files/<uuid>.jpg"; this turns that into a
// fully-qualified URL an <img> tag can load directly.
export function resolveFileUrl(path: string): string {
  if (!path) return path;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${API_BASE_URL}${path}`;
}
