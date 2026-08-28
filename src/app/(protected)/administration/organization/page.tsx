import { Card } from "@/components/ui/Card";
import { OrganizationProfilePanel } from "@/components/organization/OrganizationProfilePanel";

export default function OrganizationProfilePage() {
  return (
    <Card variant="page" className="min-h-full">
      <OrganizationProfilePanel />
    </Card>
  );
}
