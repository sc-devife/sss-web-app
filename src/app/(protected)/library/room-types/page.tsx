import { Card } from "@/components/ui/Card";
import { RoomTypesPanel } from "@/components/library/RoomTypesPanel";

export default function Page() {
  return (
    <Card variant="page" className="flex min-h-full flex-col gap-5">
      <RoomTypesPanel />
    </Card>
  );
}
