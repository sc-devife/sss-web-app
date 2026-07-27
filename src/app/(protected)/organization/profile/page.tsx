import { Card } from "@/components/ui/Card";
import { Heading, Body } from "@/components/ui/Typography";
import { Badge } from "@/components/ui/Badge";
import { OrganizationForm } from "@/components/organization/OrganizationForm";
import { getMyOrganization } from "@/lib/organization";

export default async function OrganizationProfilePage() {
  const organization = await getMyOrganization();

  return (
    <div className="flex flex-col gap-5 max-w-2xl">
      <div className="flex items-center justify-between">
        <Heading as="h2">Organization Profile</Heading>
        <Badge tone={organization.status === "ACTIVE" ? "success" : "warning"}>{organization.status}</Badge>
      </div>
      <Body muted>Basic details for {organization.display_name}. Visible to everyone in your organization, editable by Admins.</Body>

      <Card>
        <OrganizationForm organization={organization} />
      </Card>
    </div>
  );
}
