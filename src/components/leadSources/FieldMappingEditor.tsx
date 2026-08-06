"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { Select } from "@/components/ui/Select";
import { Body } from "@/components/ui/Typography";
import { LoadingState } from "@/components/ui/Spinner";
import { Alert } from "@/components/ui/Alert";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import { required, runValidators } from "@/lib/validators";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchFieldMappings, saveFieldMapping } from "@/features/integrations/integrationsThunks";
import { selectFieldMappings, selectFieldMappingsStatus, selectFieldMappingsError } from "@/features/integrations/integrationsSelectors";

const CRM_FIELD_OPTIONS = [
  { value: "name", label: "Name" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "destination_hint", label: "Escape Point" },
  { value: "travel_date", label: "Travel date" },
  { value: "number_of_people", label: "Number of people" },
  { value: "duration_days", label: "Duration (days)" },
  { value: "notes", label: "Notes" },
  { value: "ignore", label: "Ignore this field" },
];

const emptyRow = { formId: "", metaFieldKey: "", crmField: "name" };

export function FieldMappingEditor({ channelCode, onClose }: { channelCode: string; onClose: () => void }) {
  const dispatch = useAppDispatch();
  const mappings = useAppSelector(selectFieldMappings);
  const status = useAppSelector(selectFieldMappingsStatus);
  const error = useAppSelector(selectFieldMappingsError);

  const [newRow, setNewRow] = useState(emptyRow);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | undefined>();

  useEffect(() => {
    dispatch(fetchFieldMappings(channelCode));
  }, [dispatch, channelCode]);

  async function handleAdd() {
    setFormError(undefined);
    const metaFieldKeyErr = runValidators(newRow.metaFieldKey, [required("Meta field key is required")]);
    if (metaFieldKeyErr) {
      setErrors({ metaFieldKey: metaFieldKeyErr });
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      await dispatch(
        saveFieldMapping({
          channelCode,
          formId: newRow.formId || null,
          metaFieldKey: newRow.metaFieldKey,
          crmField: newRow.crmField,
        }),
      ).unwrap();
      dispatch(fetchFieldMappings(channelCode));
      setNewRow(emptyRow);
    } catch (err) {
      setFormError(typeof err === "string" ? err : extractErrorMessage(err, "Failed to save mapping"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose} title="Field Mapping" className="max-w-2xl">
      {status === "loading" && mappings.length === 0 ? (
        <LoadingState />
      ) : status === "failed" ? (
        <Body className="text-danger">{error}</Body>
      ) : (
        <div className="flex flex-col gap-4">
          <Body muted>
            Map Meta form question keys to CRM lead fields. Leave &quot;Form ID&quot; blank for an org-wide default that applies to any form without its own mapping.
          </Body>

          <div className="flex flex-col gap-2">
            {mappings.length === 0 && <Body muted>No custom mappings yet — using built-in defaults (full_name, email, phone_number).</Body>}
            {mappings.map((m) => (
              <div key={m.seqp} className="flex items-center gap-2 rounded border border-border p-2 text-sm">
                <span className="flex-1 font-medium">{m.metaFieldKey}</span>
                <span className="text-muted-foreground">→</span>
                <span className="flex-1">{CRM_FIELD_OPTIONS.find((o) => o.value === m.crmField)?.label ?? m.crmField}</span>
                <span className="text-xs text-muted-foreground">{m.formId ? `Form ${m.formId}` : "Org default"}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 rounded border border-border p-3">
            <fieldset disabled={saving} className="contents">
              <TextInput
                label="Meta field key"
                value={newRow.metaFieldKey}
                onChange={(e) => {
                  setNewRow((r) => ({ ...r, metaFieldKey: e.target.value }));
                  setErrors((p) => ({ ...p, metaFieldKey: "" }));
                }}
                error={errors.metaFieldKey}
                placeholder="e.g. q_which_destination"
              />
              <Select
                label="CRM field"
                options={CRM_FIELD_OPTIONS}
                value={newRow.crmField}
                onChange={(e) => setNewRow((r) => ({ ...r, crmField: e.target.value }))}
              />
              <TextInput
                label="Form ID (optional)"
                value={newRow.formId}
                onChange={(e) => setNewRow((r) => ({ ...r, formId: e.target.value }))}
                placeholder="Leave blank for org-wide default"
                className="col-span-2"
              />
            </fieldset>
            {formError && (
              <Alert tone="danger" autoClose={false} className="col-span-2">
                {formError}
              </Alert>
            )}
            <Button className="col-span-2" disabled={saving} loading={saving} loadingText="Saving…" onClick={handleAdd}>
              Add mapping
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
