"use client";

import { useEffect } from "react";
import { PiBuildings } from "react-icons/pi";

import { Card } from "@/components/ui/Card";
import { Heading, Body } from "@/components/ui/Typography";
import { Skeleton } from "@/components/ui/Skeleton";
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

  if ((status === "idle" || status === "loading") && !organization) {
    // "idle" (the pre-fetch initial render) needs the skeleton too — see
    // DashboardPanel's identical fix for why "loading" alone left a gap.
    return (
      <div className="mx-auto w-full max-w-7xl space-y-2">
        <Card variant="elevated">
          <div className="flex items-center justify-between border-b px-6 py-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-xl" />
              <div className="flex flex-col gap-1.5">
                <Skeleton className="h-5 w-44" />
                <Skeleton className="h-3 w-64" />
              </div>
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>

          {/* Mirrors OrganizationForm's own card-in-card: a logo picker
              (spans 2 rows) + read-only Org ID box + every text/select/phone
              field in its 3-col grid, then a full-width About textarea and
              the Save button row — a generic field grid didn't come close to
              this form's actual shape. */}
          <div className="px-6 py-4">
            <div className="rounded-2xl border bg-card p-6">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <div className="flex flex-col items-center justify-center gap-3 sm:row-span-2">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-28 w-28 rounded-full" />
                  <Skeleton className="h-7 w-40 rounded-lg" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-11 w-full rounded-lg" />
                </div>
                {Array.from({ length: 14 }).map((_, i) => (
                  <div key={i} className="flex flex-col gap-1.5">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-10 w-full rounded" />
                  </div>
                ))}
                <div className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-3">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-16 w-full rounded" />
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end border-t pt-4">
              <Skeleton className="h-10 w-40 rounded" />
            </div>
          </div>
        </Card>

        <Card variant="elevated">
          <div className="px-6 py-4">
            <div className="flex flex-col gap-4 border-b pb-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-xl" />
                <div className="flex flex-col gap-1.5">
                  <Skeleton className="h-5 w-36" />
                  <Skeleton className="h-3 w-56" />
                </div>
              </div>
              <Skeleton className="h-9 w-32 rounded" />
            </div>
            <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-border p-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-xl" />
                    <div className="flex flex-col gap-1.5">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-24 rounded-full" />
                    </div>
                  </div>
                  <div className="mt-4 flex flex-col gap-2">
                    <Skeleton className="h-3 w-4/5" />
                    <Skeleton className="h-3 w-2/3" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (status === "failed" || !organization) {
    return <Body className="text-danger">{error ?? "Failed to load organization"}</Body>;
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-2">

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
