"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useBuildStore } from "@/lib/inventory/store";
import { getPartCount, componentMapToEntries } from "@/lib/build/helpers";
import { formatCurrency } from "@/lib/utils";
import { estimateFlipResale } from "@/lib/flip/resale";
import { Button } from "@/components/ui/button";

export function ActiveRigBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentBuild, buildName, flipCosts } = useBuildStore();

  const partCount = getPartCount(currentBuild);
  const hasPc = partCount > 0;

  const listEst = hasPc
    ? estimateFlipResale(componentMapToEntries(currentBuild)).mid
    : 0;

  if (pathname === "/" && !hasPc) return null;

  // Deal page has its own scanner UI — avoid conflicting "no PC loaded" banner
  if (pathname === "/deal") return null;

  // Build page: header + visualizer already show rig context — keep bar minimal
  if (pathname === "/build") {
    if (!hasPc) {
      return (
        <div className="mb-3 rounded-xl border border-dashed border-[var(--color-border)] px-3 py-2 text-xs text-[var(--color-muted-foreground)]">
          Pick parts below, or{" "}
          <Link href="/deal" className="text-[var(--color-primary)] underline">
            paste a listing
          </Link>
          {" "}on Deal first.
        </div>
      );
    }
    return (
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-secondary)]/25 px-3 py-2">
        <p className="text-xs text-[var(--color-muted-foreground)]">
          <span className="font-semibold text-[var(--color-foreground)]">
            {partCount} parts
          </span>
          {flipCosts.purchasePrice > 0 && (
            <> · paid {formatCurrency(flipCosts.purchasePrice)}</>
          )}
          {listEst > 0 && <> · list ~{formatCurrency(listEst)}</>}
        </p>
        <Button size="sm" onClick={() => router.push("/profit")}>
          Profit math →
        </Button>
      </div>
    );
  }

  return (
    <div
      className="mb-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-secondary)]/30 px-3 py-2.5 sm:px-4 sm:py-3"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)]">
            {hasPc ? "PC you are working on" : "No PC loaded yet"}
          </p>
          {hasPc ? (
            <p className="truncate text-sm font-semibold">
              {buildName}
              <span className="font-normal text-[var(--color-muted-foreground)]">
                {" "}
                · {partCount} parts
                {flipCosts.purchasePrice > 0 &&
                  ` · paid ${formatCurrency(flipCosts.purchasePrice)}`}
                {listEst > 0 && ` · list ~${formatCurrency(listEst)}`}
              </span>
            </p>
          ) : (
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Start on{" "}
              <Link href="/deal" className="text-[var(--color-primary)] underline">
                Deal
              </Link>
              {" "}to paste a listing, or{" "}
              <Link href="/build" className="text-[var(--color-primary)] underline">
                Build
              </Link>
              {" "}to pick parts manually.
            </p>
          )}
        </div>

        {hasPc && (
          <div className="flex flex-wrap items-center gap-2">
            {pathname !== "/profit" && (
              <Button size="sm" onClick={() => router.push("/profit")}>
                Profit math
              </Button>
            )}
            {pathname !== "/build" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => router.push("/build")}
              >
                Open PC
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
