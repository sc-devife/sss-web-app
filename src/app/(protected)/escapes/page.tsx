import { Body } from "@/components/ui/Typography";
import { EscapesPanel } from "@/components/escapes/EscapesPanel";

export default function Page() {
  return (
    <div className="flex flex-col gap-5">
      <Body muted>Converted leads, from itinerary planning through to completion.</Body>
      <EscapesPanel />
    </div>
  );
}
