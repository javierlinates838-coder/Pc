import { getEbayAccessToken } from "./auth";
import {
  EBAY_MARKETPLACE_ID,
  EBAY_PC_CATEGORY_IDS,
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

  const params = new URLSearchParams({
    q: options.query,
    limit: String(limit),
    filter: filters.join(","),
  });

  if (options.mode !== "part") {
    params.set("category_ids", EBAY_PC_CATEGORY_IDS);
  }

  let response = await fetch(
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
    const detail = await response.text();
    throw new Error(`eBay search failed (${response.status}): ${detail}`);
  }

  let data = (await response.json()) as EbaySearchResponse;
  let summaries = data.itemSummaries ?? [];

  // Retry without category filter if PC categories returned nothing
  if (summaries.length === 0 && options.mode === "part") {
    params.delete("category_ids");
    response = await fetch(
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
    if (response.ok) {
      data = (await response.json()) as EbaySearchResponse;
      summaries = data.itemSummaries ?? [];
    }
  }

  const listings: EbayListingSummary[] = [];

  for (const item of summaries) {
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
