export type EbayEnvironment = "sandbox" | "production";

export interface EbayListingSummary {
  itemId: string;
  title: string;
  price: number;
  currency: string;
  condition?: string;
  imageUrl?: string;
  itemWebUrl?: string;
}

export interface EbayCompsResult {
  query: string;
  source: "ebay";
  environment: EbayEnvironment;
  configured: boolean;
  listingCount: number;
  prices: number[];
  low: number;
  median: number;
  high: number;
  average: number;
  listings: EbayListingSummary[];
  fetchedAt: string;
  note?: string;
}

export interface EbayStatus {
  configured: boolean;
  environment: EbayEnvironment;
  message: string;
}
