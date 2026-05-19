import { useMemo, useState, type ReactNode } from "react";
import { useAppToast } from "@/components/AppToast";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { DataTable, type DataTableColumn } from "@/components/DataTable";
import { AppIcons } from "@/components/icons";
import { LoadingButton } from "@/components/LoadingButton";
import { SectionCard } from "@/components/SectionCard";
import { StandardDialog } from "@/components/StandardDialog";
import { StatusBadge } from "@/components/StatusBadge";
import { TableActions } from "@/components/TableActions";
import { UserAvatar } from "@/components/UserAvatar";
import { useWorkspaceSettings } from "@/components/WorkspaceSettingsContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { mockConversations, getContact, type MockConversation } from "@/data/mock-data";
import { useMockSubmit } from "@/hooks/useMockSubmit";
import { teamMembers, type TeamMemberRecord } from "@/modules/workspace-settings/workspace-settings.data";

const selectClass =
  "h-10 rounded-xl border border-border bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-whatsapp";

type MemberForm = {
  email: string;
  name: string;
  role: TeamMemberRecord["role"];
  status: string;
};

type InviteForm = {
  email: string;
  name: string;
  role: TeamMemberRecord["role"];
};

type FormErrors = Partial<Record<keyof MemberForm, string>>;

const statusOptions = ["Active", "Away", "Offline", "Pending Invite"];
const averageResponseTimes: Record<string, string> = {
  "agent-meera": "1m 42s",
  "agent-kabir": "2m 18s",
  "agent-nisha": "1m 56s",
  "agent-dev": "4m 05s",
};
const lastActiveTimes: Record<string, string> = {
  "agent-meera": "4 min ago",
  "agent-kabir": "12 min ago",
  "agent-nisha": "7 min ago",
  "agent-dev": "Yesterday",
};

