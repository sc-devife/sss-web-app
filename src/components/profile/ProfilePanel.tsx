"use client";

import { useEffect, useLayoutEffect, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { toast } from "react-toastify";
import type { IconType } from "react-icons";
import {
  PiBuildings,
  PiEnvelopeSimple,
  PiIdentificationCard,
  PiShieldCheck,
  PiUser,
  PiPhone,
  PiCameraFill,
  PiGearSixFill,
} from "react-icons/pi";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Heading, Body, Caption } from "@/components/ui/Typography";
import { Spinner } from "@/components/ui/Spinner";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";
import { resolveFileUrl } from "@/lib/files";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import { useIsDirty } from "@/lib/forms";
import { countryCodeField, mobileField, required, runValidators } from "@/lib/validators";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchMyProfile, updateMyProfile, uploadProfilePicture } from "@/features/profile/profileThunks";
import {
  selectMyProfile,
  selectMyProfileStatus,
  selectMyProfileError,
  selectMyProfileUpdateStatus,
} from "@/features/profile/profileSelectors";
import { selectLoggedInUser } from "@/features/auth/authSelectors";
import { setLoggedInUser } from "@/features/auth/authSlice";
import { selectSoundEnabled } from "@/features/notifications/notificationsSelectors";
import { updateNotificationSoundPreference } from "@/features/notifications/notificationsThunks";
import { setSoundEnabled } from "@/features/notifications/notificationsSlice";

