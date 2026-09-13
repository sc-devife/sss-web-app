"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ToolbarSelect } from "@/components/ui/ToolbarSelect";
import { DatePicker } from "@/components/ui/DatePicker";
import { MultiSelectSearch } from "@/components/ui/MultiSelectSearch";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Body } from "@/components/ui/Typography";
import { cn } from "@/lib/cn";
import { formatDisplayDate } from "@/lib/date";
import { getLeadPeriodRange, shiftLeadPeriodAnchor, type LeadPeriodType } from "@/lib/lead-period";
import type { Lead } from "@/lib/leads";
import type { EscapePoint } from "@/lib/escape-points";
import { LEAD_STATUS_ORDER } from "@/lib/lead-status";
import { FaPlus } from "react-icons/fa";
import { BsFillInboxesFill } from "react-icons/bs";
import { PiPencilSimple, PiArchiveBold } from "react-icons/pi";
import { IoChevronBack, IoChevronForward, IoFilterOutline, IoClose } from "react-icons/io5";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchLeads, archiveLead } from "@/features/leads/leadsThunks";
import { selectLeads, selectLeadsStatus, selectLeadsError, selectLeadsPage, selectLeadsTotalPages } from "@/features/leads/leadsSelectors";
import { LeadFormModal } from "@/components/leads/LeadFormModal";
import { FollowUpFormModal } from "@/components/followups/FollowUpFormModal";
import { fetchFollowUpCount } from "@/features/followups/followupsThunks";

// "All sources" for More Filters' Source multi-select — the DIRECT channels
// (LeadFormModal's own SOURCE_CHANNEL_OPTIONS) plus "agency" (Agency leads
// carry no sourceChannel at all — see LeadSpecifications.matchesSources).
const SOURCE_OPTIONS = [
  { value: "manual", label: "Manual" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "instagram", label: "Instagram" },
  { value: "youtube", label: "YouTube" },
  { value: "google_ads", label: "Google Ads" },
  { value: "agency", label: "Agency" },
];

interface MoreFilters {
  fromDate: string;
  toDate: string;
  sources: string[];
  archive: boolean;
}

const EMPTY_MORE_FILTERS: MoreFilters = { fromDate: "", toDate: "", sources: [], archive: false };

