"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Body, Caption } from "@/components/ui/Typography";
import { LoadingState } from "@/components/ui/Spinner";
import type { Organization } from "@/lib/organization";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchQuoteTemplates, setDefaultQuoteTemplate } from "@/features/quoteTemplates/quoteTemplatesThunks";
import { selectQuoteTemplates, selectQuoteTemplatesStatus, selectQuoteTemplatesError } from "@/features/quoteTemplates/quoteTemplatesSelectors";

export function TemplatesPanel({ organization }: { organization: Organization }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const templates = useAppSelector(selectQuoteTemplates);
  const status = useAppSelector(selectQuoteTemplatesStatus);
  const error = useAppSelector(selectQuoteTemplatesError);

  const [busy, setBusy] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | undefined>();

  useEffect(() => {
    dispatch(fetchQuoteTemplates());
  }, [dispatch]);

  async function handleSelect(templateId: string) {
    setBusy(templateId);
    setFormError(undefined);
    try {
      await dispatch(setDefaultQuoteTemplate({ templateId })).unwrap();
      // Organization isn't Redux-managed yet — router.refresh() re-runs the
      // Server Component to pick up the new quote_template_id.
      router.refresh();
    } catch (err) {
      setFormError(typeof err === "string" ? err : extractErrorMessage(err, "Failed to set default template"));
    } finally {
      setBusy(null);
    }
  }

  if (status === "loading" && templates.length === 0) {
    return <LoadingState label="Loading templates…" />;
  }

  if (status === "failed") {
    return <Body className="text-danger">{error}</Body>;
  }

  return (
    <div className="flex flex-col gap-3">
      {formError && <p className="text-sm text-danger">{formError}</p>}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => {
          const isDefault = organization.settings?.quote_template_id === template.id;
          return (
            <Card key={template.id} className="flex flex-col gap-3">
              <div className="h-24 rounded" style={{ backgroundColor: template.accentColor }} />
              <div>
                <Body className="font-medium">{template.name}</Body>
                <Caption>{template.description}</Caption>
              </div>
              <div className="flex items-center justify-between">
                <Badge tone="neutral">{template.layoutFamily}</Badge>
                {isDefault ? (
                  <Badge tone="success">Default</Badge>
                ) : (
                  <Button size="sm" variant="secondary" disabled={busy === template.id} onClick={() => handleSelect(template.id)}>
                    {busy === template.id ? "Setting…" : "Set as default"}
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
