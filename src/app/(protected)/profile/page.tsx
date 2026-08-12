import { Card } from "@/components/ui/Card";
import { ProfilePanel } from "@/components/profile/ProfilePanel";

export default function ProfilePage() {
  return (
    <Card variant="page" className="min-h-full">
      <ProfilePanel />
    </Card>
  );
}
