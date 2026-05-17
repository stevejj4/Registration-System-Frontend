/**
 * Normalize backend role strings like:
 * ROLE_ADMIN → ADMIN
 * admin → ADMIN
 */
export const normalizeRole = (
  raw?: string
): UserRole | null => {
  if (!raw) return null;

  const normalized = String(raw)
    .replace(/^ROLE_/, "")
    .trim()
    .toUpperCase();

  switch (normalized) {
    case "ADMIN":
      return "ADMIN";

    case "FACILITATOR":
      return "FACILITATOR";

    case "COORDINATOR":
      return "COORDINATOR";

    default:
      return null;
  }
};