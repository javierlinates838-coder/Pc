import {
  Cpu,
  GitBranch,
  BarChart3,
  Tag,
  LayoutDashboard,
  ShieldCheck,
  Database,
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

/** Bottom nav — order matches the flip workflow */
export const primaryNavItems: NavItem[] = [
  {
    href: "/",
    label: "Home",
    shortLabel: "Home",
    icon: LayoutDashboard,
    description: "Start here — how flipping works",
  },
  {
    href: "/deal",
    label: "Check Listing",
    shortLabel: "Deal",
    icon: GitBranch,
    description: "Paste a Facebook/eBay ad",
  },
  {
    href: "/build",
    label: "Your PC",
    shortLabel: "Build",
    icon: Cpu,
    description: "Parts, 3D view, compatibility",
  },
  {
    href: "/profit",
    label: "Profit Math",
    shortLabel: "Profit",
    icon: Tag,
    description: "Pay vs sell vs fees",
  },
  {
    href: "/inventory",
    label: "My Flips",
    shortLabel: "Flips",
    icon: BarChart3,
    description: "Saved PCs you are flipping",
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
    description: "Identify parts from text or photos",
  },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
    description: "Defaults & data export",
  },
];

export const desktopNavItems: NavItem[] = [
  ...primaryNavItems,
  ...secondaryNavItems,
];

export const allNavItems: NavItem[] = [...primaryNavItems, ...secondaryNavItems];

export interface WorkflowStep {
  step: number;
  href: string;
  label: string;
  title: string;
  description: string;
}

export const FLIP_WORKFLOW: WorkflowStep[] = [
  {
    step: 1,
    href: "/deal",
    label: "Deal",
    title: "Paste a listing",
    description:
      "Copy the ad from Facebook, eBay, or Craigslist. We read the parts and the price they're asking.",
  },
  {
    step: 2,
    href: "/build",
    label: "Build",
    title: "See the PC",
    description:
      "Same parts load here automatically. Check compatibility and what the rig is worth.",
  },
  {
    step: 3,
    href: "/profit",
    label: "Profit",
    title: "Run the money",
    description:
      "What you pay, what you sell for, shipping, and platform fees — your real profit.",
  },
  {
    step: 4,
    href: "/inventory",
    label: "Flips",
    title: "Save it",
    description:
      "Store the flip so you can come back later. Open it again from here anytime.",
  },
];

export function getPageTitle(pathname: string): string {
  const item = allNavItems.find(
    (nav) =>
      pathname === nav.href ||
      (nav.href !== "/" && pathname.startsWith(nav.href))
  );
  return item?.label ?? "PC Flip Pro";
}

export function getWorkflowStep(pathname: string): WorkflowStep | null {
  const match = FLIP_WORKFLOW.find(
    (s) =>
      pathname === s.href ||
      (s.href !== "/" && pathname.startsWith(s.href))
  );
  return match ?? null;
}
