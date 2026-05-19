import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AvatarWithName } from "@/components/AvatarWithName";
import { BulkActionBar } from "@/components/BulkActionBar";
import { useAppToast } from "@/components/AppToast";
import { ContactIdentityBlock, DetailField, DetailTagList, InternalNoteCard } from "@/components/ContactDetails";
import { DataTable, type DataTableColumn } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";
import { AppIcons } from "@/components/icons";
import { LoadingButton } from "@/components/LoadingButton";
import { SearchInput } from "@/components/SearchInput";
import { SectionCard } from "@/components/SectionCard";
import { SectionHeader } from "@/components/SectionLayout";
import { StandardDialog } from "@/components/StandardDialog";
import { StatusBadge } from "@/components/StatusBadge";
import { TableActions } from "@/components/TableActions";
import { Tooltip } from "@/components/ui/tooltip";
import { UserAvatar } from "@/components/UserAvatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useMockSubmit } from "@/hooks/useMockSubmit";
import { WORKSPACE_USER } from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  agents,
  internalNotes,
  liveChatConversations,
  type InternalNote,
  type LiveChatConversation,
} from "@/modules/crm/crm.data";

const rowsPerPage = 20;
const statusOptions = ["Open", "Pending", "Closed"] as const;
const teamInboxStatusOptions = ["All Status", ...statusOptions] as const;
const assignedAgentOptions = ["All Agents", "Unassigned", ...agents.map((agent) => agent.name)] as const;
const timeRangeOptions = ["All Time", "Today", "Yesterday", "Older"] as const;
const assignmentTypeOptions = ["All Assignments", "Assigned", "Unassigned"] as const;
const sortByOptions = ["Newest first", "Oldest first", "Contact A-Z"] as const;
const selectClass =
  "h-10 rounded-xl border border-border bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-whatsapp";
const isWorkspaceAdmin = WORKSPACE_USER.role === "Admin" || WORKSPACE_USER.role === "Workspace Admin";
const loggedInAgentName = WORKSPACE_USER.name;

type ChatStatus = (typeof statusOptions)[number];
type TeamInboxStatusFilter = (typeof teamInboxStatusOptions)[number];
type AssignedAgentFilter = (typeof assignedAgentOptions)[number];
type TimeRangeFilter = (typeof timeRangeOptions)[number];
type AssignmentTypeFilter = (typeof assignmentTypeOptions)[number];
type SortByFilter = (typeof sortByOptions)[number];

type DrawerFilters = {
  assignmentType: AssignmentTypeFilter;
  needsAttention: boolean;
  sortBy: SortByFilter;
  tag: string;
};

type FilterDrawerDraft = DrawerFilters & {
  assignedAgent: AssignedAgentFilter;
  status: TeamInboxStatusFilter;
  timeRange: TimeRangeFilter;
};

const defaultDrawerFilters: DrawerFilters = {
  assignmentType: "All Assignments",
  needsAttention: false,
  sortBy: "Newest first",
  tag: "All Tags",
};

const defaultFilterDrawerDraft: FilterDrawerDraft = {
  ...defaultDrawerFilters,
  assignedAgent: "All Agents",
  status: "All Status",
  timeRange: "All Time",
};

function getAgentIdByName(agentName: string) {
  return agents.find((agent) => agent.name === agentName)?.id ?? agents[0].id;
}

