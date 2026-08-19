"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DealRatingBadge, VerdictBadge } from "@/components/ui/status-badge";
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
import { PageHeader } from "@/components/layout/page-header";
import { DealIntelPanel } from "@/components/deal/deal-intel-panel";
import { ListingGeneratorPanel } from "@/components/deal/listing-generator-panel";
import { PlatformProfitTable } from "@/components/marketplace/platform-profit-table";

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
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)]">
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
  const [listing, setListing] = useState(EXAMPLE_LISTING);
  const [analyzed, setAnalyzed] = useState(false);
  const { loadBuild } = useBuildStore();

  const scrape = useMemo(
    () => (analyzed ? scrapeListingText(listing) : null),
    [analyzed, listing]
  );

  const parts = scrape?.parts ?? {};
  const deal = useMemo(
    () => (analyzed && scrape ? analyzeDeal(listing, scrape) : null),
    [analyzed, listing, scrape]
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

  const handleAnalyze = () => setAnalyzed(true);

  const handleLoadBuild = () => {
    loadBuild(parts, "Deal Analysis Build");
    router.push("/build");
  };

  const bestPlatform = platformResults[0];

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        title="Deal Analyzer"
        description="Paste a listing — we detect parts, estimate resale, and show profit after fees"
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Paste listing</CardTitle>
            <CardDescription>
              Copy text from Facebook, eBay, or Craigslist. Price is read from $
              amounts in the text.
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
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <Button onClick={handleAnalyze} className="w-full sm:w-auto">
              Analyze deal
            </Button>
            {analyzed && Object.keys(parts).length > 0 && (
              <Button
                variant="outline"
                onClick={handleLoadBuild}
                className="w-full sm:w-auto"
              >
                Open in 3D builder
              </Button>
            )}
          </div>
        </Card>

        {deal && recommendation && (
          <Card className="border-[var(--color-primary)]/25">
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle>Summary</CardTitle>
                <DealRatingBadge rating={deal.rating} />
                <VerdictBadge verdict={recommendation.verdict} />
              </div>
              <CardDescription>
                {bestPlatform
                  ? `Best channel: ${bestPlatform.shortName} (${formatCurrency(bestPlatform.netProfit)} profit after fees)`
                  : "Profit uses real platform fees, not a flat 10%"}
              </CardDescription>
            </CardHeader>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div>
                <p className="text-xs text-[var(--color-muted-foreground)]">
                  What they&apos;re asking
                </p>
                <p className="text-xl font-bold tabular-nums">
                  {formatCurrency(deal.listingPrice)}
                </p>
              </div>
              <div>
                <p className="text-xs text-[var(--color-muted-foreground)]">
                  What you could sell for
                </p>
                <p className="text-xl font-bold tabular-nums text-[var(--color-success)]">
                  {formatCurrency(deal.estimatedResaleValue)}
                </p>
              </div>
              <div>
                <p className="text-xs text-[var(--color-muted-foreground)]">
                  Your profit after fees
                </p>
                <p
                  className={`text-xl font-bold tabular-nums ${deal.estimatedProfitPotential >= 0 ? "text-[var(--color-success)]" : "text-[var(--color-destructive)]"}`}
                >
                  {formatCurrency(deal.estimatedProfitPotential)}
                </p>
              </div>
              <div>
                <p className="text-xs text-[var(--color-muted-foreground)]">
                  Offer to aim for
                </p>
                <p className="text-lg font-bold text-[var(--color-primary)]">
                  {formatCurrency(deal.suggestedOfferPrice)}
                </p>
              </div>
            </div>
            {recommendation.reasons[0] && (
              <p className="mt-3 text-sm text-[var(--color-muted-foreground)]">
                {recommendation.reasons[0]}
              </p>
            )}
          </Card>
        )}
      </div>

      {deal && (
        <div className="space-y-3">
          <CollapsibleBlock
            title="Detected parts"
            subtitle={
              deal.parsedParts.length > 0
                ? `${deal.parsedParts.length} parts matched`
                : "No parts detected — check listing text"
            }
            defaultOpen={true}
          >
            {deal.parsedParts.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {deal.parsedParts.map((p) => (
                  <Badge key={p} variant="secondary">{p}</Badge>
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
              subtitle={`${platformResults.length} channels compared — tap to expand`}
            >
              <PlatformProfitTable results={platformResults} />
            </CollapsibleBlock>
          )}

          {intel && (intel.redFlags.length > 0 || intel.inspectionChecklist.length > 0) && (
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
