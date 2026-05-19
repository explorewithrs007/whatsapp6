import { useEffect, useMemo, useRef, useState } from "react";
import { EmptyState } from "@/components/EmptyState";
import { AppIcons, type AppIcon } from "@/components/icons";
import { ListSkeleton } from "@/components/LoadingStates";
import { StandardDialog } from "@/components/StandardDialog";
import { StatusBadge } from "@/components/StatusBadge";
import { UserAvatar } from "@/components/UserAvatar";
import { Input } from "@/components/ui/input";
import { useAppToast } from "@/components/AppToast";
import { navigationGroups, type NavItem } from "@/lib/navigation";
import { conversations, templates } from "@/modules/channels/channels.data";
import { contacts } from "@/modules/crm/crm.data";

type GlobalSearchProps = {
  onNavigate?: (path: string) => void;
};

type SearchCategory = "Conversations" | "Contacts" | "Templates" | "Settings";

type SearchResult = {
  badge?: string;
  category: SearchCategory;
  description: string;
  icon: AppIcon;
  id: string;
  path?: string;
  searchText: string;
  title: string;
};

type SearchResultGroup = {
  category: SearchCategory;
  hiddenCount: number;
  items: SearchResult[];
};

const searchPlaceholder = "Search contacts, conversations, templates...";
const categoryOrder: SearchCategory[] = ["Conversations", "Contacts", "Templates", "Settings"];
const resultLimitPerCategory = 5;

export function GlobalSearch({ onNavigate }: GlobalSearchProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const toast = useAppToast();

  const groupedResults = useMemo(() => getSearchResultGroups(query), [query]);
  const hasResults = groupedResults.some((group) => group.items.length);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isShortcut = event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey);

      if (isShortcut) {
        event.preventDefault();
        setDialogOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (!dialogOpen) {
      return;
    }

    const timeout = window.setTimeout(() => inputRef.current?.focus(), 0);

    return () => window.clearTimeout(timeout);
  }, [dialogOpen]);

  useEffect(() => {
    if (!dialogOpen) {
      return;
    }

    setIsSearching(true);
    const timeout = window.setTimeout(() => setIsSearching(false), 160);

    return () => window.clearTimeout(timeout);
  }, [dialogOpen, query]);

  const clearDialog = () => {
    setDialogOpen(false);
    setQuery("");
  };

  const selectResult = (result: SearchResult) => {
    clearDialog();

    if (result.path) {
      onNavigate?.(result.path);
      return;
    }

    toast.info(`${result.category.slice(0, -1)} selected.`);
  };

  return (
    <>
      <button
        aria-label="Search workspace"
        className="relative flex h-10 min-w-[180px] max-w-lg flex-1 items-center rounded-xl border border-border bg-card px-3 text-left text-sm text-muted-foreground transition-colors hover:border-slate-300 hover:bg-slate-50/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-whatsapp"
        onClick={() => setDialogOpen(true)}
        type="button"
      >
        <AppIcons.search className="mr-2 h-5 w-5 shrink-0 text-muted" />
        <span className="min-w-0 flex-1 truncate">{searchPlaceholder}</span>
        <SearchShortcutHint />
      </button>

      <StandardDialog
        description="Search across conversations, contacts, templates, and settings."
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setQuery("");
          }
        }}
        open={dialogOpen}
        size="lg"
        title="Search Workspace"
      >
        <div className="flex h-[min(620px,calc(100vh-12rem))] min-h-[420px] flex-col gap-4">
          <div className="relative shrink-0">
            <AppIcons.search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
            <Input
              aria-label="Search workspace"
              className="h-11 pl-10 pr-14"
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              ref={inputRef}
              value={query}
            />
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
              <SearchShortcutHint />
            </div>
          </div>

          <div className="subtle-scrollbar min-h-0 flex-1 overflow-y-auto pr-1">
            {isSearching ? (
              <ListSkeleton rows={8} />
            ) : hasResults ? (
              <SearchResultGroups groups={groupedResults} onSelect={selectResult} />
            ) : (
              <div className="flex h-full items-center justify-center">
                <EmptyState
                  actionLabel="Clear search"
                  compact
                  description="Try searching by contact, phone, message, template, or setting."
                  onAction={() => setQuery("")}
                  title="No results found"
                  variant="search"
                />
              </div>
            )}
          </div>
        </div>
      </StandardDialog>
    </>
  );
}

function SearchShortcutHint() {
  const shortcutLabel =
    typeof navigator !== "undefined" && /Mac|iPhone|iPad/i.test(navigator.platform) ? "Cmd K" : "Ctrl K";

  return (
    <kbd className="ml-2 shrink-0 rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[11px] font-medium leading-none text-slate-500">
      {shortcutLabel}
    </kbd>
  );
}

