import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  emptyMessage: string;
  searchSlot?: React.ReactNode;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function DataTable<T>({
  data,
  columns,
  emptyMessage,
  searchSlot,
  page,
  totalPages,
  onPageChange,
}: DataTableProps<T>) {
  return (
    <div className="border-t border-line">
      {searchSlot ? <div className="flex justify-end py-3">{searchSlot}</div> : null}
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-subtle">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="h-10 px-4 text-left text-xs font-medium uppercase tracking-[0.08em] text-muted"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="min-h-[200px] px-4 py-16 text-center text-sm text-secondary"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <tr key={rowIndex} className="group border-b border-line transition duration-80 ease-out hover:bg-subtle">
                  {columns.map((column) => (
                    <td key={column.key} className="h-12 px-4 py-3 align-middle text-sm text-primary">
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-end gap-3 py-3">
        <p className="text-sm text-secondary">
          Page {page} of {Math.max(totalPages, 1)}
        </p>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            className="h-8 w-8 px-0"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            className="h-8 w-8 px-0"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
