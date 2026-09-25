"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { TbEditFilled } from "react-icons/tb";
import { EditIconActions } from "@/components/library/HotelSectionEditors";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { MultiSelectSearch } from "@/components/ui/MultiSelectSearch";
import { FormAppearanceProvider } from "@/components/ui/FormAppearance";
import { clientApi } from "@/lib/axios/clientClient";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import { getOrgCurrency } from "@/lib/currency";
import type { Hotel } from "@/lib/hotels";
import type { Service } from "@/lib/services";

// Edit a hotel's services right on its detail page (Services tab): pick from the
// available services (global + this hotel's own), or add a new service for this
// hotel. The Edit Hotel page deliberately doesn't carry services any more.
export function HotelServicesEditor({ hotel, onDone }: { hotel: Hotel; onDone: () => void }) {
  const router = useRouter();
  const [options, setOptions] = useState<Service[]>([]);
  const [selected, setSelected] = useState<string[]>((hotel.services ?? []).map((s) => s.uid));
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newService, setNewService] = useState({ name: "", description: "", price: "" });
  const [savingNew, setSavingNew] = useState(false);
  const [error, setError] = useState<string | undefined>();

  // Global services plus this hotel's own.
  useEffect(() => {
    clientApi
      .get<Service[]>(`/library/services?hotelId=${hotel.uid}`)
      .then((res) => setOptions(res.data))
      .catch(() => setOptions([]));
  }, [hotel.uid]);

  async function save() {
    setSaving(true);
    setError(undefined);
    try {
      await clientApi.put(`/library/hotels/${hotel.uid}`, { serviceIds: selected });
      toast.success("Services updated.");
      router.refresh();
      onDone();
    } catch (err) {
      setError(extractErrorMessage(err, "Failed to update services"));
    } finally {
      setSaving(false);
    }
  }

  async function addService() {
    if (!newService.name.trim()) return;
    setSavingNew(true);
    setError(undefined);
    try {
      const created = await clientApi
        .post<Service>("/library/services", {
          name: newService.name,
          description: newService.description,
          price: newService.price ? Number(newService.price) : null,
          hotelId: hotel.uid,
        })
        .then((res) => res.data);
      setOptions((opts) => [...opts, created]);
      setSelected((ids) => [...ids, created.uid]);
      setNewService({ name: "", description: "", price: "" });
      setAdding(false);
    } catch (err) {
      setError(extractErrorMessage(err, "Failed to add service"));
    } finally {
      setSavingNew(false);
    }
  }

  return (
    <FormAppearanceProvider value="pill">
      <div className="flex flex-col gap-4">
        <MultiSelectSearch
          label="Services"
          placeholder="Search available services"
          options={options.map((s) => ({ value: s.uid, label: s.name }))}
          value={selected}
          onChange={setSelected}
        />

        {!adding ? (
          <button type="button" onClick={() => setAdding(true)} className="self-start text-sm text-primary hover:underline">
            + Add New Service
          </button>
        ) : (
          <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">New service for this hotel</span>
              <button type="button" onClick={() => setAdding(false)} className="text-sm text-muted-foreground hover:text-foreground">
                Cancel
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <TextInput
                label="Name"
                placeholder="e.g. Airport Pickup"
                value={newService.name}
                onChange={(e) => setNewService((s) => ({ ...s, name: e.target.value }))}
                required
              />
              <TextInput
                label="Description"
                value={newService.description}
                onChange={(e) => setNewService((s) => ({ ...s, description: e.target.value }))}
              />
              <TextInput
                label={`Price (${hotel.priceCurrency || getOrgCurrency()})`}
                type="number"
                min={0}
                step="any"
                value={newService.price}
                onChange={(e) => setNewService((s) => ({ ...s, price: e.target.value }))}
              />
            </div>
            <Button
              type="button"
              size="sm"
              className="self-start"
              disabled={savingNew || !newService.name.trim()}
              loading={savingNew}
              loadingText="Saving…"
              onClick={addService}
            >
              Add service
            </Button>
          </div>
        )}

        {error && <p className="text-sm text-danger">{error}</p>}

        <EditIconActions saving={saving} onCancel={onDone} onSave={save} label="Save services" />
      </div>
    </FormAppearanceProvider>
  );
}

export function EditServicesButton({ onClick }: { onClick: () => void }) {
  return (
    <Button size="sm" variant="secondary" onClick={onClick}>
      <TbEditFilled size={14} />
      Edit services
    </Button>
  );
}
