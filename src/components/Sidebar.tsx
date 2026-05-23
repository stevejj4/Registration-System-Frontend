import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { resolveNavigationIcon } from "@/utils/navigationIcons";

const Sidebar: React.FC = () => {
  const { user, navigation, navigationLoading } = useAuth();

  return (
    <aside
      className="w-64 shrink-0 flex flex-col text-white overflow-y-auto"
      style={{ backgroundColor: "var(--sidebar)" }}
    >
      <div className="p-6 border-b border-white/10">
        <h2 className="text-lg font-bold tracking-tight">SUN Welfare</h2>
        <p className="text-xs text-white/70 mt-1 uppercase tracking-wider">
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
              end={route === "/members" || route === "/admin" || route === "/dashboard"}
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
