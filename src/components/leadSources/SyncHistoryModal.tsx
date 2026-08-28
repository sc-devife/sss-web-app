"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { Body } from "@/components/ui/Typography";
import { LoadingState } from "@/components/ui/Spinner";
import type { LeadImportAttempt } from "@/lib/leadSources";
import { formatDisplayDateTime } from "@/lib/date";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchImportAttempts, resyncImportAttempt } from "@/features/integrations/integrationsThunks";
import { selectImportAttempts, selectImportAttemptsStatus, selectImportAttemptsError } from "@/features/integrations/integrationsSelectors";

const STATUS_TONE: Record<LeadImportAttempt["status"], "success" | "danger" | "neutral"> = {
  success: "success",
  failed: "danger",
  duplicate_matched: "neutral",
};

export function SyncHistoryModal({ channelCode, onClose }: { channelCode: string; onClose: () => void }) {
  const dispatch = useAppDispatch();
  const page = useAppSelector(selectImportAttempts);
  const status = useAppSelector(selectImportAttemptsStatus);
  const error = useAppSelector(selectImportAttemptsError);
  const [resyncingId, setResyncingId] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchImportAttempts(channelCode));
  }, [dispatch, channelCode]);

  async function handleResync(id: string) {
    setResyncingId(id);
    try {
      await dispatch(resyncImportAttempt(id));
      dispatch(fetchImportAttempts(channelCode));
    } finally {
      setResyncingId(null);
    }
  }

  const attempts = page?.content ?? [];

  const columns: DataTableColumn<LeadImportAttempt>[] = [
    { key: "receivedAt", header: "Received", render: (a) => formatDisplayDateTime(a.lastAttemptedAt) },
    { key: "form", header: "Form", render: (a) => a.formId ?? "—" },
    { key: "campaign", header: "Campaign", render: (a) => a.campaignId ?? "—" },
    { key: "status", header: "Status", render: (a) => <Badge tone={STATUS_TONE[a.status]}>{a.status}</Badge> },
    { key: "retryCount", header: "Retries", render: (a) => a.retryCount, sortValue: (a) => a.retryCount },
    { key: "lead", header: "Lead", render: (a) => a.leadUid ?? "—" },
    { key: "reason", header: "Failure reason", render: (a) => a.failureReason ?? "—" },
  ];

  return (
    <Modal open onClose={onClose} title="Sync History" className="max-w-3xl">
      {status === "loading" && !page ? (
        <LoadingState />
      ) : status === "failed" ? (
        <Body className="text-danger">{error}</Body>
      ) : (
        <DataTable
          columns={columns}
          rows={attempts}
          rowKey={(a) => a.uid}
          emptyMessage="No sync activity yet."
          rowMenuActions={(a) =>
            a.status === "failed"
              ? [{ key: "resync", label: resyncingId === a.uid ? "Resyncing…" : "Resync", disabled: resyncingId === a.uid, onSelect: () => handleResync(a.uid) }]
              : []
          }
        />
      )}
    </Modal>
  );
}
