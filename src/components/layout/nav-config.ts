import {
  LayoutDashboard,
  Wrench,
  ShieldCheck,
  Search,
  Calculator,
  Database,
  Package,
  Camera,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  shortLabel?: string;
  icon: LucideIcon;
  description?: string;
}

export const primaryNavItems: NavItem[] = [
  { href: "/", label: "Dashboard", shortLabel: "Home", icon: LayoutDashboard },
  {
    href: "/build",
    label: "Build Analyzer",
    shortLabel: "Build",
    icon: Wrench,
    description: "Select parts & analyze builds",
  },
  {
    href: "/deal",
    label: "Deal Analyzer",
    shortLabel: "Deals",
    icon: Search,
    description: "Evaluate listings fast",
  },
  {
    href: "/profit",
    label: "Profit Calculator",
    shortLabel: "Profit",
    icon: Calculator,
    description: "ROI & flip margins",
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
    href: "/inventory",
    label: "Inventory",
    icon: Package,
    description: "Track your PC flips",
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

export const allNavItems: NavItem[] = [
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
