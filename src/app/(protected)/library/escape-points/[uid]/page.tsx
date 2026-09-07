import { notFound } from "next/navigation";
import { EscapePointDetailPanel } from "@/components/library/EscapePointDetailPanel";
import { getEscapePointByUid, getEscapePoints } from "@/lib/escape-points";
import { getLocations } from "@/lib/locations";

export default async function Page({ params }: { params: { uid: string } }) {
  const [escapePoint, escapePoints, locations] = await Promise.all([
    getEscapePointByUid(params.uid).catch(() => null),
    getEscapePoints(),
    getLocations(),
  ]);

  if (!escapePoint) {
    notFound();
  }

  return <EscapePointDetailPanel escapePoint={escapePoint} escapePoints={escapePoints} locations={locations} />;
}
