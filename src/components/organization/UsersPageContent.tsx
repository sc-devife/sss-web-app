"use client";

import { useEffect } from "react";
import { PiUsersThree, PiClock } from "react-icons/pi";
import { Card } from "@/components/ui/Card";
import { Heading, Body } from "@/components/ui/Typography";
import { LoadingState } from "@/components/ui/Spinner";
import { InviteUserForm } from "@/components/organization/InviteUserForm";
import { UsersList } from "@/components/organization/UsersList";
import { UnverifiedUsersList } from "@/components/organization/UnverifiedUsersList";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchUsers, fetchAssignableRoles, fetchPendingInvitations } from "@/features/users/usersThunks";
import {
  selectOrgUsers,
  selectOrgUsersStatus,
  selectOrgUsersError,
  selectAssignableRoles,
  selectPendingInvitations,
  selectPendingInvitationsStatus,
} from "@/features/users/usersSelectors";

// Owns the initial data fetch for the whole Users page — page.tsx is no
// longer a Server Component fetching this data, so something client-side
// has to dispatch it once on mount before the three leaf panels (which read
// their own slices directly) have anything to render.
export function UsersPageContent() {
  const dispatch = useAppDispatch();
  const users = useAppSelector(selectOrgUsers);
  const usersStatus = useAppSelector(selectOrgUsersStatus);
  const usersError = useAppSelector(selectOrgUsersError);
  const roles = useAppSelector(selectAssignableRoles);
  const invitations = useAppSelector(selectPendingInvitations);
  const invitationsStatus = useAppSelector(selectPendingInvitationsStatus);

  useEffect(() => {
    dispatch(fetchUsers());
    dispatch(fetchAssignableRoles());
    dispatch(fetchPendingInvitations());
  }, [dispatch]);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-3">
      <div className="flex items-center justify-end">
        <InviteUserForm roles={roles} />
      </div>

      <Card variant="elevated">
        <div className="border-b px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-primary/10 p-1.5 text-primary">
              <PiUsersThree className="h-4 w-4" />
            </div>
            <div>
              <Heading as="h3" className="text-base font-semibold">
                Active Members
              </Heading>
              <Body muted className="text-xs">
                {users.length} {users.length === 1 ? "member" : "members"} in your organization
              </Body>
            </div>
          </div>
        </div>
        <div className="px-4 py-3">
          {usersStatus === "loading" && users.length === 0 ? (
            <LoadingState label="Loading members…" />
          ) : usersStatus === "failed" ? (
            <Body className="text-danger">{usersError}</Body>
          ) : (
            <UsersList users={users} roles={roles} />
          )}
        </div>
      </Card>

      <Card variant="elevated" className="border-warning/20 bg-warning/5">
        <div className="border-b border-warning/20 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-warning/15 p-1.5 text-warning">
              <PiClock className="h-4 w-4" />
            </div>
            <div>
              <Heading as="h3" className="text-base font-semibold">
                Pending Invitations
              </Heading>
              <Body muted className="text-xs">
                {invitations.length} {invitations.length === 1 ? "invitation" : "invitations"} awaiting response
              </Body>
            </div>
          </div>
        </div>
        <div className="px-4 py-3">
          {invitationsStatus === "loading" && invitations.length === 0 ? (
            <LoadingState label="Loading invitations…" />
          ) : (
            <UnverifiedUsersList invitations={invitations} />
          )}
        </div>
      </Card>
    </div>
  );
}
