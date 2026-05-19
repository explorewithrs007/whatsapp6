import { useEffect, useState, type ReactNode } from "react";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { ImageUploadDialog } from "@/components/ImageUploadDialog";
import { LoadingButton } from "@/components/LoadingButton";
import { SectionCard } from "@/components/SectionCard";
import { useAppToast } from "@/components/AppToast";
import { useWorkspaceSettings } from "@/components/WorkspaceSettingsContext";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMockSubmit } from "@/hooks/useMockSubmit";

type AccountSettingsPageProps = {
  activeSection?: "profile" | "business";
};

type FieldError = {
  businessName?: string;
  fullName?: string;
};

export function AccountSettingsPage({ activeSection = "profile" }: AccountSettingsPageProps) {
  return activeSection === "business" ? <BusinessInformationPage /> : <ProfileManagementPage />;
}

function ProfileManagementPage() {
  const { profile, updateProfile } = useWorkspaceSettings();
  const [draft, setDraft] = useState(profile);
  const [errors, setErrors] = useState<FieldError>({});
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [removeAvatarDialogOpen, setRemoveAvatarDialogOpen] = useState(false);
  const submit = useMockSubmit();
  const removeAvatarSubmit = useMockSubmit(450);
  const toast = useAppToast();

  useEffect(() => {
    setDraft(profile);
  }, [profile]);

  const saveProfile = () => {
    if (submit.isSubmitting) {
      return;
    }

    if (!draft.fullName.trim()) {
      setErrors({ fullName: "Full name is required." });
      return;
    }

    setErrors({});
    submit.run(
      () => {
        updateProfile({
          ...draft,
          fullName: draft.fullName.trim(),
          email: draft.email.trim(),
          initials: getInitials(draft.fullName),
        });
      },
      {
        onError: () => toast.error("Something went wrong. Please try again."),
        onSuccess: () => toast.success("Profile updated."),
      },
    );
  };

  const saveAvatar = (avatarUrl: string) => {
    updateProfile({ ...profile, avatarUrl });
    toast.success("Profile avatar updated.");
  };

  const confirmRemoveAvatar = () => {
    if (removeAvatarSubmit.isSubmitting) {
      return;
    }

    removeAvatarSubmit.run(() => {
      updateProfile({ ...profile, avatarUrl: undefined });
      setRemoveAvatarDialogOpen(false);
      toast.success("Profile avatar removed.");
    });
  };

  return (
    <SettingsPageShell
      description="Manage your personal profile and account details."
      title="Profile Management"
    >
      <SectionCard className="max-w-4xl">
        <SettingsSummary
          action={
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setAvatarDialogOpen(true)} type="button" variant="outline">
                Change Avatar
              </Button>
              {profile.avatarUrl ? (
                <Button
                  aria-label="Remove avatar"
                  className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={() => setRemoveAvatarDialogOpen(true)}
                  type="button"
                  variant="outline"
                >
                  Remove Avatar
                </Button>
              ) : null}
            </div>
          }
          avatarUrl={profile.avatarUrl}
          initials={profile.initials}
          name={profile.fullName}
          subtitle={profile.email}
        />

        <div className="mt-6 grid max-w-2xl gap-4">
          <Field error={errors.fullName} label="Full Name">
            <Input
              aria-invalid={Boolean(errors.fullName)}
              onChange={(event) => setDraft({ ...draft, fullName: event.target.value })}
              value={draft.fullName}
            />
          </Field>
          <Field label="Email">
            <Input
              onChange={(event) => setDraft({ ...draft, email: event.target.value })}
              value={draft.email}
            />
          </Field>
        </div>

        <div className="mt-6">
          <LoadingButton
            isLoading={submit.isSubmitting}
            loadingText="Saving..."
            onClick={saveProfile}
            type="button"
          >
            Save Changes
          </LoadingButton>
        </div>
      </SectionCard>

      <ImageUploadDialog
        currentImageUrl={profile.avatarUrl}
        helperText="JPG or PNG. Recommended square image."
        initials={profile.initials}
        name={profile.fullName}
        onOpenChange={setAvatarDialogOpen}
        onRemove={() => setRemoveAvatarDialogOpen(true)}
        onSave={saveAvatar}
        open={avatarDialogOpen}
        removeLabel="Remove Avatar"
        saveLabel="Save Avatar"
        title="Update Profile Avatar"
      />
      <ConfirmationDialog
        closeOnConfirm={false}
        confirmLabel="Remove Avatar"
        confirmLoadingLabel="Removing..."
        description="This will remove your current profile photo and show your initials instead."
        isConfirming={removeAvatarSubmit.isSubmitting}
        onConfirm={confirmRemoveAvatar}
        onOpenChange={setRemoveAvatarDialogOpen}
        open={removeAvatarDialogOpen}
        title="Remove profile avatar?"
      />
    </SettingsPageShell>
  );
}

