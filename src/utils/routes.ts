import type { UserRole } from "@/types/enums";

export function getRoleHomePath(role: UserRole | null | undefined): string {
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "COORDINATOR":
    case "FACILITATOR":
      return "/dashboard";
    default:
      return "/login";
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
