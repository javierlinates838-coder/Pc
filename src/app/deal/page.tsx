"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  analyzeDeal,
  generateResellerRecommendation,
  scrapeListingText,
} from "@/lib/reseller/analyzer";
import { buildDealIntelligence } from "@/lib/reseller/deal-intelligence";
import {
  getDealReadiness,
  getEmptyDealReadiness,
  incompleteListingMessage,
} from "@/lib/reseller/deal-readiness";
import { generateListingCopy } from "@/lib/reseller/listing-generator";
import { compareAllPlatforms } from "@/lib/marketplaces/calculate";
import { useBuildStore } from "@/lib/inventory/store";
import { formatCurrency } from "@/lib/utils";
import { listingHintToCondition } from "@/lib/flip/conditions";
import { FLIP_OTHER_EXPENSES, FLIP_PLATFORM_SHIPPING } from "@/lib/flip/defaults";
import { PageHeader } from "@/components/layout/page-header";
import { DealIntelPanel } from "@/components/deal/deal-intel-panel";
import { ListingGeneratorPanel } from "@/components/deal/listing-generator-panel";
import { PlatformProfitTable } from "@/components/marketplace/platform-profit-table";
import { FlipVerdictHero } from "@/components/shared/flip-verdict-hero";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { buildEbaySearchQuery } from "@/lib/ebay/comps";
import { useEbayComps } from "@/hooks/use-ebay-comps";
import { EbayCompsPanel } from "@/components/marketplace/ebay-comps-panel";

const EXAMPLE_LISTING = `Ryzen 5 5600 + RTX 3060 12GB gaming PC
16gb ram, 1tb nvme
B550 motherboard, 750w gold PSU
Liquid cooled — $450 OBO
Local pickup only`;

function CollapsibleBlock({
  title,
  subtitle,
  defaultOpen = false,
  children,
}: {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="glass-panel rounded-2xl">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
      >
        <div>
          <p className="text-sm font-semibold">{title}</p>
          {subtitle && (
            <p className="text-[10px] text-[var(--color-muted-foreground)]">
              {subtitle}
            </p>
          )}
        </div>
        {open ? (
          <ChevronUp className="h-5 w-5 shrink-0 text-[var(--color-muted-foreground)]" />
        ) : (
          <ChevronDown className="h-5 w-5 shrink-0 text-[var(--color-muted-foreground)]" />
        )}
      </button>
      {open && (
        <div className="border-t border-[var(--color-border)] p-4">{children}</div>
      )}
    </div>
  );
}

