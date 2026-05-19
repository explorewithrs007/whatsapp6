import {
  getAgent,
  getConversationLastMessageMetadata,
  getContact,
  type LastMessageMetadata,
  mockAgents,
  mockCannedReplies,
  mockContacts,
  mockConversations,
  mockCRMTriggers,
  mockCustomFields,
  mockInternalNotes,
  mockMessages,
  mockTags,
} from "@/data/mock-data";
import type { StatusLabel } from "@/lib/status";

export type Agent = {
  id: string;
  name: string;
  status: StatusLabel;
  initials: string;
};

export type LiveChatConversation = {
  id: string;
  contactId: string;
  contact: string;
  phone: string;
  email: string;
  tags: string[];
  lastMessage: string;
  lastMessageFileName?: string;
  lastMessageKind: "Audio" | "Document" | "Empty" | "Image" | "System" | "Template" | "Text" | "Video";
  lastMessageMeta: LastMessageMetadata;
  lastMessagePreview: string;
  lastMessageTooltip: string;
  assignedAgent: string;
  chatStatus: StatusLabel;
  lastActivity: string;
  lastActivityAt: string;
  lastActivitySort: number;
  historySummary: string;
  initials: string;
  avatarUrl?: string;
};

export type InternalNote = {
  conversationId: string;
  author: string;
  content: string;
  timestamp: string;
};

export type ContactRecord = {
  id: string;
  name: string;
  phone: string;
  email: string;
  avatarUrl?: string;
  tags: string[];
  lastInteraction: string;
  customAttributes: Record<string, string>;
  historySummary: string;
  initials: string;
};

export type ConversationHistoryRecord = {
  id: string;
  contactId: string;
  date: string;
  time: string;
  lastMessage: string;
  lastMessageMeta: LastMessageMetadata;
  status: StatusLabel;
  assignedAgent: string;
};

export type ConversationHistoryMessage = {
  id: string;
  conversationId: string;
  direction: "incoming" | "outgoing";
  type: "Text" | "Image" | "Document" | "Media";
  content: string;
  timestamp: string;
  status?: StatusLabel;
};

export type CustomFieldRecord = {
  fieldName: string;
  fieldType: "Text" | "Number" | "Date" | "Dropdown";
  dropdownOptions?: string[];
  status: StatusLabel;
  usedInContacts: number;
};

export type CannedReplyRecord = {
  title: string;
  shortcut: string;
  category: string;
  responsePreview: string;
  status: StatusLabel;
};

export type CRMTriggerRecord = {
  triggerName: string;
  keyword: string;
  response: string;
  status: StatusLabel;
  lastUpdated: string;
};

export type AutoReplyRule = {
  name: string;
  message: string;
  status: StatusLabel;
};

export const agents: Agent[] = mockAgents.map((agent) => ({
  id: agent.id,
  name: agent.name,
  status: agent.status,
  initials: agent.initials,
}));

const baseLiveChatConversations: LiveChatConversation[] = mockConversations.map((conversation) => {
  const contact = getContact(conversation.contactId);
  const agent = getAgent(conversation.assignedAgentId);
  const lastMessagePreview = getLastMessagePreview(conversation.id, conversation.lastMessage, agent?.name);
  const lastMessageMeta = getConversationLastMessageMetadata(conversation.id, conversation.lastMessage);

  return {
    id: conversation.id,
    contactId: conversation.contactId,
    contact: contact?.name ?? "Unknown Contact",
    phone: contact?.phone ?? "",
    email: contact?.email ?? "Not available",
    tags: contact?.tags ?? [],
    lastMessage: conversation.lastMessage,
    lastMessageFileName: lastMessagePreview.fileName,
    lastMessageKind: lastMessagePreview.kind,
    lastMessageMeta,
    lastMessagePreview: lastMessagePreview.preview,
    lastMessageTooltip: lastMessagePreview.tooltip,
    assignedAgent: agent?.name ?? "Unassigned",
    chatStatus: conversation.status,
    lastActivity: conversation.lastActivity,
    lastActivityAt: conversation.lastActivityAt,
    lastActivitySort: getConversationSortValue(conversation.lastActivityAt, conversation.lastActivity),
    historySummary: getContactHistorySummary(conversation.contactId),
    initials: contact?.initials ?? "UC",
    avatarUrl: contact?.avatarUrl,
  };
});

