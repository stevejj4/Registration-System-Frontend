import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { roleMatches } from "@/utils/auth";
import { getRoleHomePath } from "@/utils/routes";
import type { UserRole } from "@/types/enums";

interface Props {
  children: React.ReactElement;
  allowedRoles?: UserRole[] | string[];
}

const ProtectedRoute: React.FC<Props> = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    if (!user || !roleMatches(user.role, allowedRoles)) {
      return <Navigate to={getRoleHomePath(user?.role)} replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
