import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { getRoleHomePath } from "@/utils/routes";
import AuthLoadingScreen from "@/components/AuthLoadingScreen";

/**
 * Public routes (e.g. /login). Redirects authenticated users to their role home.
 */
const PublicRoute: React.FC = () => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <AuthLoadingScreen />;
  }

  if (isAuthenticated && user) {
    return <Navigate to={getRoleHomePath(user.role)} replace />;
  }

  return <Outlet />;
};

export default PublicRoute;
