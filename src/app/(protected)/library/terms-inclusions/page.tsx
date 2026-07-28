import { Heading, Body } from "@/components/ui/Typography";
import { InclusionExclusionsPanel } from "@/components/library/InclusionExclusionsPanel";
import { getInclusionExclusions } from "@/lib/inclusion-exclusions";
import { getDestinations } from "@/lib/destinations";

export default async function Page() {
  const [items, destinations] = await Promise.all([getInclusionExclusions(), getDestinations()]);

  return (
    <div className="flex flex-col gap-5">
      <Heading as="h2">Terms, Inclusions &amp; Exclusions</Heading>
      <Body muted>
        Reusable content for itineraries — optionally link an item to a destination so it&apos;s suggested automatically,
        or leave it unlinked to keep it available org-wide.
      </Body>
      <InclusionExclusionsPanel initialItems={items} destinations={destinations} />
    </div>
  );
}
