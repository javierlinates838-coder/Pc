"use client";

import { useCallback, useEffect, useState } from "react";
import type { EbayCompsResult } from "@/lib/ebay/types";

interface UseEbayCompsOptions {
  enabled?: boolean;
  minPrice?: number;
  maxPrice?: number;
  mode?: "pc" | "part";
}

export function useEbayComps(
  query: string,
  options: UseEbayCompsOptions = {}
) {
  const { enabled = true, minPrice, maxPrice, mode = "pc" } = options;
  const [data, setData] = useState<EbayCompsResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (!enabled || trimmed.length < 3) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({ q: trimmed, mode });
        if (minPrice != null) params.set("minPrice", String(minPrice));
        if (maxPrice != null) params.set("maxPrice", String(maxPrice));

        const response = await fetch(`/api/ebay/comps?${params}`, {
          signal: controller.signal,
          cache: refreshKey > 0 ? "no-store" : "default",
        });

        if (!response.ok) {
          const body = (await response.json().catch(() => ({}))) as {
            error?: string;
          };
          throw new Error(body.error ?? `Request failed (${response.status})`);
        }

        const result = (await response.json()) as EbayCompsResult;
        if (!cancelled) setData(result);
      } catch (err) {
        if (cancelled || (err instanceof DOMException && err.name === "AbortError")) {
          return;
        }
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load eBay comps");
          setData(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    const timer = setTimeout(load, 500);
    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timer);
    };
  }, [query, enabled, minPrice, maxPrice, mode, refreshKey]);

  return { data, loading, error, refetch };
}
