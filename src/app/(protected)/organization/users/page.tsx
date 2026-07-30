import { Heading, Body } from "@/components/ui/Typography";
import { InviteUserForm } from "@/components/organization/InviteUserForm";
import { UsersList } from "@/components/organization/UsersList";
import { UnverifiedUsersList } from "@/components/organization/UnverifiedUsersList";
import { getOrgUsers, getAssignableRoles, getPendingInvitations } from "@/lib/users";

export default async function UsersPage() {
  const [users, roles, pendingInvitations] = await Promise.all([
    getOrgUsers(),
    getAssignableRoles(),
    getPendingInvitations(),
  ]);

  return (
    <div className="flex flex-col gap-5 max-w-2xl">
      <Heading as="h2">Users</Heading>
      <Body muted>People in your organization and their roles.</Body>
      <UsersList users={users} roles={roles} />
      <InviteUserForm roles={roles} />
      <UnverifiedUsersList invitations={pendingInvitations} />
    </div>
  );
}
