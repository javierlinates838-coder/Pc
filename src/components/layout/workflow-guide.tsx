"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { FLIP_WORKFLOW } from "./nav-config";

export function WorkflowGuide({ compact = false }: { compact?: boolean }) {
  const pathname = usePathname();

  return (
    <div className="rounded-2xl border border-[var(--color-primary)]/25 bg-[var(--color-card)] p-4 sm:p-5">
      <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-primary)]">
        How flipping works here
      </p>
      <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
        Four tabs, one PC — data carries forward as you go.
      </p>

      <ol className={cn("mt-4 space-y-3", compact && "mt-3 space-y-2")}>
        {FLIP_WORKFLOW.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex gap-3 rounded-xl border p-3 transition-colors",
                  isActive
                    ? "border-[var(--color-primary)]/50 bg-[var(--color-primary)]/10"
                    : "border-[var(--color-border)] hover:border-[var(--color-primary)]/30 hover:bg-[var(--color-secondary)]/40"
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                    isActive
                      ? "bg-[var(--color-primary)] text-white"
                      : "bg-[var(--color-secondary)] text-[var(--color-muted-foreground)]"
                  )}
                >
                  {item.step}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm">{item.title}</p>
                  {!compact && (
                    <p className="mt-0.5 text-xs leading-relaxed text-[var(--color-muted-foreground)]">
                      {item.description}
                    </p>
                  )}
                </div>
                <ArrowRight
                  className={cn(
                    "h-4 w-4 shrink-0 self-center",
                    isActive
                      ? "text-[var(--color-primary)]"
                      : "text-[var(--color-muted-foreground)]"
                  )}
                />
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
