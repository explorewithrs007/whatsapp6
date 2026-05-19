import { useEffect, useState, type FocusEvent, type ReactNode } from "react";
import { AppIcons, type AppIcon } from "@/components/icons";
import { useWorkspaceSettings } from "@/components/WorkspaceSettingsContext";
import { Tooltip } from "@/components/ui/tooltip";
import { APP_NAME } from "@/lib/constants";
import { navigationGroups } from "@/lib/navigation";
import type { NavItem } from "@/lib/navigation";
import { cn } from "@/lib/utils";

type SidebarProps = {
  activePath: string;
  onNavigate?: (path: string) => void;
};

type SidebarNavItemProps = {
  icon: AppIcon;
  label: string;
  onClick: () => void;
  active: boolean;
};

export function Sidebar({ activePath, onNavigate }: SidebarProps) {
  const [expanded, setExpanded] = useState(false);
  const [focusedGroup, setFocusedGroup] = useState<string | null>(null);
  const [tourDismissed, setTourDismissed] = useState(false);
  const [tourFeedback, setTourFeedback] = useState("");
  const { business } = useWorkspaceSettings();

  useEffect(() => {
    if (!expanded) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setExpanded(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [expanded]);

  useEffect(() => {
    if (!tourFeedback) {
      return;
    }

    const timeout = window.setTimeout(() => setTourFeedback(""), 2400);

    return () => window.clearTimeout(timeout);
  }, [tourFeedback]);

  const handleBlur = (event: FocusEvent<HTMLElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setExpanded(false);
    }
  };

  return (
    <aside
      aria-label="Primary navigation"
      className="relative z-40 hidden h-screen w-20 shrink-0 border-r border-slate-300 bg-slate-100/80 md:block"
      onBlur={handleBlur}
      onFocus={() => setExpanded(true)}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      <CollapsedSidebar
        activePath={activePath}
        businessInitials={business.initials}
        businessLogoUrl={business.logoUrl}
        businessName={business.companyName}
        onFocusGroup={(groupLabel) => {
          setFocusedGroup(groupLabel);
          setExpanded(true);
        }}
      />
      {expanded ? (
        <ExpandedSidebar
          activePath={activePath}
          businessInitials={business.initials}
          businessLogoUrl={business.logoUrl}
          businessName={business.companyName}
          focusedGroup={focusedGroup}
          onDismissTour={() => setTourDismissed(true)}
          onNavigate={onNavigate}
          onStartTour={() => setTourFeedback("Navigation tour started.")}
          showTour={!tourDismissed}
        />
      ) : null}
      {tourFeedback ? (
        <div className="fixed left-24 top-4 z-[60] rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground shadow-soft">
          {tourFeedback}
        </div>
      ) : null}
    </aside>
  );
}

function CollapsedSidebar({
  activePath,
  businessInitials,
  businessLogoUrl,
  businessName,
  onFocusGroup,
}: {
  activePath: string;
  businessInitials: string;
  businessLogoUrl?: string;
  businessName: string;
  onFocusGroup: (groupLabel: string) => void;
}) {
  return (
    <div className="flex h-full w-20 flex-col items-center bg-slate-100/80">
      <div className="flex h-14 w-full items-center justify-center border-b border-slate-300">
        <SidebarBrandMark initials={businessInitials} logoUrl={businessLogoUrl} name={businessName} />
      </div>

      <nav className="subtle-scrollbar flex-1 overflow-y-auto py-3">
        <div className="flex flex-col items-center gap-3">
          {navigationGroups.map((group) => {
            const isActive = group.items.some((item) => isNavItemActive(item, activePath));
            const Icon = getGroupIcon(group.label);

            return (
              <SidebarNavItem
                active={isActive}
                icon={Icon}
                key={group.label}
                label={getCollapsedGroupLabel(group.label)}
                onClick={() => onFocusGroup(group.label)}
              />
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function ExpandedSidebar({
  activePath,
  businessInitials,
  businessLogoUrl,
  businessName,
  focusedGroup,
  onDismissTour,
  onNavigate,
  onStartTour,
  showTour,
}: {
  activePath: string;
  businessInitials: string;
  businessLogoUrl?: string;
  businessName: string;
  focusedGroup: string | null;
  onDismissTour: () => void;
  onNavigate?: (path: string) => void;
  onStartTour: () => void;
  showTour: boolean;
}) {
  const [openItems, setOpenItems] = useState<Set<string>>(() => getActiveParentPaths(activePath));

  useEffect(() => {
    const activeParentPaths = getActiveParentPaths(activePath);

    if (!activeParentPaths.size) {
      return;
    }

    setOpenItems((currentItems) => {
      const nextItems = new Set(currentItems);
      activeParentPaths.forEach((path) => nextItems.add(path));
      return nextItems;
    });
  }, [activePath]);

  const toggleItem = (item: NavItem) => {
    if (!item.children?.length) {
      onNavigate?.(item.path);
      return;
    }

    setOpenItems((currentItems) => {
      const nextItems = new Set(currentItems);

      if (nextItems.has(item.path)) {
        nextItems.delete(item.path);
      } else {
        nextItems.add(item.path);
      }

      return nextItems;
    });
  };

  return (
    <div
      className="absolute left-0 top-0 z-10 flex h-screen w-72 animate-[sidebar-overlay-in_200ms_ease-out] flex-col border-r border-slate-300 bg-card shadow-[12px_0_32px_rgba(15,23,42,0.10)]"
    >
      <div className="flex h-14 items-center gap-3 border-b border-slate-300 px-4">
        <SidebarBrandMark initials={businessInitials} logoUrl={businessLogoUrl} name={businessName} />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{APP_NAME}</p>
          <p className="truncate text-xs text-muted-foreground">Frontend MVP</p>
        </div>
      </div>

      <nav className="subtle-scrollbar flex-1 space-y-5 overflow-y-auto px-3 py-4 pr-2">
        {navigationGroups.map((group) => (
          <div
            className={cn(
              "rounded-xl transition-colors",
              focusedGroup === group.label && "bg-slate-50 py-1",
            )}
            key={group.label}
          >
            <p className="px-3 text-xs font-semibold uppercase tracking-normal text-muted">{group.label}</p>
            <div className="mt-2 space-y-1">
              {group.items.map((item) => (
                <ExpandedSidebarItem
                  active={isNavItemActive(item, activePath)}
                  childActive={Boolean(item.children?.some((child) => child.path === activePath))}
                  expanded={openItems.has(item.path)}
                  hasChildren={Boolean(item.children?.length)}
                  icon={item.icon}
                  key={item.path}
                  label={item.label}
                  onClick={() => toggleItem(item)}
                >
                  {openItems.has(item.path)
                    ? item.children?.map((child) => (
                        <ExpandedSidebarChildItem
                          active={child.path === activePath}
                          icon={child.icon}
                          key={child.path}
                          label={child.label}
                          onClick={() => onNavigate?.(child.path)}
                        />
                      ))
                    : null}
                </ExpandedSidebarItem>
              ))}
            </div>
          </div>
        ))}
      </nav>
      {showTour ? <SidebarTourCard onDismiss={onDismissTour} onStart={onStartTour} /> : null}
    </div>
  );
}

function SidebarBrandMark({
  initials,
  logoUrl,
  name,
}: {
  initials: string;
  logoUrl?: string;
  name: string;
}) {
  return (
    <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl bg-emerald-100 text-emerald-700">
      {logoUrl ? (
        <img alt={`${name} logo`} className="h-full w-full object-cover" src={logoUrl} />
      ) : (
        <span className="text-xs font-semibold">{initials}</span>
      )}
    </div>
  );
}

function SidebarNavItem({ active, icon: Icon, label, onClick }: SidebarNavItemProps) {
  const button = (
    <button
      aria-label={label}
      className={cn(
        "relative flex h-12 w-12 items-center justify-center rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-whatsapp",
        active
          ? "bg-emerald-100 text-emerald-700"
          : "text-slate-500 hover:bg-slate-100 hover:text-slate-700",
      )}
      onClick={onClick}
      type="button"
    >
      {active ? <span className="absolute left-0 h-6 w-1 rounded-r-full bg-emerald-600" /> : null}
      <Icon className="h-[22px] w-[22px]" />
    </button>
  );

  return (
    <Tooltip label={label} side="right" sideOffset={10}>
      {button}
    </Tooltip>
  );
}

function getGroupIcon(groupLabel: string) {
  if (groupLabel === "Dashboard") {
    return AppIcons.dashboard;
  }

  if (groupLabel === "Channels") {
    return AppIcons.message;
  }

  if (groupLabel === "CRM") {
    return AppIcons.users;
  }

  return AppIcons.accountSettings;
}

function getCollapsedGroupLabel(groupLabel: string) {
  return groupLabel === "Workspace & Settings" ? "Workspace" : groupLabel;
}

function ExpandedSidebarItem({
  active,
  childActive,
  children,
  expanded,
  hasChildren,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  childActive?: boolean;
  children?: ReactNode;
  expanded?: boolean;
  hasChildren?: boolean;
  icon: AppIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <div>
      <button
        aria-label={label}
        className={cn(
          "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-whatsapp",
          childActive
            ? "bg-emerald-50 text-emerald-700"
            : active
              ? "bg-emerald-100 text-emerald-700"
            : "text-slate-600 hover:bg-slate-50 hover:text-slate-800",
        )}
        onClick={onClick}
        type="button"
      >
        <Icon className="h-5 w-5 shrink-0" />
        <span className="min-w-0 flex-1 truncate">{label}</span>
        {hasChildren ? <AppIcons.chevronDown className={cn("h-4 w-4 shrink-0 transition-transform duration-200", expanded ? "rotate-180" : "-rotate-90")} /> : null}
      </button>
      {hasChildren ? (
        <div
          className={cn(
            "grid transition-[grid-template-rows,opacity] duration-200 ease-out",
            expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
          )}
        >
          <div className="min-h-0 overflow-hidden">
            <div className="mt-1 space-y-1 pl-6">{children}</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ExpandedSidebarChildItem({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: AppIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-whatsapp",
        active
          ? "bg-emerald-50 text-emerald-700 shadow-[inset_3px_0_0_rgba(18,140,126,0.75)]"
          : "text-slate-500 hover:bg-slate-50 hover:text-slate-800",
      )}
      onClick={onClick}
      type="button"
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{label}</span>
    </button>
  );
}

function isNavItemActive(item: NavItem, activePath: string) {
  return item.path === activePath || Boolean(item.children?.some((child) => child.path === activePath));
}

function getActiveParentPaths(activePath: string) {
  const parentPaths = new Set<string>();

  navigationGroups.forEach((group) => {
    group.items.forEach((item) => {
      if (item.children?.some((child) => child.path === activePath)) {
        parentPaths.add(item.path);
      }
    });
  });

  return parentPaths;
}

function SidebarTourCard({ onDismiss, onStart }: { onDismiss: () => void; onStart: () => void }) {
  return (
    <div className="shrink-0 border-t border-emerald-900/20 p-3">
      <div className="rounded-xl bg-whatsapp-dark p-3 text-white">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/12 text-white">
              <AppIcons.tour className="h-5 w-5" />
            </span>
            <p className="text-sm font-semibold leading-snug">Need a Quick Navigation Tour?</p>
          </div>
          <button
            aria-label="Dismiss navigation tour card"
            className="rounded-md p-1 text-white/70 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            onClick={onDismiss}
            type="button"
          >
            <AppIcons.close className="h-4 w-4" />
          </button>
        </div>
        <button
          aria-label="Start Quick Navigation Tour"
          className="mt-3 inline-flex h-8 w-full items-center justify-center rounded-lg bg-white text-sm font-semibold text-whatsapp-dark transition-colors hover:bg-whatsapp-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          onClick={onStart}
          type="button"
        >
          Start Tour
        </button>
      </div>
    </div>
  );
}
