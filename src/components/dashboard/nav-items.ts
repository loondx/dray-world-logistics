import {
  FileText,
  LayoutDashboard,
  Package,
  Settings,
  Truck,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";

import type { Permission } from "@/server/permissions/permissions";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  permission: Permission;
};

export type NavSection = { title?: string; items: NavItem[] };

export const NAV_SECTIONS: NavSection[] = [
  {
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, permission: "loads:read" },
      { href: "/loads", label: "Loads", icon: Package, permission: "loads:read" },
      { href: "/documents", label: "Documents", icon: FileText, permission: "documents:read" },
    ],
  },
  {
    title: "Directory",
    items: [
      { href: "/clients", label: "Clients", icon: Users, permission: "masterdata:read" },
      { href: "/carriers", label: "Carriers", icon: Truck, permission: "masterdata:read" },
      { href: "/drivers", label: "Drivers", icon: UserRound, permission: "masterdata:read" },
    ],
  },
  {
    title: "Admin",
    items: [{ href: "/settings", label: "Settings", icon: Settings, permission: "settings:manage" }],
  },
];
