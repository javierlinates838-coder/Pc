"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Cpu } from "lucide-react";
import { cn } from "@/lib/utils";
import { allNavItems } from "./nav-config";

interface SidebarNavProps {
  onNavigate?: () => void;
  className?: string;
}

export function SidebarNav({ onNavigate, className }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav className={cn("flex flex-col gap-0.5 p-2 sm:p-3", className)}>
      {allNavItems.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/" && pathname.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors active:scale-[0.98]",
              isActive
                ? "bg-[var(--color-sidebar-active)] text-[var(--color-primary-foreground)] font-semibold shadow-[0_0_12px_rgba(255,77,157,0.25)]"
                : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-secondary)] hover:text-[var(--color-foreground)]"
            )}
          >
            <item.icon className="h-5 w-5 shrink-0" />
            <div className="min-w-0 flex-1">
              <span className="block truncate">{item.label}</span>
              {item.description && (
                <span className="mt-0.5 hidden text-[10px] leading-tight text-[var(--color-muted-foreground)] xl:block">
                  {item.description}
                </span>
              )}
            </div>
          </Link>
        );
      })}
    </nav>
  );
}

export function SidebarBrand({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Link
      href="/"
      onClick={onNavigate}
      className="flex items-center gap-3 px-4 py-4 sm:px-5"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#ff4d9d] to-[#a855f7] shadow-[0_0_20px_rgba(255,77,157,0.35)]">
        <Cpu className="h-5 w-5 text-white" />
      </div>
      <div className="min-w-0">
        <h1 className="truncate text-sm font-bold tracking-tight">PC Flip Pro</h1>
        <p className="text-[10px] text-[var(--color-muted-foreground)]">
          Reseller Toolkit
        </p>
      </div>
    </Link>
  );
}
