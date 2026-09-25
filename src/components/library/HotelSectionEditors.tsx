"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { FaRegTrashCan, FaXmark } from "react-icons/fa6";
import { FaCheck } from "react-icons/fa";
import { PiStar, PiStarFill } from "react-icons/pi";
import { Spinner } from "@/components/ui/Spinner";
import { resolveFileUrl } from "@/lib/files";
import { TbEditFilled } from "react-icons/tb";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { Select } from "@/components/ui/Select";
import { MultiSelectSearch } from "@/components/ui/MultiSelectSearch";
import { FileUpload } from "@/components/ui/FileUpload";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { FormAppearanceProvider } from "@/components/ui/FormAppearance";
import { Caption } from "@/components/ui/Typography";
import { clientApi } from "@/lib/axios/clientClient";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import { getOrgCurrency } from "@/lib/currency";
import type { Hotel } from "@/lib/hotels";
import type { MealPlan } from "@/lib/meal-plans";
import type { RoomType } from "@/lib/room-types";
import type { Amenity } from "@/lib/amenities";

// The Edit Hotel page only carries the hotel's own details. Room types (with
// prices), meal plans, amenities and rules & policies are edited right on the
// hotel's view page, one section at a time - each section card gets a pencil
// that swaps its content for one of the editors below.

// Card with a title, an edit pencil, and either its content or its editor.
export function EditableSection({
  title,
  editing,
  onEdit,
  editor,
  children,
  className = "",
}: {
  title: string;
  editing: boolean;
  onEdit: () => void;
  editor: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative flex flex-col rounded-2xl border border-border bg-card p-4 ${editing ? "min-h-52" : "h-52"} ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <Caption className="font-semibold">{title}</Caption>
        {!editing && (
          <button
            type="button"
            onClick={onEdit}
            aria-label={`Edit ${title}`}
            title={`Edit ${title}`}
            className="flex h-7 w-7 items-center justify-center text-muted-foreground transition-colors hover:text-primary"
          >
            <TbEditFilled size={17} />
          </button>
        )}
      </div>
      <div className={`mt-2 min-h-0 flex-1 ${editing ? "" : "overflow-y-auto pr-1"}`}>{editing ? editor : children}</div>
    </div>
  );
}

// Shared save: PUT the changed fields to the hotel, then refresh the page.
function useSaveHotel(hotel: Hotel, onDone: () => void) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>();

  async function save(payload: Record<string, unknown>, successMessage: string) {
    setSaving(true);
    setError(undefined);
    try {
      await clientApi.put(`/library/hotels/${hotel.uid}`, payload);
      toast.success(successMessage);
      router.refresh();
      onDone();
    } catch (err) {
      setError(extractErrorMessage(err, "Failed to save"));
    } finally {
      setSaving(false);
    }
  }
  return { saving, error, save };
}

// Cancel / save as two icon buttons pinned to the top-right corner of the edit card
// (the card is `relative`). `label` is the tooltip for the save button.
export function EditIconActions({
  saving,
  onCancel,
  onSave,
  label,
  saveType = "button",
  saveDisabled = false,
}: {
  saving: boolean;
  onCancel: () => void;
  onSave?: () => void;
  label: string;
  saveType?: "button" | "submit";
  saveDisabled?: boolean;
}) {
  return (
    <div className="absolute right-3 top-3 z-10 flex items-center gap-1">
      <button
        type="button"
        onClick={onCancel}
        disabled={saving}
        aria-label="Cancel"
        title="Cancel"
        className="flex h-7 w-7 items-center justify-center text-muted-foreground transition-colors hover:text-danger disabled:opacity-50"
      >
        <FaXmark size={17} />
      </button>
      <button
        type={saveType}
        onClick={onSave}
        disabled={saving || saveDisabled}
        aria-label={label}
        title={label}
        className="flex h-7 w-7 items-center justify-center text-primary transition-colors hover:text-primary/70 disabled:opacity-40"
      >
        {saving ? <Spinner size="sm" tone="current" /> : <FaCheck size={16} />}
      </button>
    </div>
  );
}

