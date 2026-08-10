"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  Cpu,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/build", label: "Build Analyzer", icon: Wrench },
  { href: "/compatibility", label: "Compatibility", icon: ShieldCheck },
  { href: "/deal", label: "Deal Analyzer", icon: Search },
  { href: "/profit", label: "Profit Calculator", icon: Calculator },
  { href: "/database", label: "Parts Database", icon: Database },
  { href: "/inventory", label: "Inventory", icon: Package },
  { href: "/scanner", label: "Part Scanner", icon: Camera },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 min-h-screen bg-[var(--color-sidebar)] border-r border-[var(--color-border)] flex flex-col shrink-0">
      <div className="p-5 border-b border-[var(--color-border)]">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[var(--color-primary)] flex items-center justify-center">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-tight">PC Flip Pro</h1>
            <p className="text-[10px] text-[var(--color-muted-foreground)]">
              Reseller Toolkit
            </p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                isActive
                  ? "bg-[var(--color-sidebar-active)] text-[var(--color-accent-foreground)] font-medium"
                  : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-secondary)]"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[var(--color-border)]">
        <p className="text-[10px] text-[var(--color-muted-foreground)] text-center">
          Local compatibility engine
          <br />
          No API required
        </p>
      </div>
    </aside>
  );
}
