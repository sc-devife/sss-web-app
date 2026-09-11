import { Card } from "@/components/ui/Card";
import { FollowUpsPanel } from "@/components/followups/FollowUpsPanel";

export default function Page() {
  return (
    <Card variant="page" className="flex min-h-full flex-col gap-5">
      <FollowUpsPanel />
    </Card>
  );
}
