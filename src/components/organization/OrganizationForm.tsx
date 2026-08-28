"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { PiBuildings, PiInfoBold } from "react-icons/pi";

import { TextInput } from "@/components/ui/TextInput";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { Select } from "@/components/ui/Select";
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
import { fetchCountryOptions } from "@/lib/reference-data-client";
import type { ReferenceOption } from "@/lib/reference-data-client";
import { TbCameraUp } from "react-icons/tb";
import { Spinner } from "@/components/ui/Spinner";

const LOGO_SHAPES: { value: LogoShape; label: string }[] = [
  { value: "round", label: "Round" },
  { value: "square", label: "Square" },
  { value: "rectangle", label: "Rectangle" },
];

const LEGAL_ENTITY_TYPES = [
  { value: "PRIVATE_LIMITED", label: "Private Limited" },
  { value: "LLP", label: "Limited Liability Partnership" },
  { value: "PARTNERSHIP", label: "Partnership" },
  { value: "SOLE_PROPRIETORSHIP", label: "Sole Proprietorship" },
  { value: "PUBLIC_LIMITED", label: "Public Limited" },
  { value: "OTHER", label: "Other" },
];

export function OrganizationForm({
  organization,
}: {
  organization: Organization;
}) {
  const dispatch = useAppDispatch();

  const [displayName, setDisplayName] = useState(organization.display_name ?? "");
  const [registeredName, setRegisteredName] = useState(organization.registered_name ?? "");
  const [supportPhone, setSupportPhone] = useState(organization.support_ph_num ?? "");
  const [logoFile, setLogoFile] = useState<string[]>(organization.logo_file ? [organization.logo_file] : []);
  const [logoShape, setLogoShape] = useState<LogoShape>(organization.logo_shape ?? "round");
  const [countryCode, setCountryCode] = useState(organization.country_code ?? "");
  const [countries, setCountries] = useState<ReferenceOption[]>([]);

  // Legal / compliance identity
  const [pan, setPan] = useState(organization.pan ?? "");
  const [legalEntityType, setLegalEntityType] = useState(organization.legal_entity_type ?? "");
  const [cin, setCin] = useState(organization.cin ?? "");
  const [industryAccreditation, setIndustryAccreditation] = useState(organization.industry_accreditation ?? "");

  // Brand / presentation
  const [businessEmail, setBusinessEmail] = useState(organization.business_email ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(organization.website_url ?? "");
  const [whatsappNumber, setWhatsappNumber] = useState(organization.whatsapp_number ?? "");
  const [tagline, setTagline] = useState(organization.tagline ?? "");
  const [aboutText, setAboutText] = useState(organization.about_text ?? "");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchCountryOptions().then(setCountries).catch(() => { });
  }, []);

  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [error, setError] = useState<string>();
  const [phoneError, setPhoneError] = useState<string>();
  const [saved, setSaved] = useState(false);

  async function handleLogoUpload(file: File) {
    setError(undefined);

    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setError("Only PNG, JPG and WEBP images are allowed.");
      return;
    }

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
        country_code: countryCode || undefined,
        pan: pan || undefined,
        legal_entity_type: legalEntityType || undefined,
        cin: cin || undefined,
        business_email: businessEmail || undefined,
        website_url: websiteUrl || undefined,
        whatsapp_number: whatsappNumber || undefined,
        tagline: tagline || undefined,
        about_text: aboutText || undefined,
        industry_accreditation: industryAccreditation || undefined,
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
    <form onSubmit={handleSubmit} className="space-y-6">



      <fieldset disabled={saving} className="contents">

        {/* Organization Profile */}
        <div className="rounded-2xl border bg-card p-6">

          {/* Logo occupies one full grid cell — same width as every field
              beside it — instead of a separately-sized sidebar, so the
              section reads as one aligned grid. At the 3-col breakpoint it
              spans both rows so Registered Name/Support Phone land directly
              under Organization ID/Display Name, not under the logo. */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {/* Logo — a self-contained branding block: label+info, the
                preview with an overlaid "change photo" camera badge (the
                universal edit-avatar affordance), then the shape selector
                grouped tightly beneath it. */}
            <div className="flex flex-col items-center justify-center gap-2 lg:row-span-2">
              <div className="flex items-center gap-1.5">
                <Caption className="font-medium">Organization Logo</Caption>
                <button
                  type="button"
                  aria-label="Logo requirements"
                  title="Supported formats: PNG, JPG, WEBP • Maximum size: 5 MB • Recommended: 512 × 512 px"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  <PiInfoBold size={14} />
                </button>
              </div>

              <div className="relative">
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

                <button
                  type="button"
                  aria-label="Change organization logo"
                  title="Change organization logo"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingLogo}
                  className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-card bg-primary text-primary-foreground shadow-sm transition-transform hover:scale-105 disabled:opacity-60"
                >
                  {uploadingLogo ? <Spinner size="sm" className="text-primary-foreground" /> : <TbCameraUp size={16} aria-hidden="true" />}
                </button>
              </div>

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

              <div className="flex gap-1 rounded-lg border border-border bg-muted/30 p-1">
                {LOGO_SHAPES.map((shape) => (
                  <button
                    key={shape.value}
                    type="button"
                    onClick={() => setLogoShape(shape.value)}
                    className={cn(
                      "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                      logoShape === shape.value
                        ? "bg-card text-foreground shadow-sm border border-dotted"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {shape.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Caption className="mb-2 block">Organization ID</Caption>
              <div className="rounded-lg border bg-muted px-4 py-3 text-sm font-medium">
                {organization.org_code ?? "--"}
              </div>
            </div>

            <TextInput label="Display Name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            <TextInput label="Registered Name" value={registeredName} onChange={(e) => setRegisteredName(e.target.value)} />

            <PhoneInput
              label="Support Phone"
              value={supportPhone}
              onChange={(v) => {
                setSupportPhone(v);
                setPhoneError(undefined);
              }}
              error={phoneError}
            />
          </div>

          {/* Remaining fields — 3 per row */}
          <div className="grid grid-cols-1 gap-5 border-border pt-6 sm:grid-cols-2 lg:grid-cols-3">
            <Select
              label="Country"
              options={countries.map((c) => ({ value: c.code, label: c.label }))}
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              placeholder="Select a country"
            />

            <Select
              label="Legal Entity Type"
              options={LEGAL_ENTITY_TYPES}
              value={legalEntityType}
              onChange={(e) => setLegalEntityType(e.target.value)}
              placeholder="Select entity type"
            />

            <TextInput label="PAN" value={pan} onChange={(e) => setPan(e.target.value.toUpperCase())} placeholder="e.g. AAAAA0000A" />
            <TextInput label="CIN" value={cin} onChange={(e) => setCin(e.target.value.toUpperCase())} placeholder="Corporate Identification Number" />
            <TextInput label="Industry Accreditation" value={industryAccreditation} onChange={(e) => setIndustryAccreditation(e.target.value)} placeholder="e.g. IATA, TAAI" />

            <TextInput label="Business Email" type="email" value={businessEmail} onChange={(e) => setBusinessEmail(e.target.value)} />
            <TextInput label="Website" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://" />
            <PhoneInput label="WhatsApp Number" value={whatsappNumber} onChange={setWhatsappNumber} />
            <TextInput label="Tagline" value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="A short line shown on customer-facing quotes" />

            <div className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-3">
              <label className="text-sm font-medium text-foreground">About</label>
              <textarea
                value={aboutText}
                onChange={(e) => setAboutText(e.target.value)}
                rows={3}
                placeholder="A short description shown on customer-facing documents"
                className="rounded border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
              />
            </div>
          </div>
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