// Vertical popup, opened from the "More Filters" button — Dates
// between/Source/Archive all live in local draft state here and are only
// pushed up (via onSubmit) when Submit is clicked, so typing in a date field
// or ticking a source doesn't fire a request per keystroke/click. Same
// portal + fixed-position + outside-click-close mechanics as ToolbarSelect,
// just with a form instead of an option list.
function MoreFiltersPopover({
  applied,
  onSubmit,
}: {
  applied: MoreFilters;
  onSubmit: (next: MoreFilters) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<MoreFilters>(applied);
  const [pos, setPos] = useState<{ left: number; top: number }>({ left: 0, top: 0 });

  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const activeCount =
    (applied.fromDate || applied.toDate ? 1 : 0) + (applied.sources.length > 0 ? 1 : 0) + (applied.archive ? 1 : 0);

  function openPopover() {
    setDraft(applied);
    setOpen(true);
  }

  function close() {
    setOpen(false);
  }

  function handleSubmit() {
    onSubmit(draft);
    close();
  }

  // Resets the popup's own fields back to empty — a draft-only change, same
  // as any other edit in the popup, so it still takes a Submit to actually
  // clear the applied filters (no extra request fired just from clicking it).
  function handleClear() {
    setDraft(EMPTY_MORE_FILTERS);
  }

  useLayoutEffect(() => {
    if (!open) return;
    function position() {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const panelHeight = panelRef.current?.getBoundingClientRect().height ?? 360;
      let top = rect.bottom + 4;
      if (top + panelHeight > window.innerHeight - 8) top = Math.max(8, rect.top - panelHeight - 4);
      const left = Math.min(rect.left, window.innerWidth - 320 - 8);
      setPos({ left, top });
    }
    position();
    window.addEventListener("resize", position);
    window.addEventListener("scroll", position, true);
    return () => {
      window.removeEventListener("resize", position);
      window.removeEventListener("scroll", position, true);
    };
  }, [open, draft]);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e: MouseEvent) {
      const target = e.target as Node;
      if (panelRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      // DatePicker's calendar and MultiSelectSearch's option list are each
      // their own createPortal(..., document.body) — DOM siblings of this
      // panel, not descendants — so a click inside one of those (picking a
      // day, toggling a source) reads as "outside" by the check above alone
      // and would otherwise close this popup out from under them.
      if ((target as HTMLElement).closest?.("[data-floating-panel]")) return;
      close();
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        close();
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("mousedown", handlePointerDown, true);
    document.addEventListener("keydown", handleKey, true);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown, true);
      document.removeEventListener("keydown", handleKey, true);
    };
  }, [open]);

  return (
    <div>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => (open ? close() : openPopover())}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={cn(
          "flex h-7 items-center gap-1.5 rounded-full border border-transparent bg-[#f8f8fa] px-3 text-sm text-foreground transition-colors",
          "hover:border-primary/30 focus-visible:border-primary/40 focus-visible:outline-none",
        )}
      >
        <IoFilterOutline size={14} className="shrink-0 text-muted-foreground" />
        More Filters
        {activeCount > 0 && (
          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-semibold text-primary-foreground">
            {activeCount}
          </span>
        )}
      </button>

      {open &&
        createPortal(
          <div
            ref={panelRef}
            role="dialog"
            aria-label="More filters"
            style={{ position: "fixed", left: pos.left, top: pos.top, width: 320 }}
            className="z-50 flex flex-col gap-2 rounded border border-border bg-card p-4 text-card-foreground shadow-xl"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">More Filters</span>
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                title="Close"
                className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <IoClose size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-foreground">Dates between</span>
              <div className="grid grid-cols-2 gap-2">
                <DatePicker
                  label="From Date"
                  value={draft.fromDate}
                  onChange={(v) => setDraft((d) => ({ ...d, fromDate: v }))}
                  max={draft.toDate || undefined}
                />
                <DatePicker
                  label="To Date"
                  value={draft.toDate}
                  onChange={(v) => setDraft((d) => ({ ...d, toDate: v }))}
                  min={draft.fromDate || undefined}
                />
              </div>
            </div>

            <MultiSelectSearch
              label="Source"
              placeholder="Search source…"
              options={SOURCE_OPTIONS}
              value={draft.sources}
              onChange={(next) => setDraft((d) => ({ ...d, sources: next }))}
            />

            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-foreground">Archive</span>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 accent-primary"
                  checked={draft.archive}
                  onChange={(e) => setDraft((d) => ({ ...d, archive: e.target.checked }))}
                />
                Archive
              </label>
            </div>

            <div className="flex items-center gap-2">
              <Button type="button" variant="ghost" onClick={handleClear} className="w -full">
                Clear
              </Button>
              <Button type="button" onClick={handleSubmit} className="w-full">
                Submit
              </Button>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 300;

const PERIOD_TYPE_OPTIONS: { value: LeadPeriodType; label: string }[] = [
  { value: "month", label: "Month" },
  { value: "week", label: "Week" },
  { value: "day", label: "Day" },
  { value: "all", label: "All" },
];

// Small icon-only prev/next control matching ToolbarSelect's own compact
// pill styling (that trigger hand-rolls its button rather than using the
// shared Button component, so this does too, for the same "sits directly
// beside a ToolbarSelect" visual context — Button's smallest size is h-8,
// 4px taller, which would misalign the row).
function PeriodStepButton({
  direction,
  label,
  onClick,
  disabled,
}: {
  direction: "prev" | "next";
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-transparent bg-[#f8f8fa] text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground focus-visible:border-primary/40 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40"
    >
      {direction === "prev" ? <IoChevronBack size={14} /> : <IoChevronForward size={14} />}
    </button>
  );
}

// "Priority" isn't a real Lead.status value (it's the separate isPriority
// flag, shown as its own badge next to status elsewhere on this page) —
// sent to the backend as its own `priority=true` param (LeadSpecifications.
// isPriority), never as `status` (see statusQueryValue/priorityOnly below).
const STATUS_FILTER_OPTIONS = [
  { value: "", label: "Default" },
  { value: "Priority", label: "Priority" },
  ...LEAD_STATUS_ORDER.map((s) => ({ value: s, label: s })),
];

const TERMINAL_STATUSES = ["Unqualified", "Lost", "Duplicate", "Converted"];

// Section 15 (this rewrite): every filter — search, status, Month/Week/Day/
// All, and pagination — is sent to GET /leads and applied by the backend in
// one DB-level query (LeadsHelper.getAllLeads + LeadSpecifications). This
// component only ever holds *which* filters are selected; it never fetches
// "everything" and slices/searches/filters it in the browser. DataTable's
// serverSearch/serverPagination props (added alongside this) make it render
// `leads` as-is (already the correct page) instead of doing its own
// client-side search/pagination.
export function LeadsPanel({
  escapePoints,
}: {
  escapePoints: EscapePoint[];
}) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const leads = useAppSelector(selectLeads);
  const status = useAppSelector(selectLeadsStatus);
  const listError = useAppSelector(selectLeadsError);
  const serverPage = useAppSelector(selectLeadsPage);
  const totalPages = useAppSelector(selectLeadsTotalPages);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [escapePointFilter, setEscapePointFilter] = useState("");
  const [page, setPage] = useState(0);

  // "Priority" filters by isPriority, a different field entirely from
  // status — never sent as `status` to the backend.
  const statusQueryValue = statusFilter === "Priority" ? undefined : statusFilter || undefined;
  const priorityOnly = statusFilter === "Priority";

  // Debounced so each keystroke doesn't fire its own request — only the
  // value the user has settled on for a moment does.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [search]);

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(0);
  }

  function handleEscapePointChange(value: string) {
    setEscapePointFilter(value);
    setPage(0);
  }

  // More Filters (Dates between/Source/Archive) — only ever applied on
  // Submit (see MoreFiltersPopover), so this is the committed state the
  // fetch below reads, never the popup's own in-progress draft.
  const [moreFilters, setMoreFilters] = useState<MoreFilters>(EMPTY_MORE_FILTERS);

  function handleMoreFiltersSubmit(next: MoreFilters) {
    setMoreFilters(next);
    setPage(0);
  }

  function handleStatusChange(value: string) {
    setStatusFilter(value);
    setPage(0);
  }

  // Date-navigation filter (Month/Week/Day/All + prev/next), placed right
  // after Status in the toolbar. `periodAnchor` is any date within the
  // currently shown period; switching periodType resets it to today rather
  // than carrying over the previous period, per spec.
  const [periodType, setPeriodType] = useState<LeadPeriodType>("month");
  const [periodAnchor, setPeriodAnchor] = useState<Date>(() => new Date());
  const periodRange = getLeadPeriodRange(periodType, periodAnchor);

  function handlePeriodTypeChange(value: string) {
    setPeriodType(value as LeadPeriodType);
    setPeriodAnchor(new Date());
    setPage(0);
  }

  function stepPeriod(direction: 1 | -1) {
    setPeriodAnchor((anchor) => shiftLeadPeriodAnchor(periodType, anchor, direction));
    setPage(0);
  }

  // More Filters' own "Dates between" range, when set, overrides the Month/
  // Week/Day/All navigator above for this fetch rather than being "and"-ed
  // with it — both ultimately back the same from/to query params, so only
  // one can be in effect at a time.
  const effectiveFrom = moreFilters.fromDate || periodRange.from || undefined;
  const effectiveTo = moreFilters.toDate || periodRange.to || undefined;

  const [modalOpen, setModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [archivingUid, setArchivingUid] = useState<string | null>(null);
  const [followUpLead, setFollowUpLead] = useState<Lead | null>(null);

  useEffect(() => {
    dispatch(
      fetchLeads({
        search: debouncedSearch || undefined,
        status: statusQueryValue,
        priority: priorityOnly || undefined,
        from: effectiveFrom,
        to: effectiveTo,
        escapePointId: escapePointFilter || undefined,
        source: moreFilters.sources.length > 0 ? moreFilters.sources : undefined,
        archive: moreFilters.archive,
        page,
        size: PAGE_SIZE,
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    dispatch,
    debouncedSearch,
    statusQueryValue,
    priorityOnly,
    effectiveFrom,
    effectiveTo,
    escapePointFilter,
    moreFilters,
    page,
  ]);

  function refetchCurrentPage() {
    dispatch(
      fetchLeads({
        search: debouncedSearch || undefined,
        status: statusQueryValue,
        priority: priorityOnly || undefined,
        from: effectiveFrom,
        to: effectiveTo,
        escapePointId: escapePointFilter || undefined,
        source: moreFilters.sources.length > 0 ? moreFilters.sources : undefined,
        archive: moreFilters.archive,
        page,
        size: PAGE_SIZE,
      }),
    );
  }

  function openCreate() {
    setEditingLead(null);
    setModalOpen(true);
  }

  function openEdit(lead: Lead) {
    setEditingLead(lead);
    setModalOpen(true);
  }

  async function handleArchive(lead: Lead) {
    setArchivingUid(lead.uid);
    try {
      await dispatch(archiveLead(lead.uid));
      refetchCurrentPage();
    } finally {
      setArchivingUid(null);
    }
  }

  const escapePointNameByUid = new Map(escapePoints.map((d) => [d.uid, d.name]));

  // options[0] is ToolbarSelect's pinned "no filter" entry (searchable mode) —
  // always shown first, never excluded by the search box.
  const escapePointFilterOptions = [
    { value: "", label: "All" },
    ...escapePoints.map((d) => ({ value: d.uid, label: d.name })),
  ];

  const columns: DataTableColumn<Lead>[] = [
    {
      key: "name",
      header: "Name",
      render: (l) => l.name,
      filterValue: (l) => `${l.name} ${l.email} ${l.phone}`,
    },
    {
      key: "escapePoints",
      header: "Escape Point",
      render: (l) => {
        const names = l.escapePointIds
          .map((id) => escapePointNameByUid.get(id))
          .filter((name): name is string => !!name);
        if (names.length === 0) return "—";
        return (
          <div className="flex flex-wrap gap-1">
            {names.map((name) => (
              <Badge key={name} tone="neutral">{name}</Badge>
            ))}
          </div>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      render: (l) => (
        <div className="flex items-center gap-1">
          <Badge tone={TERMINAL_STATUSES.includes(l.status) ? (l.status === "Converted" ? "success" : "danger") : "neutral"}>
            {l.status}
          </Badge>
          {l.isPriority && <Badge tone="warning">Priority</Badge>}
        </div>
      ),
    },
    {
      key: "source",
      header: "Source",
      render: (l) => (l.sourceType === "AGENCY" ? "Agency" : l.sourceChannel ?? "—"),
    },
    {
      key: "followUpDueDate",
      header: "Follow-up due",
      render: (l) => {
        if (!l.followUpDueDate) return "—";
        const isOverdue = new Date(l.followUpDueDate) < new Date(new Date().toDateString());
        return (
          <span className={isOverdue ? "text-danger" : undefined}>{formatDisplayDate(l.followUpDueDate)}</span>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end gap-2">
        <Button className="self-start" onClick={openCreate}><FaPlus />Add lead</Button>
      </div>

      {status === "failed" ? (
        <Body className="text-danger">{listError}</Body>
      ) : (
        <DataTable
          columns={columns}
          rows={leads}
          rowKey={(l) => l.uid}
          searchPlaceholder="Search leads…"
          emptyMessage="No leads yet."
          onRowClick={(l) => router.push(`/leads/${l.uid}`)}
          getRowLabel={(l) => l.name}
          // Any of the filters below (search, status, month/week/day/all,
          // pagination) dispatch a fresh fetchLeads — status flips back to
          // "loading" (via leadsSlice's requestId guard, so a stale
          // in-flight request can't flip it back early) for every one of
          // them, so this alone covers all seven cases, not just first load.
          loading={status === "idle" || status === "loading"}
          rowMenuActions={(l) => [
            { key: "edit", label: "Edit", icon: PiPencilSimple, onSelect: () => openEdit(l) },
            { key: "add-followup", label: "Add Follow-up", icon: BsFillInboxesFill, onSelect: () => setFollowUpLead(l) },
            {
              key: "archive",
              label: "Archive",
              icon: PiArchiveBold,
              tone: "danger",
              disabled: archivingUid === l.uid,
              onSelect: () => handleArchive(l),
            },
          ]}
          serverSearch={{ value: search, onChange: handleSearchChange }}
          serverPagination={{ page: serverPage + 1, totalPages: Math.max(totalPages, 1), onPageChange: (p) => setPage(p - 1) }}
          toolbarExtra={
            <div className="flex items-center gap-2">
              <ToolbarSelect
                label="Escape Point"
                options={escapePointFilterOptions}
                value={escapePointFilter}
                onChange={handleEscapePointChange}
                placeholder="All"
                searchable
                searchPlaceholder="Search Escape Point…"
              />
              <ToolbarSelect label="Status" options={STATUS_FILTER_OPTIONS} value={statusFilter} onChange={handleStatusChange} placeholder="Default" />
              <div className="flex items-center gap-1">
                <PeriodStepButton direction="prev" label={`Previous ${periodType}`} onClick={() => stepPeriod(-1)} disabled={periodType === "all"} />
                <ToolbarSelect
                  label="Period"
                  hideLabel
                  options={PERIOD_TYPE_OPTIONS}
                  value={periodType}
                  onChange={handlePeriodTypeChange}
                />
                <PeriodStepButton direction="next" label={`Next ${periodType}`} onClick={() => stepPeriod(1)} disabled={periodType === "all"} />
              </div>
              {periodRange.label && <span className="text-sm text-muted-foreground">{periodRange.label}</span>}
              <MoreFiltersPopover applied={moreFilters} onSubmit={handleMoreFiltersSubmit} />
            </div>
          }
        />
      )}

      <LeadFormModal
        open={modalOpen}
        lead={editingLead}
        escapePoints={escapePoints}
        onClose={() => setModalOpen(false)}
        onSaved={() => {
          refetchCurrentPage();
          setModalOpen(false);
        }}
      />

      <FollowUpFormModal
        open={followUpLead != null}
        leadUid={followUpLead?.uid}
        onClose={() => setFollowUpLead(null)}
        onSaved={() => {
          setFollowUpLead(null);
          dispatch(fetchFollowUpCount());
        }}
      />
    </div>
  );
}
