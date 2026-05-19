import { useMemo, useState, type ReactNode } from "react";
import { useAppToast } from "@/components/AppToast";
import { DataTable, type DataTableColumn } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";
import { FilterChips } from "@/components/FilterChips";
import { AppIcons } from "@/components/icons";
import { LoadingButton } from "@/components/LoadingButton";
import { SectionCard } from "@/components/SectionCard";
import { DetailGrid, SectionHeader } from "@/components/SectionLayout";
import { StandardDialog } from "@/components/StandardDialog";
import { StatusBadge } from "@/components/StatusBadge";
import { TableActions } from "@/components/TableActions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMockSubmit } from "@/hooks/useMockSubmit";
import {
  billingDetails as initialBillingDetails,
  invoices,
  planDetails,
  type BillingDetails,
  type InvoiceRecord,
} from "@/modules/workspace-settings/workspace-settings.data";

type BillingPageProps = {
  activeSection?: string;
};

type InvoiceFilter = "All" | "Paid" | "Overdue";
type SortKey = "amount" | "billingPeriod" | "dueDate" | "invoiceNumber" | "status";

const invoiceFilters = ["All", "Paid", "Overdue"] as const;

export function BillingPage({ activeSection = "plan-management" }: BillingPageProps) {
  return activeSection === "invoices" ? <InvoicesPage /> : <PlanManagementPage />;
}

function PlanManagementPage() {
  const [billingDetails, setBillingDetails] = useState<BillingDetails>(initialBillingDetails);
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [editBillingOpen, setEditBillingOpen] = useState(false);
  const [billingForm, setBillingForm] = useState<BillingDetails>(billingDetails);
  const cancelSubmit = useMockSubmit(700);
  const saveBillingSubmit = useMockSubmit(600);
  const toast = useAppToast();
  const seatPercent = Math.round((planDetails.seatsUsed / planDetails.usersLimit) * 100);

  const openEditBilling = () => {
    setBillingForm(billingDetails);
    setEditBillingOpen(true);
  };

  const saveBillingDetails = () => {
    setBillingDetails(billingForm);
    setEditBillingOpen(false);
    toast.success("Billing details updated.");
  };

  const cancelSubscription = () => {
    setCancelDialogOpen(false);
    toast.warning("Subscription cancellation scheduled.");
  };

  return (
    <div className="flex w-full flex-col gap-4">
      <SectionCard>
        <SectionHeader
          actions={
            <>
              <Button onClick={() => setPlanDialogOpen(true)} type="button" variant="outline">
                View Plan Details
              </Button>
              <Button onClick={() => setCancelDialogOpen(true)} type="button" variant="outline" className="border-red-200 text-red-600 hover:bg-red-50">
                Cancel Subscription
              </Button>
            </>
          }
          description="Manage your workspace plan, billing cycle, and seat usage."
          title="Plan Management"
        />
        <DetailGrid
          columns="four"
          items={[
            { label: "Plan", value: planDetails.currentPlan },
            { label: "Billing Cycle", value: planDetails.billingCycle },
            { content: <StatusBadge status={planDetails.subscriptionStatus} />, label: "Plan Status" },
            { label: "Workspace Users Limit", value: `${planDetails.usersLimit} seats` },
          ]}
        />
        <div className="mt-5 rounded-xl bg-slate-50/80 p-4 ring-1 ring-slate-200/70">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">Seats Used</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {planDetails.seatsUsed} of {planDetails.usersLimit} seats used
              </p>
            </div>
            <p className="text-sm font-semibold text-whatsapp-dark">{seatPercent}%</p>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-whatsapp" style={{ width: `${seatPercent}%` }} />
          </div>
        </div>
      </SectionCard>

      <SectionCard>
        <SectionHeader
          actions={<Button onClick={openEditBilling} variant="outline">Edit Billing Details</Button>}
          description="These details are used for invoices and subscription records."
          title="Billing Details"
        />
        <DetailGrid
          columns="two"
          items={[
            { label: "Business Name", value: billingDetails.businessName },
            { label: "Billing Email", value: billingDetails.billingEmail },
            { label: "GST Number / Tax ID", value: billingDetails.gstNumber },
            { label: "Billing Address", value: billingDetails.billingAddress },
            { label: "Country", value: billingDetails.country },
            { label: "Currency", value: billingDetails.currency },
          ]}
        />
      </SectionCard>

      <PlanDetailsDialog open={planDialogOpen} onOpenChange={setPlanDialogOpen} />
      <CancelSubscriptionDialog
        isSubmitting={cancelSubmit.isSubmitting}
        onCancel={() => setCancelDialogOpen(false)}
        onConfirm={() => cancelSubmit.run(cancelSubscription)}
        onOpenChange={setCancelDialogOpen}
        open={cancelDialogOpen}
      />
      <EditBillingDetailsDialog
        form={billingForm}
        isSubmitting={saveBillingSubmit.isSubmitting}
        onFormChange={setBillingForm}
        onOpenChange={setEditBillingOpen}
        onSave={() => saveBillingSubmit.run(saveBillingDetails)}
        open={editBillingOpen}
      />
    </div>
  );
}

function InvoicesPage() {
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRecord | null>(null);
  const [invoiceFilter, setInvoiceFilter] = useState<InvoiceFilter>("All");
  const [sortKey, setSortKey] = useState<SortKey>("dueDate");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const toast = useAppToast();
  const overdueInvoice = invoices.find((invoice) => invoice.status === "Overdue");

  const filteredInvoices = useMemo(() => {
    const rows = invoiceFilter === "All" ? invoices : invoices.filter((invoice) => invoice.status === invoiceFilter);

    return [...rows].sort((first, second) => {
      const comparison = compareInvoices(first, second, sortKey);
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [invoiceFilter, sortDirection, sortKey]);

  const updateSort = (nextSortKey: SortKey) => {
    if (sortKey === nextSortKey) {
      setSortDirection((currentDirection) => (currentDirection === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(nextSortKey);
    setSortDirection("asc");
  };

  const downloadInvoice = (invoice: InvoiceRecord) => {
    toast.success("Invoice PDF download started.", invoice.invoiceNumber);
  };

  const columns: DataTableColumn<InvoiceRecord>[] = [
    { key: "invoice", header: "Invoice", cell: (row) => <SortableCell label={row.invoiceNumber} onSort={() => updateSort("invoiceNumber")} /> },
    { key: "billingPeriod", header: "Billing Period", cell: (row) => <SortableCell label={row.billingPeriod} onSort={() => updateSort("billingPeriod")} /> },
    { key: "amount", header: "Amount", cell: (row) => <SortableCell label={row.amount} onSort={() => updateSort("amount")} /> },
    {
      key: "status",
      header: "Status",
      cell: (row) => (
        <button className="text-left" onClick={() => updateSort("status")} type="button">
          <StatusBadge status={row.status} />
        </button>
      ),
    },
    { key: "dueDate", header: "Due Date", cell: (row) => <SortableCell label={row.dueDate} onSort={() => updateSort("dueDate")} /> },
    {
      key: "action",
      header: "Action",
      cell: (row) => (
        <TableActions
          actions={[
            { icon: AppIcons.view, label: "View invoice", onClick: () => setSelectedInvoice(row) },
            { icon: AppIcons.download, label: "Download PDF", onClick: () => downloadInvoice(row) },
          ]}
          maxDirectActions={2}
        />
      ),
    },
  ];

  return (
    <div className="flex w-full flex-col gap-4">
      <SectionCard>
        <SectionHeader
          description="Review subscription invoices and download billing documents."
          title="Invoices"
        />
        {overdueInvoice ? (
          <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <AppIcons.statusLimited className="mt-0.5 h-5 w-5 shrink-0" />
            <p>
              Payment overdue for invoice {overdueInvoice.invoiceNumber}. Please review billing details or download the invoice.
            </p>
          </div>
        ) : null}
        <div className="mb-4">
          <FilterChips
            onChange={(value) => setInvoiceFilter(value)}
            options={invoiceFilters}
            value={invoiceFilter}
          />
        </div>
        {filteredInvoices.length ? (
          <DataTable columns={columns} data={filteredInvoices} getRowId={(row) => row.invoiceNumber} />
        ) : (
          <EmptyState
            actionLabel="Clear Filter"
            description="Try changing the invoice status filter."
            onAction={() => setInvoiceFilter("All")}
            title="No invoices found"
            variant="filters"
          />
        )}
      </SectionCard>

      <InvoicePreviewDialog
        invoice={selectedInvoice}
        onDownload={downloadInvoice}
        onOpenChange={(open) => !open && setSelectedInvoice(null)}
      />
    </div>
  );
}

function PlanDetailsDialog({ onOpenChange, open }: { onOpenChange: (open: boolean) => void; open: boolean }) {
  return (
    <StandardDialog onOpenChange={onOpenChange} open={open} title="Plan Details">
      <div className="grid gap-5">
        <DetailGrid
          columns="two"
          items={[
            { label: "Plan", value: planDetails.currentPlan },
            { label: "Billing Cycle", value: planDetails.billingCycle },
            { label: "Seats", value: `${planDetails.seatsUsed} of ${planDetails.usersLimit} used` },
            { label: "Renewal Date", value: planDetails.renewalDate },
            { label: "Price", value: planDetails.price },
          ]}
        />
        <div>
          <p className="text-sm font-semibold text-foreground">Included Features</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {planDetails.includedFeatures.map((feature) => (
              <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700" key={feature}>
                <AppIcons.statusComplete className="h-4 w-4 text-whatsapp" />
                {feature}
              </div>
            ))}
          </div>
        </div>
      </div>
    </StandardDialog>
  );
}

function CancelSubscriptionDialog({
  isSubmitting,
  onCancel,
  onConfirm,
  onOpenChange,
  open,
}: {
  isSubmitting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  return (
    <StandardDialog
      description="Your workspace will remain active until the end of the current billing cycle. You can continue using included features until then."
      footerRight={
        <>
          <Button disabled={isSubmitting} onClick={onCancel} variant="outline">
            Keep Subscription
          </Button>
          <LoadingButton isLoading={isSubmitting} loadingText="Cancelling..." onClick={onConfirm} variant="destructive">
            Cancel Subscription
          </LoadingButton>
        </>
      }
      onOpenChange={onOpenChange}
      open={open}
      showCloseButton={false}
      size="sm"
      title="Cancel Subscription?"
    />
  );
}

function EditBillingDetailsDialog({
  form,
  isSubmitting,
  onFormChange,
  onOpenChange,
  onSave,
  open,
}: {
  form: BillingDetails;
  isSubmitting: boolean;
  onFormChange: (form: BillingDetails) => void;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
  open: boolean;
}) {
  return (
    <StandardDialog
      footerRight={
        <LoadingButton isLoading={isSubmitting} loadingText="Saving..." onClick={onSave}>
          Save Billing Details
        </LoadingButton>
      }
      onOpenChange={onOpenChange}
      open={open}
      title="Edit Billing Details"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Business Name">
          <Input value={form.businessName} onChange={(event) => onFormChange({ ...form, businessName: event.target.value })} />
        </Field>
        <Field label="Billing Email">
          <Input value={form.billingEmail} onChange={(event) => onFormChange({ ...form, billingEmail: event.target.value })} />
        </Field>
        <Field label="GST Number / Tax ID">
          <Input value={form.gstNumber} onChange={(event) => onFormChange({ ...form, gstNumber: event.target.value })} />
        </Field>
        <Field label="Country">
          <Input value={form.country} onChange={(event) => onFormChange({ ...form, country: event.target.value })} />
        </Field>
        <Field label="Currency">
          <Input value={form.currency} onChange={(event) => onFormChange({ ...form, currency: event.target.value })} />
        </Field>
        <Field label="Billing Address">
          <Input value={form.billingAddress} onChange={(event) => onFormChange({ ...form, billingAddress: event.target.value })} />
        </Field>
      </div>
    </StandardDialog>
  );
}

function InvoicePreviewDialog({
  invoice,
  onDownload,
  onOpenChange,
}: {
  invoice: InvoiceRecord | null;
  onDownload: (invoice: InvoiceRecord) => void;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <StandardDialog
      footerRight={
        invoice ? (
          <Button onClick={() => onDownload(invoice)} variant="outline">
            <AppIcons.download className="h-[18px] w-[18px]" />
            Download PDF
          </Button>
        ) : null
      }
      onOpenChange={onOpenChange}
      open={Boolean(invoice)}
      title={invoice ? `Invoice ${invoice.invoiceNumber}` : "Invoice"}
    >
      {invoice ? (
        <div className="grid gap-5">
          <DetailGrid
            columns="two"
            items={[
              { label: "Invoice Number", value: invoice.invoiceNumber },
              { label: "Billing Period", value: invoice.billingPeriod },
              { label: "Amount", value: invoice.amount },
              { content: <StatusBadge status={invoice.status} />, label: "Status" },
              { label: "Due Date", value: invoice.dueDate },
            ]}
          />
          <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200/70">
            <p className="text-sm font-semibold text-foreground">Billing Details</p>
            <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
              <p>{initialBillingDetails.businessName}</p>
              <p>{initialBillingDetails.billingEmail}</p>
              <p>{initialBillingDetails.billingAddress}</p>
              <p>{initialBillingDetails.gstNumber}</p>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200/70">
            <span className="text-sm text-foreground">Growth Plan subscription</span>
            <span className="text-sm font-semibold text-foreground">{invoice.amount}</span>
          </div>
        </div>
      ) : null}
    </StandardDialog>
  );
}

function SortableCell({ label, onSort }: { label: string; onSort: () => void }) {
  return (
    <button className="text-left text-sm text-foreground hover:text-whatsapp-dark" onClick={onSort} type="button">
      {label}
    </button>
  );
}

function Field({ children, label }: { children: ReactNode; label: string }) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-semibold uppercase tracking-normal text-muted">{label}</span>
      {children}
    </label>
  );
}

function compareInvoices(first: InvoiceRecord, second: InvoiceRecord, sortKey: SortKey) {
  if (sortKey === "amount") {
    return parseAmount(first.amount) - parseAmount(second.amount);
  }

  if (sortKey === "dueDate") {
    return Date.parse(first.dueDate) - Date.parse(second.dueDate);
  }

  return String(first[sortKey]).localeCompare(String(second[sortKey]));
}

function parseAmount(amount: string) {
  return Number(amount.replace(/[^0-9.]/g, ""));
}