function BusinessInformationPage() {
  const { business, updateBusiness } = useWorkspaceSettings();
  const [draft, setDraft] = useState(business);
  const [errors, setErrors] = useState<FieldError>({});
  const [logoDialogOpen, setLogoDialogOpen] = useState(false);
  const [removeLogoDialogOpen, setRemoveLogoDialogOpen] = useState(false);
  const submit = useMockSubmit();
  const removeLogoSubmit = useMockSubmit(450);
  const toast = useAppToast();

  useEffect(() => {
    setDraft(business);
  }, [business]);

  const saveBusiness = () => {
    if (submit.isSubmitting) {
      return;
    }

    if (!draft.companyName.trim()) {
      setErrors({ businessName: "Company name is required." });
      return;
    }

    setErrors({});
    submit.run(
      () => {
        updateBusiness({
          ...draft,
          address: draft.address.trim(),
          companyName: draft.companyName.trim(),
          industry: draft.industry.trim(),
          initials: getInitials(draft.companyName),
        });
      },
      {
        onError: () => toast.error("Something went wrong. Please try again."),
        onSuccess: () => toast.success("Business information updated."),
      },
    );
  };

  const saveLogo = (logoUrl: string) => {
    updateBusiness({ ...business, logoUrl });
    toast.success("Business logo updated.");
  };

  const confirmRemoveLogo = () => {
    if (removeLogoSubmit.isSubmitting) {
      return;
    }

    removeLogoSubmit.run(() => {
      updateBusiness({ ...business, logoUrl: undefined });
      setRemoveLogoDialogOpen(false);
      toast.success("Business logo removed.");
    });
  };

  return (
    <SettingsPageShell
      description="Manage your workspace business profile and support details."
      title="Business Information"
    >
      <SectionCard className="max-w-4xl">
        <SettingsSummary
          action={
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setLogoDialogOpen(true)} type="button" variant="outline">
                Change Logo
              </Button>
              {business.logoUrl ? (
                <Button
                  aria-label="Remove business logo"
                  className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={() => setRemoveLogoDialogOpen(true)}
                  type="button"
                  variant="outline"
                >
                  Remove Logo
                </Button>
              ) : null}
            </div>
          }
          avatarUrl={business.logoUrl}
          initials={business.initials}
          name={business.companyName}
          subtitle={business.industry}
        />

        <div className="mt-6 grid max-w-2xl gap-4">
          <Field error={errors.businessName} label="Company Name">
            <Input
              aria-invalid={Boolean(errors.businessName)}
              onChange={(event) => setDraft({ ...draft, companyName: event.target.value })}
              value={draft.companyName}
            />
          </Field>
          <Field label="Address">
            <Input
              onChange={(event) => setDraft({ ...draft, address: event.target.value })}
              value={draft.address}
            />
          </Field>
          <Field label="Industry">
            <Input
              onChange={(event) => setDraft({ ...draft, industry: event.target.value })}
              value={draft.industry}
            />
          </Field>
        </div>

        <div className="mt-6">
          <LoadingButton
            isLoading={submit.isSubmitting}
            loadingText="Saving..."
            onClick={saveBusiness}
            type="button"
          >
            Save Business Information
          </LoadingButton>
        </div>
      </SectionCard>

      <ImageUploadDialog
        currentImageUrl={business.logoUrl}
        helperText="JPG or PNG. Recommended square logo."
        initials={business.initials}
        name={business.companyName}
        onOpenChange={setLogoDialogOpen}
        onRemove={() => setRemoveLogoDialogOpen(true)}
        onSave={saveLogo}
        open={logoDialogOpen}
        removeLabel="Remove Logo"
        saveLabel="Save Logo"
        title="Update Business Logo"
      />
      <ConfirmationDialog
        closeOnConfirm={false}
        confirmLabel="Remove Logo"
        confirmLoadingLabel="Removing..."
        description="This will remove your current business logo and show the initials instead."
        isConfirming={removeLogoSubmit.isSubmitting}
        onConfirm={confirmRemoveLogo}
        onOpenChange={setRemoveLogoDialogOpen}
        open={removeLogoDialogOpen}
        title="Remove business logo?"
      />
    </SettingsPageShell>
  );
}

function SettingsPageShell({
  children,
  description,
  title,
}: {
  children: ReactNode;
  description: string;
  title: string;
}) {
  return (
    <div className="w-full space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-normal text-foreground">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );
}

function SettingsSummary({
  action,
  avatarUrl,
  initials,
  name,
  subtitle,
}: {
  action: ReactNode;
  avatarUrl?: string;
  initials: string;
  name: string;
  subtitle: string;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-4">
        <UserAvatar avatarUrl={avatarUrl} compact initials={initials} name={name} size="lg" />
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-foreground">{name}</p>
          <p className="mt-1 truncate text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      {action}
    </div>
  );
}

function Field({
  children,
  error,
  label,
}: {
  children: ReactNode;
  error?: string;
  label: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {children}
      {error ? <span className="text-sm font-medium text-error">{error}</span> : null}
    </label>
  );
}

function getInitials(value: string) {
  const initials = value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return initials || "NA";
}
