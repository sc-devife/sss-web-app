"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Body } from "@/components/ui/Typography";
import { Badge } from "@/components/ui/Badge";

interface RowResult {
  rowNumber: number;
  data: Record<string, string>;
  errors: string[];
}

interface PreviewResponse {
  entityType: string;
  totalRows: number;
  validRowCount: number;
  rows: RowResult[];
}

interface CommitResponse {
  committed: number;
  failed: number;
  failedRows: RowResult[];
}

// One generic upload -> validate -> show row errors -> confirm -> commit flow
// (Section 10), reused by every Library screen — only entityType and label change.
export function BulkImportModal({ entityType, label, onClose }: { entityType: string; label: string; onClose: () => void }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [result, setResult] = useState<CommitResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  async function handlePreview() {
    if (!file) return;
    setLoading(true);
    setError(undefined);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/bulk-import/${entityType}/preview`, { method: "POST", body: formData });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.message ?? "Failed to preview the file");
      setPreview(body);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to preview the file");
    } finally {
      setLoading(false);
    }
  }

  async function handleCommit() {
    if (!file) return;
    setLoading(true);
    setError(undefined);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/bulk-import/${entityType}/commit`, { method: "POST", body: formData });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.message ?? "Failed to import the file");
      setResult(body);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import the file");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(undefined);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <Modal open onClose={onClose} title={`Bulk import ${label}`} className="max-w-2xl">
      <div className="flex flex-col gap-4">
        {!result && (
          <>
            <div className="flex items-center gap-3">
              <a
                href={`/api/bulk-import/${entityType}/template`}
                className="text-sm text-primary hover:underline"
              >
                Download CSV template
              </a>
            </div>

            <div className="flex items-center gap-3">
              <input
                ref={inputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => { setFile(e.target.files?.[0] ?? null); setPreview(null); }}
                className="text-sm text-foreground"
              />
              <Button onClick={handlePreview} disabled={!file || loading} size="sm">
                {loading ? "Checking…" : "Preview"}
              </Button>
            </div>

            {error && <p className="text-sm text-danger">{error}</p>}

            {preview && (
              <div className="flex flex-col gap-2">
                <Body>
                  {preview.validRowCount} of {preview.totalRows} row{preview.totalRows === 1 ? "" : "s"} look valid.
                </Body>
                <div className="max-h-64 overflow-y-auto rounded border border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/40">
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">Row</th>
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">Status</th>
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">Errors</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.rows.map((r) => (
                        <tr key={r.rowNumber} className="border-b border-border last:border-0">
                          <td className="px-3 py-2">{r.rowNumber}</td>
                          <td className="px-3 py-2">
                            {r.errors.length === 0 ? <Badge tone="success">Valid</Badge> : <Badge tone="danger">Invalid</Badge>}
                          </td>
                          <td className="px-3 py-2 text-danger">{r.errors.join("; ")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleCommit} disabled={loading || preview.validRowCount === 0}>
                    {loading ? "Importing…" : `Import ${preview.validRowCount} valid row${preview.validRowCount === 1 ? "" : "s"}`}
                  </Button>
                  <Button variant="ghost" onClick={reset}>Choose a different file</Button>
                </div>
              </div>
            )}
          </>
        )}

        {result && (
          <div className="flex flex-col gap-3">
            <Body>
              Imported {result.committed} row{result.committed === 1 ? "" : "s"}
              {result.failed > 0 ? `, ${result.failed} failed` : ""}.
            </Body>
            {result.failedRows.length > 0 && (
              <div className="max-h-64 overflow-y-auto rounded border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">Row</th>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">Errors</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.failedRows.map((r) => (
                      <tr key={r.rowNumber} className="border-b border-border last:border-0">
                        <td className="px-3 py-2">{r.rowNumber}</td>
                        <td className="px-3 py-2 text-danger">{r.errors.join("; ")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <Button onClick={onClose}>Done</Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
