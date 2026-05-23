import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  ClipboardList,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  "layout-dashboard": LayoutDashboard,
  users: Users,
  "user-plus": UserPlus,
  "clipboard-list": ClipboardList,
};

export function resolveNavigationIcon(icon: string): LucideIcon {
  return ICON_MAP[icon] ?? ClipboardList;
}
