import { ComingSoon } from "@/components/ui/ComingSoon";
import { dashboardRoute } from "@/lib/nav-config";

export default function DashboardPage() {
  return <ComingSoon title={dashboardRoute.title} section="Overview" icon={dashboardRoute.icon} />;
}
