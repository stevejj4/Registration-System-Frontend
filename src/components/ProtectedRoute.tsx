import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { roleMatches } from "@/utils/auth";
import { getRoleHomePath } from "@/utils/routes";
import type { UserRole } from "@/types/enums";

interface Props {
  children: React.ReactElement;
  allowedRoles?: UserRole[] | string[];
  requiredPermissions?: string[];
}

const ProtectedRoute: React.FC<Props> = ({
  children,
  allowedRoles,
  requiredPermissions,
}) => {
  const { isAuthenticated, user, hasPermission } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredPermissions && requiredPermissions.length > 0) {
    const allowed = requiredPermissions.some((p) => hasPermission(p));
    if (!allowed) {
      return <Navigate to={getRoleHomePath(user?.role)} replace />;
    }
  }

  if (allowedRoles && allowedRoles.length > 0) {
    if (!user || !roleMatches(user.role, allowedRoles)) {
      return <Navigate to={getRoleHomePath(user?.role)} replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
