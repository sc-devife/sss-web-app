"use client";

import { useEffect, useState } from "react";
import { PiDesktopFill, PiDeviceMobileFill, PiSignOut } from "react-icons/pi";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Body, Caption, Heading } from "@/components/ui/Typography";
import { LoadingState } from "@/components/ui/Spinner";
import { Alert } from "@/components/ui/Alert";
import { formatDisplayDateTime, formatRelativeTime } from "@/lib/date";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchMySessions, revokeSession, revokeOtherSessions } from "@/features/sessions/sessionsThunks";
import { selectMySessions, selectMySessionsStatus, selectMySessionsError } from "@/features/sessions/sessionsSelectors";
import type { UserSessionInfo } from "@/lib/sessions";

// Good-enough device labeling from the raw User-Agent string — no parsing
// library, just enough to tell "Chrome on Windows" apart from "Safari on
// iPhone" in a session list.
function deviceLabel(ua: string | null): { label: string; isMobile: boolean } {
  if (!ua) return { label: "Unknown device", isMobile: false };
  const isMobile = /Mobile|Android|iPhone|iPad/.test(ua);
  const os = /Windows/.test(ua) ? "Windows"
    : /Mac OS X/.test(ua) ? "macOS"
    : /Android/.test(ua) ? "Android"
    : /iPhone|iPad/.test(ua) ? "iOS"
    : /Linux/.test(ua) ? "Linux"
    : "Unknown OS";
  const browser = /Edg\//.test(ua) ? "Edge"
    : /Chrome\//.test(ua) ? "Chrome"
    : /Firefox\//.test(ua) ? "Firefox"
    : /Safari\//.test(ua) ? "Safari"
    : "Unknown browser";
  return { label: `${browser} on ${os}`, isMobile };
}

function SessionRow({ session, onRevoke, revoking }: { session: UserSessionInfo; onRevoke: () => void; revoking: boolean }) {
  const { label, isMobile } = deviceLabel(session.deviceInfo);
  const Icon = isMobile ? PiDeviceMobileFill : PiDesktopFill;

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-3">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Body className="truncate font-medium">{label}</Body>
            {session.isCurrent && <Badge tone="success">This device</Badge>}
          </div>
          <Caption className="truncate text-muted-foreground">
            {session.ipAddress ? `${session.ipAddress} · ` : ""}
            {session.lastAccessed ? `Active ${formatRelativeTime(session.lastAccessed)}` : `Signed in ${formatDisplayDateTime(session.createdAt)}`}
          </Caption>
        </div>
      </div>
      {!session.isCurrent && (
        <Button variant="ghost" size="sm" disabled={revoking} onClick={onRevoke} className="shrink-0 text-danger hover:bg-danger/10">
          <PiSignOut className="h-4 w-4" />
          Log out
        </Button>
      )}
    </div>
  );
}

export function ActiveSessionsPanel() {
  const dispatch = useAppDispatch();
  const sessions = useAppSelector(selectMySessions);
  const status = useAppSelector(selectMySessionsStatus);
  const error = useAppSelector(selectMySessionsError);

  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [revokingOthers, setRevokingOthers] = useState(false);
  const [actionError, setActionError] = useState<string>();

  useEffect(() => {
    dispatch(fetchMySessions());
  }, [dispatch]);

  async function handleRevoke(sessionId: string) {
    setRevokingId(sessionId);
    setActionError(undefined);
    try {
      await dispatch(revokeSession(sessionId)).unwrap();
      dispatch(fetchMySessions());
    } catch (err) {
      setActionError(typeof err === "string" ? err : "Failed to log out that session.");
    } finally {
      setRevokingId(null);
    }
  }

  async function handleRevokeOthers() {
    setRevokingOthers(true);
    setActionError(undefined);
    try {
      await dispatch(revokeOtherSessions()).unwrap();
      dispatch(fetchMySessions());
    } catch (err) {
      setActionError(typeof err === "string" ? err : "Failed to log out other sessions.");
    } finally {
      setRevokingOthers(false);
    }
  }

  const otherSessionsCount = sessions.filter((s) => !s.isCurrent).length;

  return (
    <Card variant="elevated" className="mt-6">
      <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
        <div>
          <Heading as="h3" className="text-base font-semibold">
            Active Sessions
          </Heading>
          <Caption className="text-muted-foreground">Devices currently signed in to your account.</Caption>
        </div>
        {otherSessionsCount > 0 && (
          <Button variant="secondary" size="sm" disabled={revokingOthers} loading={revokingOthers} loadingText="Logging out…" onClick={handleRevokeOthers}>
            Log out other sessions
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-2 px-4 py-3">
        {status === "loading" && sessions.length === 0 ? (
          <LoadingState label="Loading sessions…" />
        ) : status === "failed" ? (
          <Body className="text-danger">{error}</Body>
        ) : (
          sessions.map((s) => (
            <SessionRow key={s.sessionId} session={s} revoking={revokingId === s.sessionId} onRevoke={() => handleRevoke(s.sessionId)} />
          ))
        )}
        {actionError && (
          <Alert tone="danger" autoClose={false}>
            {actionError}
          </Alert>
        )}
      </div>
    </Card>
  );
}