function SearchResultGroups({
  groups,
  onSelect,
}: {
  groups: SearchResultGroup[];
  onSelect: (result: SearchResult) => void;
}) {
  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <section key={group.category}>
          <div className="flex items-center justify-between gap-3 px-1">
            <p className="text-xs font-semibold uppercase tracking-normal text-muted">{group.category}</p>
            {group.hiddenCount > 0 ? (
              <p className="text-xs text-muted-foreground">+{group.hiddenCount} more</p>
            ) : null}
          </div>
          <div className="mt-2 divide-y divide-slate-200 rounded-xl bg-slate-50/80 ring-1 ring-slate-200/70">
            {group.items.map((result) => (
              <SearchResultRow key={result.id} onSelect={() => onSelect(result)} result={result} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function SearchResultRow({ onSelect, result }: { onSelect: () => void; result: SearchResult }) {
  const Icon = result.icon;

  return (
    <button
      className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors first:rounded-t-xl last:rounded-b-xl hover:bg-whatsapp-light/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-whatsapp"
      onClick={onSelect}
      type="button"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-card text-muted-foreground ring-1 ring-slate-200">
        {result.category === "Contacts" ? (
          <UserAvatar compact initials={getInitials(result.title)} name={result.title} size="sm" />
        ) : (
          <Icon className="h-5 w-5" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-foreground">{result.title}</span>
        <span className="mt-0.5 block truncate text-xs text-muted-foreground">{result.description}</span>
      </span>
      {result.badge ? <StatusBadge status={result.badge} /> : null}
      <AppIcons.chevronDown className="h-4 w-4 -rotate-90 text-muted" />
    </button>
  );
}

function getSearchResultGroups(query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  const results = getAllSearchResults();
  const filteredResults = normalizedQuery
    ? results.filter((result) => result.searchText.includes(normalizedQuery))
    : getDefaultSearchResults(results);

  return categoryOrder
    .map((category) => {
      const categoryResults = filteredResults.filter((result) => result.category === category);

      return {
        category,
        hiddenCount: Math.max(categoryResults.length - resultLimitPerCategory, 0),
        items: categoryResults.slice(0, resultLimitPerCategory),
      };
    })
    .filter((group) => group.items.length);
}

function getAllSearchResults(): SearchResult[] {
  return [
    ...conversations.map((conversation) => createSearchResult({
      badge: conversation.status,
      category: "Conversations",
      description: conversation.lastMessage,
      icon: AppIcons.whatsappInbox,
      id: `conversation-${conversation.id}`,
      path: "whatsapp-inbox",
      searchValues: [
        conversation.contactName,
        conversation.phoneNumber,
        conversation.lastMessage,
        conversation.assignedAgent ?? "Unassigned",
        conversation.status,
      ],
      title: conversation.contactName,
    })),
    ...contacts.map((contact) => createSearchResult({
      category: "Contacts",
      description: [contact.phone, contact.email].filter(Boolean).join(" · "),
      icon: AppIcons.contact,
      id: `contact-${contact.id}`,
      path: "contact",
      searchValues: [contact.name, contact.phone, contact.email, ...contact.tags],
      title: contact.name,
    })),
    ...templates.map((template) => createSearchResult({
      badge: template.status,
      category: "Templates",
      description: `${template.templateId} · ${template.category}`,
      icon: AppIcons.template,
      id: `template-${template.templateId}`,
      path: "whatsapp/templates",
      searchValues: [
        template.displayName,
        template.templateId,
        template.category,
        template.messageBody,
        template.status,
      ],
      title: template.displayName,
    })),
    ...getSettingsResults(),
  ];
}

function getDefaultSearchResults(results: SearchResult[]) {
  const defaults: Record<SearchCategory, number> = {
    Conversations: 3,
    Contacts: 3,
    Settings: 5,
    Templates: 4,
  };

  return categoryOrder.flatMap((category) =>
    results.filter((result) => result.category === category).slice(0, defaults[category]),
  );
}

function getSettingsResults() {
  return navigationGroups.flatMap((group) =>
    group.items.flatMap((item) => flattenNavItem(group.label, item)),
  );
}

function flattenNavItem(groupLabel: string, item: NavItem, parentLabel?: string): SearchResult[] {
  const modulePath = parentLabel ? `${groupLabel} / ${parentLabel}` : groupLabel;
  const current = createSearchResult({
    category: "Settings",
    description: parentLabel ? `${modulePath} / ${item.label}` : `${groupLabel} / ${item.label}`,
    icon: item.icon,
    id: `setting-${item.path}`,
    path: item.path,
    searchValues: [groupLabel, parentLabel, item.label, item.path],
    title: item.label,
  });

  return [current, ...(item.children?.flatMap((child) => flattenNavItem(groupLabel, child, item.label)) ?? [])];
}

function createSearchResult({
  badge,
  category,
  description,
  icon,
  id,
  path,
  searchValues,
  title,
}: Omit<SearchResult, "searchText"> & { searchValues: Array<string | undefined> }): SearchResult {
  return {
    badge,
    category,
    description,
    icon,
    id,
    path,
    searchText: [category, title, description, ...searchValues].join(" ").toLowerCase(),
    title,
  };
}

function getInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);

  return words.slice(0, 2).map((word) => word[0]?.toUpperCase()).join("") || "NA";
}
