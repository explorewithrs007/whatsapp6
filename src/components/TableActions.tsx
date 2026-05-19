import { AppIcons, type AppIcon } from "@/components/icons";
import * as DropdownMenu from "@/components/ui/dropdown-menu";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export type TableAction = {
  label: string;
  icon: AppIcon;
  onClick?: () => void;
  disabled?: boolean;
  variant?: ButtonProps["variant"];
  destructive?: boolean;
  showInOverflow?: boolean;
  tooltipAlign?: "center" | "end" | "start";
  tooltipSide?: "bottom" | "left" | "right" | "top";
};

type TableActionsProps = {
  actions: TableAction[];
  maxDirectActions?: number;
};

export function TableActions({ actions, maxDirectActions = 3 }: TableActionsProps) {
  const visibleActions = actions.filter(Boolean);
  const directCandidates = visibleActions.filter((action) => !action.showInOverflow && !action.destructive);
  const overflowCandidates = visibleActions.filter((action) => action.showInOverflow || action.destructive);
  const directActions = directCandidates.slice(0, maxDirectActions);
  const overflowActions = [...directCandidates.slice(maxDirectActions), ...overflowCandidates];

  return (
    <div className="flex items-center justify-end gap-1.5 pr-1">
      {directActions.map((action) => (
        <Tooltip
          key={action.label}
          align={action.tooltipAlign ?? "center"}
          label={action.label}
          side={action.tooltipSide ?? "top"}
          sideOffset={8}
        >
          <Button
            aria-label={action.label}
            className={cn("h-9 w-9 text-slate-500 hover:text-slate-700", action.destructive && "text-error hover:text-error")}
            disabled={action.disabled}
            onClick={action.onClick}
            size="icon"
            type="button"
            variant={action.variant ?? "ghost"}
          >
            <action.icon className="h-[18px] w-[18px]" />
          </Button>
        </Tooltip>
      ))}

      {overflowActions.length > 0 ? (
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <Button
              aria-label="More actions"
              className="h-9 w-9 text-slate-500 hover:text-slate-700"
              size="icon"
              type="button"
              variant="ghost"
            >
              <AppIcons.more className="h-[18px] w-[18px]" />
            </Button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              className="z-50 min-w-44 rounded-xl border border-border bg-card p-1 shadow-soft"
              sideOffset={6}
            >
              {overflowActions.map((action) => (
                <DropdownMenu.Item
                  key={action.label}
                  className={cn(
                    "flex cursor-pointer select-none items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground outline-none hover:bg-slate-100 focus:bg-slate-100",
                    action.disabled && "pointer-events-none opacity-50",
                    action.destructive && "text-error focus:text-error",
                  )}
                  disabled={action.disabled}
                  onSelect={(event) => {
                    if (action.disabled) {
                      event.preventDefault();
                      return;
                    }
                    action.onClick?.();
                  }}
                >
                  <action.icon className="h-[18px] w-[18px]" />
                  {action.label}
                </DropdownMenu.Item>
              ))}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      ) : null}
    </div>
  );
}
