import { Heading, Body } from "@/components/ui/Typography";
import { InclusionExclusionsPanel } from "@/components/library/InclusionExclusionsPanel";
import { getDestinations } from "@/lib/destinations";

export default async function Page() {
  const destinations = await getDestinations();

  return (
    <div className="flex flex-col gap-5">
      <InclusionExclusionsPanel destinations={destinations} />
    </div>
  );
}
