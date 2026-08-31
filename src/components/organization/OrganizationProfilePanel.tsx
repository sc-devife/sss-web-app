"use client";

import { useEffect } from "react";
import { PiBuildings } from "react-icons/pi";

import { Card } from "@/components/ui/Card";
import { Heading, Body } from "@/components/ui/Typography";
import { LoadingState } from "@/components/ui/Spinner";
import { OrganizationForm } from "@/components/organization/OrganizationForm";
import { ContactAddressPanel } from "@/components/organization/ContactAddressPanel";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchMyOrganization } from "@/features/organization/organizationThunks";
import { selectOrganization, selectOrganizationStatus, selectOrganizationError } from "@/features/organization/organizationSelectors";

export function OrganizationProfilePanel() {
  const dispatch = useAppDispatch();
  const organization = useAppSelector(selectOrganization);
  const status = useAppSelector(selectOrganizationStatus);
  const error = useAppSelector(selectOrganizationError);

  useEffect(() => {
    dispatch(fetchMyOrganization());
  }, [dispatch]);

  if (status === "loading" && !organization) {
    return <LoadingState label="Loading organization…" />;
  }

  if (status === "failed" || !organization) {
    return <Body className="text-danger">{error ?? "Failed to load organization"}</Body>;
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4">

      {/* Organization Information */}
      <Card variant="elevated">
        <div className="flex justify-between border-b px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-2 text-primary">
              <PiBuildings className="h-5 w-5" />
            </div>

            <div>
              <Heading as="h3" className="text-xl font-semibold">
                General Information
              </Heading>

              <Body muted>
                Update your organization information and branding.
              </Body>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
              {organization.status}
            </div>
          </div>
        </div>

        <div className="px-6 py-4">
          <OrganizationForm organization={organization} />
        </div>
      </Card>

      {/* Address Section — header lives inside ContactAddressPanel itself
          (alongside the Add Address button), not duplicated here. */}
      <Card variant="elevated">
        <div className="px-6 py-4">
          <ContactAddressPanel orgId={organization.uid} />
        </div>
      </Card>
    </div>
  );
}
