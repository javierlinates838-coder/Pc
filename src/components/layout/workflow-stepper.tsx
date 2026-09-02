"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check } from "lucide-react";
import { FLIP_WORKFLOW } from "./nav-config";
import { cn } from "@/lib/utils";
import { useBuildStore } from "@/lib/inventory/store";
import { getPartCount } from "@/lib/build/helpers";

export function WorkflowStepper({ compact = false }: { compact?: boolean }) {
  const pathname = usePathname();
  const { currentBuild, flipCosts } = useBuildStore();
  const hasParts = getPartCount(currentBuild) > 0;
  const hasCosts = flipCosts.purchasePrice > 0;

  const completed = new Set<number>();
  if (pathname.startsWith("/deal") || hasParts) completed.add(1);
  if (hasParts) completed.add(2);
  if (hasCosts || pathname.startsWith("/profit")) completed.add(3);
  if (pathname.startsWith("/inventory")) completed.add(4);

  return (
    <div className={cn("flex items-center gap-1", compact ? "gap-0.5" : "gap-1.5")}>
      {FLIP_WORKFLOW.map((step, i) => {
        const isActive =
          pathname === step.href ||
          (step.href !== "/" && pathname.startsWith(step.href));
        const isDone = completed.has(step.step) && !isActive;

        return (
          <div key={step.href} className="flex items-center gap-1">
            <Link
              href={step.href}
              title={step.title}
              className={cn(
                "flex items-center gap-1 rounded-full border px-2 py-1 transition-all",
                compact ? "text-[9px]" : "text-[10px]",
                isActive
                  ? "border-[var(--color-primary)] bg-[var(--color-primary)]/15 text-[var(--color-primary)] shadow-[0_0_12px_rgba(255,77,157,0.25)]"
                  : isDone
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                    : "border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:border-[var(--color-primary)]/30"
              )}
            >
              <span
                className={cn(
                  "flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold",
                  isActive
                    ? "bg-[var(--color-primary)] text-white"
                    : isDone
                      ? "bg-emerald-500/30"
                      : "bg-[var(--color-secondary)]"
                )}
              >
                {isDone ? <Check className="h-2.5 w-2.5" /> : step.step}
              </span>
              {!compact && <span className="hidden font-semibold uppercase tracking-wide sm:inline">{step.label}</span>}
            </Link>
            {i < FLIP_WORKFLOW.length - 1 && (
              <span className="h-px w-2 bg-[var(--color-border)] sm:w-3" aria-hidden />
            )}
          </div>
        );
      })}
    </div>
  );
}
