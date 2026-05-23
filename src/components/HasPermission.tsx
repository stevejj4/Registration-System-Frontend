import React from "react";
import { useAuth } from "@/hooks/useAuth";

interface HasPermissionProps {
  permissions: string | string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Renders children when the user has at least one of the required permissions.
 */
export default function HasPermission({
  permissions,
  children,
  fallback = null,
}: HasPermissionProps) {
  const { hasPermission } = useAuth();
  const required = Array.isArray(permissions) ? permissions : [permissions];

  if (!required.some((p) => hasPermission(p))) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
