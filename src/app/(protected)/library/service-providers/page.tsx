import { Heading, Body } from "@/components/ui/Typography";
import { ServiceProvidersPanel } from "@/components/library/ServiceProvidersPanel";

export default function Page() {
  return (
    <div className="flex flex-col gap-5">
      <ServiceProvidersPanel />
    </div>
  );
}
