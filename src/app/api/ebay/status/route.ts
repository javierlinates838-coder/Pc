import { NextResponse } from "next/server";
import { getEbayEnvironment, isEbayConfigured } from "@/lib/ebay/config";
import { getEbayAccessToken } from "@/lib/ebay/auth";
import type { EbayStatus } from "@/lib/ebay/types";

export const runtime = "nodejs";

export async function GET() {
  const configured = isEbayConfigured();
  const environment = getEbayEnvironment();

  if (!configured) {
    const status: EbayStatus = {
      configured: false,
      environment,
      message: "Add EBAY_CLIENT_ID and EBAY_CLIENT_SECRET to your environment.",
    };
    return NextResponse.json(status);
  }

  try {
    await getEbayAccessToken();
    const status: EbayStatus = {
      configured: true,
      environment,
      message:
        environment === "sandbox"
          ? "Connected to eBay Sandbox — test listings only."
          : "Connected to eBay Production — live market data.",
    };
    return NextResponse.json(status);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "eBay authentication failed";
    const status: EbayStatus = {
      configured: false,
      environment,
      message: `Keys found but auth failed: ${message}`,
    };
    return NextResponse.json(status);
  }
}
