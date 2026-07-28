import { Heading, Body } from "@/components/ui/Typography";
import { TemplatesPanel } from "@/components/organization/TemplatesPanel";
import { getQuoteTemplates } from "@/lib/quote-templates";
import { getMyOrganization } from "@/lib/organization";

export default async function Page() {
  const [templates, organization] = await Promise.all([getQuoteTemplates(), getMyOrganization()]);

  return (
    <div className="flex flex-col gap-5">
      <Heading as="h2">Quote Templates</Heading>
      <Body muted>Pick the default design used when quotes are rendered for your customers. Invoice templates come later.</Body>
      <TemplatesPanel templates={templates} organization={organization} />
    </div>
  );
}
