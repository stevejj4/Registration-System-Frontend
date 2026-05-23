import React, { useMemo, useState } from "react";
import Modal from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import {
  EXPORT_COLUMNS,
  ExportColumnGroup,
  buildExportRows,
  downloadCsv,
  downloadExcel,
} from "@/utils/memberExport";
import type { MemberDetailsDTO } from "@/types/member";

const GROUP_LABELS: Record<ExportColumnGroup, string> = {
  principal: "Principal member",
  nextOfKin: "Next of kin",
  dependant: "Dependants",
  meta: "Registration metadata",
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  members: MemberDetailsDTO[];
  loading?: boolean;
}

export default function MemberExportModal({
  isOpen,
  onClose,
  members,
  loading = false,
}: Props) {
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(EXPORT_COLUMNS.map((c) => c.id))
  );

  const columns = useMemo(
    () => EXPORT_COLUMNS.filter((c) => selected.has(c.id)),
    [selected]
  );

  const grouped = useMemo(() => {
    const map = new Map<ExportColumnGroup, typeof EXPORT_COLUMNS>();
    for (const col of EXPORT_COLUMNS) {
      const list = map.get(col.group) ?? [];
      list.push(col);
      map.set(col.group, list);
    }
    return map;
  }, []);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleGroup = (group: ExportColumnGroup, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      EXPORT_COLUMNS.filter((c) => c.group === group).forEach((c) => {
        if (checked) next.add(c.id);
        else next.delete(c.id);
      });
      return next;
    });
  };

  const handleExport = (format: "csv" | "excel") => {
    if (columns.length === 0) return;
    const rows = buildExportRows(members);
    const stamp = new Date().toISOString().slice(0, 10);
    const base = `sun-welfare-members-${stamp}`;
    if (format === "csv") {
      downloadCsv(rows, columns, `${base}.csv`);
    } else {
      downloadExcel(rows, columns, `${base}.xls`);
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      title="Export member data"
      onClose={onClose}
      maxWidth="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExport("csv")}
            disabled={loading || columns.length === 0}
          >
            Download CSV
          </Button>
          <Button
            variant="primary"
            onClick={() => handleExport("excel")}
            disabled={loading || columns.length === 0}
          >
            Download Excel
          </Button>
        </>
      }
    >
      <p className="text-sm text-gray-600 mb-4">
        Select columns to include. Each dependant appears on its own row (principal and NOK
        data repeated).
      </p>

      {loading ? (
        <p className="text-gray-500 text-sm">Loading member data…</p>
      ) : (
        <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
          {Array.from(grouped.entries()).map(([group, cols]) => {
            const allChecked = cols.every((c) => selected.has(c.id));
            return (
              <div key={group} className="border border-gray-200 rounded-lg p-3">
                <label className="flex items-center gap-2 font-medium text-gray-900 mb-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allChecked}
                    onChange={(e) => toggleGroup(group, e.target.checked)}
                  />
                  {GROUP_LABELS[group]}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 pl-6">
                  {cols.map((col) => (
                    <label
                      key={col.id}
                      className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selected.has(col.id)}
                        onChange={() => toggle(col.id)}
                      />
                      {col.label}
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs text-gray-500 mt-3">
        {members.length} member(s) · {columns.length} column(s) selected
      </p>
    </Modal>
  );
}
