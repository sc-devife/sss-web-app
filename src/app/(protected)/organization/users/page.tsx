import { Heading, Body } from "@/components/ui/Typography";
import { InviteUserForm } from "@/components/organization/InviteUserForm";
import { UsersList } from "@/components/organization/UsersList";
import { getOrgUsers, getAssignableRoles } from "@/lib/users";

export default async function UsersPage() {
  const [users, roles] = await Promise.all([getOrgUsers(), getAssignableRoles()]);

  return (
    <div className="flex flex-col gap-5 max-w-2xl">
      <Heading as="h2">Users</Heading>
      <Body muted>People in your organization and their roles.</Body>
      <InviteUserForm />
      <UsersList users={users} roles={roles} />
    </div>
  );
}
