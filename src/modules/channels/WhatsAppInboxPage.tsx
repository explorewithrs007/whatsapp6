import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useAppToast } from "@/components/AppToast";
import { AvatarWithName } from "@/components/AvatarWithName";
import { AppIcons, type AppIcon } from "@/components/icons";
import { EmptyState } from "@/components/EmptyState";
import { ChatSkeleton, DetailPanelSkeleton, ListSkeleton } from "@/components/LoadingStates";
import {
  ContactIdentityBlock,
  DetailField,
  DetailTagList,
  InternalNoteCard,
  ProfileAccordionSection,
  ProfileSection,
} from "@/components/ContactDetails";
import { SearchInput } from "@/components/SearchInput";
import { StandardDialog } from "@/components/StandardDialog";
import { StatusBadge } from "@/components/StatusBadge";
import { UserAvatar } from "@/components/UserAvatar";
import { useWorkspaceSettings } from "@/components/WorkspaceSettingsContext";
import { Button } from "@/components/ui/button";
import * as DropdownMenu from "@/components/ui/dropdown-menu";
import { Tooltip } from "@/components/ui/tooltip";
import { WORKSPACE_USER } from "@/lib/constants";
import { useMockLoading } from "@/hooks/useMockLoading";
import { useMockSubmit } from "@/hooks/useMockSubmit";
import { resolveTemplateVariables } from "@/lib/templateVariables";
import { cn } from "@/lib/utils";
import { agents, tagOptions } from "@/modules/crm/crm.data";
import {
  approvedInboxTemplates,
  cannedReplies,
  conversations,
  internalNotes,
  messages,
  type CannedReply,
  type Conversation,
  type ConversationMessage,
  type InboxInternalNote,
} from "@/modules/channels/channels.data";

type SelectedAttachment = {
  id: string;
  type: "Image" | "Document" | "Media";
  name: string;
};

const mockAttachments: Record<SelectedAttachment["type"], string> = {
  Image: "reference-image.png",
  Document: "appointment-confirmation.pdf",
  Media: "product-demo.mp4",
};

const mockAttachmentMeta: Record<SelectedAttachment["type"], Pick<ConversationMessage, "caption" | "duration" | "fileSize" | "imageUrl">> = {
  Image: { caption: "Uploaded reference image" },
  Document: { fileSize: "128 KB" },
  Media: { duration: "0:42" },
};

const isWorkspaceAdmin = WORKSPACE_USER.role === "Admin" || WORKSPACE_USER.role === "Workspace Admin";
const defaultAssignedAgentFilter = isWorkspaceAdmin ? "All Agents" : WORKSPACE_USER.name;
const composerMaxHeight = 132;

function insertReplyText(currentText: string, reply: CannedReply, command?: string) {
  if (command) {
    return currentText.replace(command, reply.message);
  }

  return currentText ? `${currentText}\n${reply.message}` : reply.message;
}

function resizeComposerTextarea(textarea: HTMLTextAreaElement | null) {
  if (!textarea) {
    return;
  }

  textarea.style.height = "auto";
  const nextHeight = Math.min(textarea.scrollHeight, composerMaxHeight);
  textarea.style.height = `${nextHeight}px`;
  textarea.style.overflowY = textarea.scrollHeight > composerMaxHeight ? "auto" : "hidden";
}

