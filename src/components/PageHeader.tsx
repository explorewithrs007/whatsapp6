import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
};

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 border-b border-slate-200/80 pb-3 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0 flex-1 lg:min-w-[320px]">
        <h1 className="text-2xl font-semibold tracking-normal text-foreground">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm font-normal text-muted-foreground lg:whitespace-nowrap">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto lg:justify-end">{actions}</div> : null}
    </div>
  );
}
