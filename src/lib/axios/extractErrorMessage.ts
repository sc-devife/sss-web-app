import axios from "axios";

// Every route.ts proxy returns { message: "..." } on failure (mirrors the
// backend's own error shape) — this pulls that out consistently for the
// try/catch blocks inside each thunk, matching the `body?.message ?? fallback`
// pattern used everywhere before the Redux migration.
export function extractErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string } | undefined;
    return data?.message ?? fallback;
  }
  if (err instanceof Error) {
    return err.message;
  }
  return fallback;
}
