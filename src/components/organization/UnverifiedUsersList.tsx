"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { IoClose } from "react-icons/io5";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Body, Caption, Heading } from "@/components/ui/Typography";
import type { PendingInvitation } from "@/lib/users";

export function UnverifiedUsersList({ invitations }: { invitations: PendingInvitation[] }) {
  const router = useRouter();
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  async function handleCancel(invitationId: number) {
    setCancellingId(invitationId);
    try {
      await fetch(`/api/invitations/${invitationId}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setCancellingId(null);
    }
  }

  if (invitations.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <Heading as="h3">Unverified Users</Heading>
      <Body muted>Pending invitations awaiting signup.</Body>
      <div className="flex flex-col gap-3">
        {invitations.map((invitation) => {
          const expired = new Date(invitation.expires_set).getTime() < Date.now();
          return (
            <Card key={invitation.seqp} className="flex items-center justify-between">
              <div>
                <Body className="font-medium">{invitation.email}</Body>
                <Caption>
                  {expired ? "Expired" : `Expires ${new Date(invitation.expires_set).toLocaleDateString()}`}
                  {invitation.roles && invitation.roles.length > 0 && ` · ${invitation.roles.join(", ")}`}
                </Caption>
              </div>
              <div className="flex items-center gap-2">
                {expired && <Badge tone="neutral">Expired</Badge>}
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label="Cancel invitation"
                  disabled={cancellingId === invitation.seqp}
                  onClick={() => handleCancel(invitation.seqp)}
                  className="px-2 text-danger hover:bg-danger/10"
                >
                  <IoClose className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
