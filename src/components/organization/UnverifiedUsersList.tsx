"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Body, Caption } from "@/components/ui/Typography";
import { cn } from "@/lib/cn";
import type { PendingInvitation } from "@/lib/users";
import { PiClock, PiCheckCircleFill, PiXCircle, PiXCircleBold } from "react-icons/pi";
import { useAppDispatch } from "@/store/hooks";
import { cancelInvitation, fetchPendingInvitations } from "@/features/users/usersThunks";

export function UnverifiedUsersList({ invitations }: { invitations: PendingInvitation[] }) {
  const dispatch = useAppDispatch();
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  async function handleCancel(invitationId: number) {
    setCancellingId(invitationId);
    try {
      await dispatch(cancelInvitation(invitationId));
      dispatch(fetchPendingInvitations());
    } finally {
      setCancellingId(null);
    }
  }

  if (invitations.length === 0) return null;

  return (
    <div className="space-y-3">
      {invitations.map((invitation) => {
        const expired = new Date(invitation.expires_set).getTime() < Date.now();
        const daysUntilExpiry = Math.ceil(
          (new Date(invitation.expires_set).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
        );

        return (
          <div
            key={invitation.seqp}
            className={cn(
              "group rounded-xl border p-4 transition-all duration-200 hover:shadow-md",
              expired ? "border-border bg-muted/40 opacity-75" : "border-warning/30 bg-card hover:border-warning/50",
            )}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                      expired ? "bg-muted" : "bg-warning/15",
                    )}
                  >
                    {expired ? (
                      <PiXCircle className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <PiClock className="h-5 w-5 text-warning" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Body className="truncate font-semibold">{invitation.email}</Body>
                    <Caption className="mt-0.5">
                      {expired ? (
                        "Invitation expired"
                      ) : (
                        <>
                          Expires in {daysUntilExpiry} {daysUntilExpiry === 1 ? "day" : "days"}
                          {invitation.roles && invitation.roles.length > 0 && <> · Roles: {invitation.roles.join(", ")}</>}
                        </>
                      )}
                    </Caption>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 sm:justify-start">
                {expired ? (
                  <Badge tone="neutral">Expired</Badge>
                ) : (
                  <Badge tone="warning" icon={PiCheckCircleFill}>
                    Pending
                  </Badge>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label="Cancel invitation"
                  disabled={cancellingId === invitation.seqp}
                  onClick={() => handleCancel(invitation.seqp)}
                  className="ml-2 text-danger hover:bg-danger/10"
                  title="Cancel invitation"
                >
                  <PiXCircleBold className="h-5 w-5 text-danger" />
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
