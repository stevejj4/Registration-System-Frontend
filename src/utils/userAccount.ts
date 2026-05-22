import type { AuthUser } from "@/types/auth";

export function isCurrentUserAccount(
  currentUser: AuthUser | null | undefined,
  row: { id: string; email: string }
): boolean {
  if (!currentUser) return false;
  return (
    String(currentUser.id) === String(row.id) ||
    currentUser.email.trim().toLowerCase() === row.email.trim().toLowerCase()
  );
}
