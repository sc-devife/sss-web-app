import { Card } from "@/components/ui/Card";
import { UsersPageContent } from "@/components/organization/UsersPageContent";

export default function UsersPage() {
  return (
    <Card variant="page" className="min-h-full">
      <UsersPageContent />
    </Card>
  );
}
