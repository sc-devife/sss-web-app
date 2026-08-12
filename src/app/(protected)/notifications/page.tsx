import { Card } from "@/components/ui/Card";
import { ComingSoon } from "@/components/ui/ComingSoon";
import { PiBellFill } from "react-icons/pi";

export default function NotificationsPage() {
  return (
    <Card variant="page" className="min-h-full">
      <ComingSoon title="Notifications" section="Account" icon={PiBellFill} />
    </Card>
  );
}