function EditorActions(props: { saving: boolean; onCancel: () => void; onSave: () => void; label: string }) {
  return <EditIconActions {...props} />;
}

// ---------------------------------------------------------------- meal plans

export function MealPlansEditor({ hotel, onDone }: { hotel: Hotel; onDone: () => void }) {
  const { saving, error, save } = useSaveHotel(hotel, onDone);
  const [options, setOptions] = useState<MealPlan[]>([]);
  const [selected, setSelected] = useState<string[]>((hotel.mealPlans ?? []).map((m) => m.uid));
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ code: "", name: "", description: "" });
  const [savingNew, setSavingNew] = useState(false);
  const [newError, setNewError] = useState<string | undefined>();

  useEffect(() => {
    clientApi.get<MealPlan[]>(`/library/meal-plans?hotelId=${hotel.uid}`).then((res) => setOptions(res.data)).catch(() => {});
  }, [hotel.uid]);

  async function addMealPlan() {
    if (!draft.code.trim() || !draft.name.trim()) return;
    setSavingNew(true);
    setNewError(undefined);
    try {
      const created = await clientApi.post<MealPlan>("/library/meal-plans", { ...draft, hotelId: hotel.uid }).then((res) => res.data);
      setOptions((o) => [...o, created]);
      setSelected((s) => [...s, created.uid]);
      setDraft({ code: "", name: "", description: "" });
      setAdding(false);
    } catch (err) {
      setNewError(extractErrorMessage(err, "Failed to add meal plan"));
    } finally {
      setSavingNew(false);
    }
  }

  return (
    <FormAppearanceProvider value="pill">
      <div className="flex flex-col gap-3">
        <MultiSelectSearch
          label="Meal plans"
          placeholder="Search available meal plans"
          options={options.map((m) => ({ value: m.uid, label: m.custom ? `${m.name} (custom)` : m.name }))}
          value={selected}
          onChange={setSelected}
        />
        {!adding ? (
          <button type="button" onClick={() => setAdding(true)} className="self-start text-sm text-primary hover:underline">
            + Add custom meal plan
          </button>
        ) : (
          <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">New custom meal plan <span className="font-normal text-muted-foreground">(this hotel only)</span></span>
              <button type="button" onClick={() => setAdding(false)} className="text-sm text-muted-foreground hover:text-foreground">
                Cancel
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <TextInput label="Code" placeholder="e.g. CP" value={draft.code} onChange={(e) => setDraft((d) => ({ ...d, code: e.target.value }))} required />
              <TextInput label="Name" placeholder="e.g. Continental Plan" value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} required />
              <TextInput label="Description" value={draft.description} onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))} />
            </div>
            {newError && <p className="text-sm text-danger">{newError}</p>}
            <Button type="button" size="sm" className="self-start" disabled={savingNew || !draft.code.trim() || !draft.name.trim()} loading={savingNew} loadingText="Saving…" onClick={addMealPlan}>
              Add meal plan
            </Button>
          </div>
        )}
        {error && <p className="text-sm text-danger">{error}</p>}
        <EditorActions saving={saving} onCancel={onDone} onSave={() => save({ mealPlanIds: selected }, "Meal plans updated.")} label="Save meal plans" />
      </div>
    </FormAppearanceProvider>
  );
}

// ---------------------------------------------------------------- room types

type PricingRow = { roomTypeId: string; price: string };

