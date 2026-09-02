"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { getPlainEnglishDeal } from "@/lib/reseller/deal-plain-english";
import { buildDealProfitLedger } from "@/lib/reseller/deal-math";
import { resolveResaleValuation } from "@/lib/reseller/deal-valuation";
import type { DealRating } from "@/lib/types/reseller";
import { generateListingCopy } from "@/lib/reseller/listing-generator";
import { compareAllPlatforms } from "@/lib/marketplaces/calculate";
import { useBuildStore } from "@/lib/inventory/store";
import { formatCurrency } from "@/lib/utils";
import { componentMapToEntries } from "@/lib/build/helpers";
import { listingHintToCondition } from "@/lib/flip/conditions";
import { FLIP_OTHER_EXPENSES, FLIP_PLATFORM_SHIPPING } from "@/lib/flip/defaults";
import { PageHeader } from "@/components/layout/page-header";
import { DealIntelPanel } from "@/components/deal/deal-intel-panel";
import { ListingGeneratorPanel } from "@/components/deal/listing-generator-panel";
import { PlatformProfitTable } from "@/components/marketplace/platform-profit-table";
import { DealPartsChecklist } from "@/components/deal/deal-parts-checklist";
import { DealVerdictPanel } from "@/components/deal/deal-verdict-panel";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { buildEbaySearchQuery } from "@/lib/ebay/comps";
import { useEbayComps } from "@/hooks/use-ebay-comps";
import { EbayCompsPanel } from "@/components/marketplace/ebay-comps-panel";

const EXAMPLE_LISTING = `Ryzen 5 5600 + RTX 3060 12GB gaming PC
16gb ram, 1tb nvme
B550 motherboard, 750w gold PSU
Liquid cooled — $450 OBO
Local pickup only`;

