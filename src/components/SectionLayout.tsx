import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SectionHeaderProps = {
  actions?: ReactNode;
  className?: string;
  description?: string;
  title: string;
};

export function SectionHeader({ actions, className, description, title }: SectionHeaderProps) {
  return (
    <div className={cn("mb-4 flex flex-col gap-3 border-b border-slate-200 pb-3 lg:flex-row lg:items-start lg:justify-between", className)}>
      <div className="min-w-0 flex-1 lg:min-w-[320px]">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {description ? <p className="mt-1 text-sm font-normal text-muted-foreground lg:whitespace-nowrap">{description}</p> : null}
      </div>
      {actions ? <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto lg:justify-end">{actions}</div> : null}
    </div>
  );
}

export type DetailGridItem = {
  content?: ReactNode;
  label: string;
  value?: ReactNode;
};

type DetailGridProps = {
  className?: string;
  columns?: "two" | "three" | "four";
  items: DetailGridItem[];
};

const columnClasses = {
  two: "md:grid-cols-2",
  three: "md:grid-cols-2 xl:grid-cols-3",
  four: "sm:grid-cols-2 xl:grid-cols-4",
};

export function DetailGrid({ className, columns = "three", items }: DetailGridProps) {
  return (
    <div className={cn("grid gap-x-8 gap-y-4", columnClasses[columns], className)}>
      {items.map((item, index) => (
        <div key={`${item.label}-${index}`} className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-normal text-slate-500">{item.label}</p>
          <div className="mt-1.5 text-sm font-normal text-foreground">{item.content ?? item.value}</div>
        </div>
      ))}
    </div>
  );
}
