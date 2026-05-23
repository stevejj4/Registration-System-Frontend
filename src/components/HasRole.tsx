import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { normalizeRole } from "@/utils/auth";
import type { UserRole } from "@/types/enums";

interface HasRoleProps {
  roles: UserRole | UserRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Renders children only when the authenticated user's role is allowed.
 * Reads role from AuthContext (synced with auth_user in localStorage).
 */
export default function HasRole({
  roles,
  children,
  fallback = null,
}: HasRoleProps) {
  const { user } = useAuth();
  const current = normalizeRole(user?.role);
  const allowed = Array.isArray(roles) ? roles : [roles];

  if (!current || !allowed.includes(current)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
