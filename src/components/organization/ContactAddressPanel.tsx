"use client";

import { useEffect, useState, type FormEvent } from "react";
import { PiPencilSimple, PiTrash } from "react-icons/pi";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { Alert } from "@/components/ui/Alert";
import { EmptyState } from "@/components/ui/EmptyState";
import { Body, Caption } from "@/components/ui/Typography";
import { LoadingState } from "@/components/ui/Spinner";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchAddresses, createAddress, updateAddress, deleteAddress } from "@/features/addresses/addressesThunks";
import { selectAddresses, selectAddressesStatus, selectAddressesError } from "@/features/addresses/addressesSelectors";
import type { Address } from "@/features/addresses/types";
import { FaEnvelope, FaPhoneAlt } from "react-icons/fa";
import {
  PiMapPin,
  PiPlusBold,
  PiBuildings,
} from "react-icons/pi";

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

export function ContactAddressPanel({ orgId }: { orgId: number }) {
  const dispatch = useAppDispatch();
  const addresses = useAppSelector(selectAddresses);
  const status = useAppSelector(selectAddressesStatus);
  const error = useAppSelector(selectAddressesError);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | undefined>();

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<FormState>(emptyForm);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | undefined>();

  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    dispatch(fetchAddresses(orgId));
  }, [dispatch, orgId]);

  function update<K extends keyof FormState>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function updateEdit<K extends keyof FormState>(key: K, value: string) {
    setEditForm((f) => ({ ...f, [key]: value }));
  }

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError(undefined);
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
      await dispatch(updateAddress({ orgId, addressId, payload: editForm })).unwrap();
      dispatch(fetchAddresses(orgId));
      setEditingId(null);
    } catch (err) {
      setEditError(typeof err === "string" ? err : extractErrorMessage(err, "Failed to update address"));
    } finally {
      setEditSaving(false);
    }
  }

  async function handleDelete(addressId: number) {
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


        {!showForm && editingId === null && (
          <Button
            onClick={() => setShowForm(true)}
            className="self-start md:self-auto"
          >
            <PiPlusBold className="mr-2 h-4 w-4" />
            Add Address
          </Button>
        )}
      </div>

      {status === "loading" && addresses.length === 0 ? (
        <LoadingState label="Loading addresses…" />
      ) : status === "failed" && addresses.length === 0 ? (
        <Body className="text-danger">{error}</Body>
      ) : (
        <>
          {/* Empty State */}

          {addresses.length === 0 && !showForm && (
            <EmptyState
              icon={PiMapPin}
              title="No addresses added"
              description="Add your headquarters or office address. This information can be used in invoices, documents and customer communication."
              action={{ label: "Add First Address", onClick: () => setShowForm(true) }}
            />
          )}

          {/* Address Cards */}

          {addresses.length > 0 && (

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

              {addresses.map((address) =>

                editingId === address.id ? (

                  <Card
                    key={address.id}
                    className="rounded-2xl border-primary/20"
                  >

                    <form
                      onSubmit={(e) => handleUpdate(e, address.id)}
                      className="space-y-4"
                    >

                      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                        <AddressFormFields
                          form={editForm}
                          update={updateEdit}
                        />

                      </div>

                      {editError && <Alert tone="danger">{editError}</Alert>}

                      <div className="flex flex-wrap justify-end gap-3 border-t pt-5">

                        <Button
                          type="button"
                          variant="ghost"
                          disabled={editSaving}
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </Button>

                        <Button
                          type="submit"
                          disabled={editSaving}
                        >
                          {editSaving ? "Saving..." : "Save Changes"}
                        </Button>

                      </div>

                    </form>

                  </Card>

                ) : (

                  <Card key={address.id} variant="elevated">

                    <div className="flex h-full flex-col justify-between">

                      <div>

                        <div className="flex items-start justify-between">

                          <div>

                            <div className="flex items-center gap-3">

                              <div className="rounded-xl bg-primary/10 p-2">

                                <PiBuildings className="h-5 w-5 text-primary" />

                              </div>

                              <Body className="text-lg font-semibold">
                                {address.label}
                              </Body>

                            </div>

                          </div>

                          <div className="flex gap-2">

                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={deletingId === address.id}
                              onClick={() => startEdit(address)}
                            >
                              <PiPencilSimple className="mr-0.5 h-4 w-4" />
                              Edit
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-danger hover:bg-danger/10"
                              disabled={deletingId === address.id}
                              onClick={() => handleDelete(address.id)}
                            >
                              <PiTrash className="mr-0.5 h-4 w-4" />
                              {deletingId === address.id ? "Deleting..." : "Delete"}
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

                )

              )}

            </div>

          )}
        </>
      )}

      {/* Add Address */}

      {showForm && (

        <Card className="rounded-2xl">

          <div className="mb-6">

            <h4 className="text-lg font-semibold">
              Add New Address
            </h4>

            <Caption className="mt-1 text-muted-foreground">
              Enter your office or branch details.
            </Caption>

          </div>

          <form
            onSubmit={handleAdd}
            className="space-y-6"
          >

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

              <AddressFormFields
                form={form}
                update={update}
              />

            </div>

            {formError && <Alert tone="danger">{formError}</Alert>}

            <div className="flex flex-wrap justify-end gap-3 border-t pt-6">

              <Button
                type="button"
                variant="ghost"
                disabled={saving}
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Address"}
              </Button>

            </div>

          </form>

        </Card>

      )}

    </div>
  );
}
