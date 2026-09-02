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
): string {
  const gpu = parts.gpu?.name;
  const cpu = parts.cpu?.name;
  const ram = parts.ram?.name;

  if (mode === "part" && gpu) return gpu;
  if (mode === "part" && cpu) return cpu;

  const tokens: string[] = ["gaming PC"];
  if (gpu) tokens.push(gpu.replace(/NVIDIA |AMD Radeon |GeForce /gi, "").trim());
  if (cpu) tokens.push(cpu.replace(/AMD |Intel /gi, "").trim());
  if (ram) tokens.push(ram);

  return tokens.join(" ").slice(0, 100);
}

export async function fetchEbayComps(
  query: string,
  options?: { limit?: number; minPrice?: number; maxPrice?: number }
): Promise<EbayCompsResult> {
  const environment = getEbayEnvironment();
  const configured = isEbayConfigured();
  const trimmed = query.trim();

  if (!configured) {
    return {
      query: trimmed,
      source: "ebay",
      environment,
      configured: false,
      listingCount: 0,
      prices: [],
      low: 0,
      median: 0,
      high: 0,
      average: 0,
      listings: [],
      fetchedAt: new Date().toISOString(),
      note: "Add EBAY_CLIENT_ID and EBAY_CLIENT_SECRET to enable live comps.",
    };
  }

  if (trimmed.length < 3) {
    return {
      query: trimmed,
      source: "ebay",
      environment,
      configured: true,
      listingCount: 0,
      prices: [],
      low: 0,
      median: 0,
      high: 0,
      average: 0,
      listings: [],
      fetchedAt: new Date().toISOString(),
      note: "Search query too short.",
    };
  }

  const listings = await searchEbayListings({
    query: trimmed,
    limit: options?.limit ?? 24,
    usedOnly: true,
    minPrice: options?.minPrice,
    maxPrice: options?.maxPrice,
  });

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
