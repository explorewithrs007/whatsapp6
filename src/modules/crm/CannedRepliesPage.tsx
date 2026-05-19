import { useEffect, useMemo, useState } from "react";
import { BulkActionBar } from "@/components/BulkActionBar";
import { useAppToast } from "@/components/AppToast";
import { DataTable, type DataTableColumn } from "@/components/DataTable";
import { AppIcons } from "@/components/icons";
import { LoadingButton } from "@/components/LoadingButton";
import { SearchInput } from "@/components/SearchInput";
import { SectionCard } from "@/components/SectionCard";
import { SectionHeader } from "@/components/SectionLayout";
import { StandardDialog } from "@/components/StandardDialog";
import { StatusBadge } from "@/components/StatusBadge";
import { TableActions } from "@/components/TableActions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMockSubmit } from "@/hooks/useMockSubmit";
import { cannedReplies, cannedReplyCategories, type CannedReplyRecord } from "@/modules/crm/crm.data";

export function CannedRepliesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [replyRows, setReplyRows] = useState<CannedReplyRecord[]>(cannedReplies);
  const [selectedReplyIds, setSelectedReplyIds] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingReply, setEditingReply] = useState<CannedReplyRecord | null>(null);
  const selectedReplyCount = selectedReplyIds.length;
  const toast = useAppToast();

  const filteredReplies = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return replyRows;
    }

    return replyRows.filter((reply) =>
      [reply.title, reply.shortcut, reply.category, reply.responsePreview].join(" ").toLowerCase().includes(query),
    );
  }, [replyRows, searchQuery]);

  const openCreateDialog = () => {
    setEditingReply(null);
    setDialogOpen(true);
  };

  const openEditDialog = (reply: CannedReplyRecord) => {
    setEditingReply(reply);
    setDialogOpen(true);
  };

  const saveReply = (reply: CannedReplyRecord) => {
    setReplyRows((currentRows) => {
      if (!editingReply) {
        return [...currentRows, reply];
      }

      return currentRows.map((row) => (row.shortcut === editingReply.shortcut ? reply : row));
    });
    setDialogOpen(false);
    setEditingReply(null);
    toast.success(editingReply ? "Reply updated." : "Reply created.");
  };

  const toggleReplyStatus = (reply: CannedReplyRecord) => {
    setReplyRows((currentRows) =>
      currentRows.map((row) =>
        row.shortcut === reply.shortcut
          ? { ...row, status: row.status === "Active" ? "Disabled" : "Active" }
          : row,
      ),
    );
    toast.success(reply.status === "Active" ? "Reply disabled." : "Reply enabled.");
  };

  const updateSelectedReplyStatus = (status: CannedReplyRecord["status"]) => {
    const selectedShortcuts = new Set(selectedReplyIds);

    setReplyRows((currentRows) =>
      currentRows.map((row) =>
        selectedShortcuts.has(row.shortcut) ? { ...row, status } : row,
      ),
    );
    setSelectedReplyIds([]);
    toast.success(`${selectedShortcuts.size} ${selectedShortcuts.size === 1 ? "reply" : "replies"} ${status === "Active" ? "enabled" : "disabled"}.`);
  };

  const columns: DataTableColumn<CannedReplyRecord>[] = [
    { key: "title", header: "Title", cell: (row) => row.title },
    { key: "shortcut", header: "Shortcut", cell: (row) => <span className="font-medium text-whatsapp-dark">{row.shortcut}</span> },
    { key: "category", header: "Category", cell: (row) => row.category },
    { key: "responsePreview", header: "Response Preview", cell: (row) => row.responsePreview },
    { key: "status", header: "Status", cell: (row) => <StatusBadge status={row.status} /> },
    {
      key: "action",
      header: "Action",
      cell: (row) => (
        <TableActions
          actions={[
            { icon: AppIcons.edit, label: "Edit reply", onClick: () => openEditDialog(row) },
            {
              icon: AppIcons.power,
              label: row.status === "Active" ? "Disable reply" : "Enable reply",
              onClick: () => toggleReplyStatus(row),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="flex w-full flex-col gap-4 pb-24">
      <SectionCard>
        <SectionHeader
          actions={
          <div className="flex w-full flex-col gap-2 lg:w-auto lg:flex-row lg:items-center">
            <div className="w-full lg:w-80">
              <SearchInput
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search replies"
                value={searchQuery}
              />
            </div>
            <Button onClick={openCreateDialog}>Create Reply</Button>
          </div>
          }
          description="Manage reusable reply shortcuts."
          title="Predefined Responses"
        />
        <DataTable
          columns={columns}
          data={filteredReplies}
          emptyState={{
            actionLabel: searchQuery.trim() ? "Clear Search" : "Create Reply",
            description: searchQuery.trim()
              ? "Try a different keyword or clear your search."
              : "Create reusable replies for common customer questions.",
            onAction: searchQuery.trim() ? () => setSearchQuery("") : openCreateDialog,
            title: searchQuery.trim() ? "No results found" : "No replies yet",
            variant: searchQuery.trim() ? "search" : "generic",
          }}
          getRowId={(row) => row.shortcut}
          onSelectedRowIdsChange={setSelectedReplyIds}
          selectable
          selectedRowIds={selectedReplyIds}
          showSelectionBar={false}
        />
      </SectionCard>

      <BulkActionBar
        actions={[
          { label: "Enable selected", onClick: () => updateSelectedReplyStatus("Active"), variant: "default" },
          { label: "Disable selected", onClick: () => updateSelectedReplyStatus("Disabled") },
        ]}
        label={`${selectedReplyCount} ${selectedReplyCount === 1 ? "reply" : "replies"} selected`}
        onClearSelection={() => setSelectedReplyIds([])}
        selectedCount={selectedReplyCount}
      />

      <CannedReplyDialog
        editingReply={editingReply}
        onOpenChange={setDialogOpen}
        onSave={saveReply}
        open={dialogOpen}
      />
    </div>
  );
}

function CannedReplyDialog({
  editingReply,
  onOpenChange,
  onSave,
  open,
}: {
  editingReply: CannedReplyRecord | null;
  onOpenChange: (open: boolean) => void;
  onSave: (reply: CannedReplyRecord) => void;
  open: boolean;
}) {
  const [formReply, setFormReply] = useState<CannedReplyRecord>(() => createEmptyReply());
  const submit = useMockSubmit();
  const isEditing = Boolean(editingReply);

  useEffect(() => {
    if (open) {
      setFormReply(editingReply ?? createEmptyReply());
    }
  }, [editingReply, open]);

  const updateForm = (updates: Partial<CannedReplyRecord>) => {
    setFormReply((currentReply) => ({ ...currentReply, ...updates }));
  };

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      setFormReply(createEmptyReply());
    }
  };

  const handleSave = () => {
    void submit.run(() => onSave(formReply));
  };

  return (
    <StandardDialog
      description="Create a reusable predefined response with a shortcut trigger."
      footerRight={
        <LoadingButton isLoading={submit.isSubmitting} loadingText="Saving..." onClick={handleSave}>
          {isEditing ? "Save Changes" : "Save Reply"}
        </LoadingButton>
      }
      onOpenChange={handleOpenChange}
      open={open}
      title={isEditing ? "Edit Reply" : "Create Reply"}
    >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-foreground">
              Title
              <Input
                className="mt-2"
                onChange={(event) => updateForm({ title: event.target.value })}
                placeholder="Greeting"
                value={formReply.title}
              />
            </label>
            <label className="text-sm font-medium text-foreground">
              Shortcut
              <Input
                className="mt-2"
                onChange={(event) => updateForm({ shortcut: event.target.value })}
                placeholder="/hi"
                value={formReply.shortcut}
              />
            </label>
            <label className="text-sm font-medium text-foreground">
              Category
              <select
                className="mt-2 h-10 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-whatsapp"
                onChange={(event) => updateForm({ category: event.target.value })}
                value={formReply.category}
              >
                {cannedReplyCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium text-foreground">
              Status
              <select
                className="mt-2 h-10 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-whatsapp"
                onChange={(event) =>
                  updateForm({ status: event.target.value as CannedReplyRecord["status"] })
                }
                value={formReply.status}
              >
                <option value="Active">Active</option>
                <option value="Disabled">Disabled</option>
              </select>
            </label>
          </div>

          <label className="mt-4 block text-sm font-medium text-foreground">
            Response Body
            <textarea
              className="mt-2 min-h-32 w-full resize-none rounded-xl border border-border bg-card p-3 text-sm text-foreground placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-whatsapp"
              onChange={(event) => updateForm({ responsePreview: event.target.value })}
              placeholder="Hi, thanks for reaching out. How can I help you today?"
              value={formReply.responsePreview}
            />
          </label>

    </StandardDialog>
  );
}

function createEmptyReply(): CannedReplyRecord {
  return {
    category: "General",
    responsePreview: "",
    shortcut: "",
    status: "Active",
    title: "",
  };
}
