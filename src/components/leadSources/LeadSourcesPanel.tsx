"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Body, Caption } from "@/components/ui/Typography";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatDisplayDateTime } from "@/lib/date";
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

  if ((status === "idle" || status === "loading") && sources.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i} className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-8 w-32 rounded" />
              <Skeleton className="h-8 w-32 rounded" />
              <Skeleton className="h-8 w-28 rounded" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (status === "failed") {
    return <Body className="text-danger">{error}</Body>;
  }

  const connected = sources.filter((s) => s.status === "connected");

  if (connected.length === 0) {
    return (
      <Body muted>
        No Facebook or Instagram Lead Ads sources are connected yet. Connect one from{" "}
        <Link href="/administration/integrations" className="text-primary hover:underline">
          Administration → Integrations
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
            <Caption>Last lead received: {formatDisplayDateTime(source.lastSyncedAt)}</Caption>
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