export function ManageTeamPage() {
  const [members, setMembers] = useState<TeamMemberRecord[]>(teamMembers);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [activityMember, setActivityMember] = useState<TeamMemberRecord | null>(null);
  const [editingMember, setEditingMember] = useState<TeamMemberRecord | null>(null);
  const [removingMember, setRemovingMember] = useState<TeamMemberRecord | null>(null);
  const [editForm, setEditForm] = useState<MemberForm | null>(null);
  const [editErrors, setEditErrors] = useState<FormErrors>({});
  const removeSubmit = useMockSubmit(550);
  const toast = useAppToast();
  const { profile } = useWorkspaceSettings();

  const adminCount = members.filter((member) => member.role === "Admin").length;
  const memberWorkloads = useMemo(() => getMemberWorkloads(members), [members]);

  const openEditMember = (member: TeamMemberRecord) => {
    setEditingMember(member);
    setEditForm({
      email: member.email,
      name: member.name,
      role: member.role,
      status: member.status,
    });
    setEditErrors({});
  };

  const canRemoveMember = (member: TeamMemberRecord) =>
    getRemoveBlockReason(member, members, profile.email, profile.fullName) === null;

  const removeMember = () => {
    if (!removingMember || removeSubmit.isSubmitting) {
      return;
    }

    removeSubmit.run(
      () => {
        setMembers((current) => current.filter((member) => member.id !== removingMember.id));
        setRemovingMember(null);
      },
      {
        onSuccess: () => toast.success("Team member removed."),
        onError: () => toast.error("Something went wrong. Please try again."),
      },
    );
  };

  const columns: DataTableColumn<TeamMemberRecord>[] = [
    {
      key: "user",
      header: "User",
      cell: (row) => <UserAvatar initials={row.initials} name={row.name} role={row.role} />,
    },
    { key: "email", header: "Email", cell: (row) => <span className="text-sm text-muted-foreground">{row.email}</span> },
    { key: "role", header: "Role", cell: (row) => row.role },
    { key: "status", header: "Status", cell: (row) => <StatusBadge status={row.status} /> },
    {
      key: "workload",
      header: "Workload / Active Chats",
      cell: (row) => <WorkloadCell workload={memberWorkloads[row.id]} />,
    },
    {
      key: "action",
      header: "Action",
      cell: (row) => (
        <TableActions
          actions={[
            {
              icon: AppIcons.view,
              label: "View activity",
              onClick: () => setActivityMember(row),
            },
            {
              icon: AppIcons.edit,
              label: "Edit member",
              onClick: () => openEditMember(row),
            },
            ...(canRemoveMember(row)
              ? [
                  {
                    destructive: true,
                    icon: AppIcons.delete,
                    label: "Remove member",
                    onClick: () => setRemovingMember(row),
                  },
                ]
              : []),
          ]}
        />
      ),
    },
  ];

  const handleInvite = (invite: InviteForm) => {
    const initials = getInitials(invite.name);
    setMembers((current) => [
      ...current,
      {
        email: invite.email,
        id: `invite-${Date.now()}`,
        initials,
        name: invite.name || "Invited User",
        role: invite.role,
        status: "Pending Invite",
        workload: "0 active chats",
      },
    ]);
    setInviteOpen(false);
  };

  return (
    <div className="flex w-full flex-col gap-4">
      <SectionCard>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-foreground">Team Members</h2>
            <p className="mt-1 text-sm text-muted-foreground">Manage workspace users, roles, workload, and access.</p>
          </div>
          <Button onClick={() => setInviteOpen(true)}>Invite User</Button>
        </div>
        <DataTable
          columns={columns}
          data={members}
          emptyState={{
            actionLabel: "Invite User",
            description: "Invite agents to help manage WhatsApp conversations.",
            onAction: () => setInviteOpen(true),
            title: "No team members yet",
            variant: "settings",
          }}
          getRowId={(row) => row.id}
        />
      </SectionCard>

      <InviteUserDialog
        onInvite={handleInvite}
        onOpenChange={setInviteOpen}
        open={inviteOpen}
      />
      <EditMemberDialog
        adminCount={adminCount}
        errors={editErrors}
        form={editForm}
        member={editingMember}
        onFormChange={(nextForm) => {
          setEditForm(nextForm);
          setEditErrors({});
        }}
        onOpenChange={(open) => {
          if (!open) {
            setEditingMember(null);
            setEditForm(null);
            setEditErrors({});
          }
        }}
        onSave={(nextMember) => {
          if (!editForm || !editingMember) {
            return;
          }

          if (!editForm.name.trim()) {
            setEditErrors({ name: "Full name is required." });
            return;
          }

          if (!editForm.email.trim()) {
            setEditErrors({ email: "Email is required." });
            return;
          }

          if (editingMember.role === "Admin" && editForm.role !== "Admin" && adminCount <= 1) {
            setEditErrors({ role: "At least one admin is required." });
            return;
          }

          setMembers((current) =>
            current.map((member) => (member.id === editingMember.id ? nextMember : member)),
          );
          setEditingMember(null);
          setEditForm(null);
          toast.success("Team member updated.");
        }}
        open={Boolean(editingMember)}
      />
      <MemberActivityDialog
        member={activityMember}
        onOpenChange={(open) => !open && setActivityMember(null)}
        workload={activityMember ? memberWorkloads[activityMember.id] : undefined}
      />
      <ConfirmationDialog
        cancelLabel="Cancel"
        closeOnConfirm={false}
        confirmLabel="Remove Member"
        confirmLoadingLabel="Removing..."
        description="This member will no longer have access to the workspace. Existing conversations and notes will remain in history."
        isConfirming={removeSubmit.isSubmitting}
        onConfirm={removeMember}
        onOpenChange={(open) => !open && setRemovingMember(null)}
        open={Boolean(removingMember)}
        title="Remove team member?"
      />
    </div>
  );
}

function WorkloadCell({ workload }: { workload?: MemberWorkload }) {
  const activeChats = workload?.activeChats ?? 0;
  const openChats = workload?.openChats ?? 0;
  const pendingChats = workload?.pendingChats ?? 0;

  return (
    <div className="min-w-36">
      <p className="text-sm font-medium text-foreground">{activeChats} active chats</p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {openChats} open · {pendingChats} pending
      </p>
    </div>
  );
}

