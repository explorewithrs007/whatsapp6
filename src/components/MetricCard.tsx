import type { AppIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

type MetricCardProps = {
  title: string;
  value: string;
  description?: string;
  icon: AppIcon;
  tone?: "default" | "green" | "amber";
  onClick?: () => void;
};

export function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  tone = "default",
  onClick,
}: MetricCardProps) {
  return (
    <section
      className={cn(
        "h-full rounded-xl border border-border bg-card p-4 transition-colors 2xl:p-5",
        onClick && "cursor-pointer hover:border-whatsapp/30 hover:bg-whatsapp-light/40",
      )}
      onClick={onClick}
      onKeyDown={(event) => {
        if (onClick && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          onClick();
        }
      }}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="flex min-h-20 items-start justify-between gap-3 2xl:min-h-24">
        <div>
          <p className="text-sm font-medium text-muted-foreground 2xl:text-[15px]">{title}</p>
          <p className="mt-2 text-2xl font-semibold leading-none tracking-normal text-foreground 2xl:text-3xl">{value}</p>
          {description ? <p className="mt-2 text-sm text-muted-foreground">{description}</p> : null}
        </div>
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border 2xl:h-11 2xl:w-11",
            tone === "green" && "border-whatsapp/20 bg-whatsapp-light text-whatsapp-dark",
            tone === "amber" && "border-warning/20 bg-amber-50 text-warning",
            tone === "default" && "border-border bg-slate-50 text-muted-foreground",
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </section>
  );
}
