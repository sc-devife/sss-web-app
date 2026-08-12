import { Card } from "@/components/ui/Card";
import { TransportPanel } from "@/components/library/TransportPanel";
import { getServiceProviders } from "@/lib/service-providers";
import { getEscapePoints } from "@/lib/escape-points";

export default async function Page() {
  const [providers, escapePoints] = await Promise.all([getServiceProviders(), getEscapePoints()]);

  return (
    <Card variant="page" className="flex min-h-full flex-col gap-5">
      <TransportPanel providers={providers} escapePoints={escapePoints} />
    </Card>
  );
}
