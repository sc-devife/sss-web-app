"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ToolbarSelect } from "@/components/ui/ToolbarSelect";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { BulkImportModal } from "@/components/library/BulkImportModal";
import { Body } from "@/components/ui/Typography";
import { ServiceProviderFormModal, SERVICE_PROVIDER_TYPE_OPTIONS } from "@/components/library/ServiceProviderFormModal";
import type { ServiceProvider } from "@/lib/service-providers";
import type { EscapePoint } from "@/lib/escape-points";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchServiceProviders, deleteServiceProvider } from "@/features/serviceProviders/serviceProvidersThunks";
import {
  selectServiceProviders,
  selectServiceProvidersStatus,
  selectServiceProvidersError,
} from "@/features/serviceProviders/serviceProvidersSelectors";
import { FaPlus } from "react-icons/fa";
import { LuImport } from "react-icons/lu";

const TYPE_FILTER_OPTIONS = [{ value: "", label: "Default" }, ...SERVICE_PROVIDER_TYPE_OPTIONS];

export function ServiceProvidersPanel({
  escapePoints,
}: {
  escapePoints: EscapePoint[];
}) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const providers = useAppSelector(selectServiceProviders);
  const status = useAppSelector(selectServiceProvidersStatus);
  const error = useAppSelector(selectServiceProvidersError);

  const [modalOpen, setModalOpen] = useState(false);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceProvider | null>(null);
  const [deletingUid, setDeletingUid] = useState<string | null>(null);
  const [escapePointFilter, setEscapePointFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  useEffect(() => {
    dispatch(fetchServiceProviders());
  }, [dispatch]);

  const escapePointOptions = useMemo(
    () => [{ value: "", label: "Default" }, ...escapePoints.map((ep) => ({ value: ep.uid, label: ep.name }))],
    [escapePoints],
  );

  // Stays client-side, same as DataTable's own search/pagination — the full
  // list is already fetched up front, no backend change needed.
  const visibleProviders = useMemo(() => {
    return providers.filter((p) => {
      if (escapePointFilter && p.escapePoint?.uid !== escapePointFilter) return false;
      if (typeFilter && p.typeCode !== typeFilter) return false;
      return true;
    });
  }, [providers, escapePointFilter, typeFilter]);

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(provider: ServiceProvider) {
    setEditing(provider);
    setModalOpen(true);
  }

  async function handleDelete(provider: ServiceProvider) {
    setDeletingUid(provider.uid);
    try {
      await dispatch(deleteServiceProvider(provider.uid));
      dispatch(fetchServiceProviders());
    } finally {
      setDeletingUid(null);
    }
  }

  const columns: DataTableColumn<ServiceProvider>[] = [
    {
      key: "escapePoint",
      header: "Escape Point",
      render: (p) => p.escapePoint?.name ?? "—",
      filterValue: (p) => p.escapePoint?.name ?? "",
    },
    {
      key: "name",
      header: "Name",
      render: (p) => p.name,
      sortValue: (p) => p.name.toLowerCase(),
      filterValue: (p) => p.name,
    },
    {
      key: "type",
      header: "Type",
      render: (p) => SERVICE_PROVIDER_TYPE_OPTIONS.find((t) => t.value === p.typeCode)?.label ?? p.typeCode,
      sortValue: (p) => p.typeCode,
    },
    {
      key: "country",
      header: "Country",
      render: (p) => p.countryLabel || "—",
      filterValue: (p) => p.countryLabel,
    },
    {
      key: "status",
      header: "Status",
      render: (p) => <Badge tone={p.status === "archived" ? "danger" : "success"}>{p.status ?? "active"}</Badge>,
      sortValue: (p) => p.status ?? "",
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 justify-end">
        <Button className="self-start" onClick={openCreate}><FaPlus />Add Service Provider</Button>
        <Button variant="secondary" className="self-start" onClick={() => setBulkImportOpen(true)}><LuImport size={18} />Bulk Import</Button>
      </div>

      {bulkImportOpen && (
        <BulkImportModal
          entityType="service-providers"
          label="service providers"
          onClose={() => setBulkImportOpen(false)}
          onImported={() => dispatch(fetchServiceProviders())}
        />
      )}

      {status === "failed" ? (
        <Body className="text-danger">{error}</Body>
      ) : (
        <DataTable
          columns={columns}
          rows={visibleProviders}
          rowKey={(p) => p.uid}
          searchPlaceholder="Search service providers…"
          emptyMessage="No service providers yet — add your first one."
          onRowClick={(p) => router.push(`/library/service-providers/${p.uid}`)}
          getRowLabel={(p) => p.name}
          loading={status !== "succeeded" && providers.length === 0}
          rowMenuActions={(p) => [
            { key: "edit", label: "Edit", onSelect: () => openEdit(p) },
            { key: "archive", label: "Archive", tone: "danger", disabled: deletingUid === p.uid, onSelect: () => handleDelete(p) },
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
              <ToolbarSelect label="Type" options={TYPE_FILTER_OPTIONS} value={typeFilter} onChange={setTypeFilter} placeholder="Default" />
            </div>
          }
        />
      )}

      <ServiceProviderFormModal
        open={modalOpen}
        provider={editing}
        escapePoints={escapePoints}
        onClose={() => setModalOpen(false)}
        onSaved={() => {
          dispatch(fetchServiceProviders());
          setModalOpen(false);
        }}
      />
    </div>
  );
}
