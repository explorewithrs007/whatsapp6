import { StandardDialog } from "@/components/StandardDialog";
import { LoadingButton } from "@/components/LoadingButton";
import { Button } from "@/components/ui/button";

type ConfirmationDialogProps = {
  open: boolean;
  title: string;
  description: string;
  closeOnConfirm?: boolean;
  confirmLabel?: string;
  confirmLoadingLabel?: string;
  isConfirming?: boolean;
  cancelLabel?: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export function ConfirmationDialog({
  open,
  title,
  description,
  closeOnConfirm = true,
  confirmLabel = "Confirm",
  confirmLoadingLabel,
  isConfirming = false,
  cancelLabel = "Cancel",
  onOpenChange,
  onConfirm,
}: ConfirmationDialogProps) {
  return (
    <StandardDialog
      description={description}
      footerRight={
        <>
          <Button disabled={isConfirming} onClick={() => onOpenChange(false)} variant="outline">{cancelLabel}</Button>
          <LoadingButton
            isLoading={isConfirming}
            loadingText={confirmLoadingLabel}
            onClick={() => {
              onConfirm();
              if (closeOnConfirm) {
                onOpenChange(false);
              }
            }}
            variant="destructive"
          >
            {confirmLabel}
          </LoadingButton>
        </>
      }
      onOpenChange={onOpenChange}
      open={open}
      showCloseButton={false}
      size="sm"
      title={title}
    />
  );
}
