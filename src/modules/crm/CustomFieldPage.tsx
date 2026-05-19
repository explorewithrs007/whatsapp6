import { useMemo, useState } from "react";
import { useAppToast } from "@/components/AppToast";
import { DataTable, type DataTableColumn } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";
import { AppIcons } from "@/components/icons";
import { LoadingButton } from "@/components/LoadingButton";
import { SectionCard } from "@/components/SectionCard";
import { SectionHeader } from "@/components/SectionLayout";
import { StandardDialog } from "@/components/StandardDialog";
import { StatusBadge } from "@/components/StatusBadge";
import { TableActions } from "@/components/TableActions";
import { Tooltip } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMockSubmit } from "@/hooks/useMockSubmit";
import { contacts, customFields, type ContactRecord, type CustomFieldRecord } from "@/modules/crm/crm.data";

const fieldLimit = 5;
const fieldTypes: CustomFieldRecord["fieldType"][] = ["Text", "Number", "Date", "Dropdown"];
const fieldStatuses = ["Active", "Disabled"] as const;
const selectClass =
  "h-10 rounded-xl border border-border bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-whatsapp";
const filterConditionsByType = {
  Date: ["Equals", "Before", "After"],
  Dropdown: ["Equals"],
  Number: ["Equals", "Greater than", "Less than"],
  Text: ["Contains", "Equals"],
} as const;

type FilterCondition =
  | (typeof filterConditionsByType.Text)[number]
  | (typeof filterConditionsByType.Number)[number]
  | (typeof filterConditionsByType.Dropdown)[number]
  | (typeof filterConditionsByType.Date)[number];

type FieldFormState = {
  dropdownOptions: string;
  fieldName: string;
  fieldType: CustomFieldRecord["fieldType"];
  status: CustomFieldRecord["status"];
};

type AppliedFilter = {
  condition: FilterCondition;
  field: string;
  value: string;
};

type FilterResult = {
  contact: ContactRecord;
  field: string;
  value: string;
};

