import { Card } from "@/components/ui/Card";
import { ServiceProvidersPanel } from "@/components/library/ServiceProvidersPanel";

export default function Page() {
  return (
    <Card variant="page" className="flex min-h-full flex-col gap-5">
      <ServiceProvidersPanel />
    </Card>
  );
}
