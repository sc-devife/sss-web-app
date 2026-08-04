import { Heading } from "@/components/ui/Typography";
import { DashboardPanel } from "@/components/dashboard/DashboardPanel";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      <DashboardPanel />
    </div>
  );
}
