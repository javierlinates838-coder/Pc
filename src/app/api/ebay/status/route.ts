import { NextResponse } from "next/server";
import { getEbayEnvironment, isEbayConfigured } from "@/lib/ebay/config";
import type { EbayStatus } from "@/lib/ebay/types";

export const runtime = "nodejs";

export async function GET() {
  const configured = isEbayConfigured();
  const environment = getEbayEnvironment();

  const status: EbayStatus = {
    configured,
    environment,
    message: configured
      ? environment === "sandbox"
        ? "Connected to eBay Sandbox — test listings only."
        : "Connected to eBay Production — live market data."
      : "Add EBAY_CLIENT_ID and EBAY_CLIENT_SECRET to your environment.",
  };

  return NextResponse.json(status);
}
