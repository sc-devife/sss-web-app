import { Card } from "@/components/ui/Card";
import { Heading, Body } from "@/components/ui/Typography";
import { TemplatesPanel } from "@/components/organization/TemplatesPanel";
import { InvoiceTemplatesPanel } from "@/components/organization/InvoiceTemplatesPanel";
import { getMyOrganization } from "@/lib/organization";

export default async function Page() {
  const organization = await getMyOrganization();

  return (
    <Card variant="page" className="flex min-h-full flex-col gap-6">
      <div className="flex flex-col gap-4">
        <div>
          <Heading as="h2">Quote Templates</Heading>
          <Body muted>Pick the default design used when quotes are rendered for your customers.</Body>
        </div>
        <TemplatesPanel organization={organization} />
      </div>

      <div className="flex flex-col gap-4 border-t border-border pt-4">
        <div>
          <Heading as="h2">Invoice Templates</Heading>
          <Body muted>Pick the default design used when invoices are rendered for your customers.</Body>
        </div>
        <InvoiceTemplatesPanel organization={organization} />
      </div>
    </Card>
  );
}