// Vertical popup opened from the header band's Settings button — same
// portal/fixed-position/outside-click-close mechanics as every other
// floating panel in this app (ToolbarSelect, MoreFiltersPopover).
function ProfileSettingsPopover({ onClose, anchorRef }: { onClose: () => void; anchorRef: React.RefObject<HTMLButtonElement> }) {
  const dispatch = useAppDispatch();
  const soundEnabled = useAppSelector(selectSoundEnabled);
  const [pos, setPos] = useState<{ left: number; top: number }>({ left: 0, top: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  // Optimistic: updateNotificationSoundPreference.fulfilled only updates
  // Redux after the PATCH round-trips, which left the switch visually
  // unresponsive for the gap between click and response (and a second click
  // in that window would silently flip it back) — this flips the toggle
  // immediately and reverts only if the request actually fails.
  async function handleToggle() {
    const next = !soundEnabled;
    dispatch(setSoundEnabled(next));
    try {
      await dispatch(updateNotificationSoundPreference(next)).unwrap();
    } catch {
      dispatch(setSoundEnabled(!next));
      toast.error("Failed to update notification sound preference.");
    }
  }

  useLayoutEffect(() => {
    function position() {
      const trigger = anchorRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const panelHeight = panelRef.current?.getBoundingClientRect().height ?? 140;
      let top = rect.bottom + 8;
      if (top + panelHeight > window.innerHeight - 8) top = Math.max(8, rect.top - panelHeight - 8);
      const left = Math.min(rect.right - 260, window.innerWidth - 260 - 8);
      setPos({ left: Math.max(8, left), top });
    }
    position();
    window.addEventListener("resize", position);
    window.addEventListener("scroll", position, true);
    return () => {
      window.removeEventListener("resize", position);
      window.removeEventListener("scroll", position, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function handlePointerDown(e: MouseEvent) {
      const target = e.target as Node;
      if (panelRef.current?.contains(target) || anchorRef.current?.contains(target)) return;
      onClose();
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handlePointerDown, true);
    document.addEventListener("keydown", handleKey, true);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown, true);
      document.removeEventListener("keydown", handleKey, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-label="Settings"
      style={{ position: "fixed", left: pos.left, top: pos.top, width: 260 }}
      className="z-50 rounded border border-border bg-card p-4 text-card-foreground shadow-xl"
    >
      <span className="text-sm font-semibold text-foreground">Settings</span>
      <div className="mt-3 flex items-center justify-between gap-3">
        <div>
          <span className="block text-sm font-medium text-foreground">Notification Sound</span>
          <span className="block text-xs text-muted-foreground">{soundEnabled ? "ON" : "OFF"}</span>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={soundEnabled}
          onClick={handleToggle}
          className={cn(
            "relative h-6 w-11 shrink-0 overflow-hidden rounded-full transition-colors",
            soundEnabled ? "bg-primary" : "bg-muted",
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
              soundEnabled ? "translate-x-5" : "translate-x-0",
            )}
          />
        </button>
      </div>
    </div>,
    document.body,
  );
}

type ProfileFormState = { firstName: string; lastName: string; mobileNumber: string; designation: string; signature: string };

function validate(v: ProfileFormState): Record<string, string> {
  const errors: Record<string, string> = {};
  const err = (key: "firstName" | "lastName" | "mobileNumber", validators: Parameters<typeof runValidators>[1]) => {
    const e = runValidators(v[key], validators);
    if (e) errors[key] = e;
  };
  err("firstName", [required("First name is required")]);
  err("lastName", [required("Last name is required")]);
  err("mobileNumber", [countryCodeField(), mobileField()]); // optional field, format-checked only if filled
  return errors;
}

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
  const loggedInUser = useAppSelector(selectLoggedInUser);

  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [designation, setDesignation] = useState("");
  const [signature, setSignature] = useState("");
  const [original, setOriginal] = useState<ProfileFormState | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | undefined>();

  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string>();
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
    const snapshot: ProfileFormState = {
      firstName: profile.first_name ?? "",
      lastName: profile.last_name ?? "",
      mobileNumber: profile.contact_number ?? "",
      designation: profile.designation ?? "",
      signature: profile.signature ?? "",
    };
    setFirstName(snapshot.firstName);
    setLastName(snapshot.lastName);
    setMobileNumber(snapshot.mobileNumber);
    setDesignation(snapshot.designation);
    setSignature(snapshot.signature);
    setOriginal(snapshot);
    setErrors({});
    setFormError(undefined);
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setOriginal(null);
    setErrors({});
    setFormError(undefined);
  }

  async function handlePhotoUpload(file: File) {
    if (!profile) return;
    setPhotoError(undefined);

    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setPhotoError("Only PNG, JPG and WEBP images are allowed.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError("Image size must be less than 5 MB.");
      return;
    }

    setUploadingPhoto(true);
    try {
      const url = await dispatch(uploadProfilePicture(file)).unwrap();
      await dispatch(
        updateMyProfile({
          first_name: profile.first_name,
          last_name: profile.last_name,
          contact_number: profile.contact_number ?? "",
          profile_picture: url,
          designation: profile.designation ?? "",
          signature: profile.signature ?? "",
        }),
      ).unwrap();
      if (loggedInUser) {
        dispatch(setLoggedInUser({ ...loggedInUser, profilePicture: url }));
      }
    } catch (err) {
      setPhotoError(typeof err === "string" ? err : extractErrorMessage(err, "Upload failed"));
    } finally {
      setUploadingPhoto(false);
      if (photoInputRef.current) {
        photoInputRef.current.value = "";
      }
    }
  }

  const isDirty = useIsDirty(original, { firstName, lastName, mobileNumber, designation, signature });

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submittingRef.current || !isDirty) return;
    setFormError(undefined);

    const nextErrors = validate({ firstName, lastName, mobileNumber, designation, signature });
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
          designation,
          signature,
        }),
      ).unwrap();
      setEditing(false);
      toast.success("Profile updated successfully.");
    } catch (err) {
      setFormError(typeof err === "string" ? err : extractErrorMessage(err, "Failed to update profile"));
    } finally {
      submittingRef.current = false;
    }
  }

  if ((status === "idle" || status === "loading") && !profile) {
    // "idle" (the pre-fetch initial render) needs the skeleton too — see
    // DashboardPanel's identical fix for why "loading" alone left a gap.
    return (
      <div className="w-full">
        <Card variant="elevated" className="overflow-hidden p-0">
          <div className="flex flex-col items-center gap-4 border-b border-border bg-muted/30 p-6 sm:flex-row">
            <Skeleton className="h-20 w-20 shrink-0 rounded-full" />
            <Skeleton className="h-20 w-20 shrink-0 rounded-full" />
            <div className="flex w-full flex-col items-center gap-2 sm:items-start">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-5 w-24 rounded-full" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-5 p-6 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-1.5">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-10 w-full rounded" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  if (status === "failed" || !profile) {
    return <Body className="text-danger">{error ?? "Failed to load profile"}</Body>;
  }

  const roleLabel = profile.roles.length > 0 ? profile.roles.map((r) => r.role.label).join(", ") : "—";
  const orgName = profile.organizationName || "—";
  const logoUrl = profile.organizationLogo ? resolveFileUrl(profile.organizationLogo) : null;
  const photoUrl = profile.profile_picture ? resolveFileUrl(profile.profile_picture) : null;
  const initials =
    (profile.first_name?.[0] ?? "").toUpperCase() +
    (profile.last_name?.[0] ?? "").toUpperCase() ||
    profile.name.trim().charAt(0).toUpperCase() ||
    "?";
  const saving = updateStatus === "loading";

  return (
    <div className="w-full">
      <Card variant="elevated" className="overflow-hidden p-0">
        {/* Header band: personal photo, org logo, user name, org name, role badges */}
        <div className="flex flex-col items-center gap-4 border-b border-border bg-muted/30 p-6 text-center sm:flex-row sm:text-left">
          <div className="flex shrink-0 items-center gap-3">
            <div className="relative">
              <input
                ref={photoInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handlePhotoUpload(file);
                }}
              />
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-border bg-primary/15 text-xl font-semibold text-primary shadow-sm">
                {photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photoUrl} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  initials
                )}
              </div>
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                disabled={uploadingPhoto}
                aria-label={uploadingPhoto ? "Uploading profile photo…" : "Change profile photo"}
                title={uploadingPhoto ? "Uploading…" : "Change profile photo"}
                className={cn(
                  "absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition-colors",
                  uploadingPhoto ? "cursor-not-allowed" : "hover:bg-muted hover:text-foreground",
                )}
              >
                {uploadingPhoto ? <Spinner size="sm" tone="primary" /> : <PiCameraFill className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
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
            {profile.designation && <Body muted className="text-sm">{profile.designation}</Body>}
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
              {profile.teams.map((t) => (
                <Badge key={t.uid} tone="neutral">
                  {t.name}
                </Badge>
              ))}
            </div>
          </div>

          <button
            ref={settingsButtonRef}
            type="button"
            onClick={() => setSettingsOpen((o) => !o)}
            aria-label="Settings"
            title="Settings"
            className="flex h-9 w-9 shrink-0 items-center justify-center self-start rounded-full border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground"
          >
            <PiGearSixFill className="h-4 w-4" />
          </button>
          {settingsOpen && (
            <ProfileSettingsPopover onClose={() => setSettingsOpen(false)} anchorRef={settingsButtonRef} />
          )}
        </div>

        {photoError && (
          <div className="px-6 pt-4">
            <Alert tone="danger" autoClose={false}>
              {photoError}
            </Alert>
          </div>
        )}

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
                <PhoneInput
                  label="Mobile Number"
                  value={mobileNumber}
                  onChange={(v) => {
                    setMobileNumber(v);
                    setErrors((p) => ({ ...p, mobileNumber: "" }));
                  }}
                  error={errors.mobileNumber}
                  disabled={saving}
                />
                <TextInput
                  label="Designation"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  disabled={saving}
                  placeholder="e.g. Senior Travel Consultant"
                />
                <div className="sm:col-span-2">
                  <TextInput
                    label="Signature"
                    value={signature}
                    onChange={(e) => setSignature(e.target.value)}
                    disabled={saving}
                    placeholder="Shown on outgoing quotes/documents"
                  />
                </div>
              </>
            ) : (
              <>
                <ReadOnlyField label="First Name" value={profile.first_name} icon={PiUser} />
                <ReadOnlyField label="Last Name" value={profile.last_name} icon={PiUser} />
                <ReadOnlyField label="Mobile Number" value={profile.contact_number || "—"} icon={PiPhone} />
                <ReadOnlyField label="Designation" value={profile.designation || "—"} icon={PiIdentificationCard} />
              </>
            )}
          </div>

          {formError && (
            <Alert tone="danger" autoClose={false}>
              {formError}
            </Alert>
          )}
          <div className="flex justify-end gap-3 border-t border-border pt-5">
            {editing ? (
              <>
                <Button type="button" variant="ghost" onClick={cancelEdit} disabled={saving}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving || !isDirty}
                  loading={saving}
                  loadingText="Updating…"
                  className="min-w-[140px]"
                >
                  Update
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
