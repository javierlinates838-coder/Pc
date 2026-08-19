"use client";

import { useState, useMemo } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DealRatingBadge, VerdictBadge } from "@/components/ui/status-badge";
import {
  analyzeDeal,
  generateResellerRecommendation,
  getUpgradeRecommendations,
  scrapeListingText,
} from "@/lib/reseller/analyzer";
import { buildDealIntelligence } from "@/lib/reseller/deal-intelligence";
import { generateListingCopy } from "@/lib/reseller/listing-generator";
import { compareAllPlatforms } from "@/lib/marketplaces/calculate";
import { useBuildStore } from "@/lib/inventory/store";
import { formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
import { DealIntelPanel } from "@/components/deal/deal-intel-panel";
import { ListingGeneratorPanel } from "@/components/deal/listing-generator-panel";
import { PlatformProfitTable } from "@/components/marketplace/platform-profit-table";

const EXAMPLE_LISTING = `Ryzen 5 5600 + RTX 3060 12GB gaming PC
16gb ram, 1tb nvme
B550 motherboard, 750w gold PSU
Liquid cooled — $450 OBO
Local pickup only`;

export default function DealAnalyzerPage() {
  const [listing, setListing] = useState(EXAMPLE_LISTING);
  const [analyzed, setAnalyzed] = useState(false);
  const { loadBuild } = useBuildStore();

  const scrape = useMemo(
    () => (analyzed ? scrapeListingText(listing) : null),
    [analyzed, listing]
  );

  const parts = scrape?.parts ?? {};
  const deal = useMemo(
    () => (analyzed ? analyzeDeal(listing) : null),
    [analyzed, listing]
  );

  const intel = useMemo(() => {
    if (!analyzed || !scrape || !deal) return null;
    return buildDealIntelligence(
      parts,
      scrape,
      deal.estimatedResaleValue,
      deal.listingPrice
    );
  }, [analyzed, scrape, deal, parts]);

  const platformResults = useMemo(() => {
    if (!deal) return [];
    return compareAllPlatforms({
      salePrice: deal.estimatedResaleValue,
      purchasePrice: deal.listingPrice,
      shippingCost: 25,
      otherExpenses: 15,
    });
  }, [deal]);

  const generatedListing = useMemo(() => {
    if (!analyzed || Object.keys(parts).length === 0) return null;
    return generateListingCopy(parts, "Deal Flip Build");
  }, [analyzed, parts]);

  const recommendation = useMemo(
    () =>
      analyzed && deal
        ? generateResellerRecommendation(parts, deal.listingPrice)
        : null,
    [analyzed, deal, parts]
  );

  const upgrades = useMemo(
    () => (analyzed ? getUpgradeRecommendations(parts) : []),
    [analyzed, parts]
  );

  const handleAnalyze = () => setAnalyzed(true);

  const handleLoadBuild = () => {
    loadBuild(parts, "Deal Analysis Build");
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        title="Deal Analyzer"
        description="Smart listing scraper — expands shorthand, flags mining/OEM risk, compares 12 platforms"
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Paste listing</CardTitle>
            <CardDescription>
              URLs stripped · i5/rtx/16gb shorthand expanded · red flags detected
            </CardDescription>
          </CardHeader>
          <Textarea
            value={listing}
            onChange={(e) => {
              setListing(e.target.value);
              setAnalyzed(false);
            }}
            rows={12}
            placeholder="Paste Facebook, eBay, Craigslist listing..."
            className="font-mono text-xs sm:text-sm"
          />
          {scrape && scrape.expandedTokens.length > 0 && analyzed && (
            <p className="mt-2 text-[10px] text-[var(--color-muted-foreground)]">
              Parsed tokens: {scrape.expandedTokens.slice(0, 8).join(", ")}
            </p>
          )}
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <Button onClick={handleAnalyze} className="w-full sm:w-auto">
              Scrape & analyze
            </Button>
            {analyzed && (
              <Button
                variant="outline"
                onClick={handleLoadBuild}
                className="w-full sm:w-auto"
              >
                Load into 3D build
              </Button>
            )}
          </div>
        </Card>

        {deal && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <CardTitle>Deal rating</CardTitle>
                  <DealRatingBadge rating={deal.rating} />
                </div>
              </CardHeader>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    Listing price
                  </p>
                  <p className="text-xl font-bold tabular-nums">
                    {formatCurrency(deal.listingPrice)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    Est. resale
                  </p>
                  <p className="text-xl font-bold tabular-nums text-[var(--color-success)]">
                    {formatCurrency(deal.estimatedResaleValue)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    Profit potential
                  </p>
                  <p
                    className={`text-xl font-bold tabular-nums ${deal.estimatedProfitPotential >= 0 ? "text-[var(--color-success)]" : "text-[var(--color-destructive)]"}`}
                  >
                    {formatCurrency(deal.estimatedProfitPotential)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    Suggested offer
                  </p>
                  <p className="text-lg font-bold text-[var(--color-primary)]">
                    {formatCurrency(deal.suggestedOfferPrice)}
                  </p>
                </div>
              </div>
            </Card>

            {platformResults.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Best platform for this flip
                  </CardTitle>
                  <CardDescription>
                    Real fee math — beats single % calculators
                  </CardDescription>
                </CardHeader>
                <PlatformProfitTable results={platformResults} />
              </Card>
            )}

            {deal.parsedParts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Detected parts</CardTitle>
                </CardHeader>
                <div className="flex flex-wrap gap-2">
                  {deal.parsedParts.map((p) => (
                    <Badge key={p} variant="secondary">{p}</Badge>
                  ))}
                </div>
                {scrape && scrape.unparsedLines.length > 0 && (
                  <p className="mt-3 text-xs text-amber-400/90">
                    Unparsed: {scrape.unparsedLines.join(" · ")}
                  </p>
                )}
              </Card>
            )}

            {recommendation && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-base">Verdict</CardTitle>
                    <VerdictBadge verdict={recommendation.verdict} />
                  </div>
                </CardHeader>
                <ul className="mb-3 space-y-1 text-sm">
                  {recommendation.reasons.map((r, i) => (
                    <li key={i}>• {r}</li>
                  ))}
                </ul>
                {upgrades.length > 0 && (
                  <div className="text-xs text-[var(--color-muted-foreground)]">
                    Top upgrade: {upgrades[0].recommendedPart}
                  </div>
                )}
              </Card>
            )}
          </div>
        )}
      </div>

      {intel && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <DealIntelPanel intel={intel} />
          {generatedListing && (
            <ListingGeneratorPanel listing={generatedListing} />
          )}
        </div>
      )}
    </div>
  );
}
