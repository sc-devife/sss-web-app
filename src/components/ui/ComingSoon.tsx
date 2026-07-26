import type { IconType } from "react-icons";
import { Card } from "@/components/ui/Card";
import { Heading, Body } from "@/components/ui/Typography";

export function ComingSoon({ title, section, icon: Icon }: { title: string; section: string; icon: IconType }) {
  return (
    <Card className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <Icon className="h-8 w-8 text-muted-foreground" />
      <Heading as="h3">{title}</Heading>
      <Body muted>{section} · coming soon</Body>
    </Card>
  );
}
