import { Card } from "@/components/ui/Card";
import { LeadSourcesPanel } from "@/components/leadSources/LeadSourcesPanel";

export default function LeadSourcesPage() {
  return (
    <Card variant="page" className="min-h-full">
      <div className="flex max-w-3xl flex-col gap-5">
        <LeadSourcesPanel />
      </div>
    </Card>
  );
}
