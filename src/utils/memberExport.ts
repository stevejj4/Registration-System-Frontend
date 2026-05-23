import type { MemberDetailsDTO } from "@/types/member";
import { formatDisplayDate } from "@/utils/dateUtils";

export type ExportColumnGroup = "principal" | "nextOfKin" | "dependant" | "meta";

export interface ExportColumnDef {
  id: string;
  label: string;
  group: ExportColumnGroup;
  getValue: (row: ExportRow) => string;
}

export interface ExportRow {
  member: MemberDetailsDTO;
  dependantIndex: number;
}

const col = (
  id: string,
  label: string,
  group: ExportColumnGroup,
  getValue: (row: ExportRow) => string
): ExportColumnDef => ({ id, label, group, getValue });

export const EXPORT_COLUMNS: ExportColumnDef[] = [
  col("principal_id", "Principal ID", "principal", (r) => String(r.member.principal.id ?? "")),
  col("principal_firstName", "First Name", "principal", (r) => r.member.principal.firstName),
  col("principal_lastName", "Last Name", "principal", (r) => r.member.principal.lastName),
  col("principal_nationalID", "National ID", "principal", (r) => r.member.principal.nationalID),
  col("principal_gender", "Gender", "principal", (r) => r.member.principal.gender),
  col("principal_phone", "Phone", "principal", (r) => r.member.principal.phoneNumber),
  col("principal_group", "Group", "principal", (r) => r.member.principal.groupName ?? ""),
  col("principal_dob", "Date of Birth", "principal", (r) => r.member.principal.dateOfBirth),
  col("registered_by_name", "Registered By", "meta", (r) => r.member.principal.registeredByName ?? ""),
  col("registered_by_role", "Registrar Role", "meta", (r) => r.member.principal.registeredByRole ?? ""),
  col("registration_date", "Registration Date", "meta", (r) =>
    formatDisplayDate(r.member.principal.registrationDate)
  ),
  col("nok_firstName", "NOK First Name", "nextOfKin", (r) => r.member.nextOfKin?.firstName ?? ""),
  col("nok_lastName", "NOK Last Name", "nextOfKin", (r) => r.member.nextOfKin?.lastName ?? ""),
  col("nok_idNumber", "NOK ID Number", "nextOfKin", (r) => r.member.nextOfKin?.idNumber ?? ""),
  col("nok_phone", "NOK Phone", "nextOfKin", (r) => r.member.nextOfKin?.phoneNumber ?? ""),
  col("nok_relationship", "NOK Relationship", "nextOfKin", (r) => r.member.nextOfKin?.relationship ?? ""),
  col("nok_gender", "NOK Gender", "nextOfKin", (r) => r.member.nextOfKin?.gender ?? ""),
  col("nok_dob", "NOK Date of Birth", "nextOfKin", (r) => r.member.nextOfKin?.dateOfBirth ?? ""),
  col("dep_index", "Dependant #", "dependant", (r) => {
    const d = r.member.dependants[r.dependantIndex];
    return d ? String(r.dependantIndex + 1) : "";
  }),
  col("dep_firstName", "Dependant First Name", "dependant", (r) => r.member.dependants[r.dependantIndex]?.firstName ?? ""),
  col("dep_lastName", "Dependant Last Name", "dependant", (r) => r.member.dependants[r.dependantIndex]?.lastName ?? ""),
  col("dep_relationship", "Dependant Relationship", "dependant", (r) => r.member.dependants[r.dependantIndex]?.relationship ?? ""),
  col("dep_gender", "Dependant Gender", "dependant", (r) => r.member.dependants[r.dependantIndex]?.gender ?? ""),
  col("dep_phone", "Dependant Phone", "dependant", (r) => r.member.dependants[r.dependantIndex]?.phoneNumber ?? ""),
  col("dep_dob", "Dependant Date of Birth", "dependant", (r) => r.member.dependants[r.dependantIndex]?.dateOfBirth ?? ""),
];

export function buildExportRows(members: MemberDetailsDTO[]): ExportRow[] {
  const rows: ExportRow[] = [];
  for (const member of members) {
    const count = Math.max(1, member.dependants.length);
    for (let i = 0; i < count; i++) {
      rows.push({ member, dependantIndex: i });
    }
  }
  return rows;
}

function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function downloadCsv(
  rows: ExportRow[],
  columns: ExportColumnDef[],
  filename: string
): void {
  const header = columns.map((c) => escapeCsvCell(c.label)).join(",");
  const body = rows
    .map((row) =>
      columns.map((c) => escapeCsvCell(c.getValue(row) ?? "")).join(",")
    )
    .join("\n");
  const blob = new Blob(["\uFEFF" + header + "\n" + body], {
    type: "text/csv;charset=utf-8;",
  });
  triggerDownload(blob, filename.endsWith(".csv") ? filename : `${filename}.csv`);
}

/** Excel-compatible export via HTML table (.xls) — no extra dependencies */
export function downloadExcel(
  rows: ExportRow[],
  columns: ExportColumnDef[],
  filename: string
): void {
  const th = columns.map((c) => `<th>${escapeHtml(c.label)}</th>`).join("");
  const trs = rows
    .map((row) => {
      const tds = columns
        .map((c) => `<td>${escapeHtml(c.getValue(row))}</td>`)
        .join("");
      return `<tr>${tds}</tr>`;
    })
    .join("");

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body><table border="1"><thead><tr>${th}</tr></thead><tbody>${trs}</tbody></table></body></html>`;
  const blob = new Blob([html], {
    type: "application/vnd.ms-excel;charset=utf-8;",
  });
  const name = filename.endsWith(".xls") ? filename : `${filename}.xls`;
  triggerDownload(blob, name);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
