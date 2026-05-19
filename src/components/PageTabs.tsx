import type { ReactNode } from "react";
import * as Tabs from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type PageTab = {
  value: string;
  label: string;
  content: ReactNode;
};

type PageTabsProps = {
  tabs: PageTab[];
  defaultValue: string;
  value?: string;
  onValueChange?: (value: string) => void;
};

export function PageTabs({ tabs, defaultValue, value, onValueChange }: PageTabsProps) {
  return (
    <Tabs.Root defaultValue={defaultValue} onValueChange={onValueChange} value={value}>
      <Tabs.List className="inline-flex max-w-full overflow-x-auto rounded-xl bg-slate-100 p-1">
        {tabs.map((tab) => (
          <Tabs.Trigger
            key={tab.value}
            value={tab.value}
            className={cn(
              "shrink-0 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 outline-none transition-colors hover:text-slate-800 2xl:px-4 2xl:text-[15px]",
              "data-[state=active]:bg-card data-[state=active]:text-whatsapp-dark data-[state=active]:shadow-sm",
            )}
          >
            {tab.label}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
      {tabs.map((tab) => (
        <Tabs.Content key={tab.value} value={tab.value} className="mt-5 outline-none">
          {tab.content}
        </Tabs.Content>
      ))}
    </Tabs.Root>
  );
}
