"use client";

import { useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { Body } from "@/components/ui/Typography";
import { LoadingState } from "@/components/ui/Spinner";
import type { WebhookEvent } from "@/lib/leadSources";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchWebhookEvents } from "@/features/integrations/integrationsThunks";
import { selectWebhookEvents, selectWebhookEventsStatus, selectWebhookEventsError } from "@/features/integrations/integrationsSelectors";

const STATUS_TONE: Record<string, "success" | "danger" | "neutral" | "warning"> = {
  processed: "success",
  received: "neutral",
  duplicate_skipped: "neutral",
  rejected: "warning",
  error: "danger",
};

export function WebhookLogModal({ channelCode, onClose }: { channelCode: string; onClose: () => void }) {
  const dispatch = useAppDispatch();
  const page = useAppSelector(selectWebhookEvents);
  const status = useAppSelector(selectWebhookEventsStatus);
  const error = useAppSelector(selectWebhookEventsError);

  useEffect(() => {
    dispatch(fetchWebhookEvents(channelCode));
  }, [dispatch, channelCode]);

  const events = page?.content ?? [];

  const columns: DataTableColumn<WebhookEvent>[] = [
    { key: "receivedAt", header: "Received", render: (e) => new Date(e.receivedAt).toLocaleString() },
    { key: "signature", header: "Signature", render: (e) => <Badge tone={e.signatureValid ? "success" : "danger"}>{e.signatureValid ? "valid" : "invalid"}</Badge> },
    { key: "status", header: "Status", render: (e) => <Badge tone={STATUS_TONE[e.processingStatus] ?? "neutral"}>{e.processingStatus}</Badge> },
    { key: "form", header: "Form", render: (e) => e.formId ?? "—" },
    { key: "error", header: "Error", render: (e) => e.errorMessage ?? "—" },
  ];

  return (
    <Modal open onClose={onClose} title="Webhook Delivery Log" className="max-w-3xl">
      {status === "loading" && !page ? (
        <LoadingState />
      ) : status === "failed" ? (
        <Body className="text-danger">{error}</Body>
      ) : (
        <DataTable columns={columns} rows={events} rowKey={(e) => String(e.seqp)} emptyMessage="No webhook deliveries yet." />
      )}
    </Modal>
  );
}
