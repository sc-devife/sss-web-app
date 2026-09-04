"use client";

import { useState, type FormEvent } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { createQuotationTemplate, updateQuotationTemplate } from "@/features/quotationTemplates/quotationTemplatesThunks";
import { selectQuotationTemplateSaveStatus } from "@/features/quotationTemplates/quotationTemplatesSelectors";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import type { QuotationTemplate } from "@/features/quotationTemplates/types";

// Same form for both flows — creating requires the HTML file up front,
// editing lets the file (and preview image) stay as-is if not replaced.
export function QuotationTemplateFormModal({ onClose, template }: { onClose: () => void; template?: QuotationTemplate }) {
  const dispatch = useAppDispatch();
  const saveStatus = useAppSelector(selectQuotationTemplateSaveStatus);
  const isEdit = template != null;

  const [name, setName] = useState(template?.name ?? "");
  const [description, setDescription] = useState(template?.description ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<File | null>(null);
  const [error, setError] = useState<string | undefined>();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    if (!isEdit && !file) {
      setError("Upload an HTML template file");
      return;
    }
    setError(undefined);
    try {
      if (isEdit) {
        await dispatch(updateQuotationTemplate({ uid: template.uid, name, description, file, previewImage })).unwrap();
      } else {
        await dispatch(createQuotationTemplate({ name, description, file: file as File, previewImage })).unwrap();
      }
      onClose();
    } catch (err) {
      setError(typeof err === "string" ? err : extractErrorMessage(err, `Failed to ${isEdit ? "update" : "create"} template`));
    }
  }

  const busy = saveStatus === "loading";

  return (
    <Modal open onClose={onClose} title={isEdit ? "Edit quotation template" : "Add quotation template"} className="max-w-lg">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <TextInput label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground" htmlFor="quotation-template-description">
            Description
          </label>
          <textarea
            id="quotation-template-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="rounded border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground" htmlFor="quotation-template-file">
            Template HTML file {isEdit ? "(leave blank to keep the current file)" : <span className="text-danger">*</span>}
          </label>
          <input
            id="quotation-template-file"
            type="file"
            accept=".html,text/html"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="text-sm text-foreground"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground" htmlFor="quotation-template-preview-image">
            Preview image {isEdit ? "(leave blank to keep the current image)" : "(optional)"}
          </label>
          <input
            id="quotation-template-preview-image"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => setPreviewImage(e.target.files?.[0] ?? null)}
            className="text-sm text-foreground"
          />
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="flex gap-2">
          <Button type="submit" disabled={busy}>{busy ? "Saving…" : isEdit ? "Save changes" : "Add template"}</Button>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </Modal>
  );
}
