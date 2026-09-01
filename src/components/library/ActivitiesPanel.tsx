"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { BulkImportModal } from "@/components/library/BulkImportModal";
import { ActivityFormModal, CATEGORY_OPTIONS } from "@/components/library/ActivityFormModal";
import { Body } from "@/components/ui/Typography";
import { LoadingState } from "@/components/ui/Spinner";
import type { Activity } from "@/lib/activities";
import type { EscapePoint } from "@/lib/escape-points";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchActivities, deleteActivity } from "@/features/activities/activitiesThunks";
import { selectActivities, selectActivitiesStatus, selectActivitiesError } from "@/features/activities/activitiesSelectors";
import { FaPlus } from "react-icons/fa";
import { LuImport } from "react-icons/lu";

export function ActivitiesPanel({
  escapePoints,
}: {
  escapePoints: EscapePoint[];
}) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const activities = useAppSelector(selectActivities);
  const status = useAppSelector(selectActivitiesStatus);
  const error = useAppSelector(selectActivitiesError);

  const [modalOpen, setModalOpen] = useState(false);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [editing, setEditing] = useState<Activity | null>(null);
  const [deletingUid, setDeletingUid] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchActivities());
  }, [dispatch]);

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(activity: Activity) {
    setEditing(activity);
    setModalOpen(true);
  }

  async function handleDelete(activity: Activity) {
    setDeletingUid(activity.uid);
    try {
      await dispatch(deleteActivity(activity.uid));
      dispatch(fetchActivities());
    } finally {
      setDeletingUid(null);
    }
  }

  const columns: DataTableColumn<Activity>[] = [
    {
      key: "name",
      header: "Name",
      render: (a) => a.name,
      sortValue: (a) => a.name.toLowerCase(),
      filterValue: (a) => a.name,
    },
    {
      key: "escapePoint",
      header: "Escape Point",
      render: (a) => a.escapePoint?.name ?? "—",
      filterValue: (a) => a.escapePoint?.name ?? "",
    },
    {
      key: "category",
      header: "Category",
      render: (a) => CATEGORY_OPTIONS.find((c) => c.value === a.categoryCode)?.label ?? a.categoryCode ?? "—",
    },
    {
      key: "duration",
      header: "Duration",
      render: (a) => (a.durationMinutes ? `${a.durationMinutes} min` : "—"),
      sortValue: (a) => a.durationMinutes ?? 0,
    },
    {
      key: "basePrice",
      header: "Base price (INR)",
      render: (a) => (a.basePrice != null ? `₹${a.basePrice.toFixed(2)}` : "—"),
      sortValue: (a) => a.basePrice ?? 0,
    },
    {
      key: "status",
      header: "Status",
      render: (a) => <Badge tone={a.status === "archived" ? "danger" : "success"}>{a.status ?? "active"}</Badge>,
      sortValue: (a) => a.status ?? "",
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 justify-end">
        <Button className="self-start" onClick={openCreate}><FaPlus />Add activity</Button>
        <Button variant="secondary" className="self-start" onClick={() => setBulkImportOpen(true)}><LuImport size={18} />Bulk import</Button>
      </div>

      {bulkImportOpen && (
        <BulkImportModal
          entityType="activities"
          label="activities"
          onClose={() => setBulkImportOpen(false)}
          onImported={() => dispatch(fetchActivities())}
        />
      )}

      {status === "loading" && activities.length === 0 ? (
        <LoadingState label="Loading activities…" />
      ) : status === "failed" ? (
        <Body className="text-danger">{error}</Body>
      ) : (
        <DataTable
          columns={columns}
          rows={activities}
          rowKey={(a) => a.uid}
          searchPlaceholder="Search activities…"
          emptyMessage="No activities yet — add your first one."
          onRowClick={(a) => router.push(`/library/activities/${a.uid}`)}
          getRowLabel={(a) => a.name}
          rowMenuActions={(a) => [
            { key: "edit", label: "Edit", onSelect: () => openEdit(a) },
            { key: "archive", label: "Archive", tone: "danger", disabled: deletingUid === a.uid, onSelect: () => handleDelete(a) },
          ]}
        />
      )}

      <ActivityFormModal
        open={modalOpen}
        activity={editing}
        onClose={() => setModalOpen(false)}
        onSaved={() => {}}
        escapePoints={escapePoints}
      />
    </div>
  );
}
