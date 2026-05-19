import type { ReactNode } from "react";
import { useState } from "react";
import { AppToastProvider } from "@/components/AppToast";
import { WorkspaceSettingsProvider } from "@/components/WorkspaceSettingsContext";
import { AppShell } from "@/layout/AppShell";
import { WhatsAppInboxPage } from "@/modules/channels/WhatsAppInboxPage";
import { WhatsAppPage } from "@/modules/channels/WhatsAppPage";
import { CannedRepliesPage } from "@/modules/crm/CannedRepliesPage";
import { ContactPage } from "@/modules/crm/ContactPage";
import { CRMTriggersPage } from "@/modules/crm/CRMTriggersPage";
import { CustomFieldPage } from "@/modules/crm/CustomFieldPage";
import { LiveChatPage } from "@/modules/crm/LiveChatPage";
import { DashboardPage } from "@/modules/dashboard/DashboardPage";
import { AccountSettingsPage } from "@/modules/workspace-settings/AccountSettingsPage";
import { BillingPage } from "@/modules/workspace-settings/BillingPage";
import { LinksAliasPage } from "@/modules/workspace-settings/LinksAliasPage";
import { ManageTeamPage } from "@/modules/workspace-settings/ManageTeamPage";
import { RolesPermissionsPage } from "@/modules/workspace-settings/RolesPermissionsPage";
import { SupportTicketPage } from "@/modules/workspace-settings/SupportTicketPage";
import { VisitorsConversionPage } from "@/modules/workspace-settings/VisitorsConversionPage";

function getWhatsAppTabFromLocation() {
  const params = new URLSearchParams(window.location.search);
  const queryTab = params.get("tab");
  const hashTab = window.location.hash.replace("#", "");

  return queryTab || hashTab || null;
}

function getInitialPath() {
  const initialWhatsAppTab = getWhatsAppTabFromLocation();

  if (!initialWhatsAppTab) {
    return "dashboard" as PagePath;
  }

  const legacyTabMap: Record<string, PagePath> = {
    "api-connection": "whatsapp/api-connection",
    "send-receive-messages": "whatsapp/send-receive",
    "template-messages": "whatsapp/templates",
    "chatbot-triggers": "whatsapp/chatbot-triggers",
    "message-status": "whatsapp/message-status",
  };

  return legacyTabMap[initialWhatsAppTab] ?? "whatsapp/api-connection";
}

type PagePath =
  | "dashboard"
  | "whatsapp-inbox"
  | "whatsapp/api-connection"
  | "whatsapp/send-receive"
  | "whatsapp/templates"
  | "whatsapp/chatbot-triggers"
  | "whatsapp/message-status"
  | "live-chat"
  | "contact"
  | "custom-field"
  | "canned-replies"
  | "crm-triggers/keyword-automation"
  | "crm-triggers/auto-reply-rules"
  | "crm-triggers/test-trigger"
  | "crm-triggers/auto-assignment"
  | "account-settings/profile"
  | "account-settings/business"
  | "billing/plan-management"
  | "billing/invoices"
  | "roles-permissions"
  | "manage-team"
  | "visitors-conversion"
  | "links-alias"
  | "support-ticket";

export default function App() {
  const [activePath, setActivePath] = useState<PagePath>(() => getInitialPath());

  const handleNavigate = (path: string) => {
    const validPaths: PagePath[] = [
      "dashboard",
      "whatsapp-inbox",
      "whatsapp/api-connection",
      "whatsapp/send-receive",
      "whatsapp/templates",
      "whatsapp/chatbot-triggers",
      "whatsapp/message-status",
      "live-chat",
      "contact",
      "custom-field",
      "canned-replies",
      "crm-triggers/keyword-automation",
      "crm-triggers/auto-reply-rules",
      "crm-triggers/test-trigger",
      "crm-triggers/auto-assignment",
      "account-settings/profile",
      "account-settings/business",
      "billing/plan-management",
      "billing/invoices",
      "roles-permissions",
      "manage-team",
      "visitors-conversion",
      "links-alias",
      "support-ticket",
    ];

    if (validPaths.includes(path as PagePath)) {
      setActivePath(path as PagePath);
    }
  };

  const openMessageStatus = () => {
    setActivePath("whatsapp/message-status");
    window.history.replaceState(null, "", window.location.pathname);
  };

  const openCRMTriggers = () => {
    setActivePath("crm-triggers/keyword-automation");
    window.history.replaceState(null, "", window.location.pathname);
  };

  const pages: Record<PagePath, ReactNode> = {
    dashboard: <DashboardPage onOpenMessageStatus={openMessageStatus} />,
    "whatsapp-inbox": <WhatsAppInboxPage />,
    "whatsapp/api-connection": <WhatsAppPage activeSection="api-connection" onManageCRMTriggers={openCRMTriggers} />,
    "whatsapp/send-receive": <WhatsAppPage activeSection="send-receive" onManageCRMTriggers={openCRMTriggers} />,
    "whatsapp/templates": <WhatsAppPage activeSection="templates" onManageCRMTriggers={openCRMTriggers} />,
    "whatsapp/chatbot-triggers": <WhatsAppPage activeSection="chatbot-triggers" onManageCRMTriggers={openCRMTriggers} />,
    "whatsapp/message-status": <WhatsAppPage activeSection="message-status" onManageCRMTriggers={openCRMTriggers} />,
    "live-chat": <LiveChatPage />,
    contact: <ContactPage />,
    "custom-field": <CustomFieldPage />,
    "canned-replies": <CannedRepliesPage />,
    "crm-triggers/keyword-automation": <CRMTriggersPage activeSection="keyword-automation" onNavigate={handleNavigate} />,
    "crm-triggers/auto-reply-rules": <CRMTriggersPage activeSection="auto-reply-rules" onNavigate={handleNavigate} />,
    "crm-triggers/test-trigger": <CRMTriggersPage activeSection="test-trigger" onNavigate={handleNavigate} />,
    "crm-triggers/auto-assignment": <CRMTriggersPage activeSection="auto-assignment" onNavigate={handleNavigate} />,
    "account-settings/profile": <AccountSettingsPage activeSection="profile" />,
    "account-settings/business": <AccountSettingsPage activeSection="business" />,
    "billing/plan-management": <BillingPage activeSection="plan-management" />,
    "billing/invoices": <BillingPage activeSection="invoices" />,
    "roles-permissions": <RolesPermissionsPage />,
    "manage-team": <ManageTeamPage />,
    "visitors-conversion": <VisitorsConversionPage />,
    "links-alias": <LinksAliasPage />,
    "support-ticket": <SupportTicketPage />,
  };

  return (
    <AppToastProvider>
      <WorkspaceSettingsProvider>
        <AppShell activePath={activePath} onNavigate={handleNavigate}>
          {pages[activePath] ?? pages.dashboard}
        </AppShell>
      </WorkspaceSettingsProvider>
    </AppToastProvider>
  );
}
