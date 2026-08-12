import { Card } from "@/components/ui/Card";
import { EscapePointsPanel } from "@/components/library/EscapePointsPanel";

export default function Page() {
  return (
    <Card variant="page" className="flex min-h-full flex-col gap-5">
      <EscapePointsPanel />
    </Card>
  );
}