export const liveChatConversations: LiveChatConversation[] = getLatestConversationsByContact(baseLiveChatConversations);

export const internalNotes: InternalNote[] = mockInternalNotes.map((note) => ({
  conversationId: note.conversationId,
  author: getAgent(note.authorAgentId)?.name ?? "Workspace Agent",
  content: note.note,
  timestamp: note.timestamp,
}));

export const contacts: ContactRecord[] = mockContacts.map((contact) => {
  const conversation = mockConversations.find((item) => item.contactId === contact.id);

  return {
    id: contact.id,
    name: contact.name,
    phone: contact.phone,
    email: contact.email ?? "Not available",
    avatarUrl: contact.avatarUrl,
    tags: contact.tags,
    lastInteraction: conversation?.lastActivity ?? "No recent activity",
    customAttributes: contact.customAttributes,
    historySummary: getContactHistorySummary(contact.id),
    initials: contact.initials,
  };
});

export const tagOptions = mockTags;

export const conversationHistory: ConversationHistoryRecord[] = mockConversations.map((conversation) => {
  const agent = getAgent(conversation.assignedAgentId);

  return {
    id: conversation.id,
    contactId: conversation.contactId,
    date: conversation.lastActivityAt,
    time: conversation.lastActivity,
    lastMessage: conversation.lastMessage,
    lastMessageMeta: getConversationLastMessageMetadata(conversation.id, conversation.lastMessage),
    status: conversation.status,
    assignedAgent: agent?.name ?? "Unassigned",
  };
});

export const conversationHistoryMessages: ConversationHistoryMessage[] = mockMessages.map((message) => ({
  id: message.id,
  conversationId: message.conversationId,
  direction: message.direction,
  type: message.type,
  content: message.content,
  timestamp: message.timestamp,
  status: message.status,
}));

export const customFields: CustomFieldRecord[] = mockCustomFields;

export const cannedReplies: CannedReplyRecord[] = mockCannedReplies.map((reply) => ({
  title: reply.title,
  shortcut: reply.shortcut,
  category: reply.category,
  responsePreview: reply.message,
  status: reply.status,
}));

export const cannedReplyCategories = ["Sales", "Support", "General", "Appointment"];

function getContactHistorySummary(contactId: string) {
  const history = mockConversations.filter((conversation) => conversation.contactId === contactId);

  if (!history.length) {
    return "No conversation history yet.";
  }

  const closedConversation = history.find((conversation) => conversation.status === "Closed");
  const closedSummary = closedConversation ? `, last closed ${closedConversation.lastActivityAt.toLowerCase()}` : "";

  return `${history.length} ${history.length === 1 ? "conversation" : "conversations"}${closedSummary}.`;
}

function getLastMessagePreview(conversationId: string, fallbackMessage: string, assignedAgent?: string) {
  const message = [...mockMessages].reverse().find((item) => item.conversationId === conversationId);
  const fallback = fallbackMessage.trim();

  if (!message) {
    return fallback
      ? { kind: "Text" as const, preview: fallback, tooltip: fallback }
      : { kind: "Empty" as const, preview: "No message yet", tooltip: "No message yet" };
  }

  const content = message.content.trim();
  const fileName = message.fileName?.trim();
  const tooltip = fileName ? `${content || getMessageTypeLabel(message.type, fileName)} (${fileName})` : content;

  if (/^template:/i.test(content)) {
    return {
      kind: "Template" as const,
      preview: content,
      tooltip: content,
    };
  }

  if (/^(assigned to|conversation closed|conversation opened|status changed)/i.test(content)) {
    return {
      kind: "System" as const,
      preview: content || (assignedAgent ? `Assigned to ${assignedAgent}` : "System event"),
      tooltip: content || (assignedAgent ? `Assigned to ${assignedAgent}` : "System event"),
    };
  }

  if (message.type === "Image") {
    return {
      fileName,
      kind: "Image" as const,
      preview: "Image",
      tooltip: tooltip || "Image shared",
    };
  }

  if (message.type === "Document") {
    return {
      fileName,
      kind: "Document" as const,
      preview: "Document",
      tooltip: tooltip || "Document shared",
    };
  }

  if (message.type === "Media") {
    const mediaKind = isAudioFile(fileName, content) ? "Audio" : "Video";

    return {
      fileName,
      kind: mediaKind as "Audio" | "Video",
      preview: mediaKind === "Audio" ? "Voice message" : "Video",
      tooltip: tooltip || (mediaKind === "Audio" ? "Audio shared" : "Video shared"),
    };
  }

  return content
    ? { kind: "Text" as const, preview: content, tooltip: content }
    : { kind: "Empty" as const, preview: "No message yet", tooltip: "No message yet" };
}

