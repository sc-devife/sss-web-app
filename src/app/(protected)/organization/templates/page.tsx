import { Heading, Body, Caption } from "@/components/ui/Typography";
import { TemplatesPanel } from "@/components/organization/TemplatesPanel";
import { InvoiceTemplatesPanel } from "@/components/organization/InvoiceTemplatesPanel";
import { getQuoteTemplates } from "@/lib/quote-templates";
import { getInvoiceTemplates } from "@/lib/invoice-templates";
import { getMyOrganization } from "@/lib/organization";

export default async function Page() {
  const [quoteTemplates, invoiceTemplates, organization] = await Promise.all([
    getQuoteTemplates(),
    getInvoiceTemplates(),
    getMyOrganization(),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-5">
        <Heading as="h2">Quote Templates</Heading>
        <Body muted>Pick the default design used when quotes are rendered for your customers.</Body>
        <TemplatesPanel templates={quoteTemplates} organization={organization} />
      </div>

      <div className="flex flex-col gap-5 border-t border-border pt-8">
        <div>
          <Caption>Invoice Templates</Caption>
          <Body muted>Pick the default design used when invoices are rendered for your customers.</Body>
        </div>
        <InvoiceTemplatesPanel templates={invoiceTemplates} organization={organization} />
      </div>
    </div>
  );
}
