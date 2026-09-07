"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { Alert } from "@/components/ui/Alert";
import { MultiSelect } from "@/components/ui/MultiSelect";
import type { EscapePoint } from "@/lib/escape-points";
import type { LibraryLocation } from "@/lib/locations";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import { useAppDispatch } from "@/store/hooks";
import { updateEscapePointLocations } from "@/features/escapePoints/escapePointsThunks";

// Which cities a destination covers is a separate action from editing its
// own fields (a distinct endpoint, PUT {uid}/locations) — extracted here,
// same "one modal, two call sites" split as EscapePointFormModal, so both
// the list page and the detail page can offer it.
export function EscapePointLocationsModal({
  escapePoint,
  locations,
  onClose,
  onSaved,
}: {
  escapePoint: EscapePoint | null;
  locations: LibraryLocation[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const dispatch = useAppDispatch();
  const [selectedLocationUids, setSelectedLocationUids] = useState<string[]>([]);
  const [primaryLocationUid, setPrimaryLocationUid] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    if (!escapePoint) return;
    setSelectedLocationUids(escapePoint.locations.map((l) => l.uid));
    setPrimaryLocationUid(escapePoint.locations.find((l) => l.isPrimary)?.uid ?? "");
    setError(undefined);
  }, [escapePoint]);

  async function handleSave() {
    if (!escapePoint) return;
    setSaving(true);
    setError(undefined);
    try {
      await dispatch(
        updateEscapePointLocations({
          uid: escapePoint.uid,
          locationUids: selectedLocationUids,
          primaryLocationUid: primaryLocationUid || null,
        }),
      ).unwrap();
      onSaved();
    } catch (err) {
      setError(typeof err === "string" ? err : extractErrorMessage(err, "Failed to save locations"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={!!escapePoint}
      onClose={() => {
        if (saving) return;
        onClose();
      }}
      title={escapePoint ? `Locations — ${escapePoint.name}` : "Locations"}
    >
      <div className="flex flex-col gap-4">
        <fieldset disabled={saving} className="contents">
          <MultiSelect
            label="Cities this destination covers"
            options={locations.map((l) => ({ value: l.uid, label: l.displayName }))}
            value={selectedLocationUids}
            onChange={(next) => {
              setSelectedLocationUids(next);
              if (!next.includes(primaryLocationUid)) setPrimaryLocationUid("");
            }}
          />
          <Select
            label="Headline / display city"
            options={locations.filter((l) => selectedLocationUids.includes(l.uid)).map((l) => ({ value: l.uid, label: l.displayName }))}
            value={primaryLocationUid}
            onChange={(e) => setPrimaryLocationUid(e.target.value)}
            placeholder="No primary set"
            disabled={selectedLocationUids.length === 0}
          />
        </fieldset>

        {error && (
          <Alert tone="danger" autoClose={false}>
            {error}
          </Alert>
        )}

        <div className="flex gap-2">
          <Button type="button" disabled={saving} loading={saving} loadingText="Saving…" onClick={handleSave}>
            Save locations
          </Button>
          <Button type="button" variant="ghost" disabled={saving} onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
}
