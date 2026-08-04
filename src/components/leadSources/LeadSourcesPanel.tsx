"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Body, Caption } from "@/components/ui/Typography";
import { LoadingState } from "@/components/ui/Spinner";
import { SyncHistoryModal } from "@/components/leadSources/SyncHistoryModal";
import { WebhookLogModal } from "@/components/leadSources/WebhookLogModal";
import { FieldMappingEditor } from "@/components/leadSources/FieldMappingEditor";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchLeadSources } from "@/features/integrations/integrationsThunks";
import { selectLeadSources, selectLeadSourcesStatus, selectLeadSourcesError } from "@/features/integrations/integrationsSelectors";

export function LeadSourcesPanel() {
  const dispatch = useAppDispatch();
  const sources = useAppSelector(selectLeadSources);
  const status = useAppSelector(selectLeadSourcesStatus);
  const error = useAppSelector(selectLeadSourcesError);

  const [historyChannel, setHistoryChannel] = useState<string | null>(null);
  const [logsChannel, setLogsChannel] = useState<string | null>(null);
  const [mappingChannel, setMappingChannel] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchLeadSources());
  }, [dispatch]);

  if (status === "loading" && sources.length === 0) {
    return <LoadingState label="Loading lead sources…" />;
  }

  if (status === "failed") {
    return <Body className="text-danger">{error}</Body>;
  }

  const connected = sources.filter((s) => s.status === "connected");

  if (connected.length === 0) {
    return (
      <Body muted>
        No Facebook or Instagram Lead Ads sources are connected yet. Connect one from{" "}
        <Link href="/organization/integrations" className="text-primary hover:underline">
          Organization → Integrations
        </Link>
        .
      </Body>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {connected.map((source) => (
        <Card key={source.channelCode} className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <Body className="font-medium">{source.label}</Body>
              {source.pageName && <Caption>{source.pageName}</Caption>}
            </div>
            <Badge tone="success">connected</Badge>
          </div>

          {source.lastSyncedAt && (
            <Caption>Last lead received: {new Date(source.lastSyncedAt).toLocaleString()}</Caption>
          )}

          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => setHistoryChannel(source.channelCode)}>
              View sync history
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setLogsChannel(source.channelCode)}>
              View webhook logs
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setMappingChannel(source.channelCode)}>
              Field mapping
            </Button>
          </div>
        </Card>
      ))}

      {historyChannel && <SyncHistoryModal channelCode={historyChannel} onClose={() => setHistoryChannel(null)} />}
      {logsChannel && <WebhookLogModal channelCode={logsChannel} onClose={() => setLogsChannel(null)} />}
      {mappingChannel && <FieldMappingEditor channelCode={mappingChannel} onClose={() => setMappingChannel(null)} />}
    </div>
  );
}
