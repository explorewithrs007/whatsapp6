import { useMemo, useState, type ReactNode } from "react";
import { useAppToast } from "@/components/AppToast";
import { DataTable, type DataTableColumn } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";
import { AppIcons } from "@/components/icons";
import { LoadingButton } from "@/components/LoadingButton";
import { SearchInput } from "@/components/SearchInput";
import { SectionCard } from "@/components/SectionCard";
import { SectionHeader } from "@/components/SectionLayout";
import { StandardDialog } from "@/components/StandardDialog";
import { StatusBadge } from "@/components/StatusBadge";
import { TableActions } from "@/components/TableActions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMockSubmit } from "@/hooks/useMockSubmit";
import { autoReplyRules, crmTriggers, type AutoReplyRule, type CRMTriggerRecord } from "@/modules/crm/crm.data";

const selectClass =
  "h-10 rounded-xl border border-border bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-whatsapp";
const triggerStatuses = ["Active", "Disabled"] as const;
const timeoutOptions = ["5 minutes", "10 minutes", "15 minutes"] as const;

type TriggerStatus = (typeof triggerStatuses)[number];
type TriggerForm = CRMTriggerRecord;
type TestResult = {
  keyword: string;
  response: string;
  triggerName: string;
} | null;

type CRMTriggersPageProps = {
  activeSection?: string;
  onNavigate?: (path: string) => void;
};

function createEmptyTrigger(): TriggerForm {
  return {
    keyword: "",
    lastUpdated: "Today",
    response: "",
    status: "Active",
    triggerName: "",
  };
}

