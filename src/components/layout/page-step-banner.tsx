"use client";

import { usePathname } from "next/navigation";
import { getWorkflowStep } from "./nav-config";

export function PageStepBanner() {
  const pathname = usePathname();
  const step = getWorkflowStep(pathname);

  if (!step || pathname === "/") return null;

  return (
    <div className="mb-4 rounded-xl border border-dashed border-[var(--color-primary)]/35 bg-[var(--color-primary)]/5 px-4 py-3">
      <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-primary)]">
        Step {step.step} · {step.label}
      </p>
      <p className="mt-1 text-sm leading-relaxed text-[var(--color-foreground)]">
        {step.description}
      </p>
    </div>
  );
}
