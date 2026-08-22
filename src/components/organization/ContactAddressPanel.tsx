"use client";

import { useEffect, useState, type FormEvent } from "react";
import { PiPencilSimple, PiTrash } from "react-icons/pi";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { Alert } from "@/components/ui/Alert";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { Body, Caption } from "@/components/ui/Typography";
import { LoadingState } from "@/components/ui/Spinner";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import { useIsDirty } from "@/lib/forms";
import { emailField, mobileField, required, runValidators } from "@/lib/validators";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchAddresses, createAddress, updateAddress, deleteAddress } from "@/features/addresses/addressesThunks";
import { selectAddresses, selectAddressesStatus, selectAddressesError } from "@/features/addresses/addressesSelectors";
import type { Address, AddressType } from "@/features/addresses/types";
import { Badge } from "@/components/ui/Badge";
import { FaEnvelope, FaPhoneAlt } from "react-icons/fa";
import {
  PiMapPin,
  PiPlusBold,
  PiBuildings,
} from "react-icons/pi";

const ADDRESS_TYPE_OPTIONS: { value: AddressType; label: string }[] = [
  { value: "CONTACT", label: "Contact" },
  { value: "BILLING", label: "Billing" },
];

const emptyForm = {
  label: "",
  city: "",
  state: "",
  country: "",
  zipCode: "",
  streetFirst: "",
  contactNumber: "",
  contactEmail: "",
  addressTypes: ["CONTACT"] as AddressType[],
  pan: "",
  gstin: "",
  tripDestination: "",
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
    addressTypes: address.addressTypes && address.addressTypes.length > 0 ? address.addressTypes : ["CONTACT"],
    pan: address.pan ?? "",
    gstin: address.gstin ?? "",
    tripDestination: address.tripDestination ?? "",
  };
}

function validate(v: FormState): Record<string, string> {
  const errors: Record<string, string> = {};
  const err = (key: Exclude<keyof FormState, "addressTypes">, validators: Parameters<typeof runValidators>[1]) => {
    const e = runValidators(v[key], validators);
    if (e) errors[key] = e;
  };
  err("label", [required("Label is required")]);
  err("streetFirst", [required("Street address is required")]);
  err("city", [required("City is required")]);
  err("state", [required("State is required")]);
  err("country", [required("Country is required")]);
  err("zipCode", [required("Pincode is required")]);
  err("contactNumber", [mobileField()]); // optional, format-checked only if filled
  err("contactEmail", [emailField()]); // optional, format-checked only if filled
  if (v.addressTypes.length === 0) errors.addressTypes = "Select at least one";
  return errors;
}

function AddressFormFields({
  form,
  update,
  setAddressTypes,
  errors,
}: {
  form: FormState;
  update: <K extends keyof FormState>(key: K, value: string) => void;
  setAddressTypes: (types: AddressType[]) => void;
  errors: Record<string, string>;
}) {
  function toggleType(type: AddressType) {
    const has = form.addressTypes.includes(type);
    const next = has ? form.addressTypes.filter((t) => t !== type) : [...form.addressTypes, type];
    setAddressTypes(next);
  }

  return (
    <>
      <TextInput label="Label" value={form.label} onChange={(e) => update("label", e.target.value)} error={errors.label} required placeholder="e.g. Head Office" />
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-foreground">Used For</span>
        <div className="flex gap-4">
          {ADDRESS_TYPE_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.addressTypes.includes(opt.value)}
                onChange={() => toggleType(opt.value)}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              {opt.label}
            </label>
          ))}
        </div>
        {errors.addressTypes && <p className="text-sm text-danger">{errors.addressTypes}</p>}
      </div>
      <TextInput label="Street Address" value={form.streetFirst} onChange={(e) => update("streetFirst", e.target.value)} error={errors.streetFirst} required />
      <TextInput label="City/Town/District" value={form.city} onChange={(e) => update("city", e.target.value)} error={errors.city} required />
      <TextInput label="State/Region" value={form.state} onChange={(e) => update("state", e.target.value)} error={errors.state} required />
      <TextInput label="Country" value={form.country} onChange={(e) => update("country", e.target.value)} error={errors.country} required />
      <TextInput label="Pincode" value={form.zipCode} onChange={(e) => update("zipCode", e.target.value)} error={errors.zipCode} required />
      <PhoneInput label="Contact Number" value={form.contactNumber} onChange={(v) => update("contactNumber", v)} error={errors.contactNumber} />
      <TextInput label="Contact Email" type="email" value={form.contactEmail} onChange={(e) => update("contactEmail", e.target.value)} error={errors.contactEmail} />
      <TextInput label="Trip Destination" value={form.tripDestination} onChange={(e) => update("tripDestination", e.target.value)} placeholder="Scope this address to a specific trip destination" />
      {form.addressTypes.includes("BILLING") && (
        <>
          <TextInput label="PAN" value={form.pan} onChange={(e) => update("pan", e.target.value.toUpperCase())} placeholder="e.g. AAAAA0000A" />
          <TextInput label="GSTIN" value={form.gstin} onChange={(e) => update("gstin", e.target.value.toUpperCase())} placeholder="e.g. 22AAAAA0000A1Z5" />
        </>
      )}
    </>
  );
}

