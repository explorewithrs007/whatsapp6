import { useState } from "react";
import type { ReactNode } from "react";
import { useAppToast } from "@/components/AppToast";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { DataTable, type DataTableColumn } from "@/components/DataTable";
import { AppIcons } from "@/components/icons";
import { LoadingButton } from "@/components/LoadingButton";
import { SectionCard } from "@/components/SectionCard";
import { StandardDialog } from "@/components/StandardDialog";
import { TableActions } from "@/components/TableActions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMockSubmit } from "@/hooks/useMockSubmit";
import { linkAliases, type LinkAliasRecord } from "@/modules/workspace-settings/workspace-settings.data";

const selectClass =
  "h-10 rounded-xl border border-border bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-whatsapp";

function emptyLink(): LinkAliasRecord {
  return {
    id: `link-${Date.now()}`,
    linkName: "",
    type: "Click-to-Chat Link",
    whatsappNumber: "",
    prefilledMessage: "",
    shortLink: "wa.link/new",
    customAlias: "",
    conversations: 0,
  };
}

export function LinksAliasPage() {
  const [links, setLinks] = useState<LinkAliasRecord[]>(linkAliases);
  const [formOpen, setFormOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<LinkAliasRecord | null>(null);
  const [previewLink, setPreviewLink] = useState<LinkAliasRecord | null>(null);
  const [deleteLink, setDeleteLink] = useState<LinkAliasRecord | null>(null);
  const [formLink, setFormLink] = useState<LinkAliasRecord>(emptyLink());
  const toast = useAppToast();

  const openCreate = () => {
    setEditingLink(null);
    setFormLink(emptyLink());
    setFormOpen(true);
  };

  const openEdit = (link: LinkAliasRecord) => {
    setEditingLink(link);
    setFormLink(link);
    setFormOpen(true);
  };

  const saveLink = () => {
    const nextLink = {
      ...formLink,
      shortLink: formLink.shortLink || `wa.link/${formLink.customAlias || "whatsapp"}`,
    };
    setLinks((current) =>
      editingLink ? current.map((link) => link.id === editingLink.id ? nextLink : link) : [...current, nextLink],
    );
    setFormOpen(false);
    toast.success(editingLink ? "Link updated." : "Link created.");
  };

  const columns: DataTableColumn<LinkAliasRecord>[] = [
    { key: "linkName", header: "Link Name", cell: (row) => <span className="font-medium text-foreground">{row.linkName}</span> },
    { key: "type", header: "Type", cell: (row) => row.type },
    { key: "whatsappNumber", header: "WhatsApp Number", cell: (row) => row.whatsappNumber },
    { key: "prefilledMessage", header: "Prefilled Message", cell: (row) => row.prefilledMessage },
    { key: "shortLink", header: "Short Link", cell: (row) => row.shortLink },
    { key: "customAlias", header: "Custom Alias", cell: (row) => row.customAlias },
    { key: "conversations", header: "Clicks / Conversations", cell: (row) => row.conversations },
    {
      key: "action",
      header: "Action",
      cell: (row) => (
        <TableActions
          actions={[
            { icon: AppIcons.view, label: "Preview link", onClick: () => setPreviewLink(row) },
            { icon: AppIcons.edit, label: "Edit link", onClick: () => openEdit(row) },
            { destructive: true, icon: AppIcons.delete, label: "Delete link", onClick: () => setDeleteLink(row) },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="flex w-full flex-col gap-4">
      <SectionCard>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground">Links & Alias</h2>
            <p className="mt-1 text-sm text-muted-foreground">Manage WhatsApp entry links.</p>
          </div>
          <Button onClick={openCreate}>Create Link</Button>
        </div>
        <DataTable columns={columns} data={links} getRowId={(row) => row.id} />
      </SectionCard>

      <LinkFormDialog formLink={formLink} onFormChange={setFormLink} onOpenChange={setFormOpen} onSave={saveLink} open={formOpen} title={editingLink ? "Edit Link" : "Create Link"} />
      <PreviewDialog link={previewLink} onOpenChange={(open) => !open && setPreviewLink(null)} />
      <ConfirmationDialog
        cancelLabel="Cancel"
        confirmLabel="Delete"
        description="Delete this frontend-only WhatsApp link record."
        onConfirm={() => {
          if (deleteLink) {
            setLinks((current) => current.filter((link) => link.id !== deleteLink.id));
            toast.success("Link deleted.");
          }
        }}
        onOpenChange={(open) => !open && setDeleteLink(null)}
        open={Boolean(deleteLink)}
        title="Delete Link"
      />
    </div>
  );
}

function LinkFormDialog({
  formLink,
  onFormChange,
  onOpenChange,
  onSave,
  open,
  title,
}: {
  formLink: LinkAliasRecord;
  onFormChange: (link: LinkAliasRecord) => void;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
  open: boolean;
  title: string;
}) {
  const submit = useMockSubmit();

  return (
    <StandardDialog
      description="Create a WhatsApp entry link for lead tracking."
      footerRight={
        <LoadingButton isLoading={submit.isSubmitting} loadingText="Saving..." onClick={() => submit.run(onSave)}>
          {title === "Create Link" ? "Create Link" : "Save Link"}
        </LoadingButton>
      }
      onOpenChange={onOpenChange}
      open={open}
      size="lg"
      title={title}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Link Name"><Input value={formLink.linkName} onChange={(event) => onFormChange({ ...formLink, linkName: event.target.value })} /></Field>
        <Field label="WhatsApp Number"><Input value={formLink.whatsappNumber} onChange={(event) => onFormChange({ ...formLink, whatsappNumber: event.target.value })} /></Field>
        <Field label="Link Type">
          <select className={selectClass} value={formLink.type} onChange={(event) => onFormChange({ ...formLink, type: event.target.value as LinkAliasRecord["type"] })}>
            <option>Click-to-Chat Link</option>
            <option>Short Link</option>
            <option>Custom Alias</option>
          </select>
        </Field>
        <Field label="Custom Alias"><Input value={formLink.customAlias} onChange={(event) => onFormChange({ ...formLink, customAlias: event.target.value })} /></Field>
      </div>
      <Field label="Prefilled Message">
        <textarea className="mt-2 min-h-24 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-whatsapp" value={formLink.prefilledMessage} onChange={(event) => onFormChange({ ...formLink, prefilledMessage: event.target.value })} />
      </Field>
    </StandardDialog>
  );
}

function PreviewDialog({ link, onOpenChange }: { link: LinkAliasRecord | null; onOpenChange: (open: boolean) => void }) {
  const waLink = link ? `https://wa.me/${link.whatsappNumber.replace(/\D/g, "")}?text=${encodeURIComponent(link.prefilledMessage)}` : "";
  return (
    <StandardDialog
      onOpenChange={onOpenChange}
      open={Boolean(link)}
      size="sm"
      title="Link Preview"
    >
      {link ? <div className="grid gap-4"><Info label="wa.me Link" value={waLink} /><Info label="Short Link" value={link.shortLink} /><Info label="Custom Alias" value={link.customAlias} /><Info label="Prefilled Message" value={link.prefilledMessage} /></div> : null}
    </StandardDialog>
  );
}

function Field({ children, label }: { children: ReactNode; label: string }) {
  return <label className="mt-4 grid gap-2"><span className="text-xs font-semibold uppercase tracking-normal text-muted">{label}</span>{children}</label>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs font-semibold uppercase tracking-normal text-muted">{label}</p><p className="mt-1 break-words text-sm text-foreground">{value}</p></div>;
}
