"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ToolbarSelect } from "@/components/ui/ToolbarSelect";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Body } from "@/components/ui/Typography";
import { formatDisplayDate } from "@/lib/date";
import type { Lead } from "@/lib/leads";
import type { EscapePoint } from "@/lib/escape-points";
import { LEAD_STATUS_ORDER } from "@/lib/lead-status";
import { FaPlus } from "react-icons/fa";
import { PiPencilSimple } from "react-icons/pi";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchLeads } from "@/features/leads/leadsThunks";
import { selectLeads, selectLeadsStatus, selectLeadsError } from "@/features/leads/leadsSelectors";
import { LeadFormModal } from "@/components/leads/LeadFormModal";

// "Priority" isn't a real Lead.status value (it's the separate isPriority
// flag, shown as its own badge next to status elsewhere on this page) —
// included here as a distinct filter option anyway, per what was asked;
// handled specially in the filter logic below rather than treated as a status.
const STATUS_FILTER_OPTIONS = [
  { value: "", label: "Default" },
  { value: "Priority", label: "Priority" },
  ...LEAD_STATUS_ORDER.map((s) => ({ value: s, label: s })),
];

const TERMINAL_STATUSES = ["Unqualified", "Lost", "Duplicate", "Converted"];

export function LeadsPanel({
  escapePoints,
}: {
  escapePoints: EscapePoint[];
}) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const leads = useAppSelector(selectLeads);
  const status = useAppSelector(selectLeadsStatus);
  const listError = useAppSelector(selectLeadsError);
  const [statusFilter, setStatusFilter] = useState("");

  // Stays client-side, same as DataTable's own search/pagination — the full
  // list is already fetched up front, no backend change needed.
  const visibleLeads = useMemo(() => {
    if (!statusFilter) return leads;
    if (statusFilter === "Priority") return leads.filter((l) => l.isPriority);
    return leads.filter((l) => l.status === statusFilter);
  }, [leads, statusFilter]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  useEffect(() => {
    dispatch(fetchLeads());
  }, [dispatch]);

  function openCreate() {
    setEditingLead(null);
    setModalOpen(true);
  }

  function openEdit(lead: Lead) {
    setEditingLead(lead);
    setModalOpen(true);
  }

  const columns: DataTableColumn<Lead>[] = [
    {
      key: "name",
      header: "Name",
      render: (l) => l.name,
      sortValue: (l) => l.name.toLowerCase(),
      filterValue: (l) => `${l.name} ${l.email} ${l.phone}`,
    },
    {
      key: "destination",
      header: "Escape Point",
      render: (l) => l.destination || "—",
      filterValue: (l) => l.destination ?? "",
    },
    {
      key: "status",
      header: "Status",
      render: (l) => (
        <div className="flex items-center gap-1">
          <Badge tone={TERMINAL_STATUSES.includes(l.status) ? (l.status === "Converted" ? "success" : "danger") : "neutral"}>
            {l.status}
          </Badge>
          {l.isPriority && <Badge tone="warning">Priority</Badge>}
        </div>
      ),
      sortValue: (l) => l.status,
    },
    {
      key: "source",
      header: "Source",
      render: (l) => (l.sourceType === "AGENCY" ? "Agency" : l.sourceChannel ?? "—"),
      sortValue: (l) => l.sourceType ?? "",
    },
    {
      key: "followUpDueDate",
      header: "Follow-up due",
      render: (l) => {
        if (!l.followUpDueDate) return "—";
        const isOverdue = new Date(l.followUpDueDate) < new Date(new Date().toDateString());
        return (
          <span className={isOverdue ? "text-danger" : undefined}>{formatDisplayDate(l.followUpDueDate)}</span>
        );
      },
      sortValue: (l) => l.followUpDueDate ?? "",
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end gap-2">
        <Button className="self-start" onClick={openCreate}><FaPlus />Add lead</Button>
      </div>

      {status === "failed" ? (
        <Body className="text-danger">{listError}</Body>
      ) : (
        <DataTable
          columns={columns}
          rows={visibleLeads}
          rowKey={(l) => l.uid}
          searchPlaceholder="Search leads…"
          emptyMessage="No leads yet."
          onRowClick={(l) => router.push(`/leads/${l.uid}`)}
          getRowLabel={(l) => l.name}
          loading={status !== "succeeded" && leads.length === 0}
          rowMenuActions={(l) => [
            { key: "edit", label: "Edit", icon: PiPencilSimple, onSelect: () => openEdit(l) },
          ]}
          toolbarExtra={
            <ToolbarSelect label="Status" options={STATUS_FILTER_OPTIONS} value={statusFilter} onChange={setStatusFilter} placeholder="Default" />
          }
        />
      )}

      <LeadFormModal
        open={modalOpen}
        lead={editingLead}
        escapePoints={escapePoints}
        onClose={() => setModalOpen(false)}
        onSaved={() => {
          dispatch(fetchLeads());
          setModalOpen(false);
        }}
      />
    </div>
  );
}
