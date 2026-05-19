import { useEffect, useMemo, useRef, useState } from "react";
import { EmptyState } from "@/components/EmptyState";
import { AppIcons, type AppIcon } from "@/components/icons";
import { ListSkeleton } from "@/components/LoadingStates";
import { StandardDialog } from "@/components/StandardDialog";
import { Input } from "@/components/ui/input";
import { conversations, templates } from "@/modules/channels/channels.data";
import { contacts } from "@/modules/crm/crm.data";

type GlobalSearchProps = {
  onNavigate?: (path: string) => void;
};

type SearchResult = {
  category: "Conversations" | "Contacts" | "Templates" | "Settings";
  description: string;
  icon: AppIcon;
  id: string;
  path?: string;
  title: string;
};

const searchPlaceholder = "Search contacts, conversations, templates...";
const settingsResults: SearchResult[] = [
  {
    category: "Settings",
    description: "BSP-managed WhatsApp setup",
    icon: AppIcons.whatsapp,
    id: "setting-api-connection",
    path: "whatsapp/api-connection",
    title: "API Connection",
  },
  {
    category: "Settings",
    description: "Reusable predefined responses",
    icon: AppIcons.cannedReplies,
    id: "setting-canned-replies",
    path: "canned-replies",
    title: "Canned Replies",
  },
  {
    category: "Settings",
    description: "Keyword-based automation rules",
    icon: AppIcons.trigger,
    id: "setting-crm-triggers",
    path: "crm-triggers/keyword-automation",
    title: "CRM Triggers",
  },
  {
    category: "Settings",
    description: "Workspace profile and preferences",
    icon: AppIcons.accountSettings,
    id: "setting-account-settings",
    path: "account-settings/profile",
    title: "Account Settings",
  },
];

export function GlobalSearch({ onNavigate }: GlobalSearchProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => getSearchResults(query), [query]);

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
    const timeout = window.setTimeout(() => setIsSearching(false), 180);

    return () => window.clearTimeout(timeout);
  }, [dialogOpen, query]);

  const selectResult = (result: SearchResult) => {
    setDialogOpen(false);
    setQuery("");

    if (result.path) {
      onNavigate?.(result.path);
    }
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
        description="Search across workspace conversations, contacts, templates, and settings."
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
        <div className="space-y-4">
          <div className="relative">
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

          {isSearching ? (
            <ListSkeleton rows={5} />
          ) : results.length ? (
            <SearchResultGroups onSelect={selectResult} results={results} />
          ) : (
            <EmptyState
              compact
              description="Try searching by contact, phone, message, template, or setting."
              title="No results found"
              variant="search"
            />
          )}
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
  onSelect,
  results,
}: {
  onSelect: (result: SearchResult) => void;
  results: SearchResult[];
}) {
  const groupedResults = groupResults(results);

  return (
    <div className="max-h-[52vh] space-y-4 overflow-y-auto pr-1 subtle-scrollbar">
      {groupedResults.map((group) => (
        <section key={group.category}>
          <p className="px-1 text-xs font-semibold uppercase tracking-normal text-muted">{group.category}</p>
          <div className="mt-2 divide-y divide-slate-200 rounded-xl bg-slate-50/80 ring-1 ring-slate-200/70">
            {group.items.map((result) => {
              const Icon = result.icon;

              return (
                <button
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors first:rounded-t-xl last:rounded-b-xl hover:bg-whatsapp-light/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-whatsapp"
                  key={result.id}
                  onClick={() => onSelect(result)}
                  type="button"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-card text-muted-foreground ring-1 ring-slate-200">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-foreground">{result.title}</span>
                    <span className="mt-0.5 block truncate text-xs text-muted-foreground">{result.description}</span>
                  </span>
                  <AppIcons.chevronDown className="h-4 w-4 -rotate-90 text-muted" />
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

function getSearchResults(query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  const allResults: SearchResult[] = [
    ...conversations.slice(0, 8).map((conversation) => ({
      category: "Conversations" as const,
      description: conversation.lastMessage,
      icon: AppIcons.whatsappInbox,
      id: `conversation-${conversation.id}`,
      path: "whatsapp-inbox",
      title: conversation.contactName,
    })),
    ...contacts.slice(0, 8).map((contact) => ({
      category: "Contacts" as const,
      description: `${contact.phone} - ${contact.email}`,
      icon: AppIcons.contact,
      id: `contact-${contact.id}`,
      path: "contact",
      title: contact.name,
    })),
    ...templates.map((template) => ({
      category: "Templates" as const,
      description: `${template.category} - ${template.status}`,
      icon: AppIcons.template,
      id: `template-${template.templateId}`,
      path: "whatsapp/templates",
      title: template.displayName,
    })),
    ...settingsResults,
  ];

  if (!normalizedQuery) {
    return allResults.slice(0, 12);
  }

  return allResults.filter((result) =>
    [result.category, result.description, result.title]
      .join(" ")
      .toLowerCase()
      .includes(normalizedQuery),
  );
}

function groupResults(results: SearchResult[]) {
  const groups = new Map<SearchResult["category"], SearchResult[]>();

  results.forEach((result) => {
    groups.set(result.category, [...(groups.get(result.category) ?? []), result]);
  });

  return [...groups.entries()].map(([category, items]) => ({ category, items }));
}
