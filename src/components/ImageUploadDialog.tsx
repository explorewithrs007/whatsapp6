import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { LoadingButton } from "@/components/LoadingButton";
import { StandardDialog } from "@/components/StandardDialog";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { useMockSubmit } from "@/hooks/useMockSubmit";

type ImageUploadDialogProps = {
  currentImageUrl?: string;
  helperText: string;
  initials: string;
  name: string;
  onOpenChange: (open: boolean) => void;
  onRemove: () => void;
  onSave: (imageUrl: string) => void;
  open: boolean;
  removeLabel: string;
  saveLabel: string;
  title: string;
};

export function ImageUploadDialog({
  currentImageUrl,
  helperText,
  initials,
  name,
  onOpenChange,
  onRemove,
  onSave,
  open,
  removeLabel,
  saveLabel,
  title,
}: ImageUploadDialogProps) {
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState(currentImageUrl ?? "");
  const objectUrlRef = useRef<string | null>(null);
  const saveSubmit = useMockSubmit(450);

  useEffect(() => {
    if (!open) {
      return;
    }

    setError("");
    setPreviewUrl(currentImageUrl ?? "");
  }, [currentImageUrl, open]);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        window.URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (file.type !== "image/jpeg" && file.type !== "image/png") {
      setError("Please upload a JPG or PNG image.");
      event.target.value = "";
      return;
    }

    if (objectUrlRef.current) {
      window.URL.revokeObjectURL(objectUrlRef.current);
    }

    const nextPreviewUrl = window.URL.createObjectURL(file);
    objectUrlRef.current = nextPreviewUrl;
    setPreviewUrl(nextPreviewUrl);
    setError("");
  };

  const saveImage = () => {
    if (!previewUrl || saveSubmit.isSubmitting) {
      return;
    }

    saveSubmit.run(() => {
      onSave(previewUrl);
      onOpenChange(false);
    });
  };

  return (
    <StandardDialog
      description={helperText}
      footerLeft={
        currentImageUrl ? (
          <Button
            aria-label={removeLabel}
            className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={() => {
              onRemove();
              onOpenChange(false);
            }}
            type="button"
            variant="outline"
          >
            {removeLabel}
          </Button>
        ) : null
      }
      footerRight={
        <>
          <Button onClick={() => onOpenChange(false)} type="button" variant="ghost">
            Cancel
          </Button>
          <LoadingButton
            disabled={!previewUrl || Boolean(error)}
            isLoading={saveSubmit.isSubmitting}
            loadingText="Saving..."
            onClick={saveImage}
            type="button"
          >
            {saveLabel}
          </LoadingButton>
        </>
      }
      onOpenChange={onOpenChange}
      open={open}
      size="sm"
      title={title}
    >
      <div className="grid gap-5">
        <div className="flex items-center gap-4 rounded-2xl bg-slate-50 p-4">
          <UserAvatar avatarUrl={previewUrl} compact initials={initials} name={name} size="lg" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{name}</p>
            <p className="mt-1 text-xs text-muted-foreground">Current preview</p>
          </div>
        </div>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700">Upload image</span>
          <input
            accept="image/jpeg,image/png"
            aria-label={`Upload image for ${name}`}
            className="block w-full cursor-pointer rounded-xl border border-input bg-card text-sm text-foreground file:mr-4 file:border-0 file:bg-slate-100 file:px-4 file:py-2.5 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200"
            onChange={handleFileChange}
            type="file"
          />
          {error ? <span className="text-sm font-medium text-error">{error}</span> : null}
        </label>
      </div>
    </StandardDialog>
  );
}
