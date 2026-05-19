import { AppIcons, type AppIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type EmptyStateVariant =
  | "activity"
  | "contacts"
  | "conversations"
  | "files"
  | "filters"
  | "generic"
  | "notes"
  | "search"
  | "settings"
  | "templates"
  | "triggers";

type EmptyStateProps = {
  actionLabel?: string;
  compact?: boolean;
  description?: string;
  icon?: AppIcon;
  onAction?: () => void;
  onSecondaryAction?: () => void;
  secondaryActionLabel?: string;
  title?: string;
  variant?: EmptyStateVariant;
};

const emptyStateDefaults: Record<EmptyStateVariant, { description: string; icon: AppIcon; title: string }> = {
  activity: {
    description: "New conversations, assignments, and updates will appear here.",
    icon: AppIcons.clock,
    title: "No recent activity",
  },
  contacts: {
    description: "Try searching by name, phone, email, or tag.",
    icon: AppIcons.contact,
    title: "No contacts found",
  },
  conversations: {
    description: "Try adjusting your search or filters.",
    icon: AppIcons.whatsappInbox,
    title: "No conversations found",
  },
  files: {
    description: "Images, documents, and media shared in this conversation will appear here.",
    icon: AppIcons.attachment,
    title: "No attachments yet",
  },
  filters: {
    description: "Try changing your search or clearing filters.",
    icon: AppIcons.filter,
    title: "No results found",
  },
  generic: {
    description: "Once there is activity, it will show up here.",
    icon: AppIcons.empty,
    title: "Nothing here yet",
  },
  notes: {
    description: "Add private context for your team. Customers will not see these notes.",
    icon: AppIcons.addNote,
    title: "No internal notes yet",
  },
  search: {
    description: "Try a different keyword or clear your filters.",
    icon: AppIcons.search,
    title: "No results found",
  },
  settings: {
    description: "Settings and workspace details will appear here when available.",
    icon: AppIcons.accountSettings,
    title: "Nothing configured yet",
  },
  templates: {
    description: "Create your first approved WhatsApp template to use in conversations.",
    icon: AppIcons.template,
    title: "No templates yet",
  },
  triggers: {
    description: "Create keyword-based auto-responses for common customer questions.",
    icon: AppIcons.trigger,
    title: "No triggers found",
  },
};

export function EmptyState({
  actionLabel,
  compact = false,
  description,
  icon,
  onAction,
  onSecondaryAction,
  secondaryActionLabel,
  title,
  variant = "generic",
}: EmptyStateProps) {
  const defaults = emptyStateDefaults[variant];
  const Icon = icon ?? defaults.icon;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl bg-slate-50/80 text-center ring-1 ring-slate-200/70",
        compact ? "min-h-32 px-3 py-4" : "min-h-56 px-4 py-8",
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center rounded-2xl border border-emerald-200/70 bg-whatsapp-light text-whatsapp-dark",
          compact ? "h-11 w-11" : "h-14 w-14",
        )}
      >
        <Icon className={compact ? "h-6 w-6" : "h-8 w-8"} />
      </div>
      <h3 className={cn("font-semibold text-foreground", compact ? "mt-3 text-sm" : "mt-4 text-base")}>{title ?? defaults.title}</h3>
      <p className={cn("mt-1 max-w-sm text-muted-foreground", compact ? "text-xs" : "text-sm")}>
        {description ?? defaults.description}
      </p>
      {actionLabel || secondaryActionLabel ? (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {actionLabel ? (
            <Button onClick={onAction} size="sm" type="button">
              {actionLabel}
            </Button>
          ) : null}
          {secondaryActionLabel ? (
            <Button onClick={onSecondaryAction} size="sm" type="button" variant="outline">
              {secondaryActionLabel}
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
