import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/Sidebar";
import { getPageTitle } from "@/utils/routes";

const ProtectedLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const headerTitle = getPageTitle(pathname);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="border-b bg-white px-6 py-4 flex justify-between items-center shrink-0">
          <h1 className="text-lg font-semibold text-gray-900">{headerTitle}</h1>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900">
                {user?.fullName}
              </p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
            <button
              type="button"
              onClick={logout}
              className="text-sm font-medium text-red-600 hover:text-red-700"
            >
              Logout
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default ProtectedLayout;
