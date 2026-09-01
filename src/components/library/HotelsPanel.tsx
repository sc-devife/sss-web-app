"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { BulkImportModal } from "@/components/library/BulkImportModal";
import { HotelFormModal } from "@/components/library/HotelFormModal";
import { Body } from "@/components/ui/Typography";
import { LoadingState } from "@/components/ui/Spinner";
import type { Hotel } from "@/lib/hotels";
import type { LibraryLocation } from "@/lib/locations";
import type { EscapePoint } from "@/lib/escape-points";
import type { MealPlan } from "@/lib/meal-plans";
import type { RoomType } from "@/lib/room-types";
import type { Service } from "@/lib/services";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchHotels, deleteHotel } from "@/features/hotels/hotelsThunks";
import { formatDisplayDate } from "@/lib/date";
import { selectHotels, selectHotelsStatus, selectHotelsError } from "@/features/hotels/hotelsSelectors";
import { FaPlus } from "react-icons/fa";
import { LuImport } from "react-icons/lu";

export function HotelsPanel({
  locations,
  escapePoints,
  mealPlans,
  roomTypes,
  services,
}: {
  locations: LibraryLocation[];
  escapePoints: EscapePoint[];
  mealPlans: MealPlan[];
  roomTypes: RoomType[];
  services: Service[];
}) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const hotels = useAppSelector(selectHotels);
  const status = useAppSelector(selectHotelsStatus);
  const error = useAppSelector(selectHotelsError);

  const [modalOpen, setModalOpen] = useState(false);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [editing, setEditing] = useState<Hotel | null>(null);
  const [deletingUid, setDeletingUid] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchHotels());
  }, [dispatch]);

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(hotel: Hotel) {
    setEditing(hotel);
    setModalOpen(true);
  }

  async function handleDelete(hotel: Hotel) {
    setDeletingUid(hotel.uid);
    try {
      await dispatch(deleteHotel(hotel.uid));
      dispatch(fetchHotels());
    } finally {
      setDeletingUid(null);
    }
  }

  const columns: DataTableColumn<Hotel>[] = [
    {
      key: "name",
      header: "Name",
      render: (h) => h.name,
      sortValue: (h) => h.name.toLowerCase(),
      filterValue: (h) => h.name,
    },
    {
      key: "stars",
      header: "Stars",
      render: (h) => (h.stars ? "★".repeat(h.stars) : "—"),
      sortValue: (h) => h.stars ?? 0,
    },
    {
      key: "escapePoint",
      header: "Escape Point",
      render: (h) => h.escapePoint?.name ?? "—",
      filterValue: (h) => h.escapePoint?.name ?? "",
    },
    {
      key: "location",
      header: "Location",
      render: (h) => h.location?.displayName ?? "—",
      filterValue: (h) => h.location?.displayName ?? "",
    },
    {
      key: "mealPlans",
      header: "Meal Plans",
      render: (h) => (h.mealPlans && h.mealPlans.length > 0 ? h.mealPlans.map((m) => m.code).join(" · ") : "—"),
    },
    {
      key: "checkInOut",
      header: "Check-in / Check-out",
      render: (h) => (h.checkInTime || h.checkOutTime ? `${h.checkInTime ?? "—"} / ${h.checkOutTime ?? "—"}` : "—"),
    },
    {
      key: "rateValidity",
      header: "Rate Valid",
      render: (h) =>
        h.rateValidFrom || h.rateValidTo
          ? `${formatDisplayDate(h.rateValidFrom) ?? "—"} to ${formatDisplayDate(h.rateValidTo) ?? "—"}`
          : "—",
    },
    {
      key: "status",
      header: "Status",
      render: (h) => <Badge tone={h.status === "archived" ? "danger" : "success"}>{h.status ?? "active"}</Badge>,
      sortValue: (h) => h.status ?? "",
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 justify-end">
        <Button className="self-start" onClick={openCreate}><FaPlus />Add hotel</Button>
        <Button variant="secondary" className="self-start" onClick={() => setBulkImportOpen(true)}><LuImport size={18} />Bulk import</Button>
      </div>

      {bulkImportOpen && (
        <BulkImportModal
          entityType="hotels"
          label="hotels"
          onClose={() => setBulkImportOpen(false)}
          onImported={() => dispatch(fetchHotels())}
        />
      )}

      {status === "loading" && hotels.length === 0 ? (
        <LoadingState label="Loading hotels…" />
      ) : status === "failed" ? (
        <Body className="text-danger">{error}</Body>
      ) : (
        <DataTable
          columns={columns}
          rows={hotels}
          rowKey={(h) => h.uid}
          searchPlaceholder="Search hotels…"
          emptyMessage="No hotels yet — add your first one."
          onRowClick={(h) => router.push(`/library/hotels/${h.uid}`)}
          getRowLabel={(h) => h.name}
          rowMenuActions={(h) => [
            { key: "edit", label: "Edit", onSelect: () => openEdit(h) },
            { key: "archive", label: "Archive", tone: "danger", disabled: deletingUid === h.uid, onSelect: () => handleDelete(h) },
          ]}
        />
      )}

      <HotelFormModal
        open={modalOpen}
        hotel={editing}
        onClose={() => setModalOpen(false)}
        onSaved={() => {}}
        locations={locations}
        escapePoints={escapePoints}
        mealPlans={mealPlans}
        roomTypes={roomTypes}
        services={services}
      />
    </div>
  );
}
