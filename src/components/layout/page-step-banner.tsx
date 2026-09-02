"use client";

import { usePathname } from "next/navigation";
import { getWorkflowStep } from "./nav-config";

/** Hide on pages that already show step context in the page body */
const HIDE_ON = ["/build", "/profit", "/deal"];

export function PageStepBanner() {
  const pathname = usePathname();
  const step = getWorkflowStep(pathname);

  if (!step || pathname === "/" || HIDE_ON.includes(pathname)) return null;

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
