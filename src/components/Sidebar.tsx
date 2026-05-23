import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { resolveNavigationIcon } from "@/utils/navigationIcons";

interface SidebarProps {
  isOpen?: boolean;
  onNavigate?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onNavigate }) => {
  const { user, navigation, navigationLoading } = useAuth();

  return (
    <aside
      className={[
        "fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col overflow-y-auto text-white",
        "transition-transform duration-300 ease-in-out",
        "md:relative md:z-auto md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
      ].join(" ")}
      style={{ backgroundColor: "var(--sidebar)" }}
    >
      <div className="border-b border-white/10 p-6">
        <h2 className="text-lg font-bold tracking-tight">SUN Welfare</h2>
        <p className="mt-1 text-xs uppercase tracking-wider text-white/70">
          {user?.fullName ?? "User"}
        </p>
      </div>

      <nav className="flex-1 py-4">
        {navigationLoading && navigation.length === 0 ? (
          <p className="px-6 text-sm text-white/70">Loading menu…</p>
        ) : null}

        {navigation.map(({ title, route, icon }) => {
          const Icon = resolveNavigationIcon(icon);
          return (
            <NavLink
              key={route}
              to={route}
              end={
                route === "/members" ||
                route === "/admin" ||
                route === "/dashboard"
              }
              onClick={onNavigate}
              className={({ isActive }) =>
                `nav-item${isActive ? " active" : ""}`
              }
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span>{title}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
