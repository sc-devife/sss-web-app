import { Card } from "@/components/ui/Card";
import { ServicesPanel } from "@/components/library/ServicesPanel";

export default function Page() {
  return (
    <Card variant="page" className="flex min-h-full flex-col gap-5">
      <ServicesPanel />
    </Card>
  );
}
