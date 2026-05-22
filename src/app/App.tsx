import React from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { Dashboard } from "@/features/dashboard";
import { MemberList, MemberDetails, MemberRegistration } from "@/features/members";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Menu,
  User,
  ChevronDown,
  Plus,
  LogOut,
  Settings,
} from "lucide-react";
import Login from "@/features/auth/Login";
import AdminDashboard from "@/features/admin/AdminDashboard";
import UserList from "@/features/admin/UserList";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth() as any;
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = React.useState(false);

  const pathname = location.pathname;
  const headerTitle =
    pathname === "/register"
      ? "Register New Member"
      : pathname.startsWith("/members/")
      ? "Member Details"
      : pathname === "/members"
      ? "Member Manager"
      : "Dashboard";

  if (pathname === "/login") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Login />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar omitted for brevity */}

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header omitted for brevity */}

        <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <AnimatePresence mode="wait">
            <Routes>
              {/* Dashboard */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <motion.div key="dashboard" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }} className="max-w-7xl mx-auto">
                      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                        <Dashboard
                          onNavigateToRegistration={() => navigate("/register")}
                          onNavigateToMembers={() => navigate("/members")}
                        />
                      </div>
                    </motion.div>
                  </ProtectedRoute>
                }
              />

              {/* Member List */}
              <Route
                path="/members"
                element={
                  <ProtectedRoute allowedRoles={["facilitator", "coordinator", "admin"]}>
                    <motion.div key="members" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }} className="max-w-7xl mx-auto">
                      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                        <div className="border-b border-gray-200 p-6 flex justify-between items-center">
                          <div>
                            <h1 className="text-2xl font-bold text-gray-900">Member Manager</h1>
                            <p className="text-gray-500 mt-1">Manage members, view details, and register new members</p>
                          </div>
                          <button onClick={() => navigate("/register")} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center space-x-2">
                            <Plus className="w-4 h-4" />
                            <span>Register Member</span>
                          </button>
                        </div>
                        <div className="p-6">
                          <MemberList
                            onSelectMember={(memberId: string | number) =>
                              navigate(`/members/${String(memberId)}`)
                            }
                            selectedId={location.pathname.split("/").pop() ?? ""}
                          />
                        </div>
                      </div>
                    </motion.div>
                  </ProtectedRoute>
                }
              />

              {/* Member Details */}
              <Route
                path="/members/:id"
                element={
                  <ProtectedRoute allowedRoles={["facilitator", "coordinator", "admin"]}>
                    <motion.div key="member-details" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }} className="max-w-3xl mx-auto">
                      <MemberDetails
                        memberId={String(location.pathname.split("/").pop())}
                        onBack={() => navigate("/members")}
                      />
                    </motion.div>
                  </ProtectedRoute>
                }
              />

              {/* Member Registration */}
              <Route
                path="/register"
                element={
                  <ProtectedRoute allowedRoles={["facilitator", "coordinator", "admin"]}>
                    <motion.div key="register" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }} className="max-w-3xl mx-auto">
                      <MemberRegistration
                        onSuccess={(memberId: string | number) =>
                          navigate(`/members/${String(memberId)}`)
                        }
                        onCancel={() => navigate("/members")}
                      />
                    </motion.div>
                  </ProtectedRoute>
                }
              />

              {/* Admin Dashboard */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <motion.div key="admin-dashboard" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }} className="max-w-7xl mx-auto">
                      <AdminDashboard />
                    </motion.div>
                  </ProtectedRoute>
                }
              />

              {/* Admin User List */}
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <motion.div key="user-list" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }} className="max-w-7xl mx-auto">
                      <UserList />
                    </motion.div>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
