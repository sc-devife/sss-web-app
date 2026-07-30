"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { PiPencilSimple, PiTrash } from "react-icons/pi";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { Body, Caption } from "@/components/ui/Typography";
import type { Address } from "@/lib/addresses";
import { FaEnvelope, FaPhoneAlt } from "react-icons/fa";

const emptyForm = {
  label: "",
  city: "",
  state: "",
  country: "",
  zipCode: "",
  streetFirst: "",
  contactNumber: "",
  contactEmail: "",
};

type FormState = typeof emptyForm;

function toForm(address: Address): FormState {
  return {
    label: address.label ?? "",
    city: address.city ?? "",
    state: address.state ?? "",
    country: address.country ?? "",
    zipCode: address.zipCode ?? "",
    streetFirst: address.streetFirst ?? "",
    contactNumber: address.contactNumber ?? "",
    contactEmail: address.contactEmail ?? "",
  };
}

function AddressFormFields({ form, update }: { form: FormState; update: <K extends keyof FormState>(key: K, value: string) => void }) {
  return (
    <>
      <TextInput label="Label" value={form.label} onChange={(e) => update("label", e.target.value)} required placeholder="e.g. Head Office" />
      <TextInput label="Street Address" value={form.streetFirst} onChange={(e) => update("streetFirst", e.target.value)} required />
      <TextInput label="City/Town/District" value={form.city} onChange={(e) => update("city", e.target.value)} required />
      <TextInput label="State/Region" value={form.state} onChange={(e) => update("state", e.target.value)} required />
      <TextInput label="Country" value={form.country} onChange={(e) => update("country", e.target.value)} required />
      <TextInput label="Pincode" value={form.zipCode} onChange={(e) => update("zipCode", e.target.value)} required />
      <TextInput label="Contact Number" value={form.contactNumber} onChange={(e) => update("contactNumber", e.target.value)} />
      <TextInput label="Contact Email" type="email" value={form.contactEmail} onChange={(e) => update("contactEmail", e.target.value)} />
    </>
  );
}

export function ContactAddressPanel({ orgId, addresses }: { orgId: number; addresses: Address[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<FormState>(emptyForm);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | undefined>();

  function update<K extends keyof FormState>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function updateEdit<K extends keyof FormState>(key: K, value: string) {
    setEditForm((f) => ({ ...f, [key]: value }));
  }

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(undefined);
    try {
      const res = await fetch("/api/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId, ...form }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? "Failed to add address");
      }
      setForm(emptyForm);
      setShowForm(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add address");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(address: Address) {
    setEditingId(address.id);
    setEditForm(toForm(address));
    setEditError(undefined);
    setShowForm(false);
  }

  async function handleUpdate(e: FormEvent, addressId: number) {
    e.preventDefault();
    setEditSaving(true);
    setEditError(undefined);
    try {
      const res = await fetch("/api/addresses", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId, addressId, ...editForm }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? "Failed to update address");
      }
      setEditingId(null);
      router.refresh();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Failed to update address");
    } finally {
      setEditSaving(false);
    }
  }

  async function handleDelete(addressId: number) {
    await fetch("/api/addresses", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orgId, addressId }),
    });
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        {addresses.length === 0 && !showForm && <Body muted>No addresses added yet.</Body>}
        {addresses.map((address) =>
          editingId === address.id ? (
            <Card key={address.id}>
              <form onSubmit={(e) => handleUpdate(e, address.id)} className="grid grid-cols-2 gap-4">
                <AddressFormFields form={editForm} update={updateEdit} />

                {editError && <p className="col-span-2 text-sm text-danger">{editError}</p>}

                <div className="col-span-2 flex gap-2">
                  <Button type="submit" disabled={editSaving}>{editSaving ? "Saving…" : "Save changes"}</Button>
                  <Button type="button" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                </div>
              </form>
            </Card>
          ) : (
            <Card key={address.id} className="flex items-center justify-between">
              <div>
                <Body className="font-medium">{address.label}</Body>
                <Caption>
                  {address.streetFirst}, {address.city}, {address.state}, {address.country} — {address.zipCode}
                </Caption>
                {(address.contactNumber || address.contactEmail) && (
                  <div className="mt-1 flex flex-col gap-1">
                    {address.contactNumber && (
                      <Caption className="flex items-center gap-2">
                        <FaPhoneAlt className="h-4 w-4" />
                        <span>{address.contactNumber}</span>
                      </Caption>
                    )}
                    {address.contactEmail && (
                      <Caption className="flex items-center gap-2">
                        <FaEnvelope className="h-4 w-4" />
                        <span>{address.contactEmail}</span>
                      </Caption>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label="Edit address"
                  onClick={() => startEdit(address)}
                  className="px-2"
                >
                  <PiPencilSimple className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label="Delete address"
                  onClick={() => handleDelete(address.id)}
                  className="px-2 text-danger hover:bg-danger/10"
                >
                  <PiTrash className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ),
        )}
      </div>

      {!showForm && editingId === null && (
        <Button variant="secondary" className="self-start" onClick={() => setShowForm(true)}>
          Add New Address
        </Button>
      )}

      {showForm && (
        <Card>
          <form onSubmit={handleAdd} className="grid grid-cols-2 gap-4">
            <AddressFormFields form={form} update={update} />

            {error && <p className="col-span-2 text-sm text-danger">{error}</p>}

            <div className="col-span-2 flex gap-2">
              <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save address"}</Button>
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