function ratingFromProfit(netProfit: number, askingPrice: number): DealRating {
  const margin = askingPrice > 0 ? netProfit / askingPrice : 0;
  if (netProfit >= 150 && margin >= 0.25) return "GREAT";
  if (netProfit >= 75 && margin >= 0.15) return "GOOD";
  if (netProfit >= 25) return "FAIR";
  return "BAD";
}

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
  const buildEntries = useMemo(() => componentMapToEntries(parts), [parts]);

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

  const valuation = useMemo(() => {
    if (!readiness.isComplete || buildEntries.length === 0) return null;
    return resolveResaleValuation(
      buildEntries,
      ebayComps?.median,
      ebayComps?.listingCount ?? 0
    );
  }, [buildEntries, ebayComps, readiness.isComplete]);

  const ledger = useMemo(() => {
    if (!deal || !valuation || !readiness.isComplete) return null;
    return buildDealProfitLedger({
      askingPrice: deal.listingPrice,
      resalePrice: valuation.resaleMid,
      localPickup: scrape?.hints.localPickupOnly,
    });
  }, [deal, valuation, readiness.isComplete, scrape?.hints.localPickupOnly]);

  const intel = useMemo(() => {
    if (!scrape || !deal || !readiness.hasParts) return null;
    const resale = valuation?.resaleMid ?? deal.estimatedResaleValue;
    return buildDealIntelligence(parts, scrape, resale, deal.listingPrice);
  }, [scrape, deal, parts, readiness.hasParts, valuation]);

  const platformResults = useMemo(() => {
    if (!deal || !ledger || !readiness.isComplete) return [];
    return compareAllPlatforms({
      salePrice: ledger.resalePrice,
      purchasePrice: deal.listingPrice,
      shippingCost: ledger.shippingPrep,
      otherExpenses: ledger.otherCosts,
    });
  }, [deal, ledger, readiness.isComplete]);

  const generatedListing = useMemo(() => {
    if (!readiness.hasParts) return null;
    return generateListingCopy(parts, "Deal Flip Build");
  }, [parts, readiness.hasParts]);

  const recommendation = useMemo(
    () =>
      deal && ledger && readiness.isComplete
        ? generateResellerRecommendation(parts, deal.listingPrice)
        : null,
    [deal, parts, ledger, readiness.isComplete]
  );

  const plainEnglish = useMemo(() => {
    if (!deal || !ledger) {
      return getPlainEnglishDeal({
        rating: "FAIR",
        profitAfterFees: 0,
        askingPrice: 0,
        resalePrice: 0,
        isComplete: false,
        foundCount: 0,
        missingCount: readiness.missingParts.length,
      });
    }
    return getPlainEnglishDeal({
      rating: ratingFromProfit(ledger.netProfit, deal.listingPrice),
      profitAfterFees: ledger.netProfit,
      askingPrice: deal.listingPrice,
      resalePrice: ledger.resalePrice,
      isComplete: readiness.isComplete,
      foundCount: deal.parsedParts.length,
      missingCount: readiness.missingParts.length,
    });
  }, [deal, ledger, readiness]);

  const isParsing = listing !== debouncedListing;
  const bestPlatform = platformResults[0];

  const loadSession = () => {
    if (!scrape || !deal) return;
    loadBuild(parts, {
      name: "Deal Analysis Build",
      defaultCondition: listingHintToCondition(scrape.hints.condition),
      costs: {
        purchasePrice: deal.listingPrice,
        targetSellingPrice: valuation?.resaleMid ?? deal.estimatedResaleValue,
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
        description="Paste a Facebook or eBay ad — we'll read the parts, do the math, and tell you in plain English if it's worth buying."
      />

      {!hasListingInput && !isParsing && (
        <Card className="border-dashed border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5">
          <CardHeader>
            <CardTitle className="text-base">How this works</CardTitle>
            <CardDescription className="space-y-2 text-sm leading-relaxed">
              <span className="block">
                <strong>1.</strong> Paste the seller&apos;s full listing below
              </span>
              <span className="block">
                <strong>2.</strong> We match the CPU, GPU, RAM, and other parts
              </span>
              <span className="block">
                <strong>3.</strong> We compare the asking price to resale value
                and tell you if you&apos;d profit or lose money
              </span>
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <Card className="neon-border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[var(--color-primary)]" />
            <CardTitle>Paste the listing here</CardTitle>
          </div>
          <CardDescription>
            Copy everything from the ad — specs, price, &quot;$650 OBO&quot;, all
            of it. The more detail, the more accurate we are.
          </CardDescription>
        </CardHeader>
        <Textarea
          value={listing}
          onChange={(e) => setListing(e.target.value)}
          rows={10}
          placeholder={`Example:\nRyzen 5 5600, RTX 3060 12GB\n16GB RAM, 1TB SSD\n$450 OBO`}
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
              Reading listing…
            </span>
          )}
          {!isParsing && readiness.hasParts && deal && (
            <span className="text-xs text-[var(--color-success)]">
              {deal.parsedParts.length} part
              {deal.parsedParts.length === 1 ? "" : "s"} found
              {!readiness.hasPrice && " · add the asking price"}
              {readiness.hasPrice &&
                !readiness.isComplete &&
                " · need more specs for full verdict"}
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

      {hasListingInput && !isParsing && !readiness.hasParts && (
        <Card className="border-dashed border-amber-500/30">
          <CardHeader>
            <CardTitle className="text-base">Couldn&apos;t read any parts</CardTitle>
            <CardDescription>
              Try including model names like &quot;RTX 3060&quot; or &quot;Ryzen 5
              5600&quot;, plus the asking price.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {readiness.hasParts && deal && (
        <DealPartsChecklist
          found={readiness.foundParts}
          missing={readiness.missingParts}
          partBreakdown={buildEntries}
          parsedNames={deal.parsedParts}
        />
      )}

      {deal && readiness.hasParts && (
        <DealVerdictPanel
          plain={plainEnglish}
          ledger={ledger}
          valuation={valuation}
          showMath={readiness.isComplete && readiness.hasPrice}
        />
      )}

      {readiness.hasParts && readiness.hasPrice && !readiness.isComplete && deal && (
        <Card className="border-dashed border-amber-500/40 bg-amber-500/5">
          <CardHeader>
            <CardTitle className="text-base">Why no full verdict yet?</CardTitle>
            <CardDescription>
              {incompleteListingMessage(
                deal.parsedParts,
                readiness.missingParts
              )}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {readiness.hasParts && deal && (
        <div className="space-y-3">
          {ebaySearch && readiness.isComplete && (
            <EbayCompsPanel
              query={ebaySearch.query}
              data={ebayComps}
              loading={ebayLoading}
              error={ebayError}
              localEstimate={valuation?.localMid ?? deal.estimatedResaleValue}
              onRefresh={refetchEbay}
            />
          )}

          {readiness.isComplete && platformResults.length > 0 && (
            <CollapsibleBlock
              title="Where to sell it"
              subtitle="Compare profit on Facebook, eBay, OfferUp, and more"
            >
              <PlatformProfitTable results={platformResults} />
            </CollapsibleBlock>
          )}

          {intel &&
            readiness.isComplete &&
            (intel.redFlags.length > 0 ||
              intel.inspectionChecklist.length > 0) && (
              <CollapsibleBlock
                title="Before you buy — check these"
                subtitle={
                  intel.redFlags.length > 0
                    ? `${intel.redFlags.length} thing(s) to verify in person`
                    : "Inspection checklist"
                }
              >
                <DealIntelPanel intel={intel} compact />
              </CollapsibleBlock>
            )}

          {generatedListing && readiness.isComplete && (
            <CollapsibleBlock
              title="Resale listing copy"
              subtitle="Paste this when you re-list the PC"
            >
              <ListingGeneratorPanel listing={generatedListing} />
            </CollapsibleBlock>
          )}

          {readiness.hasParts && !readiness.isComplete && deal && valuation && (
            <p className="text-center text-xs text-[var(--color-muted-foreground)]">
              Parts value so far: {formatCurrency(valuation.localMid)} — add more
              specs for a full recommendation.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
