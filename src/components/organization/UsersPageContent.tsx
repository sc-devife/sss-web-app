"use client";

import { useEffect, useState } from "react";
import { PiUsersThree, PiClock } from "react-icons/pi";
import { IoSearchOutline } from "react-icons/io5";
import { Card } from "@/components/ui/Card";
import { Heading, Body } from "@/components/ui/Typography";
import { Skeleton } from "@/components/ui/Skeleton";
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
import { fetchTeams } from "@/features/teams/teamsThunks";
import { selectTeams } from "@/features/teams/teamsSelectors";

// Mirrors a member row (avatar + name/email + trailing controls) from
// UsersList.tsx so the loading state doesn't jump when real rows arrive.
function MemberRowSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-3">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex flex-col gap-1.5">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-44" />
              </div>
            </div>
            <Skeleton className="h-8 w-20 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

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
  const teams = useAppSelector(selectTeams);
  const invitations = useAppSelector(selectPendingInvitations);
  const invitationsStatus = useAppSelector(selectPendingInvitationsStatus);

  // Active Members search: name, email, phone, role or team, case-insensitive.
  const [memberSearch, setMemberSearch] = useState("");
  const memberQuery = memberSearch.trim().toLowerCase();
  const visibleUsers = memberQuery
    ? users.filter((u) =>
        [
          `${u.first_name ?? ""} ${u.last_name ?? ""}`,
          u.name,
          u.email,
          u.contact_number,
          ...u.roles.map((r) => r.role.label),
          ...u.teams.map((t) => t.name),
        ].some((v) => v?.toLowerCase().includes(memberQuery)),
      )
    : users;

  useEffect(() => {
    dispatch(fetchUsers());
    dispatch(fetchAssignableRoles());
    dispatch(fetchPendingInvitations());
    dispatch(fetchTeams());
  }, [dispatch]);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-3">
      <div className="flex items-center justify-end">
        <InviteUserForm roles={roles} />
      </div>

      <Card variant="elevated">
        <div className="border-b px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
              <PiUsersThree className="h-5 w-5" />
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
          {(usersStatus === "idle" || usersStatus === "loading") && users.length === 0 ? (
            <MemberRowSkeleton />
          ) : usersStatus === "failed" ? (
            <Body className="text-danger">{usersError}</Body>
          ) : (
            <div className="flex flex-col gap-3">
              {users.length > 0 && (
                <div className="relative max-w-xs">
                  <IoSearchOutline className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                  <input
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    placeholder="Search members…"
                    aria-label="Search active members"
                    className="h-8 w-full rounded-full border border-transparent bg-[#f8f8fa] pl-7 pr-3 text-sm text-foreground placeholder:text-[#9da3af] transition-colors focus-visible:border-primary/40 focus-visible:bg-background focus-visible:outline-none"
                  />
                </div>
              )}
              {users.length > 0 && visibleUsers.length === 0 ? (
                <Body muted className="py-6 text-center">
                  No members match your search.
                </Body>
              ) : (
                <UsersList users={visibleUsers} roles={roles} teams={teams} />
              )}
            </div>
          )}
        </div>
      </Card>

      <Card variant="elevated" className="border-warning/20 bg-warning/5">
        <div className="border-b border-warning/20 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-warning/15 p-2.5 text-warning">
              <PiClock className="h-5 w-5" />
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
          {(invitationsStatus === "idle" || invitationsStatus === "loading") && invitations.length === 0 ? (
            <MemberRowSkeleton />
          ) : (
            <UnverifiedUsersList invitations={invitations} />
          )}
        </div>
      </Card>
    </div>
  );
}
