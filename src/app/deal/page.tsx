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
    return EXAMPLE_LISTING;
  });
  const debouncedListing = useDebouncedValue(listing, 450);
  const { loadBuild } = useBuildStore();

  const scrape = useMemo(
    () =>
      debouncedListing.trim().length > 20
        ? scrapeListingText(debouncedListing)
        : null,
    [debouncedListing]
  );

  const parts = scrape?.parts ?? {};

  const deal = useMemo(
    () => (scrape ? analyzeDeal(debouncedListing, scrape) : null),
    [debouncedListing, scrape]
  );

  const intel = useMemo(() => {
    if (!scrape || !deal) return null;
    return buildDealIntelligence(
      parts,
      scrape,
      deal.estimatedResaleValue,
      deal.listingPrice
    );
  }, [scrape, deal, parts]);

  const platformResults = useMemo(() => {
    if (!deal) return [];
    return compareAllPlatforms({
      salePrice: deal.estimatedResaleValue,
      purchasePrice: deal.listingPrice,
      shippingCost: FLIP_PLATFORM_SHIPPING,
      otherExpenses: FLIP_OTHER_EXPENSES,
    });
  }, [deal]);

  const generatedListing = useMemo(() => {
    if (Object.keys(parts).length === 0) return null;
    return generateListingCopy(parts, "Deal Flip Build");
  }, [parts]);

  const recommendation = useMemo(
    () =>
      deal ? generateResellerRecommendation(parts, deal.listingPrice) : null,
    [deal, parts]
  );

  const isParsing = listing !== debouncedListing;
  const hasAnalysis = deal && recommendation && deal.listingPrice > 0;
  const bestPlatform = platformResults[0];

  const ebayQuery = useMemo(
    () => (Object.keys(parts).length > 0 ? buildEbaySearchQuery(parts) : ""),
    [parts]
  );
  const {
    data: ebayComps,
    loading: ebayLoading,
    error: ebayError,
  } = useEbayComps(ebayQuery, { enabled: Boolean(hasAnalysis) });

  const loadSession = () => {
    if (!scrape || !deal) return;
    loadBuild(parts, {
      name: "Deal Analysis Build",
      defaultCondition: listingHintToCondition(scrape.hints.condition),
      costs: {
        purchasePrice: deal.listingPrice,
        targetSellingPrice: deal.estimatedResaleValue,
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

      {hasAnalysis && (
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
            {isParsing && (
              <span className="text-xs text-[var(--color-muted-foreground)]">
                Analyzing…
              </span>
            )}
            {!isParsing && hasAnalysis && (
              <span className="text-xs text-[var(--color-success)]">
                {deal.parsedParts.length} parts matched
              </span>
            )}
          </div>
          {hasAnalysis && Object.keys(parts).length > 0 && (
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <Button onClick={handleLoadBuild} className="w-full sm:w-auto">
                Open in 3D builder
              </Button>
              <Button
                variant="outline"
                onClick={handleOpenProfit}
                className="w-full sm:w-auto"
              >
                Profit calculator
              </Button>
            </div>
          )}
        </Card>

        <div className="space-y-4">
          {hasAnalysis ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick verdict</CardTitle>
                <CardDescription>
                  {bestPlatform
                    ? `${bestPlatform.shortName} nets ${formatCurrency(bestPlatform.netProfit)} after real fees`
                    : "Profit uses platform-specific fees, not a flat 10%"}
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
                </div>
                <div className="rounded-xl bg-[var(--color-secondary)]/50 p-3">
                  <p className="text-[10px] uppercase tracking-wide text-[var(--color-muted-foreground)]">
                    Margin
                  </p>
                  <p
                    className={`mt-1 font-bold tabular-nums ${deal.estimatedProfitPotential >= 0 ? "text-[var(--color-success)]" : "text-[var(--color-destructive)]"}`}
                  >
                    {deal.estimatedProfitPotential >= 0 ? "+" : ""}
                    {formatCurrency(deal.estimatedProfitPotential)}
                  </p>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="border-dashed border-[var(--color-primary)]/25">
              <CardHeader>
                <CardTitle className="text-base">Waiting for listing</CardTitle>
                <CardDescription>
                  Paste an ad on the left. Verdict, parts, and platform profit
                  appear here instantly.
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          {deal && deal.parsedParts.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {deal.parsedParts.map((p) => (
                <Badge key={p} variant="secondary">
                  {p}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {deal && (
        <div className="space-y-3">
          {ebayQuery && (
            <EbayCompsPanel
              query={ebayQuery}
              data={ebayComps}
              loading={ebayLoading}
              error={ebayError}
              localEstimate={deal.estimatedResaleValue}
            />
          )}

          <CollapsibleBlock
            title="Detected parts"
            subtitle={
              deal.parsedParts.length > 0
                ? `${deal.parsedParts.length} parts matched`
                : "No parts detected — check listing text"
            }
            defaultOpen={deal.parsedParts.length > 0}
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

          {platformResults.length > 0 && (
            <CollapsibleBlock
              title="Sell on which platform?"
              subtitle={`${platformResults.length} channels compared`}
            >
              <PlatformProfitTable results={platformResults} />
            </CollapsibleBlock>
          )}

          {intel &&
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

          {generatedListing && (
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
