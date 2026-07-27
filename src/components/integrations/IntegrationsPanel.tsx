"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { Badge } from "@/components/ui/Badge";
import { Body, Caption } from "@/components/ui/Typography";
import type { IntegrationConnection } from "@/lib/integrations";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/sss";

export function IntegrationsPanel({
  initialIntegrations,
  orgUid,
}: {
  initialIntegrations: IntegrationConnection[];
  orgUid: string;
}) {
  const router = useRouter();
  const [connecting, setConnecting] = useState<string | null>(null);
  const [secret, setSecret] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const webhookUrl = `${API_BASE_URL}/api/integrations/webhook/${orgUid}/leads`;

  async function handleConnect(channelCode: string) {
    setBusy(true);
    setError(undefined);
    try {
      const res = await fetch(`/api/integrations/${channelCode}/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret, autoCreateLeads: true }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? "Failed to connect");
      }
      setConnecting(null);
      setSecret("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect");
    } finally {
      setBusy(false);
    }
  }

  async function handleDisconnect(channelCode: string) {
    setBusy(true);
    try {
      await fetch(`/api/integrations/${channelCode}/disconnect`, { method: "POST" });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {initialIntegrations.map((integration) => (
        <Card key={integration.channelCode} className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <Body className="font-medium">{integration.label}</Body>
              <Caption>{integration.channelCode}</Caption>
            </div>
            <div className="flex items-center gap-2">
              {!integration.available && <Badge tone="neutral">Coming soon</Badge>}
              {integration.available && (
                <Badge tone={integration.status === "connected" ? "success" : "neutral"}>
                  {integration.status}
                </Badge>
              )}
            </div>
          </div>

          {integration.available && integration.channelCode === "webhook" && integration.status === "connected" && (
            <div className="rounded border border-border bg-muted/20 p-2 text-xs">
              <Caption>Webhook URL</Caption>
              <code className="block break-all text-foreground">{webhookUrl}</code>
              <Caption>Send POST requests here with header X-Webhook-Secret set to your connected secret.</Caption>
              {integration.lastSyncedAt && (
                <Caption>Last received: {new Date(integration.lastSyncedAt).toLocaleString()}</Caption>
              )}
            </div>
          )}

          {integration.available && (
            <div className="flex items-center gap-2">
              {integration.status !== "connected" ? (
                connecting === integration.channelCode ? (
                  <div className="flex flex-1 items-end gap-2">
                    <TextInput
                      label="Shared secret"
                      value={secret}
                      onChange={(e) => setSecret(e.target.value)}
                      placeholder="Choose a secret for this channel"
                      className="flex-1"
                    />
                    <Button size="sm" disabled={busy || !secret} onClick={() => handleConnect(integration.channelCode)}>
                      {busy ? "Connecting…" : "Save"}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setConnecting(null)}>Cancel</Button>
                  </div>
                ) : (
                  <Button size="sm" onClick={() => setConnecting(integration.channelCode)}>Connect</Button>
                )
              ) : (
                <Button size="sm" variant="danger" disabled={busy} onClick={() => handleDisconnect(integration.channelCode)}>
                  Disconnect
                </Button>
              )}
            </div>
          )}
        </Card>
      ))}
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
