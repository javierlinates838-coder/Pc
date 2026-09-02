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
      state: "not_configured",
      message:
        "Optional — deal math uses our parts database. Add eBay keys for live market comps.",
    };
    return NextResponse.json(status);
  }

  try {
    await getEbayAccessToken();
    const status: EbayStatus = {
      configured: true,
      environment,
      state: "connected",
      message:
        environment === "sandbox"
          ? "Connected to eBay Sandbox — test listings only."
          : "Connected to eBay Production — live market data.",
    };
    return NextResponse.json(status);
  } catch (error) {
    const raw =
      error instanceof Error ? error.message : "eBay authentication failed";
    const status: EbayStatus = {
      configured: false,
      environment,
      state: "auth_failed",
      message: raw.includes("invalid_client")
        ? "Keys found but login failed — double-check App ID (EBAY_CLIENT_ID) and Cert ID (EBAY_CLIENT_SECRET) are not swapped."
        : `Keys found but login failed: ${raw}`,
    };
    return NextResponse.json(status);
  }
}
