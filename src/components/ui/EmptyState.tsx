import type { IconType } from "react-icons";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Heading, Caption } from "@/components/ui/Typography";
import { cn } from "@/lib/cn";

interface EmptyStateAction {
  label: string;
  onClick: () => void;
}

interface EmptyStateProps {
  icon: IconType;
  title: string;
  description?: string;
  action?: EmptyStateAction | ReactNode;
  className?: string;
}

function isActionShorthand(action: EmptyStateAction | ReactNode): action is EmptyStateAction {
  return !!action && typeof action === "object" && "label" in action && "onClick" in action;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <Card variant="elevated" className={cn("border-dashed py-12", className)}>
      <div className="flex flex-col items-center text-center">
        <div className="mb-5 rounded-full bg-primary/10 p-5">
          <Icon className="h-9 w-9 text-primary" />
        </div>
        <Heading as="h4">{title}</Heading>
        {description && <Caption className="mt-2 max-w-sm text-muted-foreground">{description}</Caption>}
        {action &&
          (isActionShorthand(action) ? (
            <Button className="mt-6" onClick={action.onClick}>
              {action.label}
            </Button>
          ) : (
            <div className="mt-6">{action}</div>
          ))}
      </div>
    </Card>
  );
}