export function CustomFieldPage() {
  const [fieldRows, setFieldRows] = useState<CustomFieldRecord[]>(customFields);
  const [addOpen, setAddOpen] = useState(false);
  const [editingField, setEditingField] = useState<CustomFieldRecord | null>(null);
  const [fieldForm, setFieldForm] = useState<FieldFormState>({
    dropdownOptions: "",
    fieldName: "",
    fieldType: "Text",
    status: "Active",
  });
  const [filterField, setFilterField] = useState(customFields.find((field) => field.status === "Active")?.fieldName ?? "");
  const [filterCondition, setFilterCondition] = useState<AppliedFilter["condition"]>("Contains");
  const [filterValue, setFilterValue] = useState("");
  const [appliedFilter, setAppliedFilter] = useState<AppliedFilter | null>(null);
  const fieldCount = fieldRows.length;
  const canAddField = fieldCount < fieldLimit;
  const activeFields = fieldRows.filter((field) => field.status === "Active");
  const selectedFilterField = activeFields.find((field) => field.fieldName === filterField);
  const selectedFilterConditions = selectedFilterField ? getConditionsForField(selectedFilterField) : [];
  const toast = useAppToast();

  const filterResults = useMemo(() => {
    if (!appliedFilter) {
      return [];
    }

    const appliedField = fieldRows.find((field) => field.fieldName === appliedFilter.field);

    if (!appliedField || appliedField.status !== "Active") {
      return [];
    }

    return contacts
      .map((contact) => {
        const value = contact.customAttributes[appliedFilter.field] ?? "";
        return { contact, field: appliedFilter.field, value };
      })
      .filter((result) => matchesFilter(result.value, appliedFilter.value, appliedFilter.condition, appliedField.fieldType));
  }, [appliedFilter, fieldRows]);

  const openAddDialog = () => {
    if (!canAddField) {
      return;
    }

    setFieldForm({ dropdownOptions: "", fieldName: "", fieldType: "Text", status: "Active" });
    setAddOpen(true);
  };

  const openEditDialog = (field: CustomFieldRecord) => {
    setFieldForm({
      dropdownOptions: field.dropdownOptions?.join(", ") ?? "",
      fieldName: field.fieldName,
      fieldType: field.fieldType,
      status: field.status,
    });
    setEditingField(field);
  };

  const saveAddedField = () => {
    const fieldName = fieldForm.fieldName.trim();

    if (!fieldName || fieldRows.length >= fieldLimit) {
      return;
    }

    setFieldRows((currentRows) => [
      ...currentRows,
      {
        fieldName,
        dropdownOptions:
          fieldForm.fieldType === "Dropdown" ? parseDropdownOptions(fieldForm.dropdownOptions) : undefined,
        fieldType: fieldForm.fieldType,
        status: "Active",
        usedInContacts: 0,
      },
    ]);
    setFilterField(fieldName);
    setAddOpen(false);
    toast.success("Custom field created.");
  };

  const saveEditedField = () => {
    if (!editingField) {
      return;
    }

    const fieldName = fieldForm.fieldName.trim();

    if (!fieldName) {
      return;
    }

    setFieldRows((currentRows) =>
      currentRows.map((row) =>
        row.fieldName === editingField.fieldName
          ? {
              dropdownOptions:
                fieldForm.fieldType === "Dropdown" ? parseDropdownOptions(fieldForm.dropdownOptions) : undefined,
              fieldName,
              fieldType: fieldForm.fieldType,
              status: fieldForm.status,
              usedInContacts: countContactsUsingField(fieldName),
            }
          : row,
      ),
    );
    setFilterField((currentField) => (currentField === editingField.fieldName ? fieldName : currentField));
    setEditingField(null);
    toast.success("Custom field updated.");
  };

  const toggleFieldStatus = (field: CustomFieldRecord) => {
    setFieldRows((currentRows) =>
      currentRows.map((row) =>
        row.fieldName === field.fieldName
          ? { ...row, status: row.status === "Active" ? "Disabled" : "Active" }
          : row,
      ),
    );
    if (field.fieldName === filterField && field.status === "Active") {
      const nextActiveField = fieldRows.find(
        (row) => row.fieldName !== field.fieldName && row.status === "Active",
      );
      setFilterField(nextActiveField?.fieldName ?? "");
      setFilterCondition(nextActiveField ? getDefaultCondition(nextActiveField) : "Equals");
      setFilterValue("");
      setAppliedFilter(null);
    }
    toast.success(field.status === "Active" ? "Custom field disabled." : "Custom field enabled.");
  };

  const applyFilter = () => {
    if (!filterField || !filterCondition || !filterValue.trim()) {
      return;
    }

    setAppliedFilter({
      condition: filterCondition,
      field: filterField,
      value: filterValue,
    });
  };

  const clearFilter = () => {
    setFilterField("");
    setFilterCondition("Contains");
    setFilterValue("");
    setAppliedFilter(null);
  };

  const columns: DataTableColumn<CustomFieldRecord>[] = [
    { key: "fieldName", header: "Field Name", cell: (row) => row.fieldName },
    { key: "fieldType", header: "Field Type", cell: (row) => row.fieldType },
    { key: "status", header: "Status", cell: (row) => <StatusBadge status={row.status} /> },
    { key: "usedInContacts", header: "Used In Contacts", cell: (row) => row.usedInContacts },
    {
      key: "action",
      header: "Action",
      cell: (row) => (
        <TableActions
          actions={[
            { icon: AppIcons.edit, label: "Edit field", onClick: () => openEditDialog(row) },
            {
              icon: AppIcons.power,
              label: row.status === "Active" ? "Disable field" : "Enable field",
              onClick: () => toggleFieldStatus(row),
            },
          ]}
        />
      ),
    },
  ];

  const resultColumns: DataTableColumn<FilterResult>[] = [
    {
      key: "contact",
      header: "Contact",
      cell: (row) => <span className="font-medium text-foreground">{row.contact.name}</span>,
    },
    { key: "phone", header: "Phone", cell: (row) => row.contact.phone },
    { key: "matchingField", header: "Matching Field", cell: (row) => row.field },
    { key: "value", header: "Value", cell: (row) => row.value || "Not available" },
  ];

  return (
    <div className="flex w-full flex-col gap-4 pb-8">
      <SectionCard>
        <SectionHeader
          actions={
          <>
            <span className="rounded-full border border-border bg-slate-50 px-3 py-1 text-xs text-muted-foreground">
              Max 5 custom fields per workspace
            </span>
            <Tooltip label="Maximum 5 custom fields allowed per workspace.">
              <span>
                <Button disabled={!canAddField} onClick={openAddDialog}>
                  Add Field
                </Button>
              </span>
            </Tooltip>
          </>
          }
          description={`${fieldCount} of ${fieldLimit} custom fields used.`}
          title="Custom Attributes"
        />
        <DataTable columns={columns} data={fieldRows} getRowId={(row) => row.fieldName} />
      </SectionCard>

      <SectionCard>
        <SectionHeader description="Filter contacts by custom attributes." title="Field-Based Filtering" />
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto_auto]">
          <select
            className={selectClass}
            onChange={(event) => {
              const field = activeFields.find((item) => item.fieldName === event.target.value);
              setFilterField(event.target.value);
              setFilterCondition(field ? getDefaultCondition(field) : "Contains");
              setFilterValue("");
              setAppliedFilter(null);
            }}
            value={filterField}
          >
            <option value="">Select field</option>
            {activeFields.map((field) => (
              <option key={field.fieldName}>{field.fieldName}</option>
            ))}
          </select>
          <select
            className={selectClass}
            disabled={!selectedFilterField}
            onChange={(event) => {
              setFilterCondition(event.target.value as AppliedFilter["condition"]);
              setFilterValue("");
              setAppliedFilter(null);
            }}
            value={filterCondition}
          >
            {selectedFilterField ? (
              selectedFilterConditions.map((condition) => <option key={condition}>{condition}</option>)
            ) : (
              <option value="Contains">Select condition</option>
            )}
          </select>
          <FilterValueInput field={selectedFilterField} onValueChange={setFilterValue} value={filterValue} />
          <Button disabled={!filterField || !filterCondition || !filterValue.trim()} onClick={applyFilter}>
            Apply Filter
          </Button>
          {appliedFilter ? (
            <Button onClick={clearFilter} variant="outline">
              Clear Filter
            </Button>
          ) : null}
        </div>

        {appliedFilter ? (
          <div className="mt-5">
            {filterResults.length ? (
              <DataTable
                columns={resultColumns}
                data={filterResults}
                getRowId={(row) => `${row.contact.id}-${row.field}`}
              />
            ) : (
              <EmptyState actionLabel="Clear Filter" onAction={clearFilter} variant="filters" />
            )}
          </div>
        ) : null}
      </SectionCard>

      <CustomFieldDialog
        fieldForm={fieldForm}
        onFieldFormChange={setFieldForm}
        onOpenChange={setAddOpen}
        onSave={saveAddedField}
        open={addOpen}
        title="Add Custom Field"
      />
      <CustomFieldDialog
        fieldForm={fieldForm}
        includeStatus
        onFieldFormChange={setFieldForm}
        onOpenChange={(open) => !open && setEditingField(null)}
        onSave={saveEditedField}
        open={Boolean(editingField)}
        title="Edit Custom Field"
      />
    </div>
  );
}

