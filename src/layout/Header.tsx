import { forwardRef, useMemo, useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { useAppToast } from "@/components/AppToast";
import { AppIcons } from "@/components/icons";
import { useWorkspaceSettings } from "@/components/WorkspaceSettingsContext";
import { UserAvatar } from "@/components/UserAvatar";
import { Badge } from "@/components/ui/badge";
import * as DropdownMenu from "@/components/ui/dropdown-menu";
import { Tooltip } from "@/components/ui/tooltip";
import { GlobalSearch } from "@/layout/GlobalSearch";
import { WORKSPACE_USER } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { whatsappConnection } from "@/modules/channels/channels.data";
import { StatusBadge } from "@/components/StatusBadge";

type HeaderProps = {
  onNavigate?: (path: string) => void;
};

type NotificationItem = {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
};

const initialNotifications: NotificationItem[] = [
  {
    id: "notification-priya",
    title: "New conversation received",
    description: "Priya Kapoor sent a WhatsApp message.",
    time: "2 min ago",
    read: false,
  },
  {
    id: "notification-assignment",
    title: "Chat assigned",
    description: "Invoice Support was assigned to Meera Shah.",
    time: "12 min ago",
    read: false,
  },
  {
    id: "notification-template",
    title: "Template submitted",
    description: "Appointment Confirmation was submitted for approval.",
    time: "1 hr ago",
    read: true,
  },
  {
    id: "notification-whatsapp",
    title: "Connection refreshed",
    description: "WhatsApp connection was refreshed successfully.",
    time: "Today",
    read: true,
  },
];

export function Header({ onNavigate }: HeaderProps) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [availability, setAvailability] = useState("Active");
  const unreadCount = useMemo(() => notifications.filter((notification) => !notification.read).length, []);

  return (
    <header className="sticky top-0 z-30 flex h-14 min-w-0 items-center justify-between gap-3 border-b border-slate-300 bg-card/95 px-3 shadow-[0_1px_0_rgba(15,23,42,0.03)] backdrop-blur lg:px-4">
      <GlobalSearch onNavigate={onNavigate} />

      <div className="flex shrink-0 items-center gap-2.5">
        <NotificationsDropdown
          notifications={notifications}
          onNotificationRead={(notificationId) =>
            setNotifications((currentNotifications) =>
              currentNotifications.map((notification) =>
                notification.id === notificationId ? { ...notification, read: true } : notification,
              ),
            )
          }
          unreadCount={unreadCount}
        />
        <HeaderIconAction label="Support" onClick={() => onNavigate?.("support-ticket")}>
          <AppIcons.chatSupport className="h-[22px] w-[22px]" />
        </HeaderIconAction>
        <ProfileDropdown
          availability={availability}
          onAvailabilityChange={setAvailability}
          onNavigate={onNavigate}
        />
      </div>
    </header>
  );
}

const HeaderIconButton = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & {
    label: string;
    badge?: number;
    children: ReactNode;
  }
>(function HeaderIconButton({
  badge,
  children,
  label,
  ...props
}, ref) {
  return (
    <button
      aria-label={label}
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-whatsapp-light/70 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-whatsapp"
      ref={ref}
      type="button"
      {...props}
    >
      {children}
      {badge ? (
        <span className="absolute right-0.5 top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-whatsapp px-1 text-[10px] font-semibold leading-none text-white ring-2 ring-card">
          {badge}
        </span>
      ) : null}
    </button>
  );
});

function HeaderIconAction({
  children,
  label,
  onClick,
}: {
  children: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <Tooltip label={label} side="bottom" sideOffset={8}>
      <HeaderIconButton label={label} onClick={onClick}>
        {children}
      </HeaderIconButton>
    </Tooltip>
  );
}

