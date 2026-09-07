"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { BulkImportModal } from "@/components/library/BulkImportModal";
import { EscapePointFormModal } from "@/components/library/EscapePointFormModal";
import { EscapePointLocationsModal } from "@/components/library/EscapePointLocationsModal";
import { Body } from "@/components/ui/Typography";
import type { EscapePoint } from "@/lib/escape-points";
import type { LibraryLocation } from "@/lib/locations";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchEscapePoints, deleteEscapePoint } from "@/features/escapePoints/escapePointsThunks";
import { selectEscapePoints, selectEscapePointsStatus, selectEscapePointsError } from "@/features/escapePoints/escapePointsSelectors";
import { FaPlus } from "react-icons/fa";
import { LuImport } from "react-icons/lu";

export function EscapePointsPanel({ locations }: { locations: LibraryLocation[] }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const escapePoints = useAppSelector(selectEscapePoints);
  const status = useAppSelector(selectEscapePointsStatus);
  const error = useAppSelector(selectEscapePointsError);

  const [modalOpen, setModalOpen] = useState(false);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [editing, setEditing] = useState<EscapePoint | null>(null);
  const [deletingUid, setDeletingUid] = useState<string | null>(null);

  const [managingLocations, setManagingLocations] = useState<EscapePoint | null>(null);

  useEffect(() => {
    dispatch(fetchEscapePoints());
  }, [dispatch]);

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(escapePoint: EscapePoint) {
    setEditing(escapePoint);
    setModalOpen(true);
  }

  async function handleDelete(escapePoint: EscapePoint) {
    setDeletingUid(escapePoint.uid);
    try {
      await dispatch(deleteEscapePoint(escapePoint.uid));
      dispatch(fetchEscapePoints());
    } finally {
      setDeletingUid(null);
    }
  }

  const columns: DataTableColumn<EscapePoint>[] = [
    {
      key: "name",
      header: "Name",
      render: (d) => (
        <button
          type="button"
          onClick={() => router.push(`/library/escape-points/${d.uid}`)}
          className="font-medium text-primary hover:underline"
        >
          {d.name}
        </button>
      ),
      sortValue: (d) => d.name.toLowerCase(),
      filterValue: (d) => d.name,
    },
    {
      key: "location",
      header: "Location",
      render: (d) => d.locationLabel || "—",
      filterValue: (d) => d.locationLabel,
    },
    {
      key: "status",
      header: "Status",
      render: (d) => <Badge tone={d.status === "archived" ? "danger" : "success"}>{d.status ?? "active"}</Badge>,
      sortValue: (d) => d.status ?? "",
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 justify-end">
        <Button className="self-start" onClick={openCreate}><FaPlus />Add escape point</Button>
        <Button variant="secondary" className="self-start" onClick={() => setBulkImportOpen(true)}><LuImport size={18} />Bulk import</Button>
      </div>

      {bulkImportOpen && (
        <BulkImportModal
          entityType="escape-points"
          label="escape points"
          onClose={() => setBulkImportOpen(false)}
          onImported={() => dispatch(fetchEscapePoints())}
        />
      )}

      {status === "failed" ? (
        <Body className="text-danger">{error}</Body>
      ) : (
        <DataTable
          columns={columns}
          rows={escapePoints}
          rowKey={(d) => d.uid}
          searchPlaceholder="Search escape points…"
          emptyMessage="No escape points yet — add your first one."
          onRowClick={(d) => router.push(`/library/escape-points/${d.uid}`)}
          getRowLabel={(d) => d.name}
          loading={status !== "succeeded" && escapePoints.length === 0}
          rowMenuActions={(d) => [
            { key: "edit", label: "Edit", onSelect: () => openEdit(d) },
            { key: "locations", label: "Locations", onSelect: () => setManagingLocations(d) },
            { key: "archive", label: "Archive", tone: "danger", disabled: deletingUid === d.uid, onSelect: () => handleDelete(d) },
          ]}
        />
      )}

      <EscapePointFormModal
        open={modalOpen}
        escapePoint={editing}
        escapePoints={escapePoints}
        locations={locations}
        onClose={() => setModalOpen(false)}
        onSaved={() => {
          dispatch(fetchEscapePoints());
          setModalOpen(false);
        }}
      />

      <EscapePointLocationsModal
        escapePoint={managingLocations}
        locations={locations}
        onClose={() => setManagingLocations(null)}
        onSaved={() => {
          dispatch(fetchEscapePoints());
          setManagingLocations(null);
        }}
      />
    </div>
  );
}
