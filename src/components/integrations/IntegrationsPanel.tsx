"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { Badge } from "@/components/ui/Badge";
import { Body, Caption } from "@/components/ui/Typography";
import { LoadingState } from "@/components/ui/Spinner";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchIntegrations, connectIntegration, disconnectIntegration } from "@/features/integrations/integrationsThunks";
import { selectIntegrations, selectIntegrationsStatus, selectIntegrationsError } from "@/features/integrations/integrationsSelectors";
import type { IntegrationConnection } from "@/lib/integrations";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/sss";

const META_CHANNELS = new Set(["facebook", "instagram"]);

const emptyMetaForm = {
  accessToken: "",
  pageId: "",
  igAccountId: "",
  pageName: "",
};

export function IntegrationsPanel({ orgUid }: { orgUid: string }) {
  const dispatch = useAppDispatch();
  const integrations = useAppSelector(selectIntegrations);
  const status = useAppSelector(selectIntegrationsStatus);
  const error = useAppSelector(selectIntegrationsError);

  const [connecting, setConnecting] = useState<string | null>(null);
  const [secret, setSecret] = useState("");
  const [metaForm, setMetaForm] = useState(emptyMetaForm);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | undefined>();

  useEffect(() => {
    dispatch(fetchIntegrations());
  }, [dispatch]);

  const webhookUrl = `${API_BASE_URL}/api/integrations/webhook/${orgUid}/leads`;

  function updateMetaForm<K extends keyof typeof emptyMetaForm>(key: K, value: string) {
    setMetaForm((f) => ({ ...f, [key]: value }));
  }

  function startConnecting(channelCode: string) {
    setConnecting(channelCode);
    setSecret("");
    setMetaForm(emptyMetaForm);
    setFormError(undefined);
  }

  async function handleConnect(channelCode: string) {
    setBusy(true);
    setFormError(undefined);
    try {
      const isMeta = META_CHANNELS.has(channelCode);
      const body = isMeta
        ? {
            autoCreateLeads: true,
            accessToken: metaForm.accessToken,
            pageId: channelCode === "facebook" ? metaForm.pageId : undefined,
            igAccountId: channelCode === "instagram" ? metaForm.igAccountId : undefined,
            pageName: metaForm.pageName,
          }
        : { secret, autoCreateLeads: true };

      await dispatch(connectIntegration({ channelCode, body })).unwrap();
      dispatch(fetchIntegrations());
      setConnecting(null);
      setSecret("");
      setMetaForm(emptyMetaForm);
    } catch (err) {
      setFormError(typeof err === "string" ? err : extractErrorMessage(err, "Failed to connect"));
    } finally {
      setBusy(false);
    }
  }

  async function handleDisconnect(channelCode: string) {
    setBusy(true);
    try {
      await dispatch(disconnectIntegration(channelCode));
      dispatch(fetchIntegrations());
    } finally {
      setBusy(false);
    }
  }

  function canSubmit(integration: IntegrationConnection) {
    if (META_CHANNELS.has(integration.channelCode)) {
      const idFilled = integration.channelCode === "facebook" ? !!metaForm.pageId : !!metaForm.igAccountId;
      return !!metaForm.accessToken && idFilled;
    }
    return !!secret;
  }

  if (status === "loading" && integrations.length === 0) {
    return <LoadingState label="Loading integrations…" />;
  }

  if (status === "failed") {
    return <Body className="text-danger">{error}</Body>;
  }

  return (
    <div className="flex flex-col gap-3">
      {integrations.map((integration) => (
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

          {integration.available && META_CHANNELS.has(integration.channelCode) && integration.status === "connected" && (
            <div className="rounded border border-border bg-muted/20 p-2 text-xs">
              {integration.pageName && <Caption>Connected account: {integration.pageName}</Caption>}
              <Caption>{integration.channelCode === "facebook" ? "Page ID" : "IG Account ID"}: {integration.pageId ?? integration.igAccountId}</Caption>
              {integration.lastSyncedAt && (
                <Caption>Last lead received: {new Date(integration.lastSyncedAt).toLocaleString()}</Caption>
              )}
            </div>
          )}

          {integration.available && (
            <div className="flex flex-col gap-2">
              {integration.status !== "connected" ? (
                connecting === integration.channelCode ? (
                  <div className="flex flex-col gap-2">
                    {META_CHANNELS.has(integration.channelCode) ? (
                      <div className="grid grid-cols-2 gap-2">
                        <TextInput
                          label={integration.channelCode === "facebook" ? "Facebook Page ID" : "Instagram Business Account ID"}
                          value={integration.channelCode === "facebook" ? metaForm.pageId : metaForm.igAccountId}
                          onChange={(e) => updateMetaForm(integration.channelCode === "facebook" ? "pageId" : "igAccountId", e.target.value)}
                        />
                        <TextInput
                          label="Page/Account name"
                          value={metaForm.pageName}
                          onChange={(e) => updateMetaForm("pageName", e.target.value)}
                          placeholder="Display label only"
                        />
                        <TextInput
                          label="Long-lived access token"
                          value={metaForm.accessToken}
                          onChange={(e) => updateMetaForm("accessToken", e.target.value)}
                          className="col-span-2"
                          placeholder="Paste the token from Graph API Explorer"
                        />
                      </div>
                    ) : (
                      <TextInput
                        label="Shared secret"
                        value={secret}
                        onChange={(e) => setSecret(e.target.value)}
                        placeholder="Choose a secret for this channel"
                      />
                    )}
                    <div className="flex gap-2">
                      <Button size="sm" disabled={busy || !canSubmit(integration)} onClick={() => handleConnect(integration.channelCode)}>
                        {busy ? "Connecting…" : "Save"}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setConnecting(null)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <Button size="sm" className="self-start" onClick={() => startConnecting(integration.channelCode)}>Connect</Button>
                )
              ) : (
                <Button size="sm" variant="danger" className="self-start" disabled={busy} onClick={() => handleDisconnect(integration.channelCode)}>
                  Disconnect
                </Button>
              )}
            </div>
          )}
        </Card>
      ))}
      {formError && <p className="text-sm text-danger">{formError}</p>}
    </div>
  );
}