export default function DealAnalyzerPage() {
  const router = useRouter();
  const [listing, setListing] = useState(() => {
    if (typeof window !== "undefined") {
      const quick = sessionStorage.getItem("pcflip-quick-listing");
      if (quick) {
        sessionStorage.removeItem("pcflip-quick-listing");
        return quick;
      }
    }
    return "";
  });
  const debouncedListing = useDebouncedValue(listing, 450);
  const { loadBuild } = useBuildStore();

  const hasListingInput = debouncedListing.trim().length >= 3;

  const scrape = useMemo(
    () => (hasListingInput ? scrapeListingText(debouncedListing) : null),
    [debouncedListing, hasListingInput]
  );

  const parts = scrape?.parts ?? {};

  const deal = useMemo(
    () => (scrape ? analyzeDeal(debouncedListing, scrape) : null),
    [debouncedListing, scrape]
  );

  const readiness = useMemo(() => {
    if (!deal) return getEmptyDealReadiness();
    return getDealReadiness({
      parts,
      parsedPartCount: deal.parsedParts.length,
      listingPrice: deal.listingPrice,
    });
  }, [deal, parts]);

  const intel = useMemo(() => {
    if (!scrape || !deal || !readiness.hasParts) return null;
    return buildDealIntelligence(
      parts,
      scrape,
      deal.estimatedResaleValue,
      deal.listingPrice
    );
  }, [scrape, deal, parts, readiness.hasParts]);

  const platformResults = useMemo(() => {
    if (!deal || !readiness.isComplete) return [];
    return compareAllPlatforms({
      salePrice: deal.estimatedResaleValue,
      purchasePrice: deal.listingPrice,
      shippingCost: FLIP_PLATFORM_SHIPPING,
      otherExpenses: FLIP_OTHER_EXPENSES,
    });
  }, [deal, readiness.isComplete]);

  const generatedListing = useMemo(() => {
    if (!readiness.hasParts) return null;
    return generateListingCopy(parts, "Deal Flip Build");
  }, [parts, readiness.hasParts]);

  const recommendation = useMemo(
    () =>
      deal && readiness.isComplete
        ? generateResellerRecommendation(parts, deal.listingPrice)
        : null,
    [deal, parts, readiness.isComplete]
  );

  const isParsing = listing !== debouncedListing;
  const bestPlatform = platformResults[0];

  const ebaySearch = useMemo(
    () =>
      readiness.isComplete && readiness.hasCoreComponent
        ? buildEbaySearchQuery(parts)
        : null,
    [parts, readiness.isComplete, readiness.hasCoreComponent]
  );
  const {
    data: ebayComps,
    loading: ebayLoading,
    error: ebayError,
    refetch: refetchEbay,
  } = useEbayComps(ebaySearch?.query ?? "", {
    enabled: Boolean(ebaySearch),
    mode: ebaySearch?.mode,
  });

  const loadSession = () => {
    if (!scrape || !deal) return;
    loadBuild(parts, {
      name: "Deal Analysis Build",
      defaultCondition: listingHintToCondition(scrape.hints.condition),
      costs: {
        purchasePrice: deal.listingPrice,
        targetSellingPrice: readiness.isComplete
          ? deal.estimatedResaleValue
          : 0,
        shippingCosts: FLIP_PLATFORM_SHIPPING,
        otherExpenses: FLIP_OTHER_EXPENSES,
      },
      inventoryId: null,
    });
  };

  const handleLoadBuild = () => {
    loadSession();
    router.push("/build");
  };

  const handleOpenProfit = () => {
    loadSession();
    router.push("/profit");
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        title="Deal Scanner"
        description="Paste any listing — parts, price, and profit update live as you type."
      />

      {!hasListingInput && !isParsing && (
        <Card className="border-dashed border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5">
          <CardHeader>
            <CardTitle className="text-base">Paste a listing to start</CardTitle>
            <CardDescription>
              Copy the full ad from Facebook, eBay, or Craigslist — include CPU,
              GPU, RAM, storage, and the asking price. Or tap &quot;Try sample
              listing&quot; below.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {readiness.isComplete && deal && recommendation && (
        <FlipVerdictHero
          rating={deal.rating}
          verdict={recommendation.verdict}
          askingPrice={deal.listingPrice}
          resalePrice={deal.estimatedResaleValue}
          profitAfterFees={deal.estimatedProfitPotential}
          offerPrice={deal.suggestedOfferPrice}
          bestPlatform={bestPlatform?.shortName}
          reason={recommendation.reasons[0]}
        />
      )}

      {readiness.hasParts && readiness.hasPrice && !readiness.isComplete && deal && (
        <Card className="border-dashed border-amber-500/40 bg-amber-500/5">
          <CardHeader>
            <CardTitle className="text-base">Incomplete listing detected</CardTitle>
            <CardDescription>
              {incompleteListingMessage(deal.parsedParts)}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {readiness.hasParts && !readiness.hasPrice && deal && (
        <Card className="border-dashed border-sky-500/30 bg-sky-500/5">
          <CardHeader>
            <CardTitle className="text-base">Parts found — add a price</CardTitle>
            <CardDescription>
              Matched {deal.parsedParts.length} part
              {deal.parsedParts.length === 1 ? "" : "s"}. Include the asking
              price in the listing (e.g. $450 or $450 OBO) to see profit and
              offer math.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6">
        <Card className="neon-border">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[var(--color-primary)]" />
              <CardTitle>Paste listing</CardTitle>
            </div>
            <CardDescription>
              Facebook, eBay, Craigslist — we read $ amounts and match parts
              automatically.
            </CardDescription>
          </CardHeader>
          <Textarea
            value={listing}
            onChange={(e) => setListing(e.target.value)}
            rows={12}
            placeholder="Paste Facebook, eBay, Craigslist listing..."
            className="font-mono text-xs sm:text-sm"
          />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setListing(EXAMPLE_LISTING)}
            >
              Try sample listing
            </Button>
            {listing.trim().length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setListing("")}
              >
                Clear
              </Button>
            )}
            {isParsing && (
              <span className="text-xs text-[var(--color-muted-foreground)]">
                Analyzing…
              </span>
            )}
            {!isParsing && readiness.hasParts && deal && (
              <span className="text-xs text-[var(--color-success)]">
                {deal.parsedParts.length} parts matched
                {!readiness.hasPrice && " · add a price ($450) for profit math"}
                {readiness.hasPrice &&
                  !readiness.isComplete &&
                  " · add CPU/GPU for full verdict"}
              </span>
            )}
          </div>
          {readiness.hasParts && (
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <Button onClick={handleLoadBuild} className="w-full sm:w-auto">
                Open in 3D builder
              </Button>
              <Button
                variant="outline"
                onClick={handleOpenProfit}
                className="w-full sm:w-auto"
                disabled={!readiness.isComplete}
              >
                Profit calculator
              </Button>
            </div>
          )}
        </Card>

        <div className="space-y-4">
          {readiness.hasParts && deal ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {readiness.isComplete ? "Quick verdict" : "Parts detected"}
                </CardTitle>
                <CardDescription>
                  {readiness.isComplete && bestPlatform
                    ? `${bestPlatform.shortName} nets ${formatCurrency(bestPlatform.netProfit)} after real fees`
                    : readiness.isComplete
                      ? "Profit uses platform-specific fees, not a flat 10%"
                      : readiness.hasPrice && !readiness.hasCoreComponent
                        ? "Add a CPU or GPU to the listing for accurate resale math"
                        : readiness.hasPrice
                          ? "Add more specs (CPU, GPU, RAM) for a reliable verdict"
                          : "Add asking price (e.g. $450) to see profit and offer"}
                </CardDescription>
              </CardHeader>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-[var(--color-secondary)]/50 p-3">
                  <p className="text-[10px] uppercase tracking-wide text-[var(--color-muted-foreground)]">
                    Parts value
                  </p>
                  <p className="mt-1 font-bold tabular-nums">
                    {formatCurrency(deal.estimatedResaleValue)}
                  </p>
                  {!readiness.isComplete && (
                    <p className="mt-1 text-[10px] text-amber-400/90">
                      Estimate only — paste full listing
                    </p>
                  )}
                </div>
                <div className="rounded-xl bg-[var(--color-secondary)]/50 p-3">
                  <p className="text-[10px] uppercase tracking-wide text-[var(--color-muted-foreground)]">
                    {readiness.isComplete ? "Margin" : "Asking price"}
                  </p>
                  <p
                    className={`mt-1 font-bold tabular-nums ${
                      readiness.isComplete
                        ? deal.estimatedProfitPotential >= 0
                          ? "text-[var(--color-success)]"
                          : "text-[var(--color-destructive)]"
                        : "text-[var(--color-muted-foreground)]"
                    }`}
                  >
                    {readiness.isComplete
                      ? `${deal.estimatedProfitPotential >= 0 ? "+" : ""}${formatCurrency(deal.estimatedProfitPotential)}`
                      : readiness.hasPrice
                        ? formatCurrency(deal.listingPrice)
                        : "—"}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {deal.parsedParts.map((p) => (
                  <Badge key={p} variant="secondary">
                    {p}
                  </Badge>
                ))}
              </div>
            </Card>
          ) : hasListingInput && !isParsing ? (
            <Card className="border-dashed border-amber-500/30">
              <CardHeader>
                <CardTitle className="text-base">No parts matched</CardTitle>
                <CardDescription>
                  Try &quot;rtx 3060&quot;, &quot;ryzen 5 5600&quot;, or paste a
                  fuller listing with specs and price.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <Card className="border-dashed border-[var(--color-primary)]/25">
              <CardHeader>
                <CardTitle className="text-base">Waiting for listing</CardTitle>
                <CardDescription>
                  Paste an ad — even short text like &quot;3050 ti 8gb&quot; or
                  &quot;RTX 3060 $400&quot; works.
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>
      </div>

      {readiness.hasParts && deal && (
        <div className="space-y-3">
          {ebaySearch && readiness.isComplete && (
            <EbayCompsPanel
              query={ebaySearch.query}
              data={ebayComps}
              loading={ebayLoading}
              error={ebayError}
              localEstimate={deal.estimatedResaleValue}
              onRefresh={refetchEbay}
            />
          )}

          <CollapsibleBlock
            title="Detected parts"
            subtitle={
              deal.parsedParts.length > 0
                ? `${deal.parsedParts.length} parts matched`
                : "No parts detected — check listing text"
            }
            defaultOpen={!readiness.isComplete}
          >
            {deal.parsedParts.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {deal.parsedParts.map((p) => (
                  <Badge key={p} variant="secondary">
                    {p}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[var(--color-muted-foreground)]">
                We couldn&apos;t match parts. Try spelling out CPU/GPU models or
                use shorthand like &quot;rtx 3060&quot; and &quot;16gb ram&quot;.
              </p>
            )}
            {scrape && scrape.unparsedLines.length > 0 && (
              <p className="mt-3 text-xs text-amber-400/90">
                Not matched: {scrape.unparsedLines.join(" · ")}
              </p>
            )}
          </CollapsibleBlock>

          {readiness.isComplete && platformResults.length > 0 && (
            <CollapsibleBlock
              title="Sell on which platform?"
              subtitle={`${platformResults.length} channels compared`}
            >
              <PlatformProfitTable results={platformResults} />
            </CollapsibleBlock>
          )}

          {intel &&
            readiness.isComplete &&
            (intel.redFlags.length > 0 ||
              intel.inspectionChecklist.length > 0) && (
              <CollapsibleBlock
                title="Warnings & inspection"
                subtitle={
                  intel.redFlags.length > 0
                    ? `${intel.redFlags.length} thing(s) to verify`
                    : "Checklist before you buy"
                }
              >
                <DealIntelPanel intel={intel} compact />
              </CollapsibleBlock>
            )}

          {generatedListing && readiness.isComplete && (
            <CollapsibleBlock
              title="Listing copy"
              subtitle="Title and description to paste when you resell"
            >
              <ListingGeneratorPanel listing={generatedListing} />
            </CollapsibleBlock>
          )}
        </div>
      )}
    </div>
  );
}
