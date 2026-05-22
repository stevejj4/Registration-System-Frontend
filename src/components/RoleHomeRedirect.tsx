import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { getRoleHomePath } from "@/utils/routes";

const RoleHomeRedirect: React.FC = () => {
  const { user } = useAuth();
  return <Navigate to={getRoleHomePath(user?.role)} replace />;
};

export default RoleHomeRedirect;
