import { useMemo, useState, type ReactNode } from "react";
import { useAppToast } from "@/components/AppToast";
import { AvatarWithName } from "@/components/AvatarWithName";
import { DataTable, type DataTableColumn } from "@/components/DataTable";
import { AppIcons } from "@/components/icons";
import { LoadingButton } from "@/components/LoadingButton";
import { MetricCard } from "@/components/MetricCard";
import { SectionCard } from "@/components/SectionCard";
import { StandardDialog } from "@/components/StandardDialog";
import { StatusBadge } from "@/components/StatusBadge";
import { TableActions } from "@/components/TableActions";
import { Button } from "@/components/ui/button";
import { useMockSubmit } from "@/hooks/useMockSubmit";
import { teamMembers, leads, type LeadRecord } from "@/modules/workspace-settings/workspace-settings.data";

const leadStatusOptions = ["Lead", "Contact", "Customer", "Lost"] as const;
const leadStatusFilters = ["All Status", ...leadStatusOptions] as const;
const selectClass =
  "h-10 rounded-xl border border-border bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-whatsapp";
const summaryIcons = [AppIcons.assignAgent, AppIcons.contact, AppIcons.userCheck, AppIcons.delete] as const;

export function VisitorsConversionPage() {
  const [leadRows, setLeadRows] = useState<LeadRecord[]>(leads);
  const [selectedLead, setSelectedLead] = useState<LeadRecord | null>(null);
  const [statusLead, setStatusLead] = useState<LeadRecord | null>(null);
  const [leadStatus, setLeadStatus] = useState<LeadRecord["leadStatus"]>("Lead");
  const [statusFilter, setStatusFilter] = useState<(typeof leadStatusFilters)[number]>("All Status");
  const submit = useMockSubmit();
  const toast = useAppToast();

  const summary = useMemo(
    () => [
      { title: "Leads", value: `${leadRows.filter((lead) => lead.leadStatus === "Lead").length}` },
      { title: "Contacts", value: `${leadRows.filter((lead) => lead.leadStatus === "Contact").length}` },
      { title: "Customers", value: `${leadRows.filter((lead) => lead.leadStatus === "Customer").length}` },
      { title: "Lost", value: `${leadRows.filter((lead) => lead.leadStatus === "Lost").length}` },
    ],
    [leadRows],
  );

  const filteredLeads = useMemo(() => {
    if (statusFilter === "All Status") {
      return leadRows;
    }

    return leadRows.filter((lead) => lead.leadStatus === statusFilter);
  }, [leadRows, statusFilter]);

  const columns: DataTableColumn<LeadRecord>[] = [
    {
      key: "lead",
      header: "Lead / Contact",
      cell: (row) => (
        <div>
          <p className="font-medium text-foreground">{row.contact}</p>
          <p className="text-xs text-muted-foreground">{row.phone}</p>
        </div>
      ),
    },
    { key: "source", header: "Source", cell: (row) => row.source },
    {
      key: "firstMessage",
      header: "First Message",
      className: "max-w-[320px]",
      cell: (row) => <span className="block truncate text-sm text-foreground">{row.firstMessage}</span>,
    },
    { key: "assignedAgent", header: "Assigned Agent", cell: (row) => <AgentName name={row.assignedAgent} /> },
    { key: "leadStatus", header: "Lead Status", cell: (row) => <StatusBadge status={row.leadStatus} /> },
    { key: "createdAt", header: "Created At", cell: (row) => row.createdAt },
    {
      key: "action",
      header: "Action",
      cell: (row) => (
        <TableActions
          actions={[
            { icon: AppIcons.view, label: "View lead", onClick: () => setSelectedLead(row) },
            {
              icon: AppIcons.statusUpdate,
              label: "Update lead status",
              onClick: () => {
                setLeadStatus(row.leadStatus);
                setStatusLead(row);
              },
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="flex w-full flex-col gap-4">
      <SectionCard>
        <div className="mb-4">
          <h2 className="text-base font-semibold text-foreground">Conversion Tracking</h2>
          <p className="mt-1 text-sm text-muted-foreground">Track lead conversion status.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {summary.map((item, index) => {
            const Icon = summaryIcons[index] ?? AppIcons.assignAgent;
            return <MetricCard key={item.title} icon={Icon} title={item.title} value={item.value} />;
          })}
        </div>
      </SectionCard>

      <SectionCard>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground">Lead Tracking</h2>
            <p className="mt-1 text-sm text-muted-foreground">Review incoming WhatsApp leads.</p>
          </div>
          <select
            aria-label="Filter lead status"
            className={selectClass}
            onChange={(event) => setStatusFilter(event.target.value as (typeof leadStatusFilters)[number])}
            value={statusFilter}
          >
            {leadStatusFilters.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </div>
        <DataTable
          columns={columns}
          data={filteredLeads}
          emptyState={{
            actionLabel: "Clear Filters",
            description: "Try changing the status filter or clearing search.",
            onAction: () => setStatusFilter("All Status"),
            title: "No leads found",
            variant: "filters",
          }}
          getRowId={(row) => row.id}
        />
      </SectionCard>

      <StandardDialog
        onOpenChange={(open) => !open && setSelectedLead(null)}
        open={Boolean(selectedLead)}
        size="sm"
        title="Lead Details"
      >
        {selectedLead ? <LeadDetails lead={selectedLead} /> : null}
      </StandardDialog>

      <StandardDialog
        description="Update this WhatsApp lead status locally."
        footerRight={(
          <LoadingButton
            isLoading={submit.isSubmitting}
            loadingText="Updating..."
            onClick={() =>
              submit.run(() => {
                if (statusLead) {
                  setLeadRows((current) => current.map((lead) => lead.id === statusLead.id ? { ...lead, leadStatus } : lead));
                  setStatusLead(null);
                  toast.success("Lead status updated.");
                }
              }, { onError: () => toast.error("Something went wrong. Please try again.") })
            }
          >
            Update Lead Status
          </LoadingButton>
        )}
        onOpenChange={(open) => !open && setStatusLead(null)}
        open={Boolean(statusLead)}
        size="sm"
        title="Update Lead Status"
      >
        {statusLead ? (
          <div className="grid gap-4">
            <Info label="Lead" value={statusLead.contact} />
            <Field label="New Status">
              <select className={selectClass} value={leadStatus} onChange={(event) => setLeadStatus(event.target.value as LeadRecord["leadStatus"])}>
                {leadStatusOptions.map((status) => <option key={status}>{status}</option>)}
              </select>
            </Field>
          </div>
        ) : null}
      </StandardDialog>
    </div>
  );
}

function LeadDetails({ lead }: { lead: LeadRecord }) {
  return (
    <div className="grid gap-4">
      <Info label="Contact" value={lead.contact} />
      <Info label="Source" value={lead.source} />
      <Info label="First Message" value={lead.firstMessage} />
      <Info label="Lead Status"><StatusBadge status={lead.leadStatus} /></Info>
      <Info label="Assigned Agent"><AgentName name={lead.assignedAgent} /></Info>
    </div>
  );
}

function Field({ children, label }: { children: ReactNode; label: string }) {
  return <label className="grid gap-2"><span className="text-sm font-medium text-slate-700">{label}</span>{children}</label>;
}

function Info({ children, label, value }: { children?: ReactNode; label: string; value?: string }) {
  return <div><p className="text-xs font-semibold uppercase tracking-normal text-muted">{label}</p>{children ?? <p className="mt-1 text-sm text-foreground">{value}</p>}</div>;
}

function AgentName({ name }: { name: string }) {
  if (name === "Unassigned") {
    return <span className="text-sm text-muted-foreground">Unassigned</span>;
  }

  const agent = teamMembers.find((item) => item.name === name);

  return <AvatarWithName initials={agent?.initials} name={name} size="sm" />;
}