export function WhatsAppInboxPage() {
  const isLoading = useMockLoading();
  const [searchQuery, setSearchQuery] = useState("");
  const [conversationRows, setConversationRows] = useState<Conversation[]>(conversations);
  const [messageRows, setMessageRows] = useState<ConversationMessage[]>(messages);
  const [assignedAgentFilter, setAssignedAgentFilter] = useState(defaultAssignedAgentFilter);
  const [selectedConversationId, setSelectedConversationId] = useState(conversations[0].id);
  const [composerText, setComposerText] = useState("");
  const [selectedAttachments, setSelectedAttachments] = useState<SelectedAttachment[]>([]);
  const [selectedReplyShortcut, setSelectedReplyShortcut] = useState<string | null>(null);
  const [selectedTemplateName, setSelectedTemplateName] = useState<string | null>(null);
  const [previewAttachment, setPreviewAttachment] = useState<ConversationMessage | null>(null);
  const [downloadFeedback, setDownloadFeedback] = useState("");
  const [labelPanelOpen, setLabelPanelOpen] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [noteRows, setNoteRows] = useState<InboxInternalNote[]>(internalNotes);
  const [notesExpanded, setNotesExpanded] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNote, setNewNote] = useState("");
  const sendSubmit = useMockSubmit(450);
  const noteSubmit = useMockSubmit(450);
  const toast = useAppToast();
  const { profile } = useWorkspaceSettings();
  const messageAreaRef = useRef<HTMLDivElement>(null);
  const composerTextareaRef = useRef<HTMLTextAreaElement>(null);

  const filteredConversations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return conversationRows;
    }

    return conversationRows.filter((conversation) =>
      [conversation.contactName, conversation.phoneNumber, conversation.lastMessage]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [conversationRows, searchQuery]);

  const filteredByAssignedAgent = useMemo(() => {
    if (assignedAgentFilter === "All Agents") {
      return filteredConversations;
    }

    if (assignedAgentFilter === "Unassigned") {
      return filteredConversations.filter(
        (conversation) => !conversation.assignedAgent || conversation.assignedAgent === "Unassigned",
      );
    }

    return filteredConversations.filter((conversation) => conversation.assignedAgent === assignedAgentFilter);
  }, [assignedAgentFilter, filteredConversations]);

  useEffect(() => {
    if (!filteredByAssignedAgent.length) {
      return;
    }

    if (!filteredByAssignedAgent.some((conversation) => conversation.id === selectedConversationId)) {
      setSelectedConversationId(filteredByAssignedAgent[0].id);
    }
  }, [filteredByAssignedAgent, selectedConversationId]);

  const selectedConversation =
    conversationRows.find((conversation) => conversation.id === selectedConversationId) ?? conversationRows[0];
  const isComposerDisabled = selectedConversation.status === "Closed";
  const selectedMessages = messageRows.filter((message) => message.conversationId === selectedConversation.id);
  const selectedInternalNotes = noteRows.filter((note) => note.conversationId === selectedConversation.id);
  const availableLabels = useMemo(() => {
    const labelSet = new Set([...tagOptions, ...conversationRows.flatMap((conversation) => conversation.tags)]);
    return [...labelSet].sort((first, second) => first.localeCompare(second));
  }, [conversationRows]);
  const activeSlashCommand = composerText.match(/(?:^|\s)(\/[a-z]*)$/)?.[1] ?? "";
  const slashMatches = activeSlashCommand
    ? cannedReplies.filter((reply) => reply.shortcut.startsWith(activeSlashCommand.toLowerCase()))
    : [];
  const canSendMessage =
    !isComposerDisabled &&
    (Boolean(composerText.trim()) || selectedAttachments.length > 0 || Boolean(selectedTemplateName));

  useEffect(() => {
    const messageArea = messageAreaRef.current;

    if (!messageArea) {
      return;
    }

    messageArea.scrollTop = messageArea.scrollHeight;
  }, [selectedConversationId, selectedMessages.length]);

  useEffect(() => {
    resizeComposerTextarea(composerTextareaRef.current);
  }, [composerText]);

  const updateComposerText = (nextText: string) => {
    setComposerText(nextText);
  };

  const applyCannedReply = (reply: CannedReply) => {
    updateComposerText(insertReplyText(composerText, reply, activeSlashCommand));
    setSelectedReplyShortcut(reply.shortcut);
    setSelectedTemplateName(null);
  };

  const templateContext = {
    assignedAgent: selectedConversation.assignedAgent,
    contactName: selectedConversation.contactName,
    customAttributes: selectedConversation.customAttributes,
    email: selectedConversation.email,
    phoneNumber: selectedConversation.phoneNumber,
  };

  const addAttachment = (type: SelectedAttachment["type"]) => {
    setSelectedAttachments((currentAttachments) => [
      ...currentAttachments,
      {
        id: `${type}-${currentAttachments.length + 1}-${Date.now()}`,
        type,
        name: mockAttachments[type],
      },
    ]);
  };

  const removeAttachment = (id: string) => {
    setSelectedAttachments((currentAttachments) =>
      currentAttachments.filter((attachment) => attachment.id !== id),
    );
  };

  const handleDownloadAttachment = (message: ConversationMessage) => {
    const fileName = getAttachmentFileName(message);
    setDownloadFeedback(`Download started for ${fileName}`);
    window.setTimeout(() => setDownloadFeedback(""), 2500);
  };

  const updateSelectedConversationTags = (nextTags: string[]) => {
    setConversationRows((currentRows) =>
      currentRows.map((conversation) =>
        conversation.id === selectedConversation.id ? { ...conversation, tags: nextTags } : conversation,
      ),
    );
  };

  const addSelectedConversationLabel = (label: string) => {
    const normalizedLabel = normalizeLabel(label);

    if (!normalizedLabel) {
      return;
    }

    const alreadyExists = selectedConversation.tags.some(
      (tag) => tag.toLowerCase() === normalizedLabel.toLowerCase(),
    );

    if (!alreadyExists) {
      updateSelectedConversationTags([...selectedConversation.tags, normalizedLabel]);
      toast.success("Label added.");
    }

    setNewLabel("");
  };

  const removeSelectedConversationLabel = (label: string) => {
    updateSelectedConversationTags(selectedConversation.tags.filter((tag) => tag !== label));
    toast.success("Label removed.");
  };

  const updateSelectedConversationAssignee = (nextAssignee: string) => {
    setConversationRows((currentRows) =>
      currentRows.map((conversation) =>
        conversation.id === selectedConversation.id
          ? { ...conversation, assignedAgent: nextAssignee === "Unassigned" ? "Unassigned" : nextAssignee }
          : conversation,
      ),
    );

    if (nextAssignee === "Unassigned") {
      toast.info("Chat marked unassigned.");
    } else {
      toast.success(`Chat assigned to ${nextAssignee}.`);
    }
  };

  const updateSelectedConversationStatus = (nextStatus: Conversation["status"]) => {
    setConversationRows((currentRows) =>
      currentRows.map((conversation) =>
        conversation.id === selectedConversation.id ? { ...conversation, status: nextStatus } : conversation,
      ),
    );

    if (nextStatus === "Closed") {
      toast.success("Conversation closed.");
      return;
    }

    if (nextStatus === "Open") {
      toast.success("Conversation reopened.");
      return;
    }

    toast.success("Conversation marked Pending.");
  };

  const addSelectedConversationNote = () => {
    const content = newNote.trim();

    if (!content) {
      return;
    }

    setNoteRows((currentRows) => [
      {
        author: profile.fullName,
        content,
        conversationId: selectedConversation.id,
        id: `local-note-${Date.now()}`,
        timestamp: "Just now",
      },
      ...currentRows,
    ]);
    setNewNote("");
    setIsAddingNote(false);
    setNotesExpanded(true);
    toast.success("Internal note added.");
  };

  const handleSendMessage = () => {
    if (sendSubmit.isSubmitting) {
      return;
    }

    if (!canSendMessage) {
      return;
    }

    const timestamp = new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date());
    const trimmedText = resolveTemplateVariables(composerText.trim(), templateContext);
    const messageIdBase = Date.now();
    const nextMessages: ConversationMessage[] = [];

    if (trimmedText) {
      nextMessages.push({
        body: trimmedText,
        conversationId: selectedConversation.id,
        direction: "outgoing",
        id: `local-text-${messageIdBase}`,
        status: "Sent",
        timestamp,
        type: "Text",
      });
    }

    selectedAttachments.forEach((attachment, index) => {
      nextMessages.push({
        body: attachment.name,
        conversationId: selectedConversation.id,
        direction: "outgoing",
        fileName: attachment.name,
        id: `local-attachment-${messageIdBase}-${index}`,
        status: "Sent",
        timestamp,
        type: attachment.type,
        ...mockAttachmentMeta[attachment.type],
      });
    });

    if (!nextMessages.length && selectedTemplateName) {
      nextMessages.push({
        body: selectedTemplateName,
        conversationId: selectedConversation.id,
        direction: "outgoing",
        id: `local-template-${messageIdBase}`,
        status: "Sent",
        timestamp,
        type: "Text",
      });
    }

    void sendSubmit.run(() => {
      setMessageRows((currentRows) => [...currentRows, ...nextMessages]);
      setConversationRows((currentRows) => {
        const previewMessage =
          trimmedText ||
          (selectedAttachments[0] ? `${selectedAttachments[0].type}: ${selectedAttachments[0].name}` : selectedTemplateName) ||
          selectedConversation.lastMessage;
        const previewSource = nextMessages[nextMessages.length - 1];
        const lastMessageMeta = previewSource
          ? createLocalLastMessageMeta(previewSource)
          : selectedConversation.lastMessageMeta;
        const updatedRows = currentRows.map((conversation) =>
          conversation.id === selectedConversation.id
            ? { ...conversation, lastMessage: previewMessage, lastMessageMeta, lastMessageTime: timestamp }
            : conversation,
        );
        const updatedConversation = updatedRows.find((conversation) => conversation.id === selectedConversation.id);

        return updatedConversation
          ? [updatedConversation, ...updatedRows.filter((conversation) => conversation.id !== selectedConversation.id)]
          : updatedRows;
      });
      updateComposerText("");
      setSelectedAttachments([]);
      setSelectedReplyShortcut(null);
      setSelectedTemplateName(null);
      toast.success("Message sent.");
    }, { onError: () => toast.error("Something went wrong. Please try again.") });
  };

  return (
    <div className="flex h-full w-full overflow-hidden">
      {downloadFeedback ? (
        <div className="fixed bottom-5 right-5 z-50 rounded-xl border border-slate-200 bg-card px-4 py-3 text-sm text-foreground shadow-soft">
          {downloadFeedback}
        </div>
      ) : null}
      <section className="grid min-h-0 flex-1 overflow-hidden bg-card grid-cols-[300px_minmax(0,1fr)_300px] 2xl:grid-cols-[320px_minmax(0,1fr)_320px] min-[1600px]:grid-cols-[340px_minmax(0,1fr)_340px]">
        <section className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden border-r border-slate-300 bg-slate-50/70 px-2 py-2">
          <div className="mb-2 shrink-0">
            <h2 className="text-base font-semibold text-foreground">Inbox View</h2>
            <p className="mt-1 text-sm text-muted-foreground">WhatsApp conversations only.</p>
          </div>
          <SearchInput
            className="w-full"
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search name, phone, keyword"
            value={searchQuery}
          />
          {isWorkspaceAdmin ? (
            <label className="mt-2 flex items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-normal text-slate-500">Assigned Agent</span>
              <AssignedAgentFilter
                onChange={setAssignedAgentFilter}
                value={assignedAgentFilter}
              />
            </label>
          ) : null}
          <div className="scrollbar-none -mx-2 mt-2 min-h-0 flex-1 overflow-y-auto border-t border-slate-300 bg-card">
            {isLoading ? (
              <ListSkeleton rows={7} />
            ) : filteredByAssignedAgent.length ? (
              filteredByAssignedAgent.map((conversation) => {
                const isSelected = conversation.id === selectedConversation.id;

                return (
                  <button
                    key={conversation.id}
                    className={cn(
                      "flex min-h-[76px] w-full items-start gap-2.5 border-b border-slate-200 px-2 py-2.5 text-left transition-colors last:border-b-0",
                      isSelected
                        ? "bg-emerald-50/90 shadow-[inset_4px_0_0_rgba(18,140,126,0.85)]"
                        : "bg-card hover:bg-slate-50",
                    )}
                    onClick={() => setSelectedConversationId(conversation.id)}
                    type="button"
                  >
                    <UserAvatar
                      avatarUrl={conversation.avatarUrl}
                      compact
                      initials={conversation.initials}
                      name={conversation.contactName}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1 pt-0.5">
                      <div className="flex min-w-0 items-center gap-2">
                        <p className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
                          {conversation.contactName}
                        </p>
                      </div>
                      <LastMessagePreview conversation={conversation} />
                      <div className="mt-1">
                        <AgentName name={conversation.assignedAgent ?? "Unassigned"} compact />
                      </div>
                    </div>
                    <div className="flex w-[78px] shrink-0 flex-col items-end gap-1 pt-0.5">
                      <span className="max-w-full truncate text-xs text-muted">{conversation.lastMessageTime}</span>
                      <StatusBadge status={conversation.status} />
                    </div>
                  </button>
                );
              })
            ) : (
              <EmptyState
                compact
                variant="conversations"
                title="No conversations found"
                description="Try searching by contact name, phone number, keyword, or assigned agent."
              />
            )}
          </div>
        </section>

        <section className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
          {isLoading ? (
            <ChatSkeleton />
          ) : (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="shrink-0 border-b border-slate-300 bg-card px-3 py-2.5">
              <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <UserAvatar
                      avatarUrl={selectedConversation.avatarUrl}
                      compact
                      initials={selectedConversation.initials}
                      name={selectedConversation.contactName}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <h2 className="truncate text-base font-semibold text-foreground">{selectedConversation.contactName}</h2>
                      <p className="text-sm text-muted-foreground">{selectedConversation.phoneNumber}</p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                  <ChatAssigneeControl
                    editable={isWorkspaceAdmin}
                    onChange={updateSelectedConversationAssignee}
                    value={selectedConversation.assignedAgent ?? "Unassigned"}
                  />
                  <ChatStatusControl
                    editable={isWorkspaceAdmin}
                    onChange={updateSelectedConversationStatus}
                    value={selectedConversation.status}
                  />
                </div>
              </div>
            </div>

            <div ref={messageAreaRef} className="scrollbar-none min-h-0 flex-1 space-y-2.5 overflow-y-auto bg-slate-50/80 px-3 pb-3 pt-2.5">
              {selectedMessages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  onDownload={handleDownloadAttachment}
                  onViewImage={setPreviewAttachment}
                />
              ))}
            </div>

            <div className="shrink-0 border-t border-slate-300 bg-card p-1.5">
              {isComposerDisabled ? (
                <div className="flex items-center gap-3 rounded-xl bg-slate-50/70 px-3 py-2.5 text-sm text-muted-foreground">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-card text-slate-500">
                    <AppIcons.lock className="h-[18px] w-[18px]" />
                  </span>
                  <p>This conversation is closed. Reopen it to send a new message.</p>
                </div>
              ) : (
                <div className="relative rounded-xl border border-slate-200 bg-card p-1.5 focus-within:border-whatsapp/50 focus-within:ring-1 focus-within:ring-whatsapp/25">
                  {activeSlashCommand ? (
                  <div className="absolute bottom-[calc(100%+0.5rem)] left-3 z-20 w-72 rounded-xl border border-border bg-card p-2 shadow-soft">
                    {slashMatches.length ? (
                      slashMatches.map((reply) => (
                        <button
                          key={reply.shortcut}
                          className="flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left hover:bg-slate-50"
                          onClick={() => applyCannedReply(reply)}
                          type="button"
                        >
                          <span className="text-sm font-semibold text-whatsapp-dark">{reply.shortcut}</span>
                          <span className="text-sm text-muted-foreground">{reply.label}</span>
                        </button>
                      ))
                    ) : (
                      <p className="px-3 py-2 text-sm text-muted-foreground">No shortcut found</p>
                    )}
                  </div>
                ) : null}

                <textarea
                  className="subtle-scrollbar max-h-[132px] min-h-11 w-full resize-none overflow-y-hidden border-0 bg-transparent px-1 py-2 text-sm leading-5 text-foreground placeholder:text-muted focus-visible:outline-none"
                  onChange={(event) => updateComposerText(event.target.value)}
                  placeholder="Reply to this WhatsApp conversation"
                  ref={composerTextareaRef}
                  rows={1}
                  value={composerText}
                />

                <div className="mt-1.5 flex flex-col gap-1.5 sm:flex-row sm:items-end sm:justify-between">
                  <div className="scrollbar-hide flex max-h-7 min-w-0 flex-1 gap-2 overflow-x-auto overflow-y-hidden whitespace-nowrap pr-2">
                  {selectedAttachments.map((attachment) => (
                    <button
                      key={attachment.id}
                      className="inline-flex h-7 shrink-0 items-center gap-2 rounded-full border border-border bg-slate-50 px-3 text-xs text-muted-foreground"
                      onClick={() => removeAttachment(attachment.id)}
                      type="button"
                    >
                      {attachment.type}: {attachment.name}
                      <span aria-hidden="true" className="text-muted">x</span>
                    </button>
                  ))}
                  {selectedReplyShortcut ? (
                    <button
                      className="inline-flex h-7 shrink-0 items-center gap-2 rounded-full border border-border bg-slate-50 px-3 text-xs text-muted-foreground"
                      onClick={() => setSelectedReplyShortcut(null)}
                      type="button"
                    >
                      Canned Reply: {selectedReplyShortcut}
                      <span aria-hidden="true" className="text-muted">x</span>
                    </button>
                  ) : null}
                  {selectedTemplateName ? (
                    <button
                      className="inline-flex h-7 shrink-0 items-center gap-2 rounded-full border border-border bg-slate-50 px-3 text-xs text-muted-foreground"
                      onClick={() => setSelectedTemplateName(null)}
                      type="button"
                    >
                      Template: {selectedTemplateName}
                      <span aria-hidden="true" className="text-muted">x</span>
                    </button>
                  ) : null}
                </div>

                  <div className="flex shrink-0 items-center justify-end gap-1.5">
                    <DropdownMenu.Root>
                      <DropdownMenu.Trigger asChild>
                        <span>
                          <Tooltip label="Attach image, document, or media">
                            <Button
                              size="icon"
                              variant="ghost"
                              aria-label="Attach image, document, or media"
                            >
                              <AppIcons.attachment className="h-5 w-5" />
                            </Button>
                          </Tooltip>
                        </span>
                      </DropdownMenu.Trigger>
                      <DropdownMenu.Portal>
                        <DropdownMenu.Content align="start" className="z-50 w-72 rounded-xl border border-border bg-card p-2 shadow-soft">
                          <DropdownMenu.Label className="px-3 py-2 text-sm font-semibold text-foreground">
                            Attach to conversation
                          </DropdownMenu.Label>
                          {[
                            { label: "Image", helper: "Upload image files", icon: AppIcons.image },
                            { label: "Document", helper: "Upload PDF or document", icon: AppIcons.document },
                            { label: "Media", helper: "Upload media file", icon: AppIcons.media },
                          ].map((item) => {
                            const Icon = item.icon;

                            return (
                              <DropdownMenu.Item
                                key={item.label}
                                className="flex cursor-pointer items-start gap-3 rounded-lg px-3 py-2 outline-none hover:bg-slate-50"
                                onSelect={() => addAttachment(item.label as SelectedAttachment["type"])}
                              >
                                <Icon className="mt-0.5 h-5 w-5 text-muted-foreground" />
                                <span>
                                  <span className="block text-sm font-medium text-foreground">{item.label}</span>
                                  <span className="block text-xs text-muted-foreground">{item.helper}</span>
                                </span>
                              </DropdownMenu.Item>
                            );
                          })}
                        </DropdownMenu.Content>
                      </DropdownMenu.Portal>
                    </DropdownMenu.Root>

                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <span>
                      <Tooltip label="Use canned replies">
                        <Button size="icon" variant="ghost" aria-label="Use canned replies">
                          <AppIcons.sparkle className="h-5 w-5" />
                        </Button>
                      </Tooltip>
                    </span>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Content align="end" className="z-50 w-80 rounded-xl border border-border bg-card p-2 shadow-soft">
                      {cannedReplies.map((reply) => (
                        <DropdownMenu.Item
                          key={reply.shortcut}
                          className="flex cursor-pointer items-start gap-3 rounded-lg px-3 py-2 outline-none hover:bg-slate-50"
                          onSelect={() => {
                            updateComposerText(insertReplyText(composerText, reply));
                            setSelectedReplyShortcut(reply.shortcut);
                            setSelectedTemplateName(null);
                          }}
                        >
                          <span className="text-sm font-semibold text-whatsapp-dark">{reply.shortcut}</span>
                          <span>
                            <span className="block text-sm font-medium text-foreground">{reply.label}</span>
                            <span className="block text-xs text-muted-foreground">{reply.message}</span>
                          </span>
                        </DropdownMenu.Item>
                      ))}
                    </DropdownMenu.Content>
                  </DropdownMenu.Portal>
                </DropdownMenu.Root>

                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <span>
                      <Tooltip label="Use approved template">
                        <Button size="icon" variant="ghost" aria-label="Use approved template">
                          <AppIcons.template className="h-5 w-5" />
                        </Button>
                      </Tooltip>
                    </span>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Content align="end" className="z-50 w-80 rounded-xl border border-border bg-card p-2 shadow-soft">
                      {approvedInboxTemplates.map((template) => (
                        <DropdownMenu.Item
                          key={template.name}
                          className="cursor-pointer rounded-lg px-3 py-2 outline-none hover:bg-slate-50"
                          onSelect={() => {
                            updateComposerText(resolveTemplateVariables(template.body, templateContext));
                            setSelectedTemplateName(template.name);
                            setSelectedReplyShortcut(null);
                          }}
                        >
                          <span className="block text-sm font-medium text-foreground">{template.name}</span>
                          <span className="block text-xs text-muted-foreground">
                            {resolveTemplateVariables(template.body, templateContext)}
                          </span>
                        </DropdownMenu.Item>
                      ))}
                    </DropdownMenu.Content>
                  </DropdownMenu.Portal>
                </DropdownMenu.Root>

                <Tooltip label="Send message">
                  <Button
                    aria-label="Send message"
                    disabled={!canSendMessage || sendSubmit.isSubmitting}
                    onClick={handleSendMessage}
                    size="icon"
                  >
                    <AppIcons.send className={cn("h-5 w-5", sendSubmit.isSubmitting && "animate-pulse")} />
                  </Button>
                </Tooltip>
                </div>
              </div>
              </div>
              )}
            </div>
          </div>
          )}
        </section>

        <section className="scrollbar-none h-full min-h-0 w-full min-w-0 overflow-y-auto border-l border-slate-300 bg-card px-3 py-3">
          {isLoading ? (
            <DetailPanelSkeleton className="p-0" />
          ) : (
          <>
          <h2 className="text-base font-semibold text-foreground">Contact Profile</h2>
          <div className="mt-5 rounded-xl bg-slate-50 px-3 py-3 ring-1 ring-slate-200/70">
            <ContactIdentityBlock
              avatarUrl={selectedConversation.avatarUrl}
              email={selectedConversation.email}
              initials={selectedConversation.initials}
              name={selectedConversation.contactName}
              phone={selectedConversation.phoneNumber}
            />
          </div>
          <div className="mt-5 w-full space-y-5">
            <ProfileSection title="Contact Details">
              <div className="space-y-3">
                <DetailField label="Phone Number" value={selectedConversation.phoneNumber} />
                <DetailField label="Email" value={selectedConversation.email ?? "Not available"} />
              </div>
            </ProfileSection>
            <LabelsPanel
              availableLabels={availableLabels}
              isOpen={labelPanelOpen}
              newLabel={newLabel}
              onAddLabel={addSelectedConversationLabel}
              onNewLabelChange={setNewLabel}
              onOpenChange={setLabelPanelOpen}
              onRemoveLabel={removeSelectedConversationLabel}
              tags={selectedConversation.tags}
            />
            <InternalNotesContext
              isAdding={isAddingNote}
              isExpanded={notesExpanded}
              noteText={newNote}
              notes={selectedInternalNotes}
              onAddClick={() => {
                setNotesExpanded(true);
                setIsAddingNote(true);
              }}
              onCancelAdd={() => {
                setIsAddingNote(false);
                setNewNote("");
              }}
              onExpandedChange={setNotesExpanded}
              onNoteTextChange={setNewNote}
              onSave={() => noteSubmit.run(addSelectedConversationNote)}
              saving={noteSubmit.isSubmitting}
            />
          </div>
          </>
          )}
        </section>
      </section>
      <AttachmentPreviewDialog
        attachment={previewAttachment}
        onDownload={handleDownloadAttachment}
        onOpenChange={(open) => !open && setPreviewAttachment(null)}
      />
    </div>
  );
}

