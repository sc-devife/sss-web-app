import { PiShieldCheckFill } from "react-icons/pi";
import { Card } from "@/components/ui/Card";
import { ComingSoon } from "@/components/ui/ComingSoon";

// Roles isn't in the sidebar yet (its nav-config entry is commented out), so
// this stub can't look its title/icon up there the way the other coming-soon
// pages do — a missing entry made that lookup undefined and crashed the
// build's static prerender of this route. It carries its own copy instead.
export default function Page() {
  return (
    <Card variant="page" className="min-h-full">
      <ComingSoon title="Roles" section="Administration" icon={PiShieldCheckFill} />
    </Card>
  );
}
