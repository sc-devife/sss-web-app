import { notFound } from "next/navigation";
import { LeadDetailPanel } from "@/components/leads/LeadDetailPanel";
import { getLeadByUid } from "@/lib/leads";
import { getEscapePoints } from "@/lib/escape-points";

export default async function Page({ params }: { params: { uid: string } }) {
  const [lead, escapePoints] = await Promise.all([
    getLeadByUid(params.uid).catch(() => null),
    getEscapePoints(),
  ]);

  if (!lead) {
    notFound();
  }

  return <LeadDetailPanel lead={lead} escapePoints={escapePoints} />;
}
