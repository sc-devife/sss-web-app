import { Card } from "@/components/ui/Card";
import { DashboardPanel } from "@/components/dashboard/DashboardPanel";

export default function DashboardPage() {
  return (
    <Card variant="page" className="flex min-h-full flex-col gap-8">
      <DashboardPanel />
    </Card>
  );
}
