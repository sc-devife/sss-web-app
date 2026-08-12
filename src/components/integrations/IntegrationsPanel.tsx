"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { Body, Caption } from "@/components/ui/Typography";
import { LoadingState } from "@/components/ui/Spinner";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import { required, runValidators } from "@/lib/validators";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchIntegrations, connectIntegration, disconnectIntegration } from "@/features/integrations/integrationsThunks";
import { selectIntegrations, selectIntegrationsStatus, selectIntegrationsError } from "@/features/integrations/integrationsSelectors";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/sss";

const META_CHANNELS = new Set(["facebook", "instagram"]);

const emptyMetaForm = {
  accessToken: "",
  pageId: "",
  igAccountId: "",
  pageName: "",
};

// Validated on submit rather than gating the button proactively, matching
// the rest of the app's Add-form convention (stay clickable, surface field
// errors on click instead of silently disabling).
function validateConnect(
  channelCode: string,
  secret: string,
  metaForm: typeof emptyMetaForm,
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (META_CHANNELS.has(channelCode)) {
    const idKey = channelCode === "facebook" ? "pageId" : "igAccountId";
    const idErr = runValidators(channelCode === "facebook" ? metaForm.pageId : metaForm.igAccountId, [
      required("This field is required"),
    ]);
    if (idErr) errors[idKey] = idErr;
    const tokenErr = runValidators(metaForm.accessToken, [required("Access token is required")]);
    if (tokenErr) errors.accessToken = tokenErr;
  } else {
    const secretErr = runValidators(secret, [required("Shared secret is required")]);
    if (secretErr) errors.secret = secretErr;
  }
  return errors;
}

export function IntegrationsPanel({ orgUid }: { orgUid: string }) {
  const dispatch = useAppDispatch();
  const integrations = useAppSelector(selectIntegrations);
  const status = useAppSelector(selectIntegrationsStatus);
  const error = useAppSelector(selectIntegrationsError);

  const [connecting, setConnecting] = useState<string | null>(null);
  const [secret, setSecret] = useState("");
  const [metaForm, setMetaForm] = useState(emptyMetaForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | undefined>();

  useEffect(() => {
    dispatch(fetchIntegrations());
  }, [dispatch]);

  const webhookUrl = `${API_BASE_URL}/api/integrations/webhook/${orgUid}/leads`;

  function updateMetaForm<K extends keyof typeof emptyMetaForm>(key: K, value: string) {
    setMetaForm((f) => ({ ...f, [key]: value }));
    setErrors((p) => ({ ...p, [key]: "" }));
  }

  function startConnecting(channelCode: string) {
    setConnecting(channelCode);
    setSecret("");
    setMetaForm(emptyMetaForm);
    setErrors({});
    setFormError(undefined);
  }

  async function handleConnect(channelCode: string) {
    setFormError(undefined);

    const nextErrors = validateConnect(channelCode, secret, metaForm);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    setBusy(true);
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

  if (status === "loading" && integrations.length === 0) {
    return <LoadingState label="Loading integrations…" />;
  }

  if (status === "failed") {
    return <Body className="text-danger">{error}</Body>;
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {integrations.map((integration) => (
          <Card key={integration.channelCode} variant="elevated" className="flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-1">
                <Body className="font-semibold">{integration.label}</Body>
                <Caption className="text-muted-foreground">{integration.channelCode}</Caption>
              </div>
              <div>
                {!integration.available && <Badge tone="neutral">Coming soon</Badge>}
                {integration.available && (
                  <Badge tone={integration.status === "connected" ? "success" : "neutral"}>
                    {integration.status === "connected" ? "Connected" : "Disconnected"}
                  </Badge>
                )}
              </div>
            </div>

            {integration.available && integration.channelCode === "webhook" && integration.status === "connected" && (
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <Caption className="mb-2 block font-medium">Webhook URL</Caption>
                <code className="block break-all rounded bg-background px-2 py-1.5 text-xs text-foreground">{webhookUrl}</code>
                <Body className="mt-2 text-xs">Send POST requests with header <code className="bg-muted px-1">X-Webhook-Secret</code></Body>
                {integration.lastSyncedAt && (
                  <Body className="mt-1 text-xs">Last: {new Date(integration.lastSyncedAt).toLocaleString()}</Body>
                )}
              </div>
            )}

            {integration.available && META_CHANNELS.has(integration.channelCode) && integration.status === "connected" && (
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                {integration.pageName && <Body className="text-xs font-medium">Account: {integration.pageName}</Body>}
                <Caption className="mt-1 block">{integration.channelCode === "facebook" ? "Page ID" : "IG Account ID"}: {integration.pageId ?? integration.igAccountId}</Caption>
                {integration.lastSyncedAt && (
                  <Body className="mt-1 text-xs">Last lead: {new Date(integration.lastSyncedAt).toLocaleString()}</Body>
                )}
              </div>
            )}

            {integration.available && (
              <div className="flex flex-col gap-3">
                {integration.status !== "connected" ? (
                  connecting === integration.channelCode ? (
                    <div className="flex flex-col gap-3">
                      <fieldset disabled={busy} className="flex flex-col gap-3">
                        {META_CHANNELS.has(integration.channelCode) ? (
                          <div className="flex flex-col gap-3">
                            <TextInput
                              label={integration.channelCode === "facebook" ? "Facebook Page ID" : "Instagram Business Account ID"}
                              value={integration.channelCode === "facebook" ? metaForm.pageId : metaForm.igAccountId}
                              onChange={(e) => updateMetaForm(integration.channelCode === "facebook" ? "pageId" : "igAccountId", e.target.value)}
                              error={integration.channelCode === "facebook" ? errors.pageId : errors.igAccountId}
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
                              error={errors.accessToken}
                              placeholder="Paste the token from Graph API Explorer"
                            />
                          </div>
                        ) : (
                          <TextInput
                            label="Shared secret"
                            value={secret}
                            onChange={(e) => {
                              setSecret(e.target.value);
                              setErrors((p) => ({ ...p, secret: "" }));
                            }}
                            error={errors.secret}
                            placeholder="Choose a secret for this channel"
                          />
                        )}
                      </fieldset>
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" disabled={busy} loading={busy} loadingText="Connecting…" onClick={() => handleConnect(integration.channelCode)}>
                          Save
                        </Button>
                        <Button size="sm" variant="ghost" disabled={busy} onClick={() => setConnecting(null)}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <Button size="sm" className="w-full" onClick={() => startConnecting(integration.channelCode)}>Connect</Button>
                  )
                ) : (
                  <Button size="sm" variant="danger" className="w-full" disabled={busy} onClick={() => handleDisconnect(integration.channelCode)}>
                    Disconnect
                  </Button>
                )}
              </div>
            )}
          </Card>
        ))}
      </div>
      {formError && (
        <Alert tone="danger" autoClose={false}>
          {formError}
        </Alert>
      )}
    </div>
  );
}
