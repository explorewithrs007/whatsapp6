import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState, type EmptyStateVariant } from "@/components/EmptyState";
import { TableSkeleton } from "@/components/LoadingStates";
import { Button, type ButtonProps } from "@/components/ui/button";

export type DataTableColumn<TData> = {
  key: string;
  header: string;
  cell: (row: TData) => ReactNode;
  className?: string;
};

export type DataTableBulkAction<TData> = {
  label: string;
  onSelect: (rows: TData[]) => void;
  variant?: ButtonProps["variant"];
};

type DataTableProps<TData> = {
  columns: DataTableColumn<TData>[];
  data: TData[];
  emptyMessage?: string;
  emptyState?: {
    actionLabel?: string;
    description?: string;
    onAction?: () => void;
    title?: string;
    variant?: EmptyStateVariant;
  };
  bulkActions?: DataTableBulkAction<TData>[];
  getRowId?: (row: TData, index: number) => string;
  loading?: boolean;
  onSelectedRowIdsChange?: (selectedIds: string[]) => void;
  selectable?: boolean;
  selectedRowIds?: string[];
  simulateInitialLoad?: boolean;
  showSelectionBar?: boolean;
};

export function DataTable<TData>({
  bulkActions = [],
  columns,
  data,
  emptyState,
  emptyMessage = "No records found.",
  getRowId,
  loading = false,
  onSelectedRowIdsChange,
  selectable = false,
  selectedRowIds,
  simulateInitialLoad = true,
  showSelectionBar = false,
}: DataTableProps<TData>) {
  const [internalSelectedIds, setInternalSelectedIds] = useState<Set<string>>(new Set());
  const [initialLoading, setInitialLoading] = useState(simulateInitialLoad);
  const isControlled = selectedRowIds !== undefined;
  const selectedIds = useMemo(
    () => new Set(isControlled ? selectedRowIds : [...internalSelectedIds]),
    [internalSelectedIds, isControlled, selectedRowIds],
  );
  const rowIds = useMemo(
    () => data.map((row, index) => getDataTableRowId(row, index, getRowId)),
    [data, getRowId],
  );
  const selectedRows = useMemo(
    () => data.filter((row, index) => selectedIds.has(getDataTableRowId(row, index, getRowId))),
    [data, getRowId, selectedIds],
  );
  const selectedCount = selectedRows.length;
  const allRowsSelected = Boolean(data.length) && selectedCount === data.length;

  useEffect(() => {
    if (!simulateInitialLoad) {
      setInitialLoading(false);
      return;
    }

    const timeout = window.setTimeout(() => setInitialLoading(false), 300);

    return () => window.clearTimeout(timeout);
  }, [simulateInitialLoad]);

  useEffect(() => {
    if (isControlled) {
      return;
    }

    setInternalSelectedIds((currentIds) => {
      const validIds = new Set(rowIds);
      const nextIds = new Set([...currentIds].filter((id) => validIds.has(id)));
      return nextIds.size === currentIds.size ? currentIds : nextIds;
    });
  }, [isControlled, rowIds]);

  const updateSelection = (nextIds: Set<string>) => {
    if (isControlled) {
      onSelectedRowIdsChange?.([...nextIds]);
    } else {
      setInternalSelectedIds(nextIds);
    }
  };

  const toggleAllRows = () => {
    const nextIds = new Set(selectedIds);

    if (allRowsSelected) {
      rowIds.forEach((rowId) => nextIds.delete(rowId));
    } else {
      rowIds.forEach((rowId) => nextIds.add(rowId));
    }

    updateSelection(nextIds);
  };

  const toggleRow = (rowId: string) => {
    const nextIds = new Set(selectedIds);

    if (nextIds.has(rowId)) {
      nextIds.delete(rowId);
    } else {
      nextIds.add(rowId);
    }

    updateSelection(nextIds);
  };

  const clearSelection = () => {
    updateSelection(new Set());
  };

  return (
    <div className="space-y-3">
      {selectable && showSelectionBar && selectedCount && !loading && !initialLoading ? (
        <div className="flex flex-col gap-3 rounded-xl border border-emerald-200/70 bg-whatsapp-light px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-foreground">
            {selectedCount} {selectedCount === 1 ? "row" : "rows"} selected
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {bulkActions.map((action) => (
              <Button
                key={action.label}
                onClick={() => action.onSelect(selectedRows)}
                size="sm"
                variant={action.variant ?? "outline"}
              >
                {action.label}
              </Button>
            ))}
            <Button onClick={clearSelection} size="sm" variant="ghost">
              Clear selection
            </Button>
          </div>
        </div>
      ) : null}

      {loading || initialLoading ? (
        <TableSkeleton rows={6} />
      ) : data.length ? (
        <Table>
          <TableHeader>
            <TableRow>
              {selectable ? (
                <TableHead className="w-10">
                  <input
                    aria-label="Select all rows"
                    checked={allRowsSelected}
                    className="h-4 w-4 rounded border-border accent-[#25D366]"
                    disabled={!data.length}
                    onChange={toggleAllRows}
                    type="checkbox"
                  />
                </TableHead>
              ) : null}
              {columns.map((column) => (
                <TableHead key={column.key} className={column.className}>
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, rowIndex) => {
              const rowId = getDataTableRowId(row, rowIndex, getRowId);
              const isSelected = selectedIds.has(rowId);

              return (
                <TableRow key={rowId} className={isSelected ? "bg-whatsapp-light/80" : undefined}>
                  {selectable ? (
                    <TableCell className="w-10">
                      <input
                        aria-label={`Select row ${rowIndex + 1}`}
                        checked={isSelected}
                        className="h-4 w-4 rounded border-border accent-[#25D366]"
                        onChange={() => toggleRow(rowId)}
                        type="checkbox"
                      />
                    </TableCell>
                  ) : null}
                  {columns.map((column) => (
                    <TableCell key={column.key} className={column.className}>
                      {column.cell(row)}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      ) : (
        <EmptyState
          compact
          description={emptyState?.description ?? emptyMessage}
          onAction={emptyState?.onAction}
          actionLabel={emptyState?.actionLabel}
          title={emptyState?.title}
          variant={emptyState?.variant ?? "generic"}
        />
      )}
    </div>
  );
}

function getDataTableRowId<TData>(
  row: TData,
  index: number,
  getRowId?: (row: TData, index: number) => string,
) {
  return getRowId?.(row, index) ?? String(index);
}
