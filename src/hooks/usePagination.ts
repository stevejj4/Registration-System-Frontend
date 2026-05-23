import { useEffect, useMemo, useState } from "react";

export interface UsePaginationResult<T> {
  page: number;
  setPage: (page: number | ((prev: number) => number)) => void;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  paginatedItems: T[];
  rangeStart: number;
  rangeEnd: number;
}

/**
 * Client-side pagination for filtered lists/tables.
 * Pass `resetDeps` (e.g. search string) to jump back to page 0 when filters change.
 */
export function usePagination<T>(
  items: T[],
  pageSize: number,
  resetDeps: unknown[] = []
): UsePaginationResult<T> {
  const [page, setPage] = useState(0);
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  useEffect(() => {
    setPage((p) => Math.min(p, totalPages - 1));
  }, [totalPages]);

  useEffect(() => {
    setPage(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, resetDeps);

  const paginatedItems = useMemo(() => {
    const start = page * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page, pageSize]);

  const rangeStart = totalItems === 0 ? 0 : page * pageSize + 1;
  const rangeEnd = Math.min((page + 1) * pageSize, totalItems);

  return {
    page,
    setPage,
    pageSize,
    totalItems,
    totalPages,
    paginatedItems,
    rangeStart,
    rangeEnd,
  };
}
