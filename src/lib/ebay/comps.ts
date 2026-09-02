import type { ComponentMap } from "@/lib/types/components";
import { getEbayEnvironment, isEbayConfigured } from "./config";
import { searchEbayListings } from "./browse";
import type { EbayCompsResult } from "./types";

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
    : sorted[mid];
}

export function buildEbaySearchQuery(
  parts: ComponentMap,
  mode: "pc" | "part" = "pc"
): { query: string; mode: "pc" | "part" } {
  const gpu = parts.gpu?.name;
  const cpu = parts.cpu?.name;
  const ram = parts.ram?.name;

  if (mode === "part" && gpu) return { query: gpu, mode: "part" };
  if (mode === "part" && cpu) return { query: cpu, mode: "part" };

  const partCount =
    (parts.cpu ? 1 : 0) +
    (parts.gpu ? 1 : 0) +
    (parts.motherboard ? 1 : 0) +
    (parts.ram ? 1 : 0) +
    (parts.psu ? 1 : 0) +
    (parts.storage?.length ?? 0);

  if (partCount <= 2 && gpu) {
    return { query: gpu, mode: "part" };
  }

  const tokens: string[] = ["gaming PC"];
  if (gpu) tokens.push(gpu.replace(/NVIDIA |AMD Radeon |GeForce /gi, "").trim());
  if (cpu) tokens.push(cpu.replace(/AMD |Intel /gi, "").trim());
  if (ram) tokens.push(ram);

  return { query: tokens.join(" ").slice(0, 100), mode: "pc" };
}

export async function fetchEbayComps(
  query: string,
  options?: { limit?: number; minPrice?: number; maxPrice?: number; mode?: "pc" | "part" }
): Promise<EbayCompsResult> {
  const environment = getEbayEnvironment();
  const configured = isEbayConfigured();
  const trimmed = query.trim();

  if (!configured) {
    return emptyCompsResult(
      trimmed,
      environment,
      "Optional — deal math uses our parts database. Add eBay keys in Settings for live market comps."
    );
  }

  if (trimmed.length < 3) {
    return emptyCompsResult(trimmed, environment, "Search query too short.", true);
  }

  let listings;
  try {
    listings = await searchEbayListings({
      query: trimmed,
      limit: options?.limit ?? 24,
      usedOnly: true,
      minPrice: options?.minPrice,
      maxPrice: options?.maxPrice,
      mode: options?.mode,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "eBay comps request failed";
    const authFailed =
      /oauth|invalid_client|not configured|credentials/i.test(message);
    return emptyCompsResult(
      trimmed,
      environment,
      authFailed
        ? "eBay keys found but login failed — check App ID and Cert ID in Vercel env vars (they may be swapped)."
        : `Could not load eBay listings: ${message}`
    );
  }

  const prices = listings.map((l) => l.price).sort((a, b) => a - b);
  const average =
    prices.length > 0
      ? Math.round(prices.reduce((s, p) => s + p, 0) / prices.length)
      : 0;

  return {
    query: trimmed,
    source: "ebay",
    environment,
    configured: true,
    listingCount: listings.length,
    prices,
    low: prices[0] ?? 0,
    median: median(prices),
    high: prices[prices.length - 1] ?? 0,
    average,
    listings: listings.slice(0, 8),
    fetchedAt: new Date().toISOString(),
    note:
      environment === "sandbox"
        ? "Sandbox data — switch EBAY_ENVIRONMENT=production for real listings."
        : "Active eBay listings (used condition). Sold prices may differ.",
  };
}

function emptyCompsResult(
  query: string,
  environment: ReturnType<typeof getEbayEnvironment>,
  note: string,
  configured = false
): EbayCompsResult {
  return {
    query,
    source: "ebay",
    environment,
    configured,
    listingCount: 0,
    prices: [],
    low: 0,
    median: 0,
    high: 0,
    average: 0,
    listings: [],
    fetchedAt: new Date().toISOString(),
    note,
  };
}