export function ContactAddressPanel({ orgId }: { orgId: string }) {
  const dispatch = useAppDispatch();
  const addresses = useAppSelector(selectAddresses);
  const status = useAppSelector(selectAddressesStatus);
  const error = useAppSelector(selectAddressesError);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | undefined>();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FormState>(emptyForm);
  const [editOriginal, setEditOriginal] = useState<FormState | null>(null);
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | undefined>();

  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchAddresses(orgId));
  }, [dispatch, orgId]);

  function update<K extends keyof FormState>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((p) => ({ ...p, [key]: "" }));
  }

  function updateEdit<K extends keyof FormState>(key: K, value: string) {
    setEditForm((f) => ({ ...f, [key]: value }));
    setEditErrors((p) => ({ ...p, [key]: "" }));
  }

  function setFormAddressTypes(types: AddressType[]) {
    setForm((f) => ({ ...f, addressTypes: types }));
    setErrors((p) => ({ ...p, addressTypes: "" }));
  }

  function setEditFormAddressTypes(types: AddressType[]) {
    setEditForm((f) => ({ ...f, addressTypes: types }));
    setEditErrors((p) => ({ ...p, addressTypes: "" }));
  }

  function openAddModal() {
    setForm(emptyForm);
    setErrors({});
    setFormError(undefined);
    setShowForm(true);
  }

  // Ignored while a save is in flight — the modal's X button, backdrop
  // click, and Escape key all route through this, so a pending request
  // can't be silently abandoned mid-flight.
  function closeAddModal() {
    if (saving) return;
    setShowForm(false);
  }

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setFormError(undefined);

    const nextErrors = validate(form);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      await dispatch(createAddress({ orgId, payload: form })).unwrap();
      dispatch(fetchAddresses(orgId));
      setForm(emptyForm);
      setShowForm(false);
    } catch (err) {
      setFormError(typeof err === "string" ? err : extractErrorMessage(err, "Failed to add address"));
    } finally {
      setSaving(false);
    }
  }

  function startEdit(address: Address) {
    setEditingId(address.uid);
    setEditForm(toForm(address));
    setEditOriginal(toForm(address));
    setEditErrors({});
    setEditError(undefined);
  }

  function closeEditModal() {
    if (editSaving) return;
    setEditingId(null);
    setEditOriginal(null);
  }

  const isEditDirty = useIsDirty(editOriginal, editForm);

  async function handleUpdate(e: FormEvent, addressId: string) {
    e.preventDefault();
    if (!isEditDirty) return;
    setEditError(undefined);

    const nextErrors = validate(editForm);
    if (Object.keys(nextErrors).length > 0) {
      setEditErrors(nextErrors);
      return;
    }
    setEditErrors({});
    setEditSaving(true);
    try {
      await dispatch(updateAddress({ orgId, addressId, payload: editForm })).unwrap();
      dispatch(fetchAddresses(orgId));
      setEditingId(null);
      setEditOriginal(null);
    } catch (err) {
      setEditError(typeof err === "string" ? err : extractErrorMessage(err, "Failed to update address"));
    } finally {
      setEditSaving(false);
    }
  }

  async function handleDelete(addressId: string) {
    setDeletingId(addressId);
    try {
      await dispatch(deleteAddress({ orgId, addressId })).unwrap();
      dispatch(fetchAddresses(orgId));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-end">
        <Button
          onClick={openAddModal}
          className="self-start md:self-auto"
        >
          <PiPlusBold className="mr-2 h-4 w-4" />
          Add Address
        </Button>
      </div>

      {status === "loading" && addresses.length === 0 ? (
        <LoadingState label="Loading addresses…" />
      ) : status === "failed" && addresses.length === 0 ? (
        <Body className="text-danger">{error}</Body>
      ) : (
        <>
          {/* Empty State */}

          {addresses.length === 0 && (
            <EmptyState
              icon={PiMapPin}
              title="No addresses added"
              description="Add your headquarters or office address. This information can be used in invoices, documents and customer communication."
              action={{ label: "Add First Address", onClick: openAddModal }}
            />
          )}

          {/* Address Cards */}

          {addresses.length > 0 && (

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

              {addresses.map((address) => (

                <Card key={address.uid} variant="elevated">

                  <div className="flex h-full flex-col justify-between">

                    <div>

                      <div className="flex items-start justify-between">

                        <div>

                          <div className="flex items-center gap-3">

                            <div className="rounded-xl bg-primary/10 p-2">

                              <PiBuildings className="h-5 w-5 text-primary" />

                            </div>

                            <div>
                              <Body className="text-lg font-semibold">
                                {address.label}
                              </Body>
                              <div className="mt-1 flex gap-1.5">
                                {(address.addressTypes ?? []).map((t) => (
                                  <Badge key={t} tone="neutral">
                                    {t === "CONTACT" ? "Contact" : "Billing"}
                                  </Badge>
                                ))}
                              </div>
                            </div>

                          </div>

                        </div>

                        <div className="flex gap-2">

                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={deletingId === address.uid}
                            onClick={() => startEdit(address)}
                          >
                            <PiPencilSimple className="mr-0.5 h-4 w-4" />
                            Edit
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-danger hover:bg-danger/10"
                            disabled={deletingId === address.uid}
                            onClick={() => handleDelete(address.uid)}
                          >
                            <PiTrash className="mr-0.5 h-4 w-4" />
                            {deletingId === address.uid ? "Deleting..." : "Delete"}
                          </Button>

                        </div>

                      </div>

                      <div className="mt-4 space-y-2">

                        <div className="flex gap-3">

                          <PiMapPin className="mt-0.5 h-5 w-5 text-primary" />

                          <div>

                            <Caption>{address.streetFirst}</Caption>

                            <Caption>
                              {address.city}, {address.state}
                            </Caption>

                            <Caption>
                              {address.country} - {address.zipCode}
                            </Caption>

                          </div>

                        </div>

                      </div>

                      {address.tripDestination && (
                        <Caption className="mt-2 text-muted-foreground">
                          Scoped to: {address.tripDestination}
                        </Caption>
                      )}

                      {(address.contactNumber || address.contactEmail) && (

                        <div className="mt-4 space-y-3 border-t pt-4">

                          {address.contactNumber && (

                            <div className="flex items-center gap-3">

                              <FaPhoneAlt className="text-primary" />

                              <span className="text-sm">
                                {address.contactNumber}
                              </span>

                            </div>

                          )}

                          {address.contactEmail && (

                            <div className="flex items-center gap-3">

                              <FaEnvelope className="text-primary" />

                              <span className="text-sm">
                                {address.contactEmail}
                              </span>

                            </div>

                          )}

                        </div>

                      )}

                    </div>

                  </div>

                </Card>

              ))}

            </div>

          )}
        </>
      )}

      {/* Add Address */}
      <Modal open={showForm} onClose={closeAddModal} title="Add Address" className="max-w-2xl">
        <form onSubmit={handleAdd} className="space-y-6">
        <fieldset disabled={saving} className="contents">

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <AddressFormFields form={form} update={update} setAddressTypes={setFormAddressTypes} errors={errors} />
          </div>
        </fieldset>

          {formError && (
            <Alert tone="danger" autoClose={false}>
              {formError}
            </Alert>
          )}

          <div className="flex flex-wrap justify-end gap-3 border-t pt-5">
            <Button type="button" variant="ghost" disabled={saving} onClick={closeAddModal}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving} loading={saving} loadingText="Saving...">
              Save Address
            </Button>
          </div>

        </form>
      </Modal>

      {/* Edit Address */}
      <Modal open={editingId !== null} onClose={closeEditModal} title="Edit Address" className="max-w-2xl">
        <form onSubmit={(e) => editingId !== null && handleUpdate(e, editingId)} className="space-y-6">
        <fieldset disabled={editSaving} className="contents">

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <AddressFormFields form={editForm} update={updateEdit} setAddressTypes={setEditFormAddressTypes} errors={editErrors} />
          </div>
        </fieldset>

          {editError && (
            <Alert tone="danger" autoClose={false}>
              {editError}
            </Alert>
          )}

          <div className="flex flex-wrap justify-end gap-3 border-t pt-5">
            <Button type="button" variant="ghost" disabled={editSaving} onClick={closeEditModal}>
              Cancel
            </Button>
            <Button type="submit" disabled={editSaving || !isEditDirty} loading={editSaving} loadingText="Saving...">
              Save Changes
            </Button>
          </div>

        </form>
      </Modal>

    </div>
  );
}
