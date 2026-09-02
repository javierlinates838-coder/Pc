import { NextRequest, NextResponse } from "next/server";
import { fetchEbayComps } from "@/lib/ebay/comps";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();
  const minPrice = request.nextUrl.searchParams.get("minPrice");
  const maxPrice = request.nextUrl.searchParams.get("maxPrice");

  if (!q) {
    return NextResponse.json({ error: "Missing query parameter q" }, { status: 400 });
  }

  try {
    const result = await fetchEbayComps(q, {
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
    });

    return NextResponse.json(result, {
      headers: { "Cache-Control": "private, max-age=300" },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "eBay comps request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
