"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { PiFileTextFill, PiTrashFill, PiPlusFill, PiPencilSimpleFill } from "react-icons/pi";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LoadingState, Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/cn";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchQuotesForItinerary, createQuote, renameQuote, deleteQuote } from "@/features/quotes/quotesThunks";
import { selectQuotesForItinerary, selectQuotesStatus, selectQuotesError } from "@/features/quotes/quotesSelectors";
import type { Deal } from "@/lib/deals";

// Lists the Quote records for whichever itinerary is currently selected in
// the sibling ItineraryManagementCard — same row-list visual language, one
// row per quote with an editable name (double-click to rename) and a delete
// action. The full pricing tool (preview/accept/revise/compute pricing,
// template override) stays in QuotesPanel on the center Planning tab; this
// is a lightweight companion list, not a replacement for it.
export function DocumentsCard({
  selectedItineraryUid = null,
  bare = false,
}: {
  /** Kept for call-site compatibility with the parent's Deal-aware wiring —
   * unused now that accept/preview live on the center Planning tab only. */
  deal?: Deal | null;
  escapeUid?: string;
  selectedItineraryUid?: string | null;
  bare?: boolean;
}) {
  const dispatch = useAppDispatch();
  const quotes = useAppSelector((s) => (selectedItineraryUid ? selectQuotesForItinerary(s, selectedItineraryUid) : []));
  const quotesStatus = useAppSelector((s) => (selectedItineraryUid ? selectQuotesStatus(s, selectedItineraryUid) : "idle"));
  const quotesError = useAppSelector((s) => (selectedItineraryUid ? selectQuotesError(s, selectedItineraryUid) : null));

  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | undefined>();
  const [rowBusyUid, setRowBusyUid] = useState<string | null>(null);

  const [editingUid, setEditingUid] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [renamingUid, setRenamingUid] = useState<string | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selectedItineraryUid) dispatch(fetchQuotesForItinerary(selectedItineraryUid));
  }, [dispatch, selectedItineraryUid]);

  function refresh() {
    if (selectedItineraryUid) dispatch(fetchQuotesForItinerary(selectedItineraryUid));
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!selectedItineraryUid) return;
    setSaving(true);
    setFormError(undefined);
    try {
      // A blank name is fine — the backend auto-generates one from the
      // itinerary's name and the quote count for that itinerary.
      await dispatch(createQuote({ itineraryUid: selectedItineraryUid, name: name.trim(), validUntil: null })).unwrap();
      refresh();
      setName("");
    } catch (err) {
      setFormError(typeof err === "string" ? err : extractErrorMessage(err, "Failed to create quote"));
    } finally {
      setSaving(false);
    }
  }

  function startEditing(uid: string, currentName: string) {
    setEditingUid(uid);
    setEditValue(currentName);
    requestAnimationFrame(() => editInputRef.current?.select());
  }

  async function commitEdit() {
    const uid = editingUid;
    const trimmed = editValue.trim();
    setEditingUid(null);
    if (!uid || !selectedItineraryUid) return;
    const original = quotes.find((q) => q.uid === uid)?.name;
    if (!trimmed || trimmed === original) return;
    setRenamingUid(uid);
    try {
      await dispatch(renameQuote({ uid, itineraryUid: selectedItineraryUid, name: trimmed }));
      refresh();
    } finally {
      setRenamingUid(null);
    }
  }

  function handleEditKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    } else if (e.key === "Escape") {
      setEditingUid(null);
    }
  }

  async function handleDelete(uid: string) {
    if (!selectedItineraryUid) return;
    setRowBusyUid(uid);
    try {
      await dispatch(deleteQuote({ uid, itineraryUid: selectedItineraryUid }));
      refresh();
    } finally {
      setRowBusyUid(null);
    }
  }

  const sortedQuotes = quotes.slice().sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));

  const body = (
    <>
      <div className="relative flex h-full min-h-0 flex-col rounded-xl border border-border pt-4 px-2.5 pb-2.5">
        <span className="absolute -top-2.5 left-1/2 flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap bg-card px-2 text-xs font-semibold text-foreground">
          <PiFileTextFill className="h-3.5 w-3.5 shrink-0" />
          Quotes
        </span>

        {!selectedItineraryUid ? (
          <p className="py-2 text-center text-xs text-muted-foreground">Select an itinerary to view its quotes.</p>
        ) : quotesStatus === "loading" && quotes.length === 0 ? (
          <LoadingState label="Loading quotes…" />
        ) : quotesStatus === "failed" ? (
          <p className="text-xs text-danger">{quotesError}</p>
        ) : (
          <div className="show-scrollbar flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto pr-0.5">
            {sortedQuotes.length === 0 && <p className="py-1 text-xs text-muted-foreground">No quotes yet.</p>}
            {sortedQuotes.map((quote, index) => {
              const isEditing = editingUid === quote.uid;
              const isRenaming = renamingUid === quote.uid;
              const isRowBusy = rowBusyUid === quote.uid;
              return (
                <div
                  key={quote.uid}
                  className={cn(
                    "group flex items-center gap-2 rounded-lg border border-border/60 bg-card px-2.5 py-2 shadow-sm transition-all duration-150",
                    "hover:-translate-y-px hover:border-primary/40 hover:shadow-md",
                    isEditing && "border-primary/50 ring-1 ring-primary/20",
                  )}
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center text-[11px] font-semibold text-muted-foreground">
                    {index + 1}
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    {isEditing ? (
                      <input
                        ref={editInputRef}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={commitEdit}
                        onKeyDown={handleEditKeyDown}
                        autoFocus
                        className="min-w-0 rounded border border-primary/40 bg-background px-1.5 py-0.5 text-xs font-medium text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                      />
                    ) : (
                      <div
                        onDoubleClick={() => startEditing(quote.uid, quote.name ?? `Quote ${quote.version}`)}
                        title="Double-click to rename"
                        className="flex items-center gap-1.5"
                      >
                        <span className="truncate text-xs font-medium text-foreground">{quote.name ?? `Quote ${quote.version}`}</span>
                        <Badge tone={quote.status === "accepted" ? "success" : "neutral"}>{quote.status}</Badge>
                      </div>
                    )}
                    <span className="truncate text-[11px] text-muted-foreground">
                      {quote.totalUsd != null ? `$${quote.totalUsd.toFixed(2)} USD` : "Not priced yet"}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-0.5 opacity-70 transition-opacity group-hover:opacity-100">
                    {!isEditing && (
                      isRenaming ? (
                        <span aria-label="Renaming quote" title="Renaming…" className="flex h-7 w-7 items-center justify-center">
                          <Spinner size="sm" />
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => startEditing(quote.uid, quote.name ?? `Quote ${quote.version}`)}
                          aria-label="Rename quote"
                          title="Rename"
                          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                        >
                          <PiPencilSimpleFill className="h-3.5 w-3.5" />
                        </button>
                      )
                    )}
                    {isRowBusy ? (
                      <span aria-label="Deleting quote" title="Deleting…" className="flex h-7 w-7 items-center justify-center">
                        <Spinner size="sm" />
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={isRowBusy}
                        onClick={() => handleDelete(quote.uid)}
                        aria-label="Delete quote"
                        title="Delete"
                        className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-danger/10 hover:text-danger disabled:opacity-50"
                      >
                        <PiTrashFill className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {selectedItineraryUid && (
          <form
            onSubmit={handleCreate}
            className="mt-1.5 flex shrink-0 items-center gap-2 rounded-lg border border-dashed border-border/70 bg-card px-2.5 py-2 transition-colors duration-150 focus-within:border-primary/50 hover:border-primary/40"
          >
            <span className="flex h-5 w-5 shrink-0 items-center justify-center text-[11px] font-semibold text-muted-foreground/50">
              {sortedQuotes.length + 1}
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="New quote name (leave blank to auto-name)"
              className="min-w-0 flex-1 bg-transparent text-xs font-medium text-foreground placeholder:text-muted-foreground placeholder:font-normal focus-visible:outline-none"
            />
            <div className="flex shrink-0 items-center">
              {saving ? (
                <span aria-label="Adding quote" title="Adding…" className="flex h-7 w-7 items-center justify-center">
                  <Spinner size="sm" />
                </span>
              ) : (
                <button
                  type="submit"
                  disabled={saving}
                  aria-label="Add quote"
                  title="Add quote"
                  className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
                >
                  <PiPlusFill className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </form>
        )}
        {formError && <p className="pt-1.5 text-xs text-danger">{formError}</p>}
      </div>
    </>
  );

  return bare ? (
    <div className="flex h-full min-h-0 flex-col gap-2">{body}</div>
  ) : (
    <Card variant="elevated" className="flex flex-col gap-2 p-3">
      {body}
    </Card>
  );
}
