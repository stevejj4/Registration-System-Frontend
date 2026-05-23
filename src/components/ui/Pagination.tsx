import React, { useMemo } from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

export interface PaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  rangeStart: number;
  rangeEnd: number;
  onPageChange: (page: number) => void;
  className?: string;
}

function getVisiblePages(current: number, totalPages: number): (number | "ellipsis")[] {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, i) => i);
  }

  const pages = new Set<number>([0, totalPages - 1, current]);
  if (current > 0) pages.add(current - 1);
  if (current < totalPages - 1) pages.add(current + 1);

  const sorted = [...pages].sort((a, b) => a - b);
  const result: (number | "ellipsis")[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const p = sorted[i];
    if (i > 0 && p - sorted[i - 1] > 1) {
      result.push("ellipsis");
    }
    result.push(p);
  }

  return result;
}

const navButtonClass =
  "inline-flex items-center justify-center min-h-[36px] min-w-[36px] px-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white";

const pageButtonClass = (active: boolean) =>
  [
    "inline-flex items-center justify-center min-h-[36px] min-w-[36px] rounded-md border text-sm font-medium transition-colors",
    active
      ? "border-blue-500 bg-blue-500 text-white"
      : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
  ].join(" ");

export default function Pagination({
  page,
  totalPages,
  totalItems,
  rangeStart,
  rangeEnd,
  onPageChange,
  className = "",
}: PaginationProps) {
  const visiblePages = useMemo(
    () => getVisiblePages(page, totalPages),
    [page, totalPages]
  );

  const atFirst = page <= 0;
  const atLast = page >= totalPages - 1;

  if (totalItems === 0) {
    return null;
  }

  return (
    <div
      className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-gray-100 bg-gray-50/50 px-4 py-4 sm:px-6 text-sm text-gray-600 ${className}`}
    >
      <p className="text-center sm:text-left">
        Showing{" "}
        <span className="font-medium text-gray-900">{rangeStart}</span> to{" "}
        <span className="font-medium text-gray-900">{rangeEnd}</span> of{" "}
        <span className="font-medium text-gray-900">{totalItems}</span> results
      </p>

      <div className="flex flex-wrap items-center justify-center gap-1 sm:justify-end">
        <button
          type="button"
          className={navButtonClass}
          disabled={atFirst}
          onClick={() => onPageChange(0)}
          aria-label="First page"
        >
          <ChevronsLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={navButtonClass}
          disabled={atFirst}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-1 mx-1">
          {visiblePages.map((item, idx) =>
            item === "ellipsis" ? (
              <span
                key={`ellipsis-${idx}`}
                className="inline-flex min-h-[36px] min-w-[28px] items-center justify-center text-gray-400"
              >
                …
              </span>
            ) : (
              <button
                key={item}
                type="button"
                className={pageButtonClass(item === page)}
                onClick={() => onPageChange(item)}
                aria-label={`Page ${item + 1}`}
                aria-current={item === page ? "page" : undefined}
              >
                {item + 1}
              </button>
            )
          )}
        </div>

        <button
          type="button"
          className={navButtonClass}
          disabled={atLast}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={navButtonClass}
          disabled={atLast}
          onClick={() => onPageChange(totalPages - 1)}
          aria-label="Last page"
        >
          <ChevronsRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
