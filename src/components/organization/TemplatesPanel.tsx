"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Body, Caption } from "@/components/ui/Typography";
import type { QuoteTemplate } from "@/lib/quote-templates";
import type { Organization } from "@/lib/organization";

export function TemplatesPanel({ templates, organization }: { templates: QuoteTemplate[]; organization: Organization }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | undefined>();

  async function handleSelect(templateId: string) {
    setBusy(templateId);
    setError(undefined);
    try {
      const res = await fetch("/api/organizations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: organization.uid, quote_template_id: templateId }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? "Failed to set default template");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to set default template");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => {
          const isDefault = organization.quote_template_id === template.id;
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
