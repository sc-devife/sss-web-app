"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Body, Caption } from "@/components/ui/Typography";
import { LoadingState } from "@/components/ui/Spinner";
import { QuotationPreviewModal } from "@/components/quotation/QuotationPreviewModal";
import { QuotationTemplateFormModal } from "@/components/organization/QuotationTemplateFormModal";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchQuotationTemplates, setDefaultQuotationTemplate } from "@/features/quotationTemplates/quotationTemplatesThunks";
import {
  selectQuotationTemplates,
  selectQuotationTemplatesStatus,
  selectQuotationTemplatesError,
} from "@/features/quotationTemplates/quotationTemplatesSelectors";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";

export function QuotationTemplatesPanel() {
  const dispatch = useAppDispatch();
  const templates = useAppSelector(selectQuotationTemplates);
  const status = useAppSelector(selectQuotationTemplatesStatus);
  const error = useAppSelector(selectQuotationTemplatesError);

  const [busy, setBusy] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | undefined>();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editUid, setEditUid] = useState<string | null>(null);
  const [previewUid, setPreviewUid] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchQuotationTemplates());
  }, [dispatch]);

  async function handleSelect(uid: string) {
    setBusy(uid);
    setFormError(undefined);
    try {
      await dispatch(setDefaultQuotationTemplate(uid)).unwrap();
    } catch (err) {
      setFormError(typeof err === "string" ? err : extractErrorMessage(err, "Failed to set default template"));
    } finally {
      setBusy(null);
    }
  }

  if (status === "loading" && templates.length === 0) {
    return <LoadingState label="Loading quotation templates…" />;
  }

  if (status === "failed") {
    return <Body className="text-danger">{error}</Body>;
  }

  const activeTemplates = templates.filter((t) => t.isActive);

  return (
    <div className="flex flex-col gap-3">
      {formError && <p className="text-sm text-danger">{formError}</p>}

      <div className="flex justify-end">
        <Button size="sm" onClick={() => setShowAddModal(true)}>Add template</Button>
      </div>

      {activeTemplates.length === 0 ? (
        <Card className="flex items-center justify-center py-8 text-center">
          <Body muted>No quotation templates yet. Add one to get started.</Body>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {activeTemplates.map((template) => (
            <Card key={template.uid} className="flex flex-col gap-3">
              <div className="h-32 overflow-hidden rounded bg-muted">
                {template.previewImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={template.previewImageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No preview image</div>
                )}
              </div>
              <div>
                <Body className="font-medium">{template.name}</Body>
                {template.description && <Caption>{template.description}</Caption>}
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="secondary" onClick={() => setPreviewUid(template.uid)}>Preview</Button>
                  <Button size="sm" variant="secondary" onClick={() => setEditUid(template.uid)}>Edit</Button>
                </div>
                {template.isDefault ? (
                  <Badge tone="success">Default</Badge>
                ) : (
                  <Button size="sm" variant="secondary" disabled={busy === template.uid} onClick={() => handleSelect(template.uid)}>
                    {busy === template.uid ? "Setting…" : "Set as default"}
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {showAddModal && <QuotationTemplateFormModal onClose={() => setShowAddModal(false)} />}

      {editUid && (
        <QuotationTemplateFormModal
          onClose={() => setEditUid(null)}
          template={templates.find((t) => t.uid === editUid)}
        />
      )}

      {previewUid && (
        <QuotationPreviewModal
          open
          onClose={() => setPreviewUid(null)}
          title="Template preview"
          src={`/api/quotation-templates/${previewUid}/preview-sample`}
        />
      )}
    </div>
  );
}