function NotificationsDropdown({
  notifications,
  onNotificationRead,
  unreadCount,
}: {
  notifications: NotificationItem[];
  onNotificationRead: (notificationId: string) => void;
  unreadCount: number;
}) {
  const toast = useAppToast();

  return (
    <DropdownMenu.Root>
      <Tooltip label="Notifications" side="bottom" sideOffset={8}>
        <DropdownMenu.Trigger asChild>
          <HeaderIconButton badge={unreadCount} label="Notifications">
            <AppIcons.notifications className="h-[22px] w-[22px]" />
          </HeaderIconButton>
        </DropdownMenu.Trigger>
      </Tooltip>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          className="z-50 w-80 rounded-xl border border-border bg-card p-2 shadow-soft"
          sideOffset={8}
        >
          <div className="px-3 py-2">
            <p className="text-sm font-semibold text-foreground">Notifications</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{unreadCount} unread updates</p>
          </div>
          <DropdownMenu.Separator className="my-1 h-px bg-border" />
          <div className="max-h-80 overflow-y-auto subtle-scrollbar">
            {notifications.map((notification) => (
              <button
                className="flex w-full cursor-pointer items-start gap-3 rounded-lg px-3 py-2 text-left outline-none hover:bg-slate-50 focus:bg-slate-50 focus-visible:ring-2 focus-visible:ring-whatsapp"
                key={notification.id}
                onClick={() => {
                  if (!notification.read) {
                    onNotificationRead(notification.id);
                    toast.info("Notification marked as read.");
                  }
                }}
                type="button"
              >
                <span
                  className={cn(
                    "mt-1 h-2 w-2 shrink-0 rounded-full",
                    notification.read ? "bg-slate-300" : "bg-whatsapp",
                  )}
                />
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-foreground">{notification.title}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{notification.description}</span>
                  <span className="mt-1 block text-xs text-muted">{notification.time}</span>
                </span>
              </button>
            ))}
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function ProfileDropdown({
  availability,
  onAvailabilityChange,
  onNavigate,
}: {
  availability: string;
  onAvailabilityChange: (availability: string) => void;
  onNavigate?: (path: string) => void;
}) {
  const { profile } = useWorkspaceSettings();
  const toast = useAppToast();

  const updateAvailability = (nextAvailability: string) => {
    onAvailabilityChange(nextAvailability);
    toast.success(`Availability set to ${nextAvailability}.`);
  };

  return (
    <DropdownMenu.Root>
      <Tooltip label="Profile" side="bottom" sideOffset={8}>
        <DropdownMenu.Trigger asChild>
          <button
            aria-label="Profile"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-whatsapp-light/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-whatsapp"
            type="button"
          >
            <UserAvatar avatarUrl={profile.avatarUrl} compact initials={profile.initials} name={profile.fullName} size="sm" />
          </button>
        </DropdownMenu.Trigger>
      </Tooltip>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          className="z-50 w-[330px] rounded-xl border border-border bg-card p-2 shadow-soft"
          sideOffset={8}
        >
          <div className="flex items-start gap-3 px-3 py-2">
            <UserAvatar avatarUrl={profile.avatarUrl} compact initials={profile.initials} name={profile.fullName} size="sm" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{profile.fullName}</p>
              <p className="truncate text-xs text-muted-foreground">{profile.email}</p>
              <Badge className="mt-2 border-whatsapp/20 bg-whatsapp-light px-2 py-0.5 text-[11px] text-whatsapp-dark">
                {WORKSPACE_USER.role}
              </Badge>
            </div>
          </div>
          <DropdownMenu.Separator className="my-1 h-px bg-border" />
          <div className="px-3 py-2">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-normal text-muted">Availability</p>
              <StatusBadge status={availability} />
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {["Active", "Away", "Offline"].map((status) => (
                <button
                  className={cn(
                    "rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-whatsapp",
                    availability === status && "border-whatsapp/30 bg-whatsapp-light text-whatsapp-dark",
                  )}
                  key={status}
                  onClick={() => updateAvailability(status)}
                  type="button"
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
          <DropdownMenu.Separator className="my-1 h-px bg-border" />
          <div className="px-3 py-2">
            <p className="text-xs font-semibold uppercase tracking-normal text-muted">WhatsApp Number</p>
            <p className="mt-1 text-sm font-medium text-foreground">{whatsappConnection.businessPhoneNumber}</p>
          </div>
          <DropdownMenu.Separator className="my-1 h-px bg-border" />
          <ProfileMenuItem icon={<AppIcons.profileUser className="h-[18px] w-[18px]" />} label="Profile" onSelect={() => onNavigate?.("account-settings/profile")} />
          <ProfileMenuItem
            icon={<AppIcons.accountSettings className="h-[18px] w-[18px]" />}
            label="Account Settings"
            onSelect={() => onNavigate?.("account-settings/profile")}
          />
          <ProfileMenuItem
            icon={<AppIcons.manageTeam className="h-[18px] w-[18px]" />}
            label="Workspace Settings"
            onSelect={() => onNavigate?.("manage-team")}
          />
          <DropdownMenu.Separator className="my-1 h-px bg-border" />
          <ProfileMenuItem
            icon={<AppIcons.signOut className="h-[18px] w-[18px]" />}
            label="Log Out"
            onSelect={() => toast.info("Signed out in prototype.")}
          />
          <DropdownMenu.Separator className="my-1 h-px bg-border" />
          <div className="px-3 py-2">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <button className="hover:text-foreground" onClick={() => toast.info("Terms & Conditions page is not available in prototype.")} type="button">
                Terms & Conditions
              </button>
              <button className="hover:text-foreground" onClick={() => toast.info("Privacy Policy page is not available in prototype.")} type="button">
                Privacy Policy
              </button>
            </div>
            <p className="mt-2 text-xs text-muted">Version 1.0.0</p>
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function ProfileMenuItem({
  icon,
  label,
  onSelect,
}: {
  icon: ReactNode;
  label: string;
  onSelect: () => void;
}) {
  return (
    <DropdownMenu.Item
      className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground outline-none hover:bg-slate-50 focus:bg-slate-50"
      onSelect={onSelect}
    >
      <span className="text-muted-foreground">{icon}</span>
      {label}
    </DropdownMenu.Item>
  );
}
