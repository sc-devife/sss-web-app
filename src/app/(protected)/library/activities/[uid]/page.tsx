import { notFound } from "next/navigation";
import { ActivityDetailPanel } from "@/components/library/ActivityDetailPanel";
import { getActivityByUid } from "@/lib/activities";
import { getEscapePoints } from "@/lib/escape-points";

export default async function Page({ params }: { params: { uid: string } }) {
  const [activity, escapePoints] = await Promise.all([
    getActivityByUid(params.uid).catch(() => null),
    getEscapePoints(),
  ]);

  if (!activity) {
    notFound();
  }

  return <ActivityDetailPanel activity={activity} escapePoints={escapePoints} />;
}
