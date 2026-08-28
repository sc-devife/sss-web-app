import { Card } from "@/components/ui/Card";
import { ProfilePanel } from "@/components/profile/ProfilePanel";
import { ActiveSessionsPanel } from "@/components/profile/ActiveSessionsPanel";

export default function ProfilePage() {
  return (
    <Card variant="page" className="min-h-full">
      <ProfilePanel />
      <ActiveSessionsPanel />
    </Card>
  );
}
