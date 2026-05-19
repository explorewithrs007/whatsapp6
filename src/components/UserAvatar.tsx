import * as AvatarPrimitive from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type UserAvatarProps = {
  name: string;
  role?: string;
  initials: string;
  compact?: boolean;
  avatarUrl?: string;
  size?: "xs" | "sm" | "md" | "lg";
};

const avatarSizes = {
  xs: "h-5 w-5",
  sm: "h-9 w-9",
  md: "h-10 w-10",
  lg: "h-12 w-12",
};

const fallbackSizes = {
  xs: "text-[10px]",
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
};

export function UserAvatar({ name, role, initials, compact = false, avatarUrl, size = "md" }: UserAvatarProps) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <AvatarPrimitive.Root className={cn("flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-whatsapp-light", avatarSizes[size])}>
        {avatarUrl ? <AvatarPrimitive.Image alt={name} className="h-full w-full object-cover" src={avatarUrl} /> : null}
        <AvatarPrimitive.Fallback className={cn("font-semibold text-whatsapp-dark", fallbackSizes[size])}>
          {initials}
        </AvatarPrimitive.Fallback>
      </AvatarPrimitive.Root>
      {!compact ? (
        <div className="min-w-0">
          <p className={cn("truncate text-sm font-semibold text-foreground")}>{name}</p>
          {role ? <p className="truncate text-xs text-muted-foreground">{role}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
