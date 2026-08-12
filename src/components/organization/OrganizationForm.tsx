"use client";

import { useRef, useState, type FormEvent } from "react";
import {
  PiBuildings,
  PiUploadSimple,
} from "react-icons/pi";

import { TextInput } from "@/components/ui/TextInput";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Caption } from "@/components/ui/Typography";
import { resolveFileUrl } from "@/lib/files";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import { mobileField, runValidators } from "@/lib/validators";
import { useAppDispatch } from "@/store/hooks";
import { updateOrganization, uploadOrganizationLogo, fetchMyOrganization } from "@/features/organization/organizationThunks";
import type { Organization, LogoShape } from "@/features/organization/types";
import { cn } from "@/lib/cn";

const LOGO_SHAPES: { value: LogoShape; label: string }[] = [
  { value: "round", label: "Round" },
  { value: "square", label: "Square" },
  { value: "rectangle", label: "Rectangle" },
];

export function OrganizationForm({
  organization,
}: {
  organization: Organization;
}) {
  const dispatch = useAppDispatch();

  const [displayName, setDisplayName] = useState(
    organization.display_name ?? ""
  );
  const [registeredName, setRegisteredName] = useState(
    organization.registered_name ?? ""
  );
  const [supportPhone, setSupportPhone] = useState(
    organization.support_ph_num ?? ""
  );
  const [logoFile, setLogoFile] = useState<string[]>(
    organization.logo_file ? [organization.logo_file] : []
  );
  const [logoShape, setLogoShape] = useState<LogoShape>(organization.logo_shape ?? "round");
  const fileInputRef = useRef<HTMLInputElement>(null);


  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [error, setError] = useState<string>();
  const [phoneError, setPhoneError] = useState<string>();
  const [saved, setSaved] = useState(false);

  async function handleLogoUpload(file: File) {
    setError(undefined);

    // Validate image type
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setError("Only PNG, JPG and WEBP images are allowed.");
      return;
    }

    // Max 5 MB
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5 MB.");
      return;
    }

    setUploadingLogo(true);

    try {
      const url = await dispatch(uploadOrganizationLogo(file)).unwrap();
      setLogoFile([url]);
    } catch (err) {
      setError(typeof err === "string" ? err : extractErrorMessage(err, "Upload failed"));
    } finally {
      setUploadingLogo(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  const logoPreviewUrl = logoFile[0] ? resolveFileUrl(logoFile[0]) : null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(undefined);
    setSaved(false);

    const nextPhoneError = runValidators(supportPhone, [mobileField()]);
    if (nextPhoneError) {
      setPhoneError(nextPhoneError);
      return;
    }
    setPhoneError(undefined);
    setSaving(true);

    try {
      await dispatch(updateOrganization({
        uid: organization.uid,
        display_name: displayName,
        registered_name: registeredName,
        support_ph_num: supportPhone,
        logo_file: logoFile[0] ?? null,
        logo_shape: logoShape,
      })).unwrap();

      setSaved(true);
      dispatch(fetchMyOrganization());
    } catch (err) {
      setError(typeof err === "string" ? err : extractErrorMessage(err, "Failed to save"));
    } finally {
      setSaving(false);
    }
  }



  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* Logo */}
      <div className="flex flex-col gap-6 rounded-2xl border bg-card p-6 md:flex-row md:items-center">

        {/* Preview */}
        <div className="flex flex-col items-center">
          <div
            className={cn(
              "flex items-center justify-center overflow-hidden border shadow-sm bg-muted",
              logoShape === "rectangle" ? "h-20 w-40 rounded-xl" : "h-28 w-28 rounded-2xl",
              logoShape === "round" && "rounded-full",
            )}
          >
            {logoPreviewUrl ? (
              <img
                src={logoPreviewUrl}
                alt="Organization Logo"
                className="h-full w-full object-cover"
              />
            ) : (
              <PiBuildings className="h-12 w-12 text-muted-foreground" />
            )}
          </div>

          <Caption className="mt-3 font-medium">
            Organization Logo
          </Caption>

          <div className="mt-2 flex gap-1 rounded-lg border border-border bg-muted/30 p-1">
            {LOGO_SHAPES.map((shape) => (
              <button
                key={shape.value}
                type="button"
                onClick={() => setLogoShape(shape.value)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  logoShape === shape.value
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {shape.label}
              </button>
            ))}
          </div>
        </div>

        {/* Upload */}
        <div className="flex-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                handleLogoUpload(file);
              }
            }}
          />

          <div className="rounded-xl border border-dashed border-border bg-muted/20 p-5 transition-colors hover:border-primary hover:bg-primary/5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h4 className="text-base font-semibold text-foreground">
                  Brand Logo
                </h4>

                <Caption className="mt-1 text-muted-foreground">
                  Upload a square logo used throughout your CRM.
                </Caption>
              </div>

              <Button
                type="button"
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingLogo}
                className="shrink-0"
              >
                <PiUploadSimple className="mr-2 h-5 w-5" />
                {uploadingLogo ? "Uploading..." : "Choose New Logo"}
              </Button>
            </div>

            <Caption className="mt-4 block text-muted-foreground">
              Supported formats: <strong>PNG, JPG, WEBP</strong> • Maximum size:{" "}
              <strong>5 MB</strong> • Recommended: <strong>512 × 512 px</strong>
            </Caption>
          </div>
        </div>

      </div>

      {/* Organization Information */}

      <fieldset disabled={saving} className="contents">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

          <div>
            <Caption className="mb-2 block">
              Organization ID
            </Caption>

            <div className="rounded-lg border bg-muted px-4 py-3 text-sm font-medium">
              {organization.org_code ?? "--"}
            </div>
          </div>

          <PhoneInput
            label="Support Phone"
            value={supportPhone}
            onChange={(v) => {
              setSupportPhone(v);
              setPhoneError(undefined);
            }}
            error={phoneError}
          />

          <TextInput
            label="Display Name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />

          <TextInput
            label="Registered Name"
            value={registeredName}
            onChange={(e) => setRegisteredName(e.target.value)}
          />

        </div>
      </fieldset>

      {error && (
        <Alert tone="danger" autoClose={false}>
          {error}
        </Alert>
      )}

      {saved && <Alert tone="success">Organization updated successfully.</Alert>}

      <div className="flex justify-end border-t pt-4">

        <Button
          type="submit"
          disabled={saving}
          loading={saving}
          loadingText="Saving..."
          className="min-w-[170px]"
        >
          Save Changes
        </Button>

      </div>

    </form>
  );
}