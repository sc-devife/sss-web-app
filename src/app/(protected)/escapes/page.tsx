import { Body } from "@/components/ui/Typography";
import { Card } from "@/components/ui/Card";
import { EscapesPanel } from "@/components/escapes/EscapesPanel";

export default function Page() {
  return (
    <Card variant="page" className="flex min-h-full flex-col gap-5">
      <Body muted>Converted leads, from itinerary planning through to completion.</Body>
      <EscapesPanel />
    </Card>
  );
}
