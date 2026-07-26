import { ComingSoon } from "@/components/ui/ComingSoon";
import { findRouteWithGroup } from "@/lib/nav-config";

export default function Page() {
  const { route, groupTitle } = findRouteWithGroup("/marketing/lead-sources")!;
  return <ComingSoon title={route.title} section={groupTitle} icon={route.icon} />;
}
