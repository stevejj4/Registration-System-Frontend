import type { UserRole } from "@/types/enums";

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

export const roleMatches = (
  userRole: string | null | undefined,
  allowedRoles: string | string[]
): boolean => {
  if (!userRole) return false;

  const normalizedUserRole = normalizeRole(userRole);
  if (!normalizedUserRole) return false;

  const rolesArray = Array.isArray(allowedRoles)
    ? allowedRoles
    : [allowedRoles];

  return rolesArray.some(
    (role) => normalizeRole(role) === normalizedUserRole
  );
};