export function CRMTriggersPage({ activeSection = "keyword-automation", onNavigate }: CRMTriggersPageProps) {
  const [triggerRows, setTriggerRows] = useState<CRMTriggerRecord[]>(crmTriggers);
  const [ruleRows, setRuleRows] = useState<AutoReplyRule[]>(autoReplyRules);
  const [triggerSearch, setTriggerSearch] = useState("");
  const [triggerDialogOpen, setTriggerDialogOpen] = useState(false);
  const [editingTriggerKeyword, setEditingTriggerKeyword] = useState<string | null>(null);
  const [triggerForm, setTriggerForm] = useState<TriggerForm>(createEmptyTrigger());
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [editingRuleName, setEditingRuleName] = useState<string | null>(null);
  const [ruleForm, setRuleForm] = useState<AutoReplyRule>({ name: "", message: "", status: "Active" });
  const [testMessage, setTestMessage] = useState("What is your price?");
  const [testResult, setTestResult] = useState<TestResult>(null);
  const [testHelperNote, setTestHelperNote] = useState("");
  const [testSubmitted, setTestSubmitted] = useState(false);
  const [assignmentTimeout, setAssignmentTimeout] = useState<(typeof timeoutOptions)[number]>("10 minutes");
  const [assignmentStatus, setAssignmentStatus] = useState<TriggerStatus>("Active");
  const toast = useAppToast();
  const canSaveTrigger = Boolean(
    triggerForm.triggerName.trim() && triggerForm.keyword.trim() && triggerForm.response.trim(),
  );

  const filteredTriggers = useMemo(() => {
    const query = triggerSearch.trim().toLowerCase();

    if (!query) {
      return triggerRows;
    }

    return triggerRows.filter((trigger) =>
      [trigger.triggerName, trigger.keyword, trigger.response]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [triggerRows, triggerSearch]);

  const openCreateTrigger = () => {
    setEditingTriggerKeyword(null);
    setTriggerForm(createEmptyTrigger());
    setTriggerDialogOpen(true);
  };

  const openEditTrigger = (trigger: CRMTriggerRecord) => {
    setEditingTriggerKeyword(trigger.keyword);
    setTriggerForm(trigger);
    setTriggerDialogOpen(true);
  };

  const saveTrigger = () => {
    const nextTrigger = {
      ...triggerForm,
      keyword: triggerForm.keyword.trim().toLowerCase(),
      lastUpdated: "Today",
      response: triggerForm.response.trim(),
      triggerName: triggerForm.triggerName.trim(),
    };

    if (!nextTrigger.keyword || !nextTrigger.triggerName || !nextTrigger.response) {
      return;
    }

    setTriggerRows((currentRows) =>
      editingTriggerKeyword
        ? currentRows.map((trigger) => trigger.keyword === editingTriggerKeyword ? nextTrigger : trigger)
        : [...currentRows, nextTrigger],
    );
    setTriggerDialogOpen(false);
    setEditingTriggerKeyword(null);
    toast.success(editingTriggerKeyword ? "Trigger updated." : "Trigger created.");
  };

  const toggleTriggerStatus = (trigger: CRMTriggerRecord) => {
    setTriggerRows((currentRows) =>
      currentRows.map((row) =>
        row.keyword === trigger.keyword
          ? { ...row, lastUpdated: "Today", status: row.status === "Active" ? "Disabled" : "Active" }
          : row,
      ),
    );
    toast.success(trigger.status === "Active" ? "Trigger disabled." : "Trigger enabled.");
  };

  const runTriggerTest = (message = testMessage, rows = triggerRows) => {
    const normalizedMessage = message.toLowerCase();
    const matchedTrigger = rows.find((trigger) =>
      trigger.status === "Active" && normalizedMessage.includes(trigger.keyword.toLowerCase()),
    );

    setTestMessage(message);
    setTestHelperNote("");
    setTestSubmitted(true);
    setTestResult(
      matchedTrigger
        ? { keyword: matchedTrigger.keyword, response: matchedTrigger.response, triggerName: matchedTrigger.triggerName }
        : null,
    );
  };

  const testTriggerForm = () => {
    runTriggerTest(`What is your ${triggerForm.keyword || "price"}?`, [triggerForm, ...triggerRows]);
  };

  const testSingleTrigger = (trigger: CRMTriggerRecord) => {
    const sampleMessages: Record<string, string> = {
      appointment: "I need help with my appointment.",
      hours: "What are your business hours?",
      invoice: "Can you help with my invoice?",
      location: "Please share your location.",
      price: "What is your price?",
    };

    const sampleMessage = sampleMessages[trigger.keyword] ?? `I need help with ${trigger.keyword}.`;

    onNavigate?.("crm-triggers/test-trigger");
    runTriggerTest(sampleMessage);

    if (trigger.status === "Disabled") {
      setTestHelperNote("This trigger is disabled. Enable it to match customer messages.");
    }
  };

  const openEditRule = (rule: AutoReplyRule) => {
    setEditingRuleName(rule.name);
    setRuleForm(rule);
    setRuleDialogOpen(true);
  };

  const saveRule = () => {
    if (!ruleForm.name.trim() || !ruleForm.message.trim()) {
      return;
    }

    setRuleRows((currentRows) =>
      currentRows.map((rule) => rule.name === editingRuleName ? { ...ruleForm, name: ruleForm.name.trim(), message: ruleForm.message.trim() } : rule),
    );
    setRuleDialogOpen(false);
    setEditingRuleName(null);
    toast.success("Auto-reply rule updated.");
  };

  const columns: DataTableColumn<CRMTriggerRecord>[] = [
    { key: "triggerName", header: "Trigger Name", cell: (row) => <span className="font-medium text-foreground">{row.triggerName}</span> },
    { key: "keyword", header: "Keyword", cell: (row) => <span className="font-medium text-whatsapp-dark">{row.keyword}</span> },
    { key: "response", header: "Response Preview", cell: (row) => row.response },
    { key: "status", header: "Status", cell: (row) => <StatusBadge status={row.status} /> },
    { key: "lastUpdated", header: "Last Updated", cell: (row) => row.lastUpdated },
    {
      key: "action",
      header: "Action",
      cell: (row) => (
        <TableActions
          actions={[
            { icon: AppIcons.edit, label: "Edit trigger", onClick: () => openEditTrigger(row) },
            { icon: AppIcons.test, label: "Test trigger", onClick: () => testSingleTrigger(row) },
            {
              icon: AppIcons.power,
              label: row.status === "Active" ? "Disable trigger" : "Enable trigger",
              onClick: () => toggleTriggerStatus(row),
            },
          ]}
        />
      ),
    },
  ];

  const contentBySection: Record<string, ReactNode> = {
    "keyword-automation": (
              <SectionCard>
                <SectionHeader
                  actions={
                  <div className="flex w-full flex-col gap-2 lg:w-auto lg:flex-row lg:items-center">
                    <SearchInput
                      className="w-full lg:w-80"
                      onChange={(event) => setTriggerSearch(event.target.value)}
                      placeholder="Search triggers"
                      value={triggerSearch}
                    />
                    <Button onClick={openCreateTrigger}>Create Trigger</Button>
                  </div>
                  }
                  description="Manage keyword auto-responses."
                  title="Keyword Automation"
                />
                {filteredTriggers.length ? (
                  <DataTable columns={columns} data={filteredTriggers} getRowId={(row) => row.keyword} />
                ) : (
                  <EmptyState
                    actionLabel={triggerSearch.trim() ? "Clear Search" : "Create Trigger"}
                    onAction={triggerSearch.trim() ? () => setTriggerSearch("") : openCreateTrigger}
                    variant={triggerSearch.trim() ? "search" : "triggers"}
                  />
                )}
              </SectionCard>
    ),
    "auto-reply-rules": (
              <SectionCard>
                <SectionHeader description="Manage basic auto-reply rules." title="Auto-Reply Rules" />
                <div className="grid gap-2 lg:grid-cols-3">
                  {ruleRows.map((rule) => (
                    <div key={rule.name} className="min-w-0 rounded-xl bg-slate-50/70 px-3 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground">{rule.name}</p>
                          <p className="mt-1 text-sm text-muted-foreground">{rule.message}</p>
                        </div>
                        <StatusBadge status={rule.status} />
                      </div>
                      <Button className="mt-3" onClick={() => openEditRule(rule)} size="sm" variant="outline">
                        Edit
                      </Button>
                    </div>
                  ))}
                </div>
              </SectionCard>
    ),
    "test-trigger": (
              <SectionCard>
                <SectionHeader description="Test keyword matching." title="Test Trigger" />
                <div className="mt-4 grid gap-3">
                  <Field label="Customer Message">
                    <textarea
                      className="min-h-24 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-whatsapp"
                      onChange={(event) => setTestMessage(event.target.value)}
                      value={testMessage}
                    />
                  </Field>
                  <Button className="w-fit" disabled={!testMessage.trim()} onClick={() => runTriggerTest()}>
                    Test Message
                  </Button>
                  <div className="rounded-xl bg-slate-50/70 px-3 py-3">
                    {testHelperNote ? (
                      <p className="mb-3 text-sm font-medium text-amber-700">{testHelperNote}</p>
                    ) : null}
                    {testSubmitted ? (
                      testResult ? (
                        <div className="grid gap-3">
                          <Info label="Matched Trigger" value={testResult.triggerName} />
                          <Info label="Keyword" value={testResult.keyword} />
                          <Info label="Response Preview" value={testResult.response} />
                        </div>
                      ) : (
                        <EmptyState compact variant="search" title="No trigger matched" description="Try another customer message or keyword." />
                      )
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Enter a customer message and test for a matching keyword.
                      </p>
                    )}
                  </div>
                </div>
              </SectionCard>
    ),
    "auto-assignment": (
              <SectionCard>
                <SectionHeader
                  description="Assign chats to an available agent if no reply is sent within a timeout."
                  title="Auto-Assignment"
                />
                <div className="grid gap-4 rounded-xl bg-slate-50/70 px-3 py-3 lg:grid-cols-[1fr_220px_180px] lg:items-center">
                  <p className="text-sm text-muted-foreground">
                    Assign to an available agent when no team reply is sent within the selected timeout.
                  </p>
                  <select
                    className={selectClass}
                    onChange={(event) => setAssignmentTimeout(event.target.value as (typeof timeoutOptions)[number])}
                    value={assignmentTimeout}
                  >
                    {timeoutOptions.map((timeout) => <option key={timeout}>{timeout}</option>)}
                  </select>
                  <select
                    className={selectClass}
                    onChange={(event) => setAssignmentStatus(event.target.value as TriggerStatus)}
                    value={assignmentStatus}
                  >
                    {triggerStatuses.map((status) => <option key={status}>{status}</option>)}
                  </select>
                </div>
              </SectionCard>
    ),
  };

  return (
    <div className="flex w-full flex-col gap-4">
      {contentBySection[activeSection] ?? contentBySection["keyword-automation"]}
      <TriggerDialog
        form={triggerForm}
        isEditing={Boolean(editingTriggerKeyword)}
        onFormChange={setTriggerForm}
        onOpenChange={(open) => {
          setTriggerDialogOpen(open);
          if (!open) {
            setEditingTriggerKeyword(null);
          }
        }}
        onSave={saveTrigger}
        onTest={testTriggerForm}
        open={triggerDialogOpen}
        canSave={canSaveTrigger}
      />
      <RuleDialog
        form={ruleForm}
        onFormChange={setRuleForm}
        onOpenChange={(open) => {
          setRuleDialogOpen(open);
          if (!open) {
            setEditingRuleName(null);
          }
        }}
        onSave={saveRule}
        open={ruleDialogOpen}
      />
    </div>
  );
}

function TriggerDialog({
  canSave,
  form,
  isEditing,
  onFormChange,
  onOpenChange,
  onSave,
  onTest,
  open,
}: {
  canSave: boolean;
  form: TriggerForm;
  isEditing: boolean;
  onFormChange: (form: TriggerForm) => void;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
  onTest: () => void;
  open: boolean;
}) {
  const submit = useMockSubmit();

  return (
    <StandardDialog
      description={isEditing ? "Update this keyword-based auto-response." : "Create a keyword-based auto-response."}
      footerLeft={<Button disabled={!form.keyword.trim()} onClick={onTest} variant="outline">Test</Button>}
      footerRight={
        <LoadingButton disabled={!canSave} isLoading={submit.isSubmitting} loadingText="Saving..." onClick={() => submit.run(onSave)}>
          Save Trigger
        </LoadingButton>
      }
      onOpenChange={onOpenChange}
      open={open}
      title={isEditing ? "Edit Trigger" : "Create Trigger"}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Trigger Name">
          <Input
            onChange={(event) => onFormChange({ ...form, triggerName: event.target.value })}
            placeholder="Pricing Reply"
            value={form.triggerName}
          />
        </Field>
        <Field label="Keyword">
          <Input
            onChange={(event) => onFormChange({ ...form, keyword: event.target.value })}
            placeholder="price"
            value={form.keyword}
          />
        </Field>
        <Field label="Status">
          <select
            className={selectClass}
            onChange={(event) => onFormChange({ ...form, status: event.target.value as TriggerStatus })}
            value={form.status}
          >
            {triggerStatuses.map((status) => <option key={status}>{status}</option>)}
          </select>
        </Field>
        <Field className="sm:col-span-2" label="Response Message">
          <textarea
            className="min-h-24 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-whatsapp"
            onChange={(event) => onFormChange({ ...form, response: event.target.value })}
            placeholder="Sends pricing response"
            value={form.response}
          />
        </Field>
      </div>
    </StandardDialog>
  );
}

function RuleDialog({
  form,
  onFormChange,
  onOpenChange,
  onSave,
  open,
}: {
  form: AutoReplyRule;
  onFormChange: (form: AutoReplyRule) => void;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
  open: boolean;
}) {
  const submit = useMockSubmit();

  return (
    <StandardDialog
      description="Update this auto-reply rule locally."
      footerRight={<LoadingButton isLoading={submit.isSubmitting} loadingText="Saving..." onClick={() => submit.run(onSave)}>Save Rule</LoadingButton>}
      onOpenChange={onOpenChange}
      open={open}
      title="Edit Auto-Reply Rule"
    >
      <div className="grid gap-4">
        <Field label="Rule Name">
          <Input onChange={(event) => onFormChange({ ...form, name: event.target.value })} value={form.name} />
        </Field>
        <Field label="Message">
          <textarea
            className="min-h-24 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-whatsapp"
            onChange={(event) => onFormChange({ ...form, message: event.target.value })}
            value={form.message}
          />
        </Field>
        <Field label="Status">
          <select
            className={selectClass}
            onChange={(event) => onFormChange({ ...form, status: event.target.value as TriggerStatus })}
            value={form.status}
          >
            {triggerStatuses.map((status) => <option key={status}>{status}</option>)}
          </select>
        </Field>
      </div>
    </StandardDialog>
  );
}

function Field({ children, className, label }: { children: ReactNode; className?: string; label: string }) {
  return (
    <label className={className}>
      <span className="mb-2 block text-xs font-semibold uppercase tracking-normal text-muted">{label}</span>
      {children}
    </label>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-normal text-muted">{label}</p>
      <p className="mt-1 text-sm text-foreground">{value}</p>
    </div>
  );
}
