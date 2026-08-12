import { Card } from "@/components/ui/Card";
import { ComingSoon } from "@/components/ui/ComingSoon";
import { findRouteWithGroup } from "@/lib/nav-config";

export default function Page() {
  const { route, groupTitle } = findRouteWithGroup("/platform/settings")!;
  return (
    <Card variant="page" className="min-h-full">
      <ComingSoon title={route.title} section={groupTitle} icon={route.icon} />
    </Card>
  );
}
