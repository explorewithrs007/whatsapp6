import {
  getAgent,
  getConversationLastMessageMetadata,
  getContact,
  type LastMessageMetadata,
  mockCannedReplies,
  mockConversations,
  mockCRMTriggers,
  mockInternalNotes,
  mockMessageStatusTotals,
  mockMessages,
} from "@/data/mock-data";
import type { StatusLabel } from "@/lib/status";

export type Conversation = {
  contactId: string;
  id: string;
  contactName: string;
  phoneNumber: string;
  lastMessage: string;
  lastMessageMeta: LastMessageMetadata;
  status: StatusLabel;
  lastMessageTime: string;
  assignedAgent?: string;
  customAttributes?: Record<string, string>;
  email?: string;
  tags: string[];
  historySummary: string;
  initials: string;
  avatarUrl?: string;
};

export type ConversationMessage = {
  id: string;
  conversationId: string;
  direction: "incoming" | "outgoing";
  type: "Text" | "Image" | "Document" | "Media";
  body: string;
  caption?: string;
  duration?: string;
  fileName?: string;
  fileSize?: string;
  imageUrl?: string;
  timestamp: string;
  status?: StatusLabel;
};

export type InboxInternalNote = {
  id: string;
  conversationId: string;
  author: string;
  content: string;
  timestamp: string;
};

export const conversations: Conversation[] = mockConversations.map((conversation) => {
  const contact = getContact(conversation.contactId);
  const agent = getAgent(conversation.assignedAgentId);

  return {
    contactId: conversation.contactId,
    id: conversation.id,
    contactName: contact?.name ?? "Unknown Contact",
    phoneNumber: contact?.phone ?? "",
    lastMessage: conversation.lastMessage,
    lastMessageMeta: getConversationLastMessageMetadata(conversation.id, conversation.lastMessage),
    status: conversation.status,
    lastMessageTime: conversation.lastActivity,
    assignedAgent: agent?.name,
    customAttributes: contact?.customAttributes,
    email: contact?.email,
    tags: contact?.tags ?? [],
    historySummary: getConversationHistorySummary(conversation.contactId),
    initials: contact?.initials ?? "UC",
    avatarUrl: contact?.avatarUrl,
  };
});

export const messages: ConversationMessage[] = mockMessages.map((message) => ({
  id: message.id,
  conversationId: message.conversationId,
  direction: message.direction,
  type: message.type,
  body: message.content,
  caption: message.caption,
  duration: message.duration,
  fileName: message.fileName,
  fileSize: message.fileSize,
  imageUrl: message.imageUrl,
  timestamp: message.timestamp,
  status: message.status,
}));

export const internalNotes: InboxInternalNote[] = mockInternalNotes.map((note) => ({
  id: note.id,
  conversationId: note.conversationId,
  author: getAgent(note.authorAgentId)?.name ?? "Workspace Agent",
  content: note.note,
  timestamp: note.timestamp,
}));

export const whatsappConnection = {
  status: "Connected" as StatusLabel,
  businessAccount: "Pixelotech Support",
  businessPhoneNumber: "+91 80456 78901",
  phoneNumberId: "PN-4829-7712",
  setupType: "BSP Managed",
  lastWebhookReceived: "Today, 10:44 AM",
};

export type TemplateMessage = {
  displayName: string;
  templateId: string;
  category: "Utility" | "Marketing" | "Authentication";
  language: string;
  status: StatusLabel;
  lastUpdated: string;
  messageBody: string;
  variableSamples?: Record<string, string>;
  variablesPreview: string;
  rejectionReason?: string;
};

export const templates: TemplateMessage[] = [
  {
    displayName: "Appointment Confirmation",
    templateId: "appointment_confirmation",
    category: "Utility",
    language: "English",
    status: "Approved",
    lastUpdated: "May 12, 2026",
    messageBody: "Hi {{name}}, your appointment is confirmed for {{date}}.",
    variableSamples: { date: "May 14, 2026", name: "Priya Kapoor" },
    variablesPreview: "name = Priya Kapoor, date = May 14, 2026",
  },
  {
    displayName: "Pricing Follow-up",
    templateId: "pricing_followup",
    category: "Marketing",
    language: "English",
    status: "Submitted",
    lastUpdated: "May 10, 2026",
    messageBody: "Hi {{name}}, following up with pricing details for {{plan}}.",
    variableSamples: { name: "Rohan Mehta", plan: "Business" },
    variablesPreview: "name = Rohan Mehta, plan = Business",
  },
  {
    displayName: "Login OTP",
    templateId: "login_otp",
    category: "Authentication",
    language: "English",
    status: "Draft",
    lastUpdated: "May 8, 2026",
    messageBody: "Your login code is {{otp}}. Do not share this code.",
    variableSamples: { otp: "482910" },
    variablesPreview: "otp = 482910",
  },
  {
    displayName: "Renewal Reminder",
    templateId: "renewal_reminder",
    category: "Utility",
    language: "English",
    status: "Rejected",
    lastUpdated: "May 4, 2026",
    messageBody: "Hi {{name}}, your renewal is due on {{date}}.",
    variableSamples: { date: "May 20, 2026", name: "Anika Bose" },
    variablesPreview: "name = Anika Bose, date = May 20, 2026",
    rejectionReason: "Message needs clearer business context.",
  },
];

export type ChatbotTrigger = {
  keyword: string;
  response: string;
  status: StatusLabel;
  lastUpdated: string;
};

export const chatbotTriggers: ChatbotTrigger[] = mockCRMTriggers.slice(0, 3);

export const messageStatusOverview = mockMessageStatusTotals;

export const supportedMessageTypes = [
  { label: "Text", description: "Customer and agent text conversations" },
  { label: "Images", description: "Image attachments in WhatsApp chats" },
  { label: "Documents", description: "PDF and document exchanges" },
  { label: "Media", description: "Supported WhatsApp media messages" },
];

export type CannedReply = {
  shortcut: string;
  label: string;
  message: string;
};

export const cannedReplies: CannedReply[] = mockCannedReplies.map((reply) => ({
  shortcut: reply.shortcut,
  label: reply.label,
  message: reply.message,
}));

function getConversationHistorySummary(contactId: string) {
  const history = mockConversations.filter((conversation) => conversation.contactId === contactId);

  if (!history.length) {
    return "No conversation history yet.";
  }

  const closedConversation = history.find((conversation) => conversation.status === "Closed");
  const closedSummary = closedConversation ? `, last closed ${closedConversation.lastActivityAt.toLowerCase()}` : "";

  return `${history.length} ${history.length === 1 ? "conversation" : "conversations"}${closedSummary}.`;
}

export type ApprovedInboxTemplate = {
  name: string;
  body: string;
};

export const approvedInboxTemplates: ApprovedInboxTemplate[] = [
  {
    name: "Appointment Confirmation",
    body: "Hi {{name}}, your appointment is confirmed for {{appointment_date}}.",
  },
  {
    name: "Order Update",
    body: "Hi {{name}}, your order {{order_id}} has been updated.",
  },
  {
    name: "Follow-up Message",
    body: "Hi {{name}}, following up on your recent WhatsApp conversation.",
  },
];
