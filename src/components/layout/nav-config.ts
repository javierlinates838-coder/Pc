import {
  Cpu,
  GitBranch,
  Tag,
  BarChart3,
  Bookmark,
  ShieldCheck,
  Database,
  Package,
  Camera,
  Settings,
  LayoutDashboard,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  shortLabel?: string;
  icon: LucideIcon;
  description?: string;
}

/** Mobile bottom bar — matches bench-style workflow */
export const primaryNavItems: NavItem[] = [
  {
    href: "/build",
    label: "Build",
    shortLabel: "Build",
    icon: Cpu,
    description: "3D rig builder & analyzer",
  },
  {
    href: "/deal",
    label: "Deal Analyzer",
    shortLabel: "Deal",
    icon: GitBranch,
    description: "Evaluate listings fast",
  },
  {
    href: "/profit",
    label: "List Price",
    shortLabel: "List",
    icon: Tag,
    description: "ROI & flip margins",
  },
  {
    href: "/inventory",
    label: "Sales",
    shortLabel: "Sales",
    icon: BarChart3,
    description: "Track your PC flips",
  },
  {
    href: "/",
    label: "Saved",
    shortLabel: "Saved",
    icon: Bookmark,
    description: "Dashboard & saved builds",
  },
];

export const secondaryNavItems: NavItem[] = [
  {
    href: "/compatibility",
    label: "Compatibility",
    icon: ShieldCheck,
    description: "Part compatibility checks",
  },
  {
    href: "/database",
    label: "Parts Database",
    icon: Database,
    description: "Browse all components",
  },
  {
    href: "/scanner",
    label: "Part Scanner",
    icon: Camera,
    description: "Identify parts from photos",
  },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
    description: "Defaults & data export",
  },
];

export const desktopNavItems: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  ...primaryNavItems.filter((i) => i.href !== "/"),
  ...secondaryNavItems,
];

export const allNavItems: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  ...primaryNavItems,
  ...secondaryNavItems,
];

export function getPageTitle(pathname: string): string {
  const item = allNavItems.find(
    (nav) =>
      pathname === nav.href ||
      (nav.href !== "/" && pathname.startsWith(nav.href))
  );
  return item?.label ?? "PC Flip Pro";
}