function getMessageTypeLabel(type: string, fileName: string) {
  if (type === "Media") {
    return isAudioFile(fileName) ? "Audio shared" : "Video";
  }

  return type;
}

function isAudioFile(fileName = "", content = "") {
  return /\.(aac|m4a|mp3|ogg|wav)$/i.test(fileName) || /\b(audio|voice)\b/i.test(content);
}

function getConversationSortValue(lastActivityAt: string, lastActivity: string) {
  const now = new Date("2026-05-15T12:00:00");
  const relativeMatch = lastActivity.match(/^(\d+)\s+(min|mins|hr|hrs)\s+ago$/i);

  if (relativeMatch) {
    const amount = Number(relativeMatch[1]);
    const unit = relativeMatch[2].toLowerCase();
    const milliseconds = unit.startsWith("hr") ? amount * 60 * 60 * 1000 : amount * 60 * 1000;

    return now.getTime() - milliseconds;
  }

  const date = getConversationDate(lastActivityAt);
  const time = parseConversationTime(lastActivity);

  date.setHours(time.hours, time.minutes, 0, 0);

  return date.getTime();
}

function getConversationDate(lastActivityAt: string) {
  if (lastActivityAt === "Today") {
    return new Date("2026-05-15T00:00:00");
  }

  if (lastActivityAt === "Yesterday") {
    return new Date("2026-05-14T00:00:00");
  }

  const parsedDate = new Date(lastActivityAt);

  return Number.isNaN(parsedDate.getTime()) ? new Date("2026-05-15T00:00:00") : parsedDate;
}

function parseConversationTime(lastActivity: string) {
  const timeMatch = lastActivity.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);

  if (!timeMatch) {
    return { hours: 12, minutes: 0 };
  }

  const [, hourText, minuteText, meridiem] = timeMatch;
  let hours = Number(hourText);

  if (meridiem.toUpperCase() === "PM" && hours !== 12) {
    hours += 12;
  }

  if (meridiem.toUpperCase() === "AM" && hours === 12) {
    hours = 0;
  }

  return { hours, minutes: Number(minuteText) };
}

function getLatestConversationsByContact(conversations: LiveChatConversation[]) {
  const latestByContact = new Map<string, LiveChatConversation>();

  conversations.forEach((conversation) => {
    const currentConversation = latestByContact.get(conversation.contactId);

    if (!currentConversation || conversation.lastActivitySort > currentConversation.lastActivitySort) {
      latestByContact.set(conversation.contactId, conversation);
    }
  });

  return [...latestByContact.values()].sort((first, second) => second.lastActivitySort - first.lastActivitySort);
}

const triggerNames: Record<string, string> = {
  appointment: "Appointment Help",
  hours: "Business Hours",
  invoice: "Invoice Support",
  location: "Location Reply",
  price: "Pricing Reply",
};

export const crmTriggers: CRMTriggerRecord[] = mockCRMTriggers.map((trigger) => ({
  ...trigger,
  triggerName: triggerNames[trigger.keyword] ?? `${trigger.keyword} Reply`,
}));

export const autoReplyRules: AutoReplyRule[] = [
  {
    name: "Welcome Message",
    message: "Send a greeting when a new WhatsApp conversation starts.",
    status: "Active",
  },
  {
    name: "Away Message",
    message: "Send a response when agents are unavailable.",
    status: "Disabled",
  },
  {
    name: "Business-Hours Reply",
    message: "Send business-hours information for common timing queries.",
    status: "Active",
  },
];
