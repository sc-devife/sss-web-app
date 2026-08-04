import { Heading, Body } from "@/components/ui/Typography";
import { TripsPanel } from "@/components/trips/TripsPanel";

export default function Page() {
  return (
    <div className="flex flex-col gap-5">
      <Body muted>Converted leads, from itinerary planning through to completion.</Body>
      <TripsPanel />
    </div>
  );
}