export function RoomTypesEditor({ hotel, onDone }: { hotel: Hotel; onDone: () => void }) {
  const { saving, error, save } = useSaveHotel(hotel, onDone);
  const [options, setOptions] = useState<RoomType[]>([]);
  const [rows, setRows] = useState<PricingRow[]>(
    (hotel.roomTypes ?? []).map((r) => ({ roomTypeId: r.roomTypeId, price: r.price != null ? String(r.price) : "" })),
  );
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ name: "", description: "" });
  const [savingNew, setSavingNew] = useState(false);
  const [newError, setNewError] = useState<string | undefined>();
  // Prices are entered in the currency chosen on the hotel itself.
  const currency = hotel.priceCurrency || getOrgCurrency();

  useEffect(() => {
    clientApi.get<RoomType[]>("/library/room-types").then((res) => setOptions(res.data)).catch(() => {});
  }, []);

  async function addRoomType() {
    if (!draft.name.trim()) return;
    setSavingNew(true);
    setNewError(undefined);
    try {
      const created = await clientApi.post<RoomType>("/library/room-types", draft).then((res) => res.data);
      setOptions((o) => [...o, created]);
      // Put it straight into a priced row, same "select it right away" as elsewhere.
      setRows((r) => [...r, { roomTypeId: created.uid, price: "" }]);
      setDraft({ name: "", description: "" });
      setAdding(false);
    } catch (err) {
      setNewError(extractErrorMessage(err, "Failed to add room type"));
    } finally {
      setSavingNew(false);
    }
  }

  return (
    <FormAppearanceProvider value="pill">
      <div className="flex flex-col gap-3">
        {rows.length > 0 && (
          <div className="flex flex-col gap-2">
            {rows.map((row, index) => {
              const takenElsewhere = new Set(rows.filter((_, i) => i !== index).map((r) => r.roomTypeId));
              const rowOptions = options.filter((rt) => rt.uid === row.roomTypeId || !takenElsewhere.has(rt.uid));
              return (
                <div key={index} className="grid grid-cols-1 items-end gap-3 sm:grid-cols-[1fr_1fr_auto]">
                  <Select
                    label="Room Type"
                    options={rowOptions.map((rt) => ({ value: rt.uid, label: rt.name }))}
                    value={row.roomTypeId}
                    onChange={(e) => setRows((rs) => rs.map((r, i) => (i === index ? { ...r, roomTypeId: e.target.value } : r)))}
                    placeholder="Select a room type"
                    searchable
                  />
                  <TextInput
                    label={`Price / Night (${currency})`}
                    type="number"
                    min={0}
                    step="any"
                    placeholder="e.g. 8000"
                    value={row.price}
                    onChange={(e) => setRows((rs) => rs.map((r, i) => (i === index ? { ...r, price: e.target.value } : r)))}
                  />
                  <button
                    type="button"
                    onClick={() => setRows((rs) => rs.filter((_, i) => i !== index))}
                    className="mb-1 shrink-0 rounded-full p-2 text-muted-foreground hover:bg-danger/10 hover:text-danger"
                    aria-label="Remove room type"
                    title="Remove room type"
                  >
                    <FaRegTrashCan size={15} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <button type="button" onClick={() => setRows((r) => [...r, { roomTypeId: "", price: "" }])} className="text-sm text-primary hover:underline">
            + Add Room Type
          </button>
          {!adding && (
            <button type="button" onClick={() => setAdding(true)} className="text-sm text-primary hover:underline">
              + Create a new room type
            </button>
          )}
        </div>

        {adding && (
          <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">New room type</span>
              <button type="button" onClick={() => setAdding(false)} className="text-sm text-muted-foreground hover:text-foreground">
                Cancel
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <TextInput label="Name" placeholder="e.g. Deluxe Room" value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} required />
              <TextInput label="Description" value={draft.description} onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))} />
            </div>
            {newError && <p className="text-sm text-danger">{newError}</p>}
            <Button type="button" size="sm" className="self-start" disabled={savingNew || !draft.name.trim()} loading={savingNew} loadingText="Saving…" onClick={addRoomType}>
              Add room type
            </Button>
          </div>
        )}

        {error && <p className="text-sm text-danger">{error}</p>}
        <EditorActions
          saving={saving}
          onCancel={onDone}
          onSave={() =>
            save(
              {
                roomTypePricing: rows
                  .filter((r) => r.roomTypeId)
                  .map((r) => ({ roomTypeId: r.roomTypeId, price: r.price ? Number(r.price) : null })),
              },
              "Room types updated.",
            )
          }
          label="Save room types"
        />
      </div>
    </FormAppearanceProvider>
  );
}

// ---------------------------------------------------------------- amenities

export function AmenitiesEditor({ hotel, onDone }: { hotel: Hotel; onDone: () => void }) {
  const { saving, error, save } = useSaveHotel(hotel, onDone);
  const [options, setOptions] = useState<Amenity[]>([]);
  const [selected, setSelected] = useState<string[]>(hotel.amenities ?? []);

  useEffect(() => {
    clientApi.get<Amenity[]>("/library/amenities").then((res) => setOptions(res.data)).catch(() => {});
  }, []);

  // Custom amenity: kept on this hotel only, never added to the amenity library.
  async function createAmenity(name: string) {
    const trimmed = name.trim();
    return { value: trimmed, label: `${trimmed} (custom)` };
  }

  return (
    <FormAppearanceProvider value="pill">
      <div className="flex flex-col gap-3">
        <MultiSelectSearch
          label="Amenities"
          placeholder="Search amenities…"
          options={[
            ...options.map((a) => ({ value: a.name, label: a.name })),
            ...selected.filter((n) => !options.some((a) => a.name === n)).map((n) => ({ value: n, label: `${n} (custom)` })),
          ]}
          value={selected}
          onChange={setSelected}
          onCreateOption={createAmenity}
        />
        {error && <p className="text-sm text-danger">{error}</p>}
        <EditorActions saving={saving} onCancel={onDone} onSave={() => save({ amenities: selected }, "Amenities updated.")} label="Save amenities" />
      </div>
    </FormAppearanceProvider>
  );
}

// ---------------------------------------------------------------- rules & policies

export function RulesEditor({ hotel, onDone }: { hotel: Hotel; onDone: () => void }) {
  const { saving, error, save } = useSaveHotel(hotel, onDone);
  const [html, setHtml] = useState(hotel.rulesAndPolicies ?? "");

  return (
    <div className="flex flex-col gap-3">
      <RichTextEditor label="" value={html} onChange={setHtml} placeholder="Check-in rules, cancellation policy, house rules…" />
      {error && <p className="text-sm text-danger">{error}</p>}
      <EditorActions saving={saving} onCancel={onDone} onSave={() => save({ rulesAndPolicies: html }, "Rules and policies updated.")} label="Save rules" />
    </div>
  );
}

// ---------------------------------------------------------------- images

export function ImagesEditor({
  hotel,
  priorityImage,
  settingPriorityFor,
  priorityError,
  onMakePriority,
  onDone,
}: {
  hotel: Hotel;
  priorityImage: string | null;
  settingPriorityFor: string | null;
  priorityError?: string;
  onMakePriority: (url: string) => void;
  onDone: () => void;
}) {
  const { saving, error, save } = useSaveHotel(hotel, onDone);
  const [images, setImages] = useState<string[]>(hotel.images ?? []);

  return (
    <div className="flex flex-col gap-3">
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-6">
          {images.map((url) => {
            const isPriority = url === priorityImage;
            const isSettingThis = settingPriorityFor === url;
            const saved = (hotel.images ?? []).includes(url);
            return (
              <div key={url} className="group relative aspect-square overflow-hidden rounded-lg border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={resolveFileUrl(url)} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setImages((prev) => prev.filter((u) => u !== url))}
                  aria-label="Remove image"
                  title="Remove image"
                  className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-danger"
                >
                  <FaRegTrashCan size={12} />
                </button>
                {isPriority ? (
                  <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground shadow">
                    <PiStarFill size={11} />
                    Priority
                  </span>
                ) : (
                  saved && (
                    <button
                      type="button"
                      onClick={() => onMakePriority(url)}
                      disabled={settingPriorityFor !== null}
                      className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-black/60 py-1.5 text-[11px] font-medium text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 disabled:cursor-not-allowed"
                    >
                      {isSettingThis ? <Spinner size="sm" tone="current" /> : (<><PiStar size={12} />Make Priority</>)}
                    </button>
                  )
                )}
              </div>
            );
          })}
        </div>
      )}
      {priorityError && <p className="text-sm text-danger">{priorityError}</p>}
      <FileUpload label={images.length > 0 ? "Add more images" : "Images"} value={[]} onChange={(added) => setImages((prev) => [...prev, ...added])} />
      {error && <p className="text-sm text-danger">{error}</p>}
      <EditorActions saving={saving} onCancel={onDone} onSave={() => save({ images }, "Images updated.")} label="Save images" />
    </div>
  );
}
