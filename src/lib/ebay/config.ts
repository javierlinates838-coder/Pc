import type { EbayEnvironment } from "./types";

export function getEbayEnvironment(): EbayEnvironment {
  const env = process.env.EBAY_ENVIRONMENT?.toLowerCase();
  return env === "production" ? "production" : "sandbox";
}

export function getEbayClientId(): string | undefined {
  return process.env.EBAY_CLIENT_ID?.trim() || undefined;
}

export function getEbayClientSecret(): string | undefined {
  return process.env.EBAY_CLIENT_SECRET?.trim() || undefined;
}

export function isEbayConfigured(): boolean {
  return Boolean(getEbayClientId() && getEbayClientSecret());
}

export function getEbayApiBase(): string {
  return getEbayEnvironment() === "production"
    ? "https://api.ebay.com"
    : "https://api.sandbox.ebay.com";
}

export const EBAY_MARKETPLACE_ID = "EBAY_US";

/** eBay Browse API allows max 1 category per request */
export const EBAY_CATEGORY_DESKTOPS = "171957";
export const EBAY_CATEGORY_PC_PARTS = "175673";
