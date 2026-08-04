import { Heading, Body } from "@/components/ui/Typography";
import { DestinationsPanel } from "@/components/library/DestinationsPanel";

export default function Page() {
  return (
    <div className="flex flex-col gap-5">
      <DestinationsPanel />
    </div>
  );
}
