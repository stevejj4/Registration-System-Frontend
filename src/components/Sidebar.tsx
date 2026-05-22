import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { getNavItemsForRole } from "@/utils/routes";

const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const navItems = getNavItemsForRole(user?.role);

  return (
    <aside
      className="w-64 shrink-0 flex flex-col text-white overflow-y-auto"
      style={{ backgroundColor: "var(--sidebar)" }}
    >
      <div className="p-6 border-b border-white/10">
        <h2 className="text-lg font-bold tracking-tight">SUN Welfare</h2>
        <p className="text-xs text-white/70 mt-1 uppercase tracking-wider">
          {user?.role ?? "User"}
        </p>
      </div>

      <nav className="flex-1 py-4">
        {navItems.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === "/members" || path === "/admin"}
            className={({ isActive }) =>
              `nav-item${isActive ? " active" : ""}`
            }
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
