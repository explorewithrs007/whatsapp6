import { AppIcons } from "@/components/icons";
import * as DropdownMenu from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export type ActionMenuItem = {
  label: string;
  onSelect?: () => void;
};

type ActionMenuProps = {
  items: ActionMenuItem[];
};

export function ActionMenu({ items }: ActionMenuProps) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button aria-label="Open row actions" size="icon" variant="ghost">
          <AppIcons.more className="h-[18px] w-[18px]" />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          className="z-50 min-w-40 rounded-xl border border-border bg-card p-1 shadow-soft"
        >
          {items.map((item) => (
            <DropdownMenu.Item
              key={item.label}
              className="cursor-pointer rounded-lg px-3 py-2 text-sm text-foreground outline-none hover:bg-slate-50"
              onSelect={item.onSelect}
            >
              {item.label}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
