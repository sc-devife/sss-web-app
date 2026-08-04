"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { IconType } from "react-icons";
import {
  PiBuildings,
  PiEnvelopeSimple,
  PiIdentificationCard,
  PiShieldCheck,
  PiUser,
  PiPhone,
} from "react-icons/pi";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Heading, Body, Caption } from "@/components/ui/Typography";
import { LoadingState, Spinner } from "@/components/ui/Spinner";
import { resolveFileUrl } from "@/lib/files";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchMyProfile, updateMyProfile } from "@/features/profile/profileThunks";
import {
  selectMyProfile,
  selectMyProfileStatus,
  selectMyProfileError,
  selectMyProfileUpdateStatus,
} from "@/features/profile/profileSelectors";

function ReadOnlyField({ label, value, icon: Icon }: { label: string; value: string; icon: IconType }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Caption className="font-medium text-foreground">{label}</Caption>
      <div className="flex h-10 items-center gap-2 rounded border border-border bg-muted/40 px-3 text-sm text-foreground">
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="truncate">{value}</span>
      </div>
    </div>
  );
}

export function ProfilePanel() {
  const dispatch = useAppDispatch();
  const profile = useAppSelector(selectMyProfile);
  const status = useAppSelector(selectMyProfileStatus);
  const error = useAppSelector(selectMyProfileError);
  const updateStatus = useAppSelector(selectMyProfileUpdateStatus);

  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | undefined>();
  const [saved, setSaved] = useState(false);
  // Guards against a double-submit landing two PUTs in flight: the backend
  // rotates the session token per request, so a second request racing on the
  // stale token gets a 401 and the client's response interceptor treats any
  // 401 as "session expired" and force-logs the user out — even though the
  // first request already saved successfully. React's disabled-button state
  // lags one render behind the click, so this ref blocks re-entry immediately.
  const submittingRef = useRef(false);

  useEffect(() => {
    dispatch(fetchMyProfile());
  }, [dispatch]);

  function startEdit() {
    if (!profile) return;
    setFirstName(profile.first_name ?? "");
    setLastName(profile.last_name ?? "");
    setMobileNumber(profile.contact_number ?? "");
    setErrors({});
    setFormError(undefined);
    setSaved(false);
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setErrors({});
    setFormError(undefined);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submittingRef.current) return;
    setFormError(undefined);

    const nextErrors: Record<string, string> = {};
    if (!firstName.trim()) nextErrors.firstName = "First name is required";
    if (!lastName.trim()) nextErrors.lastName = "Last name is required";

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    submittingRef.current = true;

    try {
      await dispatch(
        updateMyProfile({
          first_name: firstName,
          last_name: lastName,
          contact_number: mobileNumber,
        }),
      ).unwrap();
      setEditing(false);
      setSaved(true);
    } catch (err) {
      setFormError(typeof err === "string" ? err : extractErrorMessage(err, "Failed to update profile"));
    } finally {
      submittingRef.current = false;
    }
  }

  if (status === "loading" && !profile) {
    return <LoadingState label="Loading profile…" />;
  }

  if (status === "failed" || !profile) {
    return <Body className="text-danger">{error ?? "Failed to load profile"}</Body>;
  }

  const roleLabel = profile.roles.length > 0 ? profile.roles.map((r) => r.role.label).join(", ") : "—";
  const orgName = profile.organizationName || "—";
  const logoUrl = profile.organizationLogo ? resolveFileUrl(profile.organizationLogo) : null;
  const saving = updateStatus === "loading";

  return (
    <div className="w-full">
      <Card variant="elevated" className="overflow-hidden p-0">
        {/* Header band: org logo, user name, org name, role badges */}
        <div className="flex flex-col items-center gap-4 border-b border-border bg-muted/30 p-6 text-center sm:flex-row sm:text-left">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-card shadow-sm">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={orgName} className="h-full w-full object-cover" />
            ) : (
              <PiBuildings className="h-9 w-9 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <Heading as="h1" className="text-xl font-semibold">
              {profile.first_name} {profile.last_name}
            </Heading>
            <Body muted>{orgName}</Body>
            <div className="mt-2 flex flex-wrap justify-center gap-1.5 sm:justify-start">
              {profile.roles.length > 0 ? (
                profile.roles.map((r) => (
                  <Badge key={r.role.name} tone="neutral">
                    {r.role.label}
                  </Badge>
                ))
              ) : (
                <Badge tone="neutral">No role assigned</Badge>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6 p-6">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <ReadOnlyField label="Email" value={profile.email} icon={PiEnvelopeSimple} />
            <ReadOnlyField label="User ID" value={profile.userId} icon={PiIdentificationCard} />
            <ReadOnlyField label="Role" value={roleLabel} icon={PiShieldCheck} />
            <ReadOnlyField label="Organization" value={orgName} icon={PiBuildings} />

            {editing ? (
              <>
                <TextInput
                  label="First Name"
                  value={firstName}
                  onChange={(e) => {
                    setFirstName(e.target.value);
                    setErrors((p) => ({ ...p, firstName: "" }));
                  }}
                  error={errors.firstName}
                  disabled={saving}
                  required
                />
                <TextInput
                  label="Last Name"
                  value={lastName}
                  onChange={(e) => {
                    setLastName(e.target.value);
                    setErrors((p) => ({ ...p, lastName: "" }));
                  }}
                  error={errors.lastName}
                  disabled={saving}
                  required
                />
                <TextInput
                  label="Mobile Number"
                  value={mobileNumber}
                  onChange={(e) => {
                    setMobileNumber(e.target.value);
                    setErrors((p) => ({ ...p, mobileNumber: "" }));
                  }}
                  error={errors.mobileNumber}
                  disabled={saving}
                  className="sm:col-span-2"
                />
              </>
            ) : (
              <>
                <ReadOnlyField label="First Name" value={profile.first_name} icon={PiUser} />
                <ReadOnlyField label="Last Name" value={profile.last_name} icon={PiUser} />
                <ReadOnlyField label="Mobile Number" value={profile.contact_number || "—"} icon={PiPhone} />
              </>
            )}
          </div>

          {formError && <Alert tone="danger">{formError}</Alert>}
          {saved && !editing && <Alert tone="success">Profile updated successfully.</Alert>}

          <div className="flex justify-end gap-3 border-t border-border pt-5">
            {editing ? (
              <>
                <Button type="button" variant="ghost" onClick={cancelEdit} disabled={saving}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving} className="min-w-[140px]">
                  {saving ? (
                    <>
                      <Spinner size="sm" /> Updating…
                    </>
                  ) : (
                    "Update"
                  )}
                </Button>
              </>
            ) : (
              <Button type="button" onClick={startEdit} className="min-w-[140px]">
                Update
              </Button>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}
