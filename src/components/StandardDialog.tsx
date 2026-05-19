import type { ReactNode } from "react";
import { AppIcons } from "@/components/icons";
import * as Dialog from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type StandardDialogProps = {
  children?: ReactNode;
  description?: string;
  footerLeft?: ReactNode;
  footerRight?: ReactNode;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  showCloseButton?: boolean;
  size?: "sm" | "md" | "lg";
  title: string;
};

const sizeClasses = {
  sm: "max-w-md",
  md: "max-w-xl",
  lg: "max-w-4xl",
};

export function StandardDialog({
  children,
  description,
  footerLeft,
  footerRight,
  onOpenChange,
  open,
  showCloseButton = true,
  size = "md",
  title,
}: StandardDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/30" />
        <Dialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 flex max-h-[calc(100vh-3rem)] w-[calc(100%_-_2rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft sm:w-[calc(100%_-_3rem)]",
            sizeClasses[size],
          )}
        >
          {showCloseButton ? (
            <Dialog.Close asChild>
              <Button
                aria-label="Close dialog"
                className="absolute right-4 top-4 h-8 w-8 rounded-lg"
                size="icon"
                variant="ghost"
              >
                <AppIcons.close className="h-[18px] w-[18px]" />
              </Button>
            </Dialog.Close>
          ) : null}

          <div className={cn("shrink-0 p-5 pb-0", showCloseButton ? "pr-14" : undefined)}>
            <Dialog.Title className="text-xl font-semibold tracking-normal text-foreground">{title}</Dialog.Title>
            {description ? (
              <Dialog.Description className="mt-1.5 text-sm text-muted-foreground">
                {description}
              </Dialog.Description>
            ) : null}
          </div>

          {children ? <div className="subtle-scrollbar mt-5 min-h-0 flex-1 overflow-y-auto px-5">{children}</div> : null}

          {footerLeft || footerRight ? (
            <div className="mt-5 flex shrink-0 flex-col gap-3 border-t border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-2">{footerLeft}</div>
              <div className="flex flex-wrap justify-end gap-2">{footerRight}</div>
            </div>
          ) : (
            <div className="h-5 shrink-0" />
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
