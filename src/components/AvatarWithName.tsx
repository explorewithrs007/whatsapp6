import { UserAvatar } from "@/components/UserAvatar";
import { cn } from "@/lib/utils";

type AvatarWithNameProps = {
  avatarUrl?: string;
  className?: string;
  initials?: string;
  meta?: string;
  name: string;
  size?: "xs" | "sm" | "md" | "lg";
};

export function AvatarWithName({ avatarUrl, className, initials, meta, name, size = "sm" }: AvatarWithNameProps) {
  return (
    <div className={cn("flex min-w-0 items-center", size === "xs" ? "gap-1.5" : "gap-2.5", className)}>
      <UserAvatar
        avatarUrl={avatarUrl}
        compact
        initials={initials ?? getInitials(name)}
        name={name}
        size={size}
      />
      <div className="min-w-0">
        <p className={cn("truncate font-medium text-foreground", size === "xs" ? "text-xs" : "text-sm")}>{name}</p>
        {meta ? <p className="mt-0.5 truncate text-xs text-muted-foreground">{meta}</p> : null}
      </div>
    </div>
  );
}

function getInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);

  if (!words.length) {
    return "NA";
  }

  return words.slice(0, 2).map((word) => word[0]?.toUpperCase()).join("");
}