function MemberActivityDialog({
  member,
  onOpenChange,
  workload,
}: {
  member: TeamMemberRecord | null;
  onOpenChange: (open: boolean) => void;
  workload?: MemberWorkload;
}) {
  const assignedConversations = workload?.assignedConversations ?? [];
  const columns: DataTableColumn<MockConversation>[] = [
    {
      key: "contact",
      header: "Contact",
      cell: (row) => {
        const contact = getContact(row.contactId);

        return contact ? (
          <UserAvatar
            avatarUrl={contact.avatarUrl}
            initials={contact.initials}
            name={contact.name}
            role={contact.phone}
            size="sm"
          />
        ) : (
          "Unknown Contact"
        );
      },
    },
    {
      key: "lastMessage",
      header: "Last Message",
      className: "max-w-[280px]",
      cell: (row) => <span className="block truncate text-sm text-foreground">{row.lastMessage}</span>,
    },
    { key: "status", header: "Chat Status", cell: (row) => <StatusBadge status={row.status} /> },
    { key: "lastActivity", header: "Last Activity", cell: (row) => row.lastActivity },
  ];

  return (
    <StandardDialog
      description="Review member workload and assigned WhatsApp conversations."
      onOpenChange={onOpenChange}
      open={Boolean(member)}
      size="lg"
      title="Member Activity"
    >
      {member ? (
        <div className="space-y-5">
          <div className="flex flex-col gap-4 rounded-2xl bg-slate-50/80 p-4 sm:flex-row sm:items-center sm:justify-between">
            <UserAvatar initials={member.initials} name={member.name} role={member.email} size="lg" />
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={member.role} />
              <StatusBadge status={member.status} />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Metric label="Active chats" value={String(workload?.activeChats ?? 0)} />
            <Metric label="Open chats" value={String(workload?.openChats ?? 0)} />
            <Metric label="Pending chats" value={String(workload?.pendingChats ?? 0)} />
            <Metric label="Closed chats today" value={String(workload?.closedToday ?? 0)} />
            <Metric label="Average response time" value={workload?.averageResponseTime ?? "-"} />
            <Metric label="Last active" value={workload?.lastActive ?? "-"} />
          </div>

          <div>
            <div className="mb-3">
              <h3 className="text-sm font-semibold text-foreground">Assigned Conversations</h3>
              <p className="mt-1 text-sm text-muted-foreground">Latest shared conversation records for this member.</p>
            </div>
            <DataTable
              columns={columns}
              data={assignedConversations}
              emptyState={{
                description: "This member does not have assigned conversations right now.",
                title: "No assigned conversations",
                variant: "conversations",
              }}
              getRowId={(row) => row.id}
              simulateInitialLoad={false}
            />
          </div>
        </div>
      ) : null}
    </StandardDialog>
  );
}

