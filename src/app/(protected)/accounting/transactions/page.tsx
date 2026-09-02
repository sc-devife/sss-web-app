import { Card } from "@/components/ui/Card";
import { TransactionsPanel } from "@/components/accounting/TransactionsPanel";

export default function Page() {
  return (
    <Card variant="page" className="flex min-h-full flex-col gap-4">
      <div className="min-h-0 flex-1">
        <TransactionsPanel />
      </div>
    </Card>
  );
}
