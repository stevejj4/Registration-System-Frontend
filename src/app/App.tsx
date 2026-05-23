import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Login from "@/features/auth/Login";
import ForgotPassword from "@/features/auth/ForgotPassword";
import ResetPassword from "@/features/auth/ResetPassword";
import AdminDashboard from "@/features/admin/AdminDashboard";
import UserList from "@/features/admin/UserList";

import PublicRoute from "@/components/PublicRoute";
import RequireAuth from "@/components/RequireAuth";
import ProtectedLayout from "@/components/ProtectedLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import RoleHomeRedirect from "@/components/RoleHomeRedirect";
import AuthLoadingScreen from "@/components/AuthLoadingScreen";
import {
  MemberListPage,
  MemberDetailsPage,
  MemberRegistrationPage,
} from "@/components/routes/MemberRoutes";
import { Dashboard } from "@/features/dashboard";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { PERMISSIONS } from "@/types/permissions";

function MemberDashboardPage() {
  const navigate = useNavigate();
  return (
    <Dashboard
      onNavigateToRegistration={() => navigate("/register")}
      onNavigateToMembers={() => navigate("/members")}
    />
  );
}

function CatchAllRedirect() {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <AuthLoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <RoleHomeRedirect />;
}

export default function App() {
  const { loading } = useAuth();

  if (loading) {
    return <AuthLoadingScreen />;
  }

  return (
    <Routes>
      <Route element={<PublicRoute />}>
        <Route
          path="/login"
          element={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
              <Login />
            </div>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
              <ForgotPassword />
            </div>
          }
        />
        <Route
          path="/reset-password"
          element={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
              <ResetPassword />
            </div>
          }
        />
      </Route>

      <Route element={<RequireAuth />}>
        <Route element={<ProtectedLayout />}>
          <Route index element={<RoleHomeRedirect />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute requiredPermissions={[PERMISSIONS.MEMBER_READ]}>
                <MemberDashboardPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/members"
            element={
              <ProtectedRoute requiredPermissions={[PERMISSIONS.MEMBER_READ]}>
                <MemberListPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/members/:id"
            element={
              <ProtectedRoute requiredPermissions={[PERMISSIONS.MEMBER_READ]}>
                <MemberDetailsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/register"
            element={
              <ProtectedRoute requiredPermissions={[PERMISSIONS.MEMBER_CREATE]}>
                <MemberRegistrationPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <UserList />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<CatchAllRedirect />} />
        </Route>
      </Route>

      <Route path="*" element={<CatchAllRedirect />} />
    </Routes>
  );
}
