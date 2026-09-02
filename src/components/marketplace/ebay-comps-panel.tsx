"use client";

import { ExternalLink, Loader2, RefreshCw } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { EbayCompsResult } from "@/lib/ebay/types";
import { Button } from "@/components/ui/button";

interface EbayCompsPanelProps {
  query: string;
  data: EbayCompsResult | null;
  loading: boolean;
  error: string | null;
  localEstimate?: number;
  className?: string;
  onRefresh?: () => void;
}

export function EbayCompsPanel({
  query,
  data,
  loading,
  error,
  localEstimate,
  className,
  onRefresh,
}: EbayCompsPanelProps) {
  if (!query.trim()) return null;

  const hasListings = (data?.listingCount ?? 0) > 0;
  const delta =
    localEstimate && data?.median
      ? data.median - localEstimate
      : null;

  return (
    <div className={cn("glass-panel rounded-2xl p-4 sm:p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-primary)]">
            eBay live comps
          </p>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
            Used listings for &quot;{query}&quot;
          </p>
        </div>
        {onRefresh && (
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          </Button>
        )}
      </div>

      {loading && !data && (
        <div className="mt-4 flex items-center gap-2 text-sm text-[var(--color-muted-foreground)]">
          <Loader2 className="h-4 w-4 animate-spin text-[var(--color-primary)]" />
          Pulling eBay market data…
        </div>
      )}

      {error && (
        <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
          {error}
        </p>
      )}

      {data && !data.configured && (
        <p className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          {data.note} Add keys in Settings → Live APIs.
        </p>
      )}

      {data && data.configured && (
        <>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Low" value={formatCurrency(data.low)} />
            <Stat
              label="Median"
              value={formatCurrency(data.median)}
              accent="primary"
              hero
            />
            <Stat label="High" value={formatCurrency(data.high)} />
            <Stat label="Avg" value={formatCurrency(data.average)} />
          </div>

          {localEstimate != null && localEstimate > 0 && delta != null && (
            <p className="mt-3 text-xs text-[var(--color-muted-foreground)]">
              Local estimate: {formatCurrency(localEstimate)}
              {" · "}
              <span
                className={
                  delta >= 0
                    ? "text-[var(--color-success)]"
                    : "text-[var(--color-destructive)]"
                }
              >
                eBay median {delta >= 0 ? "+" : ""}
                {formatCurrency(delta)}
              </span>
            </p>
          )}

          {data.note && (
            <p className="mt-2 text-[10px] text-[var(--color-muted-foreground)]">
              {data.note}
            </p>
          )}

          {hasListings && (
            <div className="mt-4 space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)]">
                Sample listings ({data.listingCount})
              </p>
              {data.listings.map((listing) => (
                <a
                  key={listing.itemId || listing.title}
                  href={listing.itemWebUrl ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-secondary)]/30 px-3 py-2 text-xs transition-colors hover:border-[var(--color-primary)]/40"
                >
                  <span className="line-clamp-1 flex-1">{listing.title}</span>
                  <span className="shrink-0 font-bold tabular-nums text-[var(--color-primary)]">
                    {formatCurrency(listing.price)}
                  </span>
                  <ExternalLink className="h-3 w-3 shrink-0 opacity-50" />
                </a>
              ))}
            </div>
          )}

          {!hasListings && !loading && !error && (
            <p className="mt-4 text-sm text-[var(--color-muted-foreground)]">
              No used listings found. Try a broader search or check sandbox data.
            </p>
          )}
        </>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
  hero,
}: {
  label: string;
  value: string;
  accent?: "primary";
  hero?: boolean;
}) {
  return (
    <div className="rounded-xl bg-[var(--color-secondary)]/40 p-3">
      <p className="text-[9px] uppercase tracking-wide text-[var(--color-muted-foreground)]">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 font-bold tabular-nums",
          hero ? "text-xl sm:text-2xl" : "text-base",
          accent === "primary" && "text-[var(--color-primary)]"
        )}
      >
        {value}
      </p>
    </div>
  );
}
