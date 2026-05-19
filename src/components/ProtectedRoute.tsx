import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { roleMatches } from '../utils/auth';

interface Props {
  children: React.ReactElement;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<Props> = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useAuth() as any;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && allowedRoles.length > 0) {
    if (!user || !roleMatches(user.role, allowedRoles)) return <Navigate to="/" replace />;
  }
  return children;
};

export default ProtectedRoute;
