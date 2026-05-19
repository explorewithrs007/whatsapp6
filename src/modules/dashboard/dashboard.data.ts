import { mockMessageStatusTotals } from "@/data/mock-data";
import type { StatusLabel } from "@/lib/status";

export const conversationSummary = [
  {
    title: "Open Conversations",
    value: "128",
  },
  {
    title: "Pending Conversations",
    value: "34",
  },
  {
    title: "Closed Conversations",
    value: "912",
  },
  {
    title: "WhatsApp Message Volume",
    value: mockMessageStatusTotals[0].value,
  },
];

export type AgentPerformance = {
  agent: string;
  chatsHandled: number;
  responseTime: string;
  status: StatusLabel;
};

export const agentPerformance: AgentPerformance[] = [
  {
    agent: "Meera Shah",
    chatsHandled: 14,
    responseTime: "1m 42s",
    status: "Active",
  },
  {
    agent: "Kabir Rao",
    chatsHandled: 11,
    responseTime: "2m 10s",
    status: "Away",
  },
  {
    agent: "Nisha Verma",
    chatsHandled: 13,
    responseTime: "1m 18s",
    status: "Active",
  },
  {
    agent: "Dev Iyer",
    chatsHandled: 8,
    responseTime: "3m 05s",
    status: "Offline",
  },
  {
    agent: "Sarah Mitchell",
    chatsHandled: 12,
    responseTime: "1m 55s",
    status: "Active",
  },
  {
    agent: "David Chen",
    chatsHandled: 9,
    responseTime: "2m 22s",
    status: "Active",
  },
  {
    agent: "Elena Rodriguez",
    chatsHandled: 10,
    responseTime: "2m 48s",
    status: "Away",
  },
  {
    agent: "Arjun Patel",
    chatsHandled: 7,
    responseTime: "1m 36s",
    status: "Active",
  },
  {
    agent: "Neha Sharma",
    chatsHandled: 9,
    responseTime: "2m 05s",
    status: "Active",
  },
  {
    agent: "Rohan Desai",
    chatsHandled: 7,
    responseTime: "3m 20s",
    status: "Offline",
  },
];

export const activityFeed = [
  {
    title: "New conversation received",
    description: "Added to WhatsApp Inbox.",
    time: "4 min ago",
    status: "Open" as StatusLabel,
  },
  {
    title: "Chat assigned to agent",
    description: "Assigned to Meera Shah.",
    time: "12 min ago",
    status: "Assigned" as StatusLabel,
  },
  {
    title: "Conversation marked pending",
    description: "Moved to pending follow-up.",
    time: "25 min ago",
    status: "Pending" as StatusLabel,
  },
  {
    title: "Conversation closed",
    description: "Closed by workspace team.",
    time: "1 hr ago",
    status: "Closed" as StatusLabel,
  },
  {
    title: "CRM trigger executed",
    description: "Ran on incoming conversation.",
    time: "2 hr ago",
    status: "Triggered" as StatusLabel,
  },
];