function CustomFieldDialog({
  fieldForm,
  includeStatus = false,
  onFieldFormChange,
  onOpenChange,
  onSave,
  open,
  title,
}: {
  fieldForm: FieldFormState;
  includeStatus?: boolean;
  onFieldFormChange: (fieldForm: FieldFormState) => void;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
  open: boolean;
  title: string;
}) {
  const submit = useMockSubmit();

  return (
    <StandardDialog
      footerRight={
        <LoadingButton
          disabled={!fieldForm.fieldName.trim()}
          isLoading={submit.isSubmitting}
          loadingText="Saving..."
          onClick={() => submit.run(onSave)}
        >
          Save Field
        </LoadingButton>
      }
      onOpenChange={onOpenChange}
      open={open}
      size="sm"
      title={title}
    >
      <div className="grid gap-4">
        <Field label="Field Name">
          <Input
            onChange={(event) => onFieldFormChange({ ...fieldForm, fieldName: event.target.value })}
            value={fieldForm.fieldName}
          />
        </Field>
        <Field label="Field Type">
          <select
            className={selectClass}
            onChange={(event) =>
              onFieldFormChange({
                ...fieldForm,
                dropdownOptions: event.target.value === "Dropdown" ? fieldForm.dropdownOptions : "",
                fieldType: event.target.value as CustomFieldRecord["fieldType"],
              })
            }
            value={fieldForm.fieldType}
          >
            {fieldTypes.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </Field>
        {fieldForm.fieldType === "Dropdown" ? (
          <Field label="Dropdown Options">
            <Input
              onChange={(event) => onFieldFormChange({ ...fieldForm, dropdownOptions: event.target.value })}
              placeholder="Lead, Existing Customer, VIP"
              value={fieldForm.dropdownOptions}
            />
          </Field>
        ) : null}
        {includeStatus ? (
          <Field label="Status">
            <select
              className={selectClass}
              onChange={(event) =>
                onFieldFormChange({ ...fieldForm, status: event.target.value as CustomFieldRecord["status"] })
              }
              value={fieldForm.status}
            >
              {fieldStatuses.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </Field>
        ) : null}
      </div>
    </StandardDialog>
  );
}

function FilterValueInput({
  field,
  onValueChange,
  value,
}: {
  field?: CustomFieldRecord;
  onValueChange: (value: string) => void;
  value: string;
}) {
  if (!field) {
    return <Input disabled placeholder="Select a field first" value="" />;
  }

  if (field.fieldType === "Dropdown") {
    return (
      <select className={selectClass} onChange={(event) => onValueChange(event.target.value)} value={value}>
        <option value="">Select value</option>
        {(field.dropdownOptions ?? []).map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    );
  }

  if (field.fieldType === "Date") {
    return <Input onChange={(event) => onValueChange(event.target.value)} type="date" value={value} />;
  }

  if (field.fieldType === "Number") {
    return (
      <Input
        onChange={(event) => onValueChange(event.target.value)}
        placeholder="Enter number"
        type="number"
        value={value}
      />
    );
  }

  return <Input onChange={(event) => onValueChange(event.target.value)} placeholder="Enter value" value={value} />;
}

function Field({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-semibold uppercase tracking-normal text-muted">{label}</span>
      {children}
    </label>
  );
}

function countContactsUsingField(fieldName: string) {
  return contacts.filter((contact) => Boolean(contact.customAttributes[fieldName])).length;
}

function getConditionsForField(field: CustomFieldRecord) {
  return filterConditionsByType[field.fieldType];
}

function getDefaultCondition(field: CustomFieldRecord): FilterCondition {
  return getConditionsForField(field)[0];
}

function matchesFilter(value: string, query: string, condition: FilterCondition, fieldType: CustomFieldRecord["fieldType"]) {
  const cleanValue = value.trim();
  const cleanQuery = query.trim();

  if (!cleanValue || !cleanQuery) {
    return false;
  }

  if (fieldType === "Number") {
    const numericValue = Number(cleanValue);
    const numericQuery = Number(cleanQuery);

    if (Number.isNaN(numericValue) || Number.isNaN(numericQuery)) {
      return false;
    }

    if (condition === "Greater than") {
      return numericValue > numericQuery;
    }

    if (condition === "Less than") {
      return numericValue < numericQuery;
    }

    return numericValue === numericQuery;
  }

  if (fieldType === "Date") {
    const dateValue = Date.parse(cleanValue);
    const dateQuery = Date.parse(cleanQuery);

    if (Number.isNaN(dateValue) || Number.isNaN(dateQuery)) {
      return false;
    }

    if (condition === "Before") {
      return dateValue < dateQuery;
    }

    if (condition === "After") {
      return dateValue > dateQuery;
    }

    return dateValue === dateQuery;
  }

  if (condition === "Contains") {
    return cleanValue.toLowerCase().includes(cleanQuery.toLowerCase());
  }

  return cleanValue.toLowerCase() === cleanQuery.toLowerCase();
}

function parseDropdownOptions(options: string) {
  return options
    .split(",")
    .map((option) => option.trim())
    .filter(Boolean);
}
