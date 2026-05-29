import type { AuthUser } from "@/types/auth";

/**
 * Checks whether a user row belongs to the currently logged-in user.
 *
 * This is useful for scenarios like:
 * - Preventing users from deleting their own account
 * - Disabling self role/permission changes
 * - Showing a "You" badge in tables
 * - Highlighting the current user's row
 *
 * The function first compares user IDs, then falls back
 * to email comparison for extra safety.
 *
 * Email values are normalized using:
 * - trim() to remove accidental spaces
 * - toLowerCase() to avoid case-sensitive mismatches
 *
 * @param currentUser currently authenticated user
 * @param row user row being checked
 *
 * @returns true if the row belongs to the current user
 */
export function isCurrentUserAccount(
  currentUser: AuthUser | null | undefined,
  row: { id: string; email: string }
): boolean {

  // No authenticated user means no possible match
  if (!currentUser) {
    return false;
  }

  // Compare IDs safely by converting both values to strings
  const isSameId =
    String(currentUser.id) === String(row.id);

  // Normalize emails before comparing
  const isSameEmail =
    currentUser.email.trim().toLowerCase() ===
    row.email.trim().toLowerCase();

  // A match is valid if either the ID or email matches
  return isSameId || isSameEmail;
}