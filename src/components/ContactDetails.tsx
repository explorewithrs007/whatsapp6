import type { ReactNode } from "react";
import { AvatarWithName } from "@/components/AvatarWithName";
import { AppIcons } from "@/components/icons";
import { UserAvatar } from "@/components/UserAvatar";
import { cn } from "@/lib/utils";

export function ContactIdentityBlock({
  avatarUrl,
  initials,
  name,
  phone,
  email,
}: {
  avatarUrl?: string;
  email?: string;
  initials: string;
  name: string;
  phone: string;
}) {
  return (
    <div className="flex w-full min-w-0 items-center gap-3">
      <UserAvatar avatarUrl={avatarUrl} compact initials={initials} name={name} size="lg" />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-foreground">{name}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">{phone}</p>
        {email ? <p className="mt-0.5 truncate text-xs text-muted-foreground">{email}</p> : null}
      </div>
    </div>
  );
}

export function DetailField({
  children,
  className,
  label,
  value,
}: {
  children?: ReactNode;
  className?: string;
  label: string;
  value?: ReactNode;
}) {
  const isMissingValue = value === "Not available" || value === "Unassigned" || value === "—";

  return (
    <div className={cn("w-full min-w-0", className)}>
      <p className="text-xs font-semibold uppercase tracking-normal text-slate-500">{label}</p>
      {children ?? (
        <div className={cn("mt-1.5 text-sm leading-6", isMissingValue ? "text-slate-500" : "text-foreground")}>
          {value}
        </div>
      )}
    </div>
  );
}

export function ProfileSection({
  children,
  className,
  title,
}: {
  children: ReactNode;
  className?: string;
  title: string;
}) {
  return (
    <section className={cn("border-t border-slate-200 pt-4", className)}>
      <p className="text-xs font-semibold uppercase tracking-normal text-slate-500">{title}</p>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export function ProfileAccordionSection({
  children,
  className,
  isOpen,
  onOpenChange,
  summary,
  title,
}: {
  children: ReactNode;
  className?: string;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  summary?: ReactNode;
  title: string;
}) {
  return (
    <section className={cn("border-t border-slate-200 pt-4", className)}>
      <button
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-3 rounded-xl border border-transparent bg-slate-50/80 px-3 py-2.5 text-left transition-colors hover:border-slate-200 hover:bg-slate-100/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-whatsapp"
        onClick={() => onOpenChange(!isOpen)}
        type="button"
      >
        <span className="min-w-0">
          <span className="block text-xs font-semibold uppercase tracking-normal text-slate-500">{title}</span>
          {summary ? <span className="mt-1 block truncate text-xs text-muted-foreground">{summary}</span> : null}
        </span>
        <AppIcons.chevronDown
          className={cn("h-5 w-5 shrink-0 text-slate-500 transition-transform", isOpen && "rotate-180")}
        />
      </button>
      {isOpen ? <div className="mt-3 px-1">{children}</div> : null}
    </section>
  );
}

export function DetailTagList({ tags }: { tags: string[] }) {
  if (!tags.length) {
    return <p className="mt-2 text-sm text-muted-foreground">Not available</p>;
  }

  return (
    <div className="mt-2 flex w-full flex-wrap gap-2">
      {tags.map((tag) => (
        <span key={tag} className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600">
          {tag}
        </span>
      ))}
    </div>
  );
}

export function InternalNoteCard({
  author,
  className,
  content,
  timestamp,
}: {
  author: string;
  className?: string;
  content: string;
  timestamp: string;
}) {
  return (
    <div className={cn("w-full min-w-0 rounded-xl bg-slate-50 p-4", className)}>
      <div className="flex items-start justify-between gap-3">
        <AvatarWithName name={author} size="sm" />
        <span className="shrink-0 text-xs text-muted">{timestamp}</span>
      </div>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{content}</p>
    </div>
  );
}
