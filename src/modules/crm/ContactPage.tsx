import { useEffect, useMemo, useState } from "react";
import { AvatarWithName } from "@/components/AvatarWithName";
import { ContactIdentityBlock, DetailField, DetailTagList } from "@/components/ContactDetails";
import { DataTable, type DataTableColumn } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";
import { AppIcons } from "@/components/icons";
import { SearchInput } from "@/components/SearchInput";
import { SectionCard } from "@/components/SectionCard";
import { SectionHeader } from "@/components/SectionLayout";
import { StandardDialog } from "@/components/StandardDialog";
import { StatusBadge } from "@/components/StatusBadge";
import { TableActions } from "@/components/TableActions";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  contacts,
  agents,
  conversationHistory,
  conversationHistoryMessages,
  tagOptions,
  type ContactRecord,
  type ConversationHistoryRecord,
} from "@/modules/crm/crm.data";

const customAttributeFields = ["Appointment Date", "City", "Budget", "Requirement", "Customer Type"] as const;
const rowsPerPage = 20;

type ContactFormState = {
  customAttributes: Record<string, string>;
  email: string;
  name: string;
  phone: string;
  tagToAdd: string;
  tags: string[];
};

export function ContactPage() {
  const [contactRows, setContactRows] = useState<ContactRecord[]>(contacts);
  const [availableTags, setAvailableTags] = useState(tagOptions);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewContact, setViewContact] = useState<ContactRecord | null>(null);
  const [editContact, setEditContact] = useState<ContactRecord | null>(null);
  const [contactForm, setContactForm] = useState<ContactFormState>(() => createContactFormState(contacts[0]));
  const [historyContact, setHistoryContact] = useState<ContactRecord | null>(null);
  const [timelineConversation, setTimelineConversation] = useState<ConversationHistoryRecord | null>(null);

  const filteredContacts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return contactRows;
    }

    return contactRows.filter((contact) =>
      [contact.name, contact.phone, contact.email, contact.tags.join(" ")]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [contactRows, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredContacts.length / rowsPerPage));
  const pageStart = (currentPage - 1) * rowsPerPage;
  const pageEnd = Math.min(pageStart + rowsPerPage, filteredContacts.length);
  const visibleContacts = filteredContacts.slice(pageStart, pageEnd);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const openViewProfile = (contact: ContactRecord) => {
    setViewContact(contact);
  };

  const openEditContact = (contact: ContactRecord) => {
    setContactForm(createContactFormState(contact));
    setEditContact(contact);
  };

  const openConversationHistory = (contact: ContactRecord) => {
    setTimelineConversation(null);
    setHistoryContact(contact);
  };

  const saveContactChanges = () => {
    if (!editContact) {
      return;
    }

    const nextContact: ContactRecord = {
      ...editContact,
      customAttributes: contactForm.customAttributes,
      email: contactForm.email.trim() || "Not available",
      name: contactForm.name.trim() || editContact.name,
      phone: contactForm.phone.trim() || editContact.phone,
      tags: contactForm.tags,
      initials: getInitials(contactForm.name.trim() || editContact.name),
    };

    setContactRows((currentContacts) =>
      currentContacts.map((contact) => (contact.id === editContact.id ? nextContact : contact)),
    );
    setEditContact(null);
  };

  const contactColumns: DataTableColumn<ContactRecord>[] = [
    {
      key: "contact",
      header: "Contact",
      cell: (row) => (
        <div className="flex items-center gap-3">
          <UserAvatar compact initials={row.initials} name={row.name} />
          <div>
            <p className="text-sm font-semibold text-foreground">{row.name}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{row.phone}</p>
          </div>
        </div>
      ),
    },
    { key: "email", header: "Email", cell: (row) => row.email },
    {
      key: "tags",
      header: "Tags",
      cell: (row) => <DetailTagList tags={row.tags} />,
    },
    { key: "lastInteraction", header: "Last Interaction", cell: (row) => row.lastInteraction },
    {
      key: "action",
      header: "Action",
      cell: (row) => (
        <TableActions
          actions={[
            { icon: AppIcons.view, label: "View profile", onClick: () => openViewProfile(row) },
            {
              icon: AppIcons.messageText,
              label: "View conversation history",
              onClick: () => openConversationHistory(row),
            },
            { icon: AppIcons.edit, label: "Edit contact", onClick: () => openEditContact(row) },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="flex w-full flex-col gap-4 pb-8">
      <SectionCard>
        <SectionHeader
          actions={
          <div className="w-full lg:w-80">
            <SearchInput
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search contacts"
              value={searchQuery}
            />
          </div>
          }
          description="Review WhatsApp contact records."
          title="Contact List"
        />
        {filteredContacts.length ? (
          <>
            <DataTable columns={contactColumns} data={visibleContacts} getRowId={(row) => row.id} />
            <div className="mt-4 flex flex-col gap-3 border-t border-border pt-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <p>
                Showing {pageStart + 1}-{pageEnd} of {filteredContacts.length} contacts
              </p>
              <div className="flex items-center gap-2">
                <Button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  size="sm"
                  variant="outline"
                >
                  Previous
                </Button>
                <span className="text-sm font-medium text-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  size="sm"
                  variant="outline"
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        ) : (
          <EmptyState
            actionLabel={searchQuery.trim() ? "Clear Search" : undefined}
            onAction={searchQuery.trim() ? () => setSearchQuery("") : undefined}
            variant={searchQuery.trim() ? "search" : "contacts"}
          />
        )}
      </SectionCard>

      <ContactProfileDialog contact={viewContact} onOpenChange={(open) => !open && setViewContact(null)} />
      <EditContactDialog
        availableTags={availableTags}
        contact={editContact}
        form={contactForm}
        onAddTag={() => {
          const nextTag = normalizeTagName(contactForm.tagToAdd);

          if (!nextTag || hasTag(contactForm.tags, nextTag)) {
            return;
          }

          setAvailableTags((currentTags) =>
            hasTag(currentTags, nextTag) ? currentTags : [...currentTags, nextTag],
          );
          setContactForm((currentForm) => ({
            ...currentForm,
            tagToAdd: "",
            tags: [...currentForm.tags, nextTag],
          }));
        }}
        onFormChange={setContactForm}
        onOpenChange={(open) => !open && setEditContact(null)}
        onRemoveTag={(tag) =>
          setContactForm((currentForm) => ({
            ...currentForm,
            tags: currentForm.tags.filter((item) => item !== tag),
          }))
        }
        onSave={saveContactChanges}
      />
      <ConversationHistoryDialog
        contact={historyContact}
        conversation={timelineConversation}
        onConversationSelect={setTimelineConversation}
        onOpenChange={(open) => {
          if (!open) {
            setHistoryContact(null);
            setTimelineConversation(null);
          }
        }}
      />
    </div>
  );
}

function ContactProfileDetails({ contact }: { contact: ContactRecord }) {
  return (
    <div className="mt-5 grid gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <DetailField label="Contact Name" value={contact.name} />
        <DetailField label="Phone Number" value={contact.phone} />
        <DetailField label="Email" value={contact.email} />
        <DetailField label="Conversation History" value={contact.historySummary} />
      </div>
      <DetailField label="Tags">
        <DetailTagList tags={contact.tags} />
      </DetailField>
      <DetailField label="Custom Attributes">
        <CustomAttributesList attributes={contact.customAttributes} />
      </DetailField>
    </div>
  );
}

function ContactProfileDialog({
  contact,
  onOpenChange,
}: {
  contact: ContactRecord | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <StandardDialog onOpenChange={onOpenChange} open={Boolean(contact)} title="Contact Profile">
      {contact ? (
        <div className="space-y-5">
          <ContactIdentityBlock
            avatarUrl={contact.avatarUrl}
            initials={contact.initials}
            name={contact.name}
            phone={contact.phone}
          />
          <ContactProfileDetails contact={contact} />
        </div>
      ) : null}
    </StandardDialog>
  );
}

function EditContactDialog({
  availableTags,
  contact,
  form,
  onAddTag,
  onFormChange,
  onOpenChange,
  onRemoveTag,
  onSave,
}: {
  availableTags: string[];
  contact: ContactRecord | null;
  form: ContactFormState;
  onAddTag: () => void;
  onFormChange: (form: ContactFormState) => void;
  onOpenChange: (open: boolean) => void;
  onRemoveTag: (tag: string) => void;
  onSave: () => void;
}) {
  const normalizedTag = normalizeTagName(form.tagToAdd);
  const matchingTags = availableTags.filter((tag) =>
    tag.toLowerCase().includes(form.tagToAdd.trim().toLowerCase()),
  );
  const exactTagExists = Boolean(normalizedTag) && hasTag(availableTags, normalizedTag);
  const selectedTagExists = Boolean(normalizedTag) && hasTag(form.tags, normalizedTag);

  return (
    <StandardDialog
      description="Update PRD-safe contact fields and tags."
      footerRight={<Button onClick={onSave}>Save Changes</Button>}
      onOpenChange={onOpenChange}
      open={Boolean(contact)}
      title="Edit Contact"
    >
      {contact ? (
        <div className="grid gap-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Contact Name">
              <Input
                onChange={(event) => onFormChange({ ...form, name: event.target.value })}
                value={form.name}
              />
            </Field>
            <Field label="Phone Number">
              <Input
                onChange={(event) => onFormChange({ ...form, phone: event.target.value })}
                value={form.phone}
              />
            </Field>
            <Field label="Email">
              <Input
                onChange={(event) => onFormChange({ ...form, email: event.target.value })}
                value={form.email}
              />
            </Field>
          </div>

          <Field label="Tags">
            <div className="flex flex-wrap gap-2">
              {form.tags.map((tag) => (
                <span
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-slate-50 px-3 py-1 text-xs text-muted-foreground"
                  key={tag}
                >
                  {tag}
                  <button
                    className="text-muted hover:text-foreground"
                    onClick={() => onRemoveTag(tag)}
                    type="button"
                  >
                    x
                  </button>
                </span>
              ))}
            </div>
            <div className="mt-3 grid gap-2">
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  onChange={(event) => onFormChange({ ...form, tagToAdd: event.target.value })}
                  placeholder="Search or create tag"
                  value={form.tagToAdd}
                />
                <Button disabled={!normalizedTag || selectedTagExists} onClick={onAddTag} type="button">
                  {exactTagExists ? "Add Tag" : `Create "${normalizedTag || "Tag"}"`}
                </Button>
              </div>
              {form.tagToAdd.trim() ? (
                <div className="flex flex-wrap gap-2">
                  {matchingTags.map((tag) => (
                    <button
                      className="rounded-full border border-border bg-slate-50 px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-whatsapp/30 hover:bg-whatsapp-light hover:text-whatsapp-dark disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={hasTag(form.tags, tag)}
                      key={tag}
                      onClick={() => onFormChange({ ...form, tagToAdd: tag })}
                      type="button"
                    >
                      {tag}
                    </button>
                  ))}
                  {!exactTagExists && normalizedTag ? (
                    <button
                      className="rounded-full border border-whatsapp/30 bg-whatsapp-light px-3 py-1 text-xs font-medium text-whatsapp-dark"
                      onClick={onAddTag}
                      type="button"
                    >
                      Create "{normalizedTag}"
                    </button>
                  ) : null}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {availableTags.map((tag) => (
                    <button
                      className="rounded-full border border-border bg-slate-50 px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-whatsapp/30 hover:bg-whatsapp-light hover:text-whatsapp-dark disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={hasTag(form.tags, tag)}
                      key={tag}
                      onClick={() => onFormChange({ ...form, tagToAdd: tag })}
                      type="button"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              )}
              {selectedTagExists ? (
                <p className="text-xs text-muted-foreground">Tag already added.</p>
              ) : null}
            </div>
          </Field>

          <Field label="Custom Attributes">
            <div className="grid gap-3 sm:grid-cols-2">
              {customAttributeFields.map((field) => (
                <label className="grid gap-2" key={field}>
                  <span className="text-xs font-semibold uppercase tracking-normal text-muted">{field}</span>
                  <Input
                    onChange={(event) =>
                      onFormChange({
                        ...form,
                        customAttributes: { ...form.customAttributes, [field]: event.target.value },
                      })
                    }
                    value={form.customAttributes[field] ?? ""}
                  />
                </label>
              ))}
            </div>
          </Field>
        </div>
      ) : null}
    </StandardDialog>
  );
}

function ConversationHistoryDialog({
  contact,
  conversation,
  onConversationSelect,
  onOpenChange,
}: {
  contact: ContactRecord | null;
  conversation: ConversationHistoryRecord | null;
  onConversationSelect: (conversation: ConversationHistoryRecord | null) => void;
  onOpenChange: (open: boolean) => void;
}) {
  const [historySearch, setHistorySearch] = useState("");
  const [visibleHistoryCount, setVisibleHistoryCount] = useState(10);
  const [statusFilter, setStatusFilter] = useState("All Status");
  const contactHistory = conversationHistory.filter((item) => item.contactId === contact?.id);
  const messages = conversationHistoryMessages.filter((message) => message.conversationId === conversation?.id);
  const filteredHistory = useMemo(() => {
    const query = historySearch.trim().toLowerCase();

    return contactHistory.filter((item) => {
      const matchesSearch =
        !query ||
        [item.lastMessage, item.status, item.assignedAgent]
          .join(" ")
          .toLowerCase()
          .includes(query);
      const matchesStatus = statusFilter === "All Status" || item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [contactHistory, historySearch, statusFilter]);
  const visibleHistory = filteredHistory.slice(0, visibleHistoryCount);
  const groupedHistory = useMemo(() => groupHistoryByDate(visibleHistory), [visibleHistory]);

  useEffect(() => {
    setHistorySearch("");
    setStatusFilter("All Status");
    setVisibleHistoryCount(10);
  }, [contact?.id]);

  useEffect(() => {
    setVisibleHistoryCount(10);
  }, [historySearch, statusFilter]);

  return (
    <StandardDialog onOpenChange={onOpenChange} open={Boolean(contact)} size="lg" title="Conversation History">
      {contact && !conversation ? (
        <div className="space-y-5">
          <ContactIdentityBlock
            avatarUrl={contact.avatarUrl}
            initials={contact.initials}
            name={contact.name}
            phone={contact.phone}
          />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <SearchInput
              className="min-w-0 flex-1"
              onChange={(event) => setHistorySearch(event.target.value)}
              placeholder="Search history"
              value={historySearch}
            />
            <select
              className="h-12 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-whatsapp sm:w-[190px]"
              onChange={(event) => setStatusFilter(event.target.value)}
              value={statusFilter}
            >
              {["All Status", "Open", "Pending", "Closed"].map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </div>
          {contactHistory.length ? (
            groupedHistory.length ? (
              <div className="space-y-5">
                {groupedHistory.map((group) => (
                  <section key={group.date}>
                    <p className="px-1 text-[11px] font-semibold uppercase tracking-normal text-muted">{group.date}</p>
                    <div className="mt-1 divide-y divide-slate-200">
                      {group.items.map((item) => (
                        <div
                          className="grid gap-2 px-2 py-2.5 text-sm sm:grid-cols-[78px_minmax(0,1fr)_86px_120px_52px] sm:items-center"
                          key={item.id}
                        >
                          <p className="text-xs font-medium text-muted-foreground">{item.time}</p>
                          <p className="min-w-0 truncate text-foreground" title={item.lastMessage}>
                            {item.lastMessage}
                          </p>
                          <div>
                            <StatusBadge status={item.status} />
                          </div>
                          <AgentName name={item.assignedAgent} />
                          <Button className="h-8 w-fit px-2" onClick={() => onConversationSelect(item)} size="sm" variant="ghost">
                            View
                          </Button>
                        </div>
                      ))}
                    </div>
                  </section>
                ))}
                {filteredHistory.length > visibleHistoryCount ? (
                  <div className="flex justify-center border-t border-border pt-3">
                    <Button
                      onClick={() => setVisibleHistoryCount((currentCount) => currentCount + 10)}
                      size="sm"
                      variant="outline"
                    >
                      Load More
                    </Button>
                  </div>
                ) : null}
              </div>
            ) : (
              <EmptyState
                actionLabel="Clear Filters"
                onAction={() => {
                  setHistorySearch("");
                  setStatusFilter("All Status");
                }}
                variant="filters"
              />
            )
          ) : (
            <EmptyState
              title="No conversation history"
              description="This contact does not have any recorded WhatsApp conversations yet."
              variant="conversations"
            />
          )}
        </div>
      ) : null}
      {conversation && contact ? (
        <div className="space-y-5">
          <Button onClick={() => onConversationSelect(null)} size="sm" variant="outline">
            Back to history
          </Button>
          <ContactIdentityBlock
            avatarUrl={contact.avatarUrl}
            initials={contact.initials}
            name={contact.name}
            phone={contact.phone}
          />
          <div className="grid gap-4 sm:grid-cols-3">
            <DetailField label="Date" value={conversation.date} />
            <DetailField label="Assigned Agent">
              <div className="mt-2">
                <AgentName name={conversation.assignedAgent} />
              </div>
            </DetailField>
            <DetailField label="Conversation Status">
              <div className="mt-2">
                <StatusBadge status={conversation.status} />
              </div>
            </DetailField>
          </div>
          <div className="space-y-3 rounded-xl bg-slate-50/70 p-4">
            {messages.length ? (
              messages.map((message) => <HistoryMessageBubble key={message.id} message={message} />)
            ) : (
              <EmptyState compact variant="conversations" title="No message timeline" description="This history record does not have messages yet." />
            )}
          </div>
        </div>
      ) : null}
    </StandardDialog>
  );
}

function HistoryMessageBubble({ message }: { message: { content: string; direction: string; status?: string; timestamp: string; type: string } }) {
  const isOutgoing = message.direction === "outgoing";

  return (
    <div className={`flex ${isOutgoing ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[78%] rounded-2xl border px-4 py-3 text-sm ${
          isOutgoing
            ? "border-whatsapp/20 bg-whatsapp-light text-foreground"
            : "border-border bg-card text-foreground"
        }`}
      >
        <p className="text-xs font-semibold uppercase tracking-normal text-muted">{message.type}</p>
        <p className="mt-1 leading-6">{message.content}</p>
        <p className="mt-2 text-xs text-muted-foreground">
          {message.timestamp}
          {isOutgoing && message.status ? ` · ${message.status}` : ""}
        </p>
      </div>
    </div>
  );
}

function AgentName({ name }: { name: string }) {
  if (name === "Unassigned") {
    return <span className="text-xs text-muted-foreground">Unassigned</span>;
  }

  const agent = agents.find((item) => item.name === name);

  return <AvatarWithName initials={agent?.initials} name={name} size="sm" />;
}

function groupHistoryByDate(history: ConversationHistoryRecord[]) {
  const groups = new Map<string, ConversationHistoryRecord[]>();

  history.forEach((item) => {
    const currentGroup = groups.get(item.date) ?? [];
    currentGroup.push(item);
    groups.set(item.date, currentGroup);
  });

  return [...groups.entries()].map(([date, items]) => ({ date, items }));
}

function CustomAttributesList({ attributes }: { attributes: Record<string, string> }) {
  const entries = customAttributeFields
    .map((field) => [field, attributes[field]] as const)
    .filter(([, value]) => Boolean(value));

  if (!entries.length) {
    return <p className="mt-2 text-sm text-muted-foreground">Not available</p>;
  }

  return (
    <div className="mt-2 grid gap-2 sm:grid-cols-2">
      {entries.map(([field, value]) => (
        <div className="rounded-xl bg-slate-50/70 p-3" key={field}>
          <p className="text-xs font-semibold uppercase tracking-normal text-muted">{field}</p>
          <p className="mt-1 text-sm text-foreground">{value}</p>
        </div>
      ))}
    </div>
  );
}

function Field({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-semibold uppercase tracking-normal text-muted">{label}</span>
      {children}
    </label>
  );
}

function createContactFormState(contact?: ContactRecord): ContactFormState {
  return {
    customAttributes: { ...(contact?.customAttributes ?? {}) },
    email: contact?.email ?? "",
    name: contact?.name ?? "",
    phone: contact?.phone ?? "",
    tagToAdd: "",
    tags: [...(contact?.tags ?? [])],
  };
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function hasTag(tags: string[], tag: string) {
  return tags.some((item) => item.toLowerCase() === tag.toLowerCase());
}

function normalizeTagName(tag: string) {
  const cleanedTag = tag.trim().replace(/\s+/g, " ");

  if (!cleanedTag) {
    return "";
  }

  return cleanedTag
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}
