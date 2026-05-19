import { AppIcons, type AppIcon } from "@/components/icons";

export type NavItem = {
  children?: NavItem[];
  label: string;
  path: string;
  icon: AppIcon;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export const navigationGroups: NavGroup[] = [
  {
    label: "Dashboard",
    items: [{ label: "Dashboard", path: "dashboard", icon: AppIcons.dashboard }],
  },
  {
    label: "Channels",
    items: [
      { label: "WhatsApp Inbox", path: "whatsapp-inbox", icon: AppIcons.whatsappInbox },
      {
        label: "WhatsApp",
        path: "whatsapp/api-connection",
        icon: AppIcons.whatsapp,
        children: [
          { label: "API Connection", path: "whatsapp/api-connection", icon: AppIcons.whatsapp },
          { label: "Send/Receive Messages", path: "whatsapp/send-receive", icon: AppIcons.messageText },
          { label: "Template Messages", path: "whatsapp/templates", icon: AppIcons.template },
          { label: "Chatbot Triggers", path: "whatsapp/chatbot-triggers", icon: AppIcons.trigger },
          { label: "Message Status", path: "whatsapp/message-status", icon: AppIcons.statusComplete },
        ],
      },
    ],
  },
  {
    label: "CRM",
    items: [
      { label: "Live Chat", path: "live-chat", icon: AppIcons.liveChat },
      { label: "Contact", path: "contact", icon: AppIcons.contact },
      { label: "Custom Field", path: "custom-field", icon: AppIcons.customField },
      { label: "Canned Replies", path: "canned-replies", icon: AppIcons.cannedReplies },
      {
        label: "CRM Triggers",
        path: "crm-triggers/keyword-automation",
        icon: AppIcons.trigger,
        children: [
          { label: "Keyword Automation", path: "crm-triggers/keyword-automation", icon: AppIcons.trigger },
          { label: "Auto-Reply Rules", path: "crm-triggers/auto-reply-rules", icon: AppIcons.messageText },
          { label: "Test Trigger", path: "crm-triggers/test-trigger", icon: AppIcons.test },
          { label: "Auto-Assignment", path: "crm-triggers/auto-assignment", icon: AppIcons.assignAgent },
        ],
      },
    ],
  },
  {
    label: "Workspace & Settings",
    items: [
      {
        label: "Account Settings",
        path: "account-settings/profile",
        icon: AppIcons.accountSettings,
        children: [
          { label: "Profile Management", path: "account-settings/profile", icon: AppIcons.profileUser },
          { label: "Business Information", path: "account-settings/business", icon: AppIcons.accountSettings },
        ],
      },
      {
        label: "Billing",
        path: "billing/plan-management",
        icon: AppIcons.billing,
        children: [
          { label: "Plan Management", path: "billing/plan-management", icon: AppIcons.billing },
          { label: "Invoices", path: "billing/invoices", icon: AppIcons.document },
        ],
      },
      { label: "Roles & Permissions", path: "roles-permissions", icon: AppIcons.rolesPermissions },
      { label: "Manage Team", path: "manage-team", icon: AppIcons.manageTeam },
      { label: "Visitors & Conversion", path: "visitors-conversion", icon: AppIcons.visitorsConversion },
      { label: "Links & Alias", path: "links-alias", icon: AppIcons.linksAlias },
      { label: "Support Ticket", path: "support-ticket", icon: AppIcons.supportTicket },
    ],
  },
];
