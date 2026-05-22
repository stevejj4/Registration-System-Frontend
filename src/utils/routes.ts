import type { UserRole } from "@/types/enums";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  ClipboardList,
} from "lucide-react";

export const MEMBER_ROLES: UserRole[] = [
  "ADMIN",
  "COORDINATOR",
  "FACILITATOR",
];

export const REGISTRATION_ROLES: UserRole[] = ["ADMIN", "COORDINATOR"];

export function getRoleHomePath(role: UserRole | null | undefined): string {
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "COORDINATOR":
    case "FACILITATOR":
      return "/members";
    default:
      return "/login";
  }
}

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
}

const ADMIN_NAV: NavItem[] = [
  { label: "Admin Dashboard", path: "/admin", icon: LayoutDashboard },
  { label: "Users", path: "/admin/users", icon: Users },
  { label: "Members", path: "/members", icon: ClipboardList },
];

const COORDINATOR_NAV: NavItem[] = [
  { label: "Members", path: "/members", icon: ClipboardList },
  { label: "Registration", path: "/register", icon: UserPlus },
];

const FACILITATOR_NAV: NavItem[] = [
  { label: "Members", path: "/members", icon: ClipboardList },
];

export function getNavItemsForRole(
  role: UserRole | null | undefined
): NavItem[] {
  switch (role) {
    case "ADMIN":
      return ADMIN_NAV;
    case "COORDINATOR":
      return COORDINATOR_NAV;
    case "FACILITATOR":
      return FACILITATOR_NAV;
    default:
      return [];
  }
}

export function getPageTitle(pathname: string): string {
  if (pathname === "/register") return "Register New Member";
  if (pathname.startsWith("/members/") && pathname !== "/members")
    return "Member Details";
  if (pathname === "/members") return "Member Manager";
  if (pathname === "/admin/users") return "User Management";
  if (pathname === "/admin") return "Admin Dashboard";
  if (pathname === "/dashboard") return "Dashboard";
  if (pathname === "/forgot-password") return "Forgot Password";
  if (pathname === "/reset-password") return "Reset Password";
  return "SUN Welfare";
}