export function LiveChatPage() {
  const [conversationRows, setConversationRows] = useState<LiveChatConversation[]>(liveChatConversations);
  const [noteRows, setNoteRows] = useState<InternalNote[]>(internalNotes);
  const [teamInboxSearch, setTeamInboxSearch] = useState("");
  const [teamInboxStatusFilter, setTeamInboxStatusFilter] = useState<TeamInboxStatusFilter>("All Status");
  const [assignedAgentFilter, setAssignedAgentFilter] = useState<AssignedAgentFilter>("All Agents");
  const [timeRangeFilter, setTimeRangeFilter] = useState<TimeRangeFilter>("All Time");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerFilters, setDrawerFilters] = useState<DrawerFilters>(defaultDrawerFilters);
  const [draftDrawerFilters, setDraftDrawerFilters] = useState<FilterDrawerDraft>(defaultFilterDrawerDraft);
  const [selectedConversationIds, setSelectedConversationIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [detailsConversation, setDetailsConversation] = useState<LiveChatConversation | null>(null);
  const [assignConversation, setAssignConversation] = useState<LiveChatConversation | null>(null);
  const [statusConversation, setStatusConversation] = useState<LiveChatConversation | null>(null);
  const [noteConversation, setNoteConversation] = useState<LiveChatConversation | null>(null);
  const [dialogAgentId, setDialogAgentId] = useState(agents[0].id);
  const [dialogStatus, setDialogStatus] = useState<ChatStatus>("Open");
  const [dialogNote, setDialogNote] = useState("");
  const [bulkDialog, setBulkDialog] = useState<"assign" | "status" | "note" | null>(null);
  const [bulkAgentId, setBulkAgentId] = useState(agents[0].id);
  const [bulkStatus, setBulkStatus] = useState<ChatStatus>("Open");
  const [bulkNote, setBulkNote] = useState("");
  const toast = useAppToast();
  const availableTags = useMemo(
    () => ["All Tags", ...Array.from(new Set(conversationRows.flatMap((conversation) => conversation.tags))).sort()],
    [conversationRows],
  );

  const resetTableState = () => {
    setCurrentPage(1);
    setSelectedConversationIds([]);
  };

  const filteredConversationRows = useMemo(() => {
    const query = teamInboxSearch.trim().toLowerCase();
    const visibleByRole = isWorkspaceAdmin
      ? conversationRows
      : conversationRows.filter((conversation) => conversation.assignedAgent === loggedInAgentName);

    return visibleByRole.filter((conversation) => {
      const matchesSearch =
        !query ||
        [
          conversation.contact,
          conversation.phone,
          conversation.lastMessage,
          conversation.lastMessageFileName,
          conversation.lastMessagePreview,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);
      const matchesStatus =
        teamInboxStatusFilter === "All Status" || conversation.chatStatus === teamInboxStatusFilter;
      const matchesAgent =
        !isWorkspaceAdmin ||
        assignedAgentFilter === "All Agents" ||
        (assignedAgentFilter === "Unassigned"
          ? conversation.assignedAgent === "Unassigned"
          : conversation.assignedAgent === assignedAgentFilter);
      const matchesTimeRange =
        timeRangeFilter === "All Time" ||
        (timeRangeFilter === "Older"
          ? conversation.lastActivityAt !== "Today" && conversation.lastActivityAt !== "Yesterday"
          : conversation.lastActivityAt === timeRangeFilter);
      const matchesAssignmentType =
        drawerFilters.assignmentType === "All Assignments" ||
        (drawerFilters.assignmentType === "Assigned"
          ? conversation.assignedAgent !== "Unassigned"
          : conversation.assignedAgent === "Unassigned");
      const matchesNeedsAttention = !drawerFilters.needsAttention || conversation.chatStatus === "Pending";
      const matchesTag = drawerFilters.tag === "All Tags" || conversation.tags.includes(drawerFilters.tag);

      return (
        matchesSearch &&
        matchesStatus &&
        matchesAgent &&
        matchesTimeRange &&
        matchesAssignmentType &&
        matchesNeedsAttention &&
        matchesTag
      );
    }).sort((first, second) => {
      if (drawerFilters.sortBy === "Oldest first") {
        return first.lastActivitySort - second.lastActivitySort;
      }

      if (drawerFilters.sortBy === "Contact A-Z") {
        return first.contact.localeCompare(second.contact);
      }

      return second.lastActivitySort - first.lastActivitySort;
    });
  }, [assignedAgentFilter, conversationRows, drawerFilters, teamInboxSearch, teamInboxStatusFilter, timeRangeFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredConversationRows.length / rowsPerPage));
  const pageStart = (currentPage - 1) * rowsPerPage;
  const pageEnd = Math.min(pageStart + rowsPerPage, filteredConversationRows.length);
  const visibleRows = filteredConversationRows.slice(pageStart, pageEnd);
  const selectedConversations = useMemo(
    () => conversationRows.filter((conversation) => selectedConversationIds.includes(conversation.id)),
    [conversationRows, selectedConversationIds],
  );
  const selectedConversationCount = selectedConversations.length;
  const activeFilterCount =
    (teamInboxSearch.trim() ? 1 : 0) +
    (teamInboxStatusFilter !== "All Status" ? 1 : 0) +
    (isWorkspaceAdmin && assignedAgentFilter !== "All Agents" ? 1 : 0) +
    (timeRangeFilter !== "All Time" ? 1 : 0) +
    (drawerFilters.assignmentType !== "All Assignments" ? 1 : 0) +
    (drawerFilters.needsAttention ? 1 : 0) +
    (drawerFilters.tag !== "All Tags" ? 1 : 0) +
    (drawerFilters.sortBy !== "Newest first" ? 1 : 0);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const applyAssignment = (conversationId: string, agentId: string) => {
    const agent = agents.find((item) => item.id === agentId);
    const agentName = agent?.name ?? "Unassigned";

    setConversationRows((currentRows) =>
      currentRows.map((conversation) =>
        conversation.id === conversationId ? { ...conversation, assignedAgent: agentName } : conversation,
      ),
    );
    toast.success(`Chat assigned to ${agentName}.`);
  };

  const applyStatusUpdate = (conversationId: string, status: ChatStatus) => {
    setConversationRows((currentRows) =>
      currentRows.map((row) => (row.id === conversationId ? { ...row, chatStatus: status } : row)),
    );
    toast.success(status === "Closed" ? "Conversation closed." : `Conversation marked ${status}.`);
  };

  const addNote = (conversationId: string, note: string) => {
    const trimmedNote = note.trim();

    if (!trimmedNote) {
      return false;
    }

    setNoteRows((currentNotes) => [
      ...currentNotes,
      {
        conversationId,
        author: "Meera Shah",
        content: trimmedNote,
        timestamp: "Just now",
      },
    ]);
    toast.success("Internal note added.");
    return true;
  };

  const clearBulkSelection = () => {
    setSelectedConversationIds([]);
  };

  const applyBulkAssignment = () => {
    const selectedIds = new Set(selectedConversationIds);
    const agent = agents.find((item) => item.id === bulkAgentId);
    const agentName = agent?.name ?? "Unassigned";

    setConversationRows((currentRows) =>
      currentRows.map((conversation) =>
        selectedIds.has(conversation.id) ? { ...conversation, assignedAgent: agentName } : conversation,
      ),
    );
    clearBulkSelection();
    setBulkDialog(null);
    toast.success(`${selectedIds.size} ${selectedIds.size === 1 ? "chat" : "chats"} assigned to ${agentName}.`);
  };

  const applyBulkStatusUpdate = () => {
    const selectedIds = new Set(selectedConversationIds);

    setConversationRows((currentRows) =>
      currentRows.map((conversation) =>
        selectedIds.has(conversation.id) ? { ...conversation, chatStatus: bulkStatus } : conversation,
      ),
    );
    clearBulkSelection();
    setBulkDialog(null);
    toast.success(`${selectedIds.size} ${selectedIds.size === 1 ? "conversation" : "conversations"} marked ${bulkStatus}.`);
  };

  const applyBulkInternalNote = () => {
    const trimmedNote = bulkNote.trim();

    if (!trimmedNote) {
      return;
    }

    setNoteRows((currentNotes) => [
      ...currentNotes,
      ...selectedConversationIds.map((conversationId) => ({
        conversationId,
        author: "Meera Shah",
        content: trimmedNote,
        timestamp: "Just now",
      })),
    ]);
    setBulkNote("");
    clearBulkSelection();
    setBulkDialog(null);
    toast.success(`Internal note added to ${selectedConversationIds.length} ${selectedConversationIds.length === 1 ? "conversation" : "conversations"}.`);
  };

  const openAssignDialog = (conversation: LiveChatConversation) => {
    setDialogAgentId(getAgentIdByName(conversation.assignedAgent));
    setAssignConversation(conversation);
  };

  const openStatusDialog = (conversation: LiveChatConversation) => {
    setDialogStatus(conversation.chatStatus as ChatStatus);
    setStatusConversation(conversation);
  };

  const openNoteDialog = (conversation: LiveChatConversation) => {
    setDialogNote("");
    setNoteConversation(conversation);
  };

  const openFilterDrawer = () => {
    setDraftDrawerFilters({
      ...drawerFilters,
      assignedAgent: assignedAgentFilter,
      status: teamInboxStatusFilter,
      timeRange: timeRangeFilter,
    });
    setDrawerOpen(true);
  };

  const applyDrawerFilters = () => {
    const { assignedAgent, status, timeRange, ...nextDrawerFilters } = draftDrawerFilters;

    setAssignedAgentFilter(assignedAgent);
    setTeamInboxStatusFilter(status);
    setTimeRangeFilter(timeRange);
    setDrawerFilters(nextDrawerFilters);
    resetTableState();
    setDrawerOpen(false);
  };

  const resetAllFilters = () => {
    setTeamInboxSearch("");
    setTeamInboxStatusFilter("All Status");
    setAssignedAgentFilter("All Agents");
    setTimeRangeFilter("All Time");
    setDrawerFilters(defaultDrawerFilters);
    setDraftDrawerFilters(defaultFilterDrawerDraft);
    resetTableState();
  };

  const columns: DataTableColumn<LiveChatConversation>[] = [
    {
      key: "contact",
      header: "Contact",
      cell: (row) => (
        <div className="flex items-center gap-3">
          <UserAvatar compact initials={row.initials} name={row.contact} />
          <div>
            <p className="text-sm font-semibold text-foreground">{row.contact}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{row.phone}</p>
          </div>
        </div>
      ),
    },
    {
      key: "lastMessage",
      header: "Last Message",
      className: "max-w-[420px]",
      cell: (row) => <LastMessageCell conversation={row} />,
    },
    { key: "assignedAgent", header: "Assigned Agent", cell: (row) => <AgentName name={row.assignedAgent} /> },
    { key: "chatStatus", header: "Chat Status", cell: (row) => <StatusBadge status={row.chatStatus} /> },
    { key: "lastActivity", header: "Last Activity", cell: (row) => row.lastActivity },
    {
      key: "action",
      header: "Action",
      cell: (row) => (
        <TableActions
          actions={[
            { icon: AppIcons.view, label: "View details", onClick: () => setDetailsConversation(row) },
            { icon: AppIcons.assignAgent, label: "Assign chat", onClick: () => openAssignDialog(row) },
            { icon: AppIcons.statusUpdate, label: "Update status", onClick: () => openStatusDialog(row) },
            { icon: AppIcons.addNote, label: "Add note", onClick: () => openNoteDialog(row), tooltipAlign: "end" },
          ]}
          maxDirectActions={4}
        />
      ),
    },
  ];

  return (
    <div className="flex w-full flex-col gap-4 pb-24">
      <SectionCard>
        <SectionHeader
          actions={
          <div className="grid w-full grid-cols-1 gap-2 md:grid-cols-[minmax(240px,1fr)_160px_auto] lg:w-auto lg:grid-cols-[minmax(240px,1fr)_160px_176px_156px_auto] xl:min-w-[760px]">
            <SearchInput
              className="min-w-0"
              onChange={(event) => {
                setTeamInboxSearch(event.target.value);
                resetTableState();
              }}
              placeholder="Search conversations"
              value={teamInboxSearch}
            />
            <label className="hidden w-full min-w-0 md:block">
              <select
                aria-label="Chat Status"
                className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-whatsapp"
                onChange={(event) => {
                  setTeamInboxStatusFilter(event.target.value as TeamInboxStatusFilter);
                  resetTableState();
                }}
                value={teamInboxStatusFilter}
              >
                {teamInboxStatusOptions.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </label>
            {isWorkspaceAdmin ? (
              <label className="hidden w-full min-w-0 lg:block">
                <select
                  aria-label="Assigned Agent"
                  className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-whatsapp"
                  onChange={(event) => {
                    setAssignedAgentFilter(event.target.value as AssignedAgentFilter);
                    resetTableState();
                  }}
                  value={assignedAgentFilter}
                >
                  {assignedAgentOptions.map((agent) => (
                    <option key={agent}>{agent}</option>
                  ))}
                </select>
              </label>
            ) : null}
            <label className="hidden w-full min-w-0 lg:block">
              <select
                aria-label="Last Activity"
                className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-whatsapp"
                onChange={(event) => {
                  setTimeRangeFilter(event.target.value as TimeRangeFilter);
                  resetTableState();
                }}
                value={timeRangeFilter}
              >
                {timeRangeOptions.map((range) => (
                  <option key={range}>{range}</option>
                ))}
              </select>
            </label>
            <Button
              aria-label="Open filters"
              className="relative justify-self-end md:justify-self-auto"
              onClick={openFilterDrawer}
              size="icon"
              type="button"
              variant="outline"
            >
              <AppIcons.filter className="h-5 w-5" />
              {activeFilterCount ? (
                <Badge className="absolute -right-2 -top-2 border-whatsapp/30 bg-whatsapp text-white">
                  {activeFilterCount}
                </Badge>
              ) : null}
            </Button>
          </div>
          }
          description="Manage WhatsApp conversation workflow."
          title="Team Inbox"
        />
        {filteredConversationRows.length ? (
          <>
            <DataTable
              columns={columns}
              data={visibleRows}
              getRowId={(row) => row.id}
              onSelectedRowIdsChange={setSelectedConversationIds}
              selectable
              selectedRowIds={selectedConversationIds}
              showSelectionBar={false}
            />
            <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {pageStart + 1}-{pageEnd} of {filteredConversationRows.length} conversations
              </p>
              <div className="flex items-center gap-2">
                <Button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  variant="outline"
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  variant="outline"
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        ) : (
          <EmptyState
            actionLabel={activeFilterCount ? "Clear Filters" : undefined}
            onAction={activeFilterCount ? resetAllFilters : undefined}
            variant={activeFilterCount ? "filters" : "conversations"}
          />
        )}
      </SectionCard>

      <BulkActionBar
        actions={[
          { label: "Assign Agent", onClick: () => setBulkDialog("assign"), variant: "default" },
          { label: "Update Status", onClick: () => setBulkDialog("status") },
          { label: "Add Internal Note", onClick: () => setBulkDialog("note") },
        ]}
        label={`${selectedConversationCount} ${
          selectedConversationCount === 1 ? "conversation" : "conversations"
        } selected`}
        onClearSelection={clearBulkSelection}
        selectedCount={selectedConversationCount}
      />

      <LiveChatFilterDrawer
        availableTags={availableTags}
        draftFilters={draftDrawerFilters}
        isWorkspaceAdmin={isWorkspaceAdmin}
        onApply={applyDrawerFilters}
        onDraftChange={setDraftDrawerFilters}
        onOpenChange={setDrawerOpen}
        onReset={() => {
          resetAllFilters();
          setDrawerOpen(false);
        }}
        open={drawerOpen}
      />

      <ConversationDetailsDialog
        conversation={detailsConversation}
        notes={noteRows.filter((note) => note.conversationId === detailsConversation?.id)}
        onOpenChange={(open) => {
          if (!open) {
            setDetailsConversation(null);
          }
        }}
      />
      <AssignChatDialog
        agentId={dialogAgentId}
        conversation={assignConversation}
        onAgentChange={setDialogAgentId}
        onAssign={() => {
          if (assignConversation) {
            applyAssignment(assignConversation.id, dialogAgentId);
            setAssignConversation(null);
          }
        }}
        onOpenChange={(open) => {
          if (!open) {
            setAssignConversation(null);
          }
        }}
      />
      <UpdateStatusDialog
        conversation={statusConversation}
        onOpenChange={(open) => {
          if (!open) {
            setStatusConversation(null);
          }
        }}
        onStatusChange={setDialogStatus}
        onUpdate={() => {
          if (statusConversation) {
            applyStatusUpdate(statusConversation.id, dialogStatus);
            setStatusConversation(null);
          }
        }}
        status={dialogStatus}
      />
      <AddInternalNoteDialog
        conversation={noteConversation}
        note={dialogNote}
        onNoteChange={setDialogNote}
        onOpenChange={(open) => {
          if (!open) {
            setNoteConversation(null);
          }
        }}
        onSubmit={() => {
          if (noteConversation && addNote(noteConversation.id, dialogNote)) {
            setDialogNote("");
            setNoteConversation(null);
          }
        }}
      />
      <BulkAssignAgentDialog
        agentId={bulkAgentId}
        onAgentChange={setBulkAgentId}
        onAssign={applyBulkAssignment}
        onOpenChange={(open) => {
          if (!open) {
            setBulkDialog(null);
          }
        }}
        open={bulkDialog === "assign"}
        selectedCount={selectedConversationCount}
      />
      <BulkUpdateStatusDialog
        onOpenChange={(open) => {
          if (!open) {
            setBulkDialog(null);
          }
        }}
        onStatusChange={setBulkStatus}
        onUpdate={applyBulkStatusUpdate}
        open={bulkDialog === "status"}
        selectedCount={selectedConversationCount}
        status={bulkStatus}
      />
      <BulkInternalNoteDialog
        note={bulkNote}
        onNoteChange={setBulkNote}
        onOpenChange={(open) => {
          if (!open) {
            setBulkDialog(null);
          }
        }}
        onSubmit={applyBulkInternalNote}
        open={bulkDialog === "note"}
        selectedCount={selectedConversationCount}
      />
    </div>
  );
}

function BulkAssignAgentDialog({
  agentId,
  onAgentChange,
  onAssign,
  onOpenChange,
  open,
  selectedCount,
}: {
  agentId: string;
  onAgentChange: (agentId: string) => void;
  onAssign: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  selectedCount: number;
}) {
  const submit = useMockSubmit();

  return (
    <StandardDialog
      description="Assign selected conversations to an agent."
      footerRight={<LoadingButton isLoading={submit.isSubmitting} loadingText="Assigning..." onClick={() => submit.run(onAssign)}>Assign Agent</LoadingButton>}
      onOpenChange={onOpenChange}
      open={open}
      size="sm"
      title="Assign Agent"
    >
          <div className="grid gap-4">
            <Info label="Selected Conversations" value={`${selectedCount}`} />
            <Field label="Agent">
              <select className={selectClass} onChange={(event) => onAgentChange(event.target.value)} value={agentId}>
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>
    </StandardDialog>
  );
}

function BulkUpdateStatusDialog({
  onOpenChange,
  onStatusChange,
  onUpdate,
  open,
  selectedCount,
  status,
}: {
  onOpenChange: (open: boolean) => void;
  onStatusChange: (status: ChatStatus) => void;
  onUpdate: () => void;
  open: boolean;
  selectedCount: number;
  status: ChatStatus;
}) {
  const submit = useMockSubmit();

  return (
    <StandardDialog
      description="Update the lifecycle status for selected conversations."
      footerRight={<LoadingButton isLoading={submit.isSubmitting} loadingText="Updating..." onClick={() => submit.run(onUpdate)}>Update Status</LoadingButton>}
      onOpenChange={onOpenChange}
      open={open}
      size="sm"
      title="Update Chat Status"
    >
          <div className="grid gap-4">
            <Info label="Selected Conversations" value={`${selectedCount}`} />
            <Field label="New Status">
              <select
                className={selectClass}
                onChange={(event) => onStatusChange(event.target.value as ChatStatus)}
                value={status}
              >
                {statusOptions.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </Field>
          </div>
    </StandardDialog>
  );
}

function BulkInternalNoteDialog({
  note,
  onNoteChange,
  onOpenChange,
  onSubmit,
  open,
  selectedCount,
}: {
  note: string;
  onNoteChange: (note: string) => void;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
  open: boolean;
  selectedCount: number;
}) {
  const submit = useMockSubmit();

  return (
    <StandardDialog
      description="Add a private internal note to selected conversations. Notes are visible only to the team and are not sent to customers."
      footerRight={<LoadingButton disabled={!note.trim()} isLoading={submit.isSubmitting} loadingText="Adding..." onClick={() => submit.run(onSubmit)}>Add Internal Note</LoadingButton>}
      onOpenChange={onOpenChange}
      open={open}
      size="sm"
      title="Add Internal Note"
    >
          <div className="grid gap-4">
            <Info label="Selected Conversations" value={`${selectedCount}`} />
            <Field label="Note">
              <textarea
                className="min-h-24 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-whatsapp"
                onChange={(event) => onNoteChange(event.target.value)}
                placeholder="Add a private internal note for selected conversations"
                value={note}
              />
            </Field>
          </div>
    </StandardDialog>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-semibold uppercase tracking-normal text-muted">{label}</span>
      {children}
    </label>
  );
}

function AgentName({ name }: { name: string }) {
  if (name === "Unassigned") {
    return <span className="text-sm text-muted-foreground">Unassigned</span>;
  }

  const agent = agents.find((item) => item.name === name);

  return <AvatarWithName initials={agent?.initials} name={name} size="sm" />;
}

function LastMessageCell({ conversation }: { conversation: LiveChatConversation }) {
  const Icon = getLastMessageIcon(conversation.lastMessageKind);
  const fileName = conversation.lastMessageFileName;
  const deliveryLabel = conversation.lastMessageMeta.status
    ? getLastMessageDeliveryLabel(conversation.lastMessageMeta.status)
    : null;

  return (
    <Tooltip align="start" label={conversation.lastMessageTooltip || "No message yet"}>
      <span className="flex h-7 min-w-0 max-w-full items-center gap-2 overflow-hidden text-sm text-foreground">
        {conversation.lastMessageMeta.direction === "customer" ? (
          <span className="h-2 w-2 shrink-0 rounded-full bg-whatsapp-dark" />
        ) : (
          <span
            className={cn(
              "inline-flex shrink-0 items-center",
              conversation.lastMessageMeta.status === "read" ? "text-whatsapp-dark" : "text-slate-500",
            )}
          >
            {conversation.lastMessageMeta.status === "delivered" || conversation.lastMessageMeta.status === "read" ? (
              <AppIcons.checkDouble className="h-4 w-4" />
            ) : (
              <AppIcons.check className="h-4 w-4" />
            )}
          </span>
        )}
        {Icon ? <Icon className="h-[18px] w-[18px] shrink-0 text-muted-foreground" /> : null}
        <span className="min-w-0 flex-1 truncate">
          <span className="font-normal">{conversation.lastMessagePreview || "No message yet"}</span>
          {fileName ? <span className="text-muted-foreground"> - {fileName}</span> : null}
        </span>
        {conversation.lastMessageMeta.direction === "agent" && deliveryLabel ? (
          <span
            className={cn(
              "shrink-0 text-xs font-medium",
              conversation.lastMessageMeta.status === "read" ? "text-whatsapp-dark" : "text-slate-500",
            )}
          >
            {deliveryLabel}
          </span>
        ) : null}
      </span>
    </Tooltip>
  );
}

function getLastMessageDeliveryLabel(status: NonNullable<LiveChatConversation["lastMessageMeta"]["status"]>) {
  if (status === "sent") {
    return "Sent";
  }

  if (status === "delivered") {
    return "Delivered";
  }

  return "Read";
}

function getLastMessageIcon(kind: LiveChatConversation["lastMessageKind"]) {
  if (kind === "Image") {
    return AppIcons.image;
  }

  if (kind === "Document") {
    return AppIcons.document;
  }

  if (kind === "Video") {
    return AppIcons.media;
  }

  if (kind === "Audio") {
    return AppIcons.voice;
  }

  if (kind === "Template") {
    return AppIcons.template;
  }

  if (kind === "System") {
    return AppIcons.notifications;
  }

  return null;
}

function LiveChatFilterDrawer({
  availableTags,
  draftFilters,
  isWorkspaceAdmin,
  onApply,
  onDraftChange,
  onOpenChange,
  onReset,
  open,
}: {
  availableTags: string[];
  draftFilters: FilterDrawerDraft;
  isWorkspaceAdmin: boolean;
  onApply: () => void;
  onDraftChange: (filters: FilterDrawerDraft) => void;
  onOpenChange: (open: boolean) => void;
  onReset: () => void;
  open: boolean;
}) {
  if (!open) {
    return null;
  }

  const updateDraft = (nextFilters: Partial<FilterDrawerDraft>) => {
    onDraftChange({ ...draftFilters, ...nextFilters });
  };

  return (
    <div className="fixed inset-0 z-50">
      <button
        aria-label="Close filters"
        className="absolute inset-0 bg-slate-950/20"
        onClick={() => onOpenChange(false)}
        type="button"
      />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-card shadow-soft">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">Filters</h2>
            <p className="mt-1 text-sm text-muted-foreground">Refine Team Inbox conversations.</p>
          </div>
          <Button aria-label="Close filters" onClick={() => onOpenChange(false)} size="icon" type="button" variant="ghost">
            <AppIcons.close className="h-[18px] w-[18px]" />
          </Button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4 subtle-scrollbar">
          <div className="grid gap-3">
            <Field label="Chat Status">
              <select
                className={selectClass}
                onChange={(event) => updateDraft({ status: event.target.value as TeamInboxStatusFilter })}
                value={draftFilters.status}
              >
                {teamInboxStatusOptions.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </Field>
            {isWorkspaceAdmin ? (
              <Field label="Assigned Agent">
                <select
                  className={selectClass}
                  onChange={(event) => updateDraft({ assignedAgent: event.target.value as AssignedAgentFilter })}
                  value={draftFilters.assignedAgent}
                >
                  {assignedAgentOptions.map((agent) => (
                    <option key={agent}>{agent}</option>
                  ))}
                </select>
              </Field>
            ) : null}
            <Field label="Last Activity">
              <select
                className={selectClass}
                onChange={(event) => updateDraft({ timeRange: event.target.value as TimeRangeFilter })}
                value={draftFilters.timeRange}
              >
                {timeRangeOptions.map((range) => (
                  <option key={range}>{range}</option>
                ))}
              </select>
            </Field>
          </div>

          <div className="border-t border-border pt-5">
            <div className="grid gap-3">
              <Field label="Assignment Type">
                <select
                  className={selectClass}
                  onChange={(event) => updateDraft({ assignmentType: event.target.value as AssignmentTypeFilter })}
                  value={draftFilters.assignmentType}
                >
                  {assignmentTypeOptions.map((assignmentType) => (
                    <option key={assignmentType}>{assignmentType}</option>
                  ))}
                </select>
              </Field>
              <label className="flex items-center justify-between gap-3 rounded-xl bg-slate-50/70 px-3 py-2.5">
                <span className="text-sm font-medium text-slate-700">Unread / Needs Attention</span>
                <input
                  checked={draftFilters.needsAttention}
                  className="h-4 w-4 rounded border-border accent-whatsapp"
                  onChange={(event) => updateDraft({ needsAttention: event.target.checked })}
                  type="checkbox"
                />
              </label>
              <Field label="Tags / Category">
                <select
                  className={selectClass}
                  onChange={(event) => updateDraft({ tag: event.target.value })}
                  value={draftFilters.tag}
                >
                  {availableTags.map((tag) => (
                    <option key={tag}>{tag}</option>
                  ))}
                </select>
              </Field>
              <Field label="Sort By">
                <select
                  className={selectClass}
                  onChange={(event) => updateDraft({ sortBy: event.target.value as SortByFilter })}
                  value={draftFilters.sortBy}
                >
                  {sortByOptions.map((sortBy) => (
                    <option key={sortBy}>{sortBy}</option>
                  ))}
                </select>
              </Field>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-4">
          <Button onClick={onReset} type="button" variant="outline">
            Reset
          </Button>
          <Button onClick={onApply} type="button">
            Apply
          </Button>
        </div>
      </aside>
    </div>
  );
}

function NoteCard({ note }: { note: InternalNote }) {
  return <InternalNoteCard author={note.author} content={note.content} timestamp={note.timestamp} />;
}

function ConversationDetailsDialog({
  conversation,
  notes,
  onOpenChange,
}: {
  conversation: LiveChatConversation | null;
  notes: InternalNote[];
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <StandardDialog
      onOpenChange={onOpenChange}
      open={Boolean(conversation)}
      title="Conversation Details"
    >
          {conversation ? (
            <div className="space-y-5">
              <ContactIdentityBlock
                avatarUrl={conversation.avatarUrl}
                initials={conversation.initials}
                name={conversation.contact}
                phone={conversation.phone}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <DetailField label="Contact Name" value={conversation.contact} />
                <DetailField label="Phone Number" value={conversation.phone} />
                <DetailField label="Email" value={conversation.email} />
                <DetailField label="Last Message" value={conversation.lastMessageTooltip} />
                <DetailField label="Assigned Agent">
                  <div className="mt-2">
                    <AgentName name={conversation.assignedAgent} />
                  </div>
                </DetailField>
                <DetailField label="Last Activity" value={conversation.lastActivity} />
                <DetailField label="Conversation Status">
                  <div className="mt-2">
                    <StatusBadge status={conversation.chatStatus} />
                  </div>
                </DetailField>
                <DetailField label="Tags">
                  <DetailTagList tags={conversation.tags} />
                </DetailField>
              </div>
              <DetailField label="Conversation History" value={conversation.historySummary} />
              <div>
                <DetailField label="Internal Notes">
                  <></>
                </DetailField>
                <div className="mt-4 space-y-3">
                  {notes.length ? (
                    notes.map((note) => <NoteCard key={`${note.author}-${note.timestamp}-${note.content}`} note={note} />)
                  ) : (
                    <EmptyState compact variant="notes" />
                  )}
                </div>
              </div>
            </div>
          ) : null}
    </StandardDialog>
  );
}

function AssignChatDialog({
  agentId,
  conversation,
  onAgentChange,
  onAssign,
  onOpenChange,
}: {
  agentId: string;
  conversation: LiveChatConversation | null;
  onAgentChange: (agentId: string) => void;
  onAssign: () => void;
  onOpenChange: (open: boolean) => void;
}) {
  const submit = useMockSubmit();

  return (
    <StandardDialog
      description="Assign this WhatsApp conversation to an agent."
      footerRight={<LoadingButton isLoading={submit.isSubmitting} loadingText="Assigning..." onClick={() => submit.run(onAssign)}>Assign Chat</LoadingButton>}
      onOpenChange={onOpenChange}
      open={Boolean(conversation)}
      size="sm"
      title="Assign Chat"
    >
          {conversation ? (
            <div className="grid gap-4">
              <Info label="Conversation" value={conversation.contact} />
              <Field label="Assign to Agent">
                <select className={selectClass} onChange={(event) => onAgentChange(event.target.value)} value={agentId}>
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          ) : null}
    </StandardDialog>
  );
}

function UpdateStatusDialog({
  conversation,
  onOpenChange,
  onStatusChange,
  onUpdate,
  status,
}: {
  conversation: LiveChatConversation | null;
  onOpenChange: (open: boolean) => void;
  onStatusChange: (status: ChatStatus) => void;
  onUpdate: () => void;
  status: ChatStatus;
}) {
  const submit = useMockSubmit();

  return (
    <StandardDialog
      description="Update the lifecycle status for this conversation."
      footerRight={<LoadingButton isLoading={submit.isSubmitting} loadingText="Updating..." onClick={() => submit.run(onUpdate)}>Update Status</LoadingButton>}
      onOpenChange={onOpenChange}
      open={Boolean(conversation)}
      size="sm"
      title="Update Chat Status"
    >
          {conversation ? (
            <div className="grid gap-4">
              <Info label="Conversation" value={conversation.contact} />
              <Field label="New Status">
                <select
                  className={selectClass}
                  onChange={(event) => onStatusChange(event.target.value as ChatStatus)}
                  value={status}
                >
                  {statusOptions.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </Field>
            </div>
          ) : null}
    </StandardDialog>
  );
}

function AddInternalNoteDialog({
  conversation,
  note,
  onNoteChange,
  onOpenChange,
  onSubmit,
}: {
  conversation: LiveChatConversation | null;
  note: string;
  onNoteChange: (note: string) => void;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
}) {
  const submit = useMockSubmit();

  return (
    <StandardDialog
      description="Internal notes are visible only to the team and are not sent to the customer."
      onOpenChange={onOpenChange}
      open={Boolean(conversation)}
      size="sm"
      title="Add Internal Note"
      footerRight={<LoadingButton disabled={!note.trim()} isLoading={submit.isSubmitting} loadingText="Adding..." onClick={() => submit.run(onSubmit)}>Add Internal Note</LoadingButton>}
    >
          {conversation ? (
            <div className="grid gap-4">
              <Info label="Conversation" value={conversation.contact} />
              <Field label="Note">
                <textarea
                  className="min-h-24 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-whatsapp"
                  onChange={(event) => onNoteChange(event.target.value)}
                  placeholder="Add a private internal note for this conversation"
                  value={note}
                />
              </Field>
            </div>
          ) : null}
    </StandardDialog>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-normal text-muted">{label}</p>
      <p className="mt-1 text-sm text-foreground">{value}</p>
    </div>
  );
}
