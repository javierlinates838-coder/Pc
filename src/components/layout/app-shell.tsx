"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { AppProviders } from "@/components/providers/app-providers";
import { SidebarBrand, SidebarNav } from "./sidebar-nav";
import { getPageTitle, primaryNavItems } from "./nav-config";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const pageTitle = getPageTitle(pathname);
  const isBuildPage = pathname === "/build";

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <div className="flex min-h-[100dvh] bg-[var(--color-background)]">
      <aside className="hidden lg:flex lg:w-64 lg:shrink-0 lg:flex-col lg:border-r lg:border-[var(--color-border)] lg:bg-[var(--color-sidebar)]">
        <SidebarBrand />
        <div className="flex-1 overflow-y-auto">
          <SidebarNav />
        </div>
        <div className="border-t border-[var(--color-border)] p-4">
          <p className="text-center text-[10px] leading-relaxed text-[var(--color-muted-foreground)]">
            <span className="font-semibold text-[var(--color-primary)]">205+ parts</span>
            {" · "}12 platforms · 3D rig builder
            <br />
            Local engine — works offline · eBay comps optional
          </p>
        </div>
      </aside>

      {menuOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[min(100vw-3rem,20rem)] flex-col border-r border-[var(--color-border)] bg-[var(--color-sidebar)] shadow-2xl transition-transform duration-300 ease-out lg:hidden",
          menuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between border-b border-[var(--color-border)] pr-2">
          <SidebarBrand onNavigate={() => setMenuOpen(false)} />
          <button
            type="button"
            onClick={() => setMenuOpen(false)}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-[var(--color-muted-foreground)] hover:bg-[var(--color-secondary)]"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <SidebarNav onNavigate={() => setMenuOpen(false)} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-background)]/90 px-4 backdrop-blur-md safe-top lg:hidden">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-foreground)] active:scale-95"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{pageTitle}</p>
            <p className="truncate text-[10px] text-[var(--color-muted-foreground)]">
              PC Flip Pro
            </p>
          </div>
        </header>

        <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
          <div
            className={cn(
              "page-container",
              isBuildPage && "page-container--build"
            )}
          >
            <AppProviders>{children}</AppProviders>
          </div>
        </main>

        <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-[var(--color-border)] bg-[var(--color-card)]/95 backdrop-blur-md safe-bottom lg:hidden">
          <div className="mx-auto grid max-w-lg grid-cols-5 gap-0.5 px-1 py-1.5">
            {primaryNavItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative flex min-h-[52px] flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] font-semibold uppercase tracking-wide transition-all active:scale-95",
                    isActive
                      ? "bg-[var(--color-primary)] text-white shadow-[0_0_16px_rgba(255,77,157,0.35)]"
                      : "text-[var(--color-muted-foreground)]"
                  )}
                >
                  <item.icon className="h-5 w-5" strokeWidth={isActive ? 2.25 : 2} />
                  <span className="truncate">{item.shortLabel ?? item.label}</span>
                  {isActive && (
                    <span
                      className="absolute -top-0.5 right-2 h-1.5 w-1.5 rounded-full bg-white/80"
                      aria-hidden
                    />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
