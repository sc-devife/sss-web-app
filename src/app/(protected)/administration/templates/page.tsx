import { Card } from "@/components/ui/Card";
import { Heading, Body } from "@/components/ui/Typography";
import { QuotationTemplatesPanel } from "@/components/organization/QuotationTemplatesPanel";

export default async function Page() {
  return (
    <Card variant="page" className="flex min-h-full flex-col gap-6">
      <div className="flex flex-col gap-4">
        <div>
          <Heading as="h2">Quotation Templates</Heading>
          <Body muted>Manage HTML quotation templates and pick the default used for Escape quotation previews.</Body>
        </div>
        <QuotationTemplatesPanel />
      </div>
    </Card>
  );
}
