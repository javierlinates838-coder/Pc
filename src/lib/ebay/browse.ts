import { getEbayAccessToken } from "./auth";
import {
  EBAY_CATEGORY_DESKTOPS,
  EBAY_CATEGORY_PC_PARTS,
  EBAY_MARKETPLACE_ID,
  getEbayApiBase,
} from "./config";
import type { EbayListingSummary } from "./types";

interface EbaySearchResponse {
  total?: number;
  itemSummaries?: Array<{
    itemId?: string;
    title?: string;
    price?: { value?: string; currency?: string };
    condition?: string;
    conditionId?: string;
    image?: { imageUrl?: string };
    itemWebUrl?: string;
  }>;
}

export interface EbaySearchOptions {
  query: string;
  limit?: number;
  usedOnly?: boolean;
  minPrice?: number;
  maxPrice?: number;
  /** Full PC builds vs single parts */
  mode?: "pc" | "part";
}

function parseListings(summaries: EbaySearchResponse["itemSummaries"]): EbayListingSummary[] {
  const listings: EbayListingSummary[] = [];

  for (const item of summaries ?? []) {
    const price = parseFloat(item.price?.value ?? "");
    if (!item.title || Number.isNaN(price) || price <= 0) continue;

    listings.push({
      itemId: item.itemId ?? "",
      title: item.title,
      price,
      currency: item.price?.currency ?? "USD",
      condition: item.condition,
      imageUrl: item.image?.imageUrl,
      itemWebUrl: item.itemWebUrl,
    });
  }

  return listings;
}

async function runSearch(
  token: string,
  params: URLSearchParams
): Promise<{ ok: boolean; status: number; summaries: EbaySearchResponse["itemSummaries"] }> {
  const response = await fetch(
    `${getEbayApiBase()}/buy/browse/v1/item_summary/search?${params}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-EBAY-C-MARKETPLACE-ID": EBAY_MARKETPLACE_ID,
        Accept: "application/json",
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    return { ok: false, status: response.status, summaries: [] };
  }

  const data = (await response.json()) as EbaySearchResponse;
  return { ok: true, status: response.status, summaries: data.itemSummaries };
}

export async function searchEbayListings(
  options: EbaySearchOptions
): Promise<EbayListingSummary[]> {
  const token = await getEbayAccessToken();
  const limit = Math.min(Math.max(options.limit ?? 20, 1), 50);

  const filters: string[] = [
    "buyingOptions:{FIXED_PRICE|AUCTION}",
    "priceCurrency:USD",
  ];

  if (options.usedOnly !== false) {
    filters.push("conditionIds:{3000|4000|5000}");
  }

  if (options.minPrice != null || options.maxPrice != null) {
    const min = options.minPrice ?? 0;
    const max = options.maxPrice ?? 5000;
    filters.push(`price:[${min}..${max}]`);
  }

  const baseParams = new URLSearchParams({
    q: options.query,
    limit: String(limit),
    filter: filters.join(","),
  });

  const category =
    options.mode === "part" ? EBAY_CATEGORY_PC_PARTS : EBAY_CATEGORY_DESKTOPS;

  const withCategory = new URLSearchParams(baseParams);
  withCategory.set("category_ids", category);

  let result = await runSearch(token, withCategory);

  if (!result.ok || (result.summaries?.length ?? 0) === 0) {
    const withoutCategory = new URLSearchParams(baseParams);
    const fallback = await runSearch(token, withoutCategory);
    if (fallback.ok && (fallback.summaries?.length ?? 0) > 0) {
      result = fallback;
    } else if (!result.ok) {
      throw new Error(
        `eBay search failed (${result.status}). Try a different search term.`
      );
    }
  }

  return parseListings(result.summaries);
}
