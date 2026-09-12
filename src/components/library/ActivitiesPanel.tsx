"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { ToolbarSelect } from "@/components/ui/ToolbarSelect";
import { Badge } from "@/components/ui/Badge";
import { BulkImportModal } from "@/components/library/BulkImportModal";
import { ActivityFormModal, CATEGORY_OPTIONS } from "@/components/library/ActivityFormModal";
import { Body } from "@/components/ui/Typography";
import type { Activity } from "@/lib/activities";
import type { EscapePoint } from "@/lib/escape-points";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchActivities, deleteActivity } from "@/features/activities/activitiesThunks";
import { selectActivities, selectActivitiesStatus, selectActivitiesError } from "@/features/activities/activitiesSelectors";
import { FaPlus } from "react-icons/fa";
import { LuImport } from "react-icons/lu";

// Unlike Transport's modeCode (fully bounded by MODE_OPTIONS) or Escape's
// status, categoryCode in real data isn't limited to CATEGORY_OPTIONS' 3
// entries (bulk-imported activities routinely use freeform codes like
// "trekking" or "scuba", already tolerated by this table's own render
// fallback below) — so the filter list is built from whatever codes are
// actually present, not the incomplete canonical list, or most rows would
// have no matching filter option at all.
function humanizeCategoryCode(code: string): string {
  return code
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

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
  const [escapePointFilter, setEscapePointFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  useEffect(() => {
    dispatch(fetchActivities());
  }, [dispatch]);

  const escapePointOptions = useMemo(
    () => [{ value: "", label: "Default" }, ...escapePoints.map((ep) => ({ value: ep.uid, label: ep.name }))],
    [escapePoints],
  );

  const categoryOptions = useMemo(() => {
    const codes = Array.from(
      new Set(activities.map((a) => a.categoryCode).filter((c): c is string => !!c)),
    ).sort((a, b) => a.localeCompare(b));
    return [
      { value: "", label: "Default" },
      ...codes.map((code) => ({
        value: code,
        label: CATEGORY_OPTIONS.find((c) => c.value === code)?.label ?? humanizeCategoryCode(code),
      })),
    ];
  }, [activities]);

  // Stays client-side, same as DataTable's own search/pagination — the full
  // list is already fetched up front, no backend change needed.
  const visibleActivities = useMemo(() => {
    return activities.filter((a) => {
      if (escapePointFilter && a.escapePoint?.uid !== escapePointFilter) return false;
      if (categoryFilter && a.categoryCode !== categoryFilter) return false;
      return true;
    });
  }, [activities, escapePointFilter, categoryFilter]);

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
      key: "escapePoint",
      header: "Escape Point",
      render: (a) => a.escapePoint?.name ?? "—",
      filterValue: (a) => a.escapePoint?.name ?? "",
    },
    {
      key: "name",
      header: "Name",
      render: (a) => a.name,
      sortValue: (a) => a.name.toLowerCase(),
      filterValue: (a) => a.name,
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
        <Button className="self-start" onClick={openCreate}><FaPlus />Add Activity</Button>
        <Button variant="secondary" className="self-start" onClick={() => setBulkImportOpen(true)}><LuImport size={18} />Bulk Import</Button>
      </div>

      {bulkImportOpen && (
        <BulkImportModal
          entityType="activities"
          label="activities"
          onClose={() => setBulkImportOpen(false)}
          onImported={() => dispatch(fetchActivities())}
        />
      )}

      {status === "failed" ? (
        <Body className="text-danger">{error}</Body>
      ) : (
        <DataTable
          columns={columns}
          rows={visibleActivities}
          rowKey={(a) => a.uid}
          searchPlaceholder="Search activities…"
          emptyMessage="No activities yet — add your first one."
          onRowClick={(a) => router.push(`/library/activities/${a.uid}`)}
          getRowLabel={(a) => a.name}
          loading={status !== "succeeded" && activities.length === 0}
          rowMenuActions={(a) => [
            { key: "edit", label: "Edit", onSelect: () => openEdit(a) },
            { key: "archive", label: "Archive", tone: "danger", disabled: deletingUid === a.uid, onSelect: () => handleDelete(a) },
          ]}
          toolbarExtra={
            <div className="flex items-center gap-2">
              <ToolbarSelect
                label="Escape Point"
                options={escapePointOptions}
                value={escapePointFilter}
                onChange={setEscapePointFilter}
                placeholder="Default"
                searchable
                searchPlaceholder="Search Escape Point…"
              />
              <ToolbarSelect label="Category" options={categoryOptions} value={categoryFilter} onChange={setCategoryFilter} placeholder="Default" />
            </div>
          }
        />
      )}

      <ActivityFormModal
        open={modalOpen}
        activity={editing}
        onClose={() => setModalOpen(false)}
        onSaved={() => { }}
        escapePoints={escapePoints}
      />
    </div>
  );
}
