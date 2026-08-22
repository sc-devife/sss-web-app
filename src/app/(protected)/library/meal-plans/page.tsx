import { Card } from "@/components/ui/Card";
import { MealPlansPanel } from "@/components/library/MealPlansPanel";

export default function Page() {
  return (
    <Card variant="page" className="flex min-h-full flex-col gap-5">
      <MealPlansPanel />
    </Card>
  );
}