function EditMemberDialog({
  adminCount,
  errors,
  form,
  member,
  onFormChange,
  onOpenChange,
  onSave,
  open,
}: {
  adminCount: number;
  errors: FormErrors;
  form: MemberForm | null;
  member: TeamMemberRecord | null;
  onFormChange: (form: MemberForm) => void;
  onOpenChange: (open: boolean) => void;
  onSave: (member: TeamMemberRecord) => void;
  open: boolean;
}) {
  const submit = useMockSubmit();

  return (
    <StandardDialog
      description="Update this workspace member's profile, role, and availability."
      footerRight={
        <LoadingButton
          isLoading={submit.isSubmitting}
          loadingText="Saving..."
          onClick={() => {
            if (!member || !form) {
              return;
            }

            submit.run(() =>
              onSave({
                ...member,
                email: form.email.trim(),
                initials: getInitials(form.name),
                name: form.name.trim(),
                role: form.role,
                status: form.status,
              }),
            );
          }}
        >
          Save Member
        </LoadingButton>
      }
      onOpenChange={onOpenChange}
      open={open}
      size="sm"
      title="Edit Member"
    >
      {member && form ? (
        <div className="grid gap-4">
          <Field error={errors.name} label="Full Name">
            <Input value={form.name} onChange={(event) => onFormChange({ ...form, name: event.target.value })} />
          </Field>
          <Field error={errors.email} label="Email">
            <Input value={form.email} onChange={(event) => onFormChange({ ...form, email: event.target.value })} />
          </Field>
          <Field error={errors.role} label="Role">
            <select className={selectClass} value={form.role} onChange={(event) => onFormChange({ ...form, role: event.target.value as TeamMemberRecord["role"] })}>
              <option>Admin</option>
              <option>Agent</option>
            </select>
            {member.role === "Admin" && adminCount <= 1 ? (
              <span className="text-xs text-muted-foreground">This is currently the only admin account.</span>
            ) : null}
          </Field>
          <Field label="Status">
            <select className={selectClass} value={form.status} onChange={(event) => onFormChange({ ...form, status: event.target.value })}>
              {statusOptions.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </Field>
        </div>
      ) : null}
    </StandardDialog>
  );
}

function InviteUserDialog({
  onInvite,
  onOpenChange,
  open,
}: {
  onInvite: (invite: InviteForm) => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  const [invite, setInvite] = useState<InviteForm>({ name: "", email: "", role: "Agent" });
  const [errors, setErrors] = useState<Partial<Record<keyof InviteForm, string>>>({});
  const submit = useMockSubmit();
  const toast = useAppToast();

  const sendInvite = () => {
    if (!invite.email.trim()) {
      setErrors({ email: "Email is required." });
      return;
    }

    if (!invite.role) {
      setErrors({ role: "Role is required." });
      return;
    }

    setErrors({});
    submit.run(
      () => {
        onInvite({
          email: invite.email.trim(),
          name: invite.name.trim(),
          role: invite.role,
        });
        setInvite({ name: "", email: "", role: "Agent" });
      },
      {
        onSuccess: () => toast.success("Invite sent."),
        onError: () => toast.error("Something went wrong. Please try again."),
      },
    );
  };

  return (
    <StandardDialog
      description="Invite an Admin or Agent to this workspace."
      footerRight={<LoadingButton isLoading={submit.isSubmitting} loadingText="Sending..." onClick={sendInvite}>Send Invite</LoadingButton>}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          setErrors({});
        }
        onOpenChange(nextOpen);
      }}
      open={open}
      size="sm"
      title="Invite User"
    >
      <div className="grid gap-4">
        <Field label="Full Name">
          <Input value={invite.name} onChange={(event) => setInvite({ ...invite, name: event.target.value })} />
        </Field>
        <Field error={errors.email} label="Email">
          <Input value={invite.email} onChange={(event) => setInvite({ ...invite, email: event.target.value })} />
        </Field>
        <Field error={errors.role} label="Role">
          <select className={selectClass} value={invite.role} onChange={(event) => setInvite({ ...invite, role: event.target.value as TeamMemberRecord["role"] })}>
            <option>Admin</option>
            <option>Agent</option>
          </select>
        </Field>
      </div>
    </StandardDialog>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50/80 px-3 py-3">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-base font-semibold text-foreground">{value}</p>
    </div>
  );
}

function Field({
  children,
  error,
  label,
}: {
  children: ReactNode;
  error?: string;
  label: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {children}
      {error ? <span className="text-sm font-medium text-error">{error}</span> : null}
    </label>
  );
}

type MemberWorkload = {
  activeChats: number;
  assignedConversations: MockConversation[];
  averageResponseTime: string;
  closedToday: number;
  lastActive: string;
  openChats: number;
  pendingChats: number;
};

function getMemberWorkloads(members: TeamMemberRecord[]) {
  return members.reduce<Record<string, MemberWorkload>>((workloads, member) => {
    const assignedConversations = mockConversations.filter((conversation) => conversation.assignedAgentId === member.id);
    const openChats = assignedConversations.filter((conversation) => conversation.status === "Open").length;
    const pendingChats = assignedConversations.filter((conversation) => conversation.status === "Pending").length;

    workloads[member.id] = {
      activeChats: openChats + pendingChats,
      assignedConversations,
      averageResponseTime: averageResponseTimes[member.id] ?? "-",
      closedToday: assignedConversations.filter(
        (conversation) => conversation.status === "Closed" && conversation.lastActivityAt === "Today",
      ).length,
      lastActive: lastActiveTimes[member.id] ?? (member.status === "Offline" ? "Offline" : "Just now"),
      openChats,
      pendingChats,
    };

    return workloads;
  }, {});
}

function getRemoveBlockReason(
  member: TeamMemberRecord,
  members: TeamMemberRecord[],
  currentUserEmail: string,
  currentUserName: string,
) {
  const isCurrentUser =
    member.email.toLowerCase() === currentUserEmail.toLowerCase() ||
    member.name.toLowerCase() === currentUserName.toLowerCase();

  if (isCurrentUser) {
    return "You cannot remove your own account.";
  }

  const adminCount = members.filter((item) => item.role === "Admin").length;

  if (member.role === "Admin" && adminCount <= 1) {
    return "At least one admin is required.";
  }

  return null;
}

function getInitials(value: string) {
  const initials = value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return initials || "IU";
}