function AssignedAgentFilter({
  onChange,
  value,
}: {
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button
          aria-label="Filter by assigned agent"
          className="h-9 w-36 justify-between px-3 text-sm font-normal"
          type="button"
          variant="outline"
        >
          <span className="truncate">{value}</span>
          <AppIcons.chevronDown className="h-5 w-5 text-muted-foreground" />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          className="z-50 w-64 rounded-xl border border-border bg-card p-1.5 shadow-soft"
          sideOffset={6}
        >
          <AssignedAgentFilterItem
            icon={<AppIcons.users className="h-5 w-5 text-muted-foreground" />}
            label="All Agents"
            onSelect={() => onChange("All Agents")}
          />
          <AssignedAgentFilterItem
            icon={<span className="h-2.5 w-2.5 rounded-full bg-slate-300" />}
            label="Unassigned"
            onSelect={() => onChange("Unassigned")}
          />
          <DropdownMenu.Separator className="my-1 h-px bg-border" />
          {agents.map((agent) => (
            <AssignedAgentFilterItem
              key={agent.id}
              icon={<span className={cn("h-2.5 w-2.5 rounded-full", getAgentStatusDotClass(agent.status))} />}
              label={agent.name}
              meta={agent.status}
              onSelect={() => onChange(agent.name)}
            />
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function LastMessagePreview({ conversation }: { conversation: Conversation }) {
  const lastMessage = conversation.lastMessageMeta;
  const deliveryLabel = lastMessage.status ? getDeliveryStatusLabel(lastMessage.status) : null;

  return (
    <div className="mt-1 flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
      {lastMessage.direction === "customer" ? (
        <Tooltip label="Customer message" side="top" sideOffset={6}>
          <span
            aria-label="Customer message"
            className="h-2 w-2 shrink-0 rounded-full bg-whatsapp-dark"
          />
        </Tooltip>
      ) : (
        <Tooltip label={deliveryLabel ?? "Agent message"} side="top" sideOffset={6}>
          <span
            aria-label={deliveryLabel ?? "Agent message"}
            className={cn(
              "inline-flex shrink-0 items-center",
              lastMessage.status === "read" ? "text-whatsapp-dark" : "text-slate-500",
            )}
          >
            {lastMessage.status === "delivered" || lastMessage.status === "read" ? (
              <AppIcons.checkDouble className="h-4 w-4" />
            ) : (
              <AppIcons.check className="h-4 w-4" />
            )}
          </span>
        </Tooltip>
      )}

      <Tooltip align="start" className="min-w-0 flex-1" label={lastMessage.tooltip || lastMessage.preview} side="top" sideOffset={6}>
        <span className="min-w-0 flex-1 truncate">{lastMessage.preview}</span>
      </Tooltip>
    </div>
  );
}

function getDeliveryStatusLabel(status: NonNullable<Conversation["lastMessageMeta"]["status"]>) {
  if (status === "sent") {
    return "Sent";
  }

  if (status === "delivered") {
    return "Delivered";
  }

  return "Read";
}

function createLocalLastMessageMeta(message: ConversationMessage): Conversation["lastMessageMeta"] {
  const type = getLocalLastMessageType(message);
  const preview = getLocalLastMessagePreview(message, type);

  return {
    direction: message.direction === "outgoing" ? "agent" : "customer",
    fileName: message.fileName,
    preview,
    status: normalizeLocalDeliveryStatus(message.status),
    timestamp: message.timestamp,
    tooltip: message.fileName ? `${preview} (${message.fileName})` : preview,
    type,
  };
}

function getLocalLastMessageType(message: ConversationMessage): Conversation["lastMessageMeta"]["type"] {
  if (/^template:/i.test(message.body.trim())) {
    return "template";
  }

  if (message.type === "Image") {
    return "image";
  }

  if (message.type === "Document") {
    return "document";
  }

  if (message.type === "Media") {
    return "media";
  }

  return "text";
}

function getLocalLastMessagePreview(
  message: ConversationMessage,
  type: Conversation["lastMessageMeta"]["type"],
) {
  const content = message.body.trim();
  const fileName = message.fileName?.trim();

  if (type === "template") {
    return content.replace(/^template:\s*/i, "Template: ");
  }

  if (type === "image") {
    return `Image${fileName ? `: ${fileName}` : ""}`;
  }

  if (type === "document") {
    return `Document${fileName ? `: ${fileName}` : ""}`;
  }

  if (type === "media") {
    const isAudio = /\.(aac|m4a|mp3|ogg|wav)$/i.test(fileName ?? "") || /\b(audio|voice)\b/i.test(content);
    return isAudio ? `Voice message${fileName ? `: ${fileName}` : ""}` : `Video${fileName ? `: ${fileName}` : ""}`;
  }

  return content || "No message yet";
}

function normalizeLocalDeliveryStatus(status?: ConversationMessage["status"]): Conversation["lastMessageMeta"]["status"] {
  if (status === "Sent") {
    return "sent";
  }

  if (status === "Delivered") {
    return "delivered";
  }

  if (status === "Read") {
    return "read";
  }

  return undefined;
}

function AssignedAgentFilterItem({
  icon,
  label,
  meta,
  onSelect,
}: {
  icon: ReactNode;
  label: string;
  meta?: string;
  onSelect: () => void;
}) {
  return (
    <DropdownMenu.Item
      className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm outline-none hover:bg-slate-50 focus:bg-slate-50"
      onSelect={onSelect}
    >
      <span className="flex h-5 w-5 shrink-0 items-center justify-center">{icon}</span>
      <span className="min-w-0 flex-1 truncate text-foreground">{label}</span>
      {meta ? <span className="shrink-0 text-xs text-muted-foreground">{meta}</span> : null}
    </DropdownMenu.Item>
  );
}

function getAgentStatusDotClass(status: string) {
  if (status === "Active") {
    return "bg-whatsapp";
  }

  if (status === "Away") {
    return "bg-warning";
  }

  return "bg-slate-300";
}

function ChatAssigneeControl({
  editable,
  onChange,
  value,
}: {
  editable: boolean;
  onChange: (value: string) => void;
  value: string;
}) {
  if (!editable) {
    return <AgentName compact name={value} />;
  }

  const selectedAgent = agents.find((agent) => agent.name === value);

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button
          aria-label="Assigned agent"
          className="h-9 min-w-[150px] justify-between px-2.5 text-sm font-normal"
          type="button"
          variant="outline"
        >
          {selectedAgent ? (
            <span className="flex min-w-0 items-center gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border bg-whatsapp-light text-[10px] font-semibold text-whatsapp-dark">
                {selectedAgent.initials}
              </span>
              <span className="truncate">{selectedAgent.name}</span>
            </span>
          ) : (
            <span className="truncate text-muted-foreground">Unassigned</span>
          )}
          <AppIcons.chevronDown className="h-5 w-5 shrink-0 text-muted-foreground" />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          className="z-50 w-72 rounded-xl border border-border bg-card p-1.5 shadow-soft"
          sideOffset={6}
        >
          <AssignedAgentOption
            label="Unassigned"
            onSelect={() => onChange("Unassigned")}
          />
          <DropdownMenu.Separator className="my-1 h-px bg-border" />
          {agents.map((agent) => (
            <AssignedAgentOption
              agent={agent}
              key={agent.id}
              label={agent.name}
              onSelect={() => onChange(agent.name)}
            />
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function AssignedAgentOption({
  agent,
  label,
  onSelect,
}: {
  agent?: (typeof agents)[number];
  label: string;
  onSelect: () => void;
}) {
  return (
    <DropdownMenu.Item
      className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm outline-none hover:bg-slate-50 focus:bg-slate-50"
      onSelect={onSelect}
    >
      {agent ? (
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border bg-whatsapp-light text-[10px] font-semibold text-whatsapp-dark">
          {agent.initials}
        </span>
      ) : (
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-dashed border-slate-300 bg-slate-50">
          <AppIcons.users className="h-4 w-4 text-muted-foreground" />
        </span>
      )}
      <span className="min-w-0 flex-1 truncate text-foreground">{label}</span>
      {agent ? <StatusBadge status={agent.status} /> : null}
    </DropdownMenu.Item>
  );
}

const chatStatusOptions: Conversation["status"][] = ["Open", "Pending", "Closed"];

function ChatStatusControl({
  editable,
  onChange,
  value,
}: {
  editable: boolean;
  onChange: (value: Conversation["status"]) => void;
  value: Conversation["status"];
}) {
  if (!editable) {
    return <StatusBadge status={value} />;
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button
          aria-label="Chat status"
          className="h-9 justify-between gap-2 px-2.5 text-sm font-normal"
          type="button"
          variant="outline"
        >
          <StatusBadge status={value} />
          <AppIcons.chevronDown className="h-5 w-5 text-muted-foreground" />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          className="z-50 w-44 rounded-xl border border-border bg-card p-1.5 shadow-soft"
          sideOffset={6}
        >
          {chatStatusOptions.map((status) => (
            <DropdownMenu.Item
              className="flex cursor-pointer items-center rounded-lg px-2.5 py-2 outline-none hover:bg-slate-50 focus:bg-slate-50"
              key={status}
              onSelect={() => onChange(status)}
            >
              <StatusBadge status={status} />
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function MessageBubble({
  message,
  onDownload,
  onViewImage,
}: {
  message: ConversationMessage;
  onDownload: (message: ConversationMessage) => void;
  onViewImage: (message: ConversationMessage) => void;
}) {
  const isOutgoing = message.direction === "outgoing";

  return (
    <div className={cn("flex", isOutgoing ? "justify-end" : "justify-start")}>
      <div className="max-w-[76%]">
        <div
          className={cn(
            "rounded-2xl border px-3 py-2",
            isOutgoing ? "border-whatsapp/20 bg-whatsapp-light" : "border-border bg-card",
          )}
        >
          <MessageContent message={message} onDownload={onDownload} onViewImage={onViewImage} />
        </div>
        <MessageMeta message={message} />
      </div>
    </div>
  );
}

function MessageContent({
  message,
  onDownload,
  onViewImage,
}: {
  message: ConversationMessage;
  onDownload: (message: ConversationMessage) => void;
  onViewImage: (message: ConversationMessage) => void;
}) {
  if (message.type === "Image") {
    return <MessageAttachmentCard message={message} onDownload={onDownload} onViewImage={onViewImage} />;
  }

  if (message.type === "Document") {
    return <MessageAttachmentCard message={message} onDownload={onDownload} onViewImage={onViewImage} />;
  }

  if (message.type === "Media") {
    return <MessageAttachmentCard message={message} onDownload={onDownload} onViewImage={onViewImage} />;
  }

  return <p className="text-sm leading-5 text-foreground">{message.body}</p>;
}

function MessageAttachmentCard({
  message,
  onDownload,
  onViewImage,
}: {
  message: ConversationMessage;
  onDownload: (message: ConversationMessage) => void;
  onViewImage: (message: ConversationMessage) => void;
}) {
  const isImage = message.type === "Image";
  const Icon = getAttachmentIcon(message.type);
  const fileName = getAttachmentFileName(message);
  const meta = getAttachmentMeta(message);
  const downloadLabel = getDownloadLabel(message.type);

  if (isImage) {
    return (
      <div className="w-[220px] max-w-full">
        <button
          className="relative block w-full overflow-hidden rounded-xl bg-slate-50/70 text-left transition-colors hover:bg-whatsapp-light/60"
          onClick={() => onViewImage(message)}
          title="Open image"
          type="button"
        >
          {message.imageUrl ? (
            <img
              alt={message.caption ?? fileName}
              className="h-40 w-full object-cover"
              src={message.imageUrl}
            />
          ) : (
            <div className="flex h-40 items-center justify-center text-muted-foreground">
              <AppIcons.image className="h-7 w-7" />
            </div>
          )}
        </button>
        <div className="mt-1.5 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm text-foreground">{message.caption ?? message.body}</p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{fileName}</p>
          </div>
          <DownloadAction label="Download image" onDownload={() => onDownload(message)} />
        </div>
      </div>
    );
  }

  return (
    <button
      className="flex min-w-[220px] max-w-[300px] cursor-pointer items-center gap-2.5 rounded-xl border border-border bg-white/70 p-2.5 text-left transition-colors hover:border-whatsapp/30 hover:bg-whatsapp-light/60"
      onClick={() => onDownload(message)}
      type="button"
    >
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-muted-foreground">
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{fileName}</p>
          {meta ? <p className="mt-0.5 text-xs text-muted-foreground">{meta}</p> : null}
        </div>
      </div>
      <DownloadAction label={downloadLabel} onDownload={() => onDownload(message)} />
    </button>
  );
}

function DownloadAction({
  label,
  onDownload,
}: {
  label: string;
  onDownload: () => void;
}) {
  return (
    <Tooltip label={label}>
      <Button
        aria-label={label}
        className="h-7 w-7 shrink-0"
        onClick={(event) => {
          event.stopPropagation();
          onDownload();
        }}
        size="icon"
        variant="ghost"
      >
        <AppIcons.download className="h-[18px] w-[18px]" />
      </Button>
    </Tooltip>
  );
}

function MessageMeta({ message }: { message: ConversationMessage }) {
  const isOutgoing = message.direction === "outgoing";

  return (
    <div
      className={cn(
        "mt-1 text-xs",
        isOutgoing ? "text-right text-whatsapp-dark" : "text-left text-muted",
      )}
    >
      {message.timestamp}
      {isOutgoing && message.status ? (
        <span className="text-muted-foreground"> &middot; {message.status}</span>
      ) : null}
    </div>
  );
}

function AttachmentPreviewDialog({
  attachment,
  onDownload,
  onOpenChange,
}: {
  attachment: ConversationMessage | null;
  onDownload: (message: ConversationMessage) => void;
  onOpenChange: (open: boolean) => void;
}) {
  const imageAttachment = attachment?.type === "Image" ? attachment : null;

  return (
    <StandardDialog
      footerRight={imageAttachment ? (
        <Button onClick={() => onDownload(imageAttachment)} variant="outline">
          <AppIcons.download className="mr-2 h-[18px] w-[18px]" />
          Download
        </Button>
      ) : null}
      onOpenChange={onOpenChange}
      open={Boolean(imageAttachment)}
      title="Image Preview"
    >
      {imageAttachment ? <ImagePreviewContent attachment={imageAttachment} /> : null}
    </StandardDialog>
  );
}

function ImagePreviewContent({ attachment }: { attachment: ConversationMessage }) {
  const fileName = getAttachmentFileName(attachment);

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl bg-slate-50/70">
        {attachment.imageUrl ? (
          <img alt={attachment.caption ?? fileName} className="max-h-[360px] w-full object-cover" src={attachment.imageUrl} />
        ) : (
          <div className="flex h-64 items-center justify-center text-muted-foreground">
            <AppIcons.image className="h-8 w-8" />
          </div>
        )}
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">{fileName}</p>
        {attachment.caption ? <p className="mt-1 text-sm text-muted-foreground">{attachment.caption}</p> : null}
      </div>
    </div>
  );
}

function AgentName({ compact = false, name }: { compact?: boolean; name: string }) {
  if (name === "Unassigned") {
    return <span className="text-xs text-muted-foreground">Unassigned</span>;
  }

  const agent = agents.find((item) => item.name === name);

  return (
    <AvatarWithName
      initials={agent?.initials}
      meta={compact ? undefined : agent?.status}
      name={name}
      size={compact ? "xs" : "sm"}
    />
  );
}

function LabelsPanel({
  availableLabels,
  isOpen,
  newLabel,
  onAddLabel,
  onNewLabelChange,
  onOpenChange,
  onRemoveLabel,
  tags,
}: {
  availableLabels: string[];
  isOpen: boolean;
  newLabel: string;
  onAddLabel: (label: string) => void;
  onNewLabelChange: (label: string) => void;
  onOpenChange: (open: boolean) => void;
  onRemoveLabel: (label: string) => void;
  tags: string[];
}) {
  const summary = tags.length ? `${tags.length} ${tags.length === 1 ? "label" : "labels"} - ${tags.join(", ")}` : "No labels added";

  return (
    <ProfileAccordionSection isOpen={isOpen} onOpenChange={onOpenChange} summary={summary} title="Labels">
      <div className="space-y-3">
        <LabelChips onRemove={onRemoveLabel} tags={tags} />
        <div className="space-y-3 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200/70">
          <p className="text-xs font-medium text-muted-foreground">Add or remove labels for this contact.</p>
          <div className="flex flex-wrap gap-2">
            {availableLabels.map((label) => {
              const isSelected = tags.some((tag) => tag.toLowerCase() === label.toLowerCase());

              return (
                <button
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-xs transition-colors",
                    isSelected
                      ? "border-whatsapp/30 bg-whatsapp-light text-whatsapp-dark"
                      : "border-slate-200 bg-card text-slate-600 hover:bg-slate-100",
                  )}
                  key={label}
                  onClick={() => (isSelected ? onRemoveLabel(label) : onAddLabel(label))}
                  type="button"
                >
                  {label}
                </button>
              );
            })}
          </div>
          <div className="flex gap-2">
            <input
              className="h-9 min-w-0 flex-1 rounded-xl border border-slate-200 bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-whatsapp"
              onChange={(event) => onNewLabelChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  onAddLabel(newLabel);
                }
              }}
              placeholder="Add label"
              value={newLabel}
            />
            <Button className="h-9 px-3" disabled={!newLabel.trim()} onClick={() => onAddLabel(newLabel)} size="sm" type="button">
              Add
            </Button>
          </div>
        </div>
      </div>
    </ProfileAccordionSection>
  );
}

function LabelChips({ onRemove, tags }: { onRemove?: (tag: string) => void; tags: string[] }) {
  if (!tags.length) {
    return <p className="mt-2 text-sm text-muted-foreground">No labels added.</p>;
  }

  return (
    <div className="mt-2 flex w-full flex-wrap gap-2">
      {tags.map((tag) => (
        <span key={tag} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600">
          {tag}
          {onRemove ? (
            <button
              aria-label={`Remove ${tag}`}
              className="rounded-full text-slate-400 hover:text-slate-700"
              onClick={() => onRemove(tag)}
              type="button"
            >
              <AppIcons.close className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </span>
      ))}
    </div>
  );
}

function InternalNotesContext({
  isAdding,
  isExpanded,
  noteText,
  notes,
  onAddClick,
  onCancelAdd,
  onExpandedChange,
  onNoteTextChange,
  onSave,
  saving,
}: {
  isAdding: boolean;
  isExpanded: boolean;
  noteText: string;
  notes: InboxInternalNote[];
  onAddClick: () => void;
  onCancelAdd: () => void;
  onExpandedChange: (isExpanded: boolean) => void;
  onNoteTextChange: (text: string) => void;
  onSave: () => void | Promise<unknown>;
  saving: boolean;
}) {
  const summary = `${notes.length} ${notes.length === 1 ? "note" : "notes"} - Private context for this conversation`;

  return (
    <ProfileAccordionSection isOpen={isExpanded} onOpenChange={onExpandedChange} summary={summary} title="Internal Notes">
      <div className="space-y-3">
        <div className="space-y-2">
          {notes.length ? (
            notes.map((note) => (
              <InternalNoteCard
                key={note.id}
                author={note.author}
                className="p-3"
                content={note.content}
                timestamp={note.timestamp}
              />
            ))
          ) : (
            <EmptyState
              actionLabel="Add Note"
              compact
              onAction={onAddClick}
              variant="notes"
            />
          )}
        </div>
        {isAdding ? (
          <div className="space-y-2">
            <textarea
              className="min-h-20 w-full resize-none rounded-xl border border-slate-200 bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-whatsapp"
              onChange={(event) => onNoteTextChange(event.target.value)}
              placeholder="Add an internal note"
              value={noteText}
            />
            <div className="flex justify-end gap-2">
              <Button onClick={onCancelAdd} size="sm" type="button" variant="outline">
                Cancel
              </Button>
              <Button disabled={!noteText.trim() || saving} onClick={onSave} size="sm" type="button">
                {saving ? "Saving..." : "Save Note"}
              </Button>
            </div>
          </div>
        ) : (
          <Button className="w-full" onClick={onAddClick} size="sm" type="button" variant="outline">
            Add Note
          </Button>
        )}
      </div>
    </ProfileAccordionSection>
  );
}

function normalizeLabel(label: string) {
  const trimmedLabel = label.trim().replace(/\s+/g, " ");

  if (!trimmedLabel) {
    return "";
  }

  return trimmedLabel
    .split(" ")
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`)
    .join(" ");
}

function getAttachmentFileName(message: ConversationMessage) {
  return message.fileName ?? message.body;
}

function getAttachmentIcon(type: ConversationMessage["type"]): AppIcon {
  if (type === "Document") {
    return AppIcons.document;
  }

  if (type === "Media") {
    return AppIcons.media;
  }

  return AppIcons.image;
}

function getAttachmentMeta(message: ConversationMessage) {
  return message.fileSize ?? message.duration;
}

function getDownloadLabel(type: ConversationMessage["type"]) {
  if (type === "Document") {
    return "Download document";
  }

  if (type === "Media") {
    return "Download media";
  }

  return "Download image";
}

