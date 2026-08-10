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
} from "@/lib/reseller/analyzer";
import { parseDealListing } from "@/lib/reseller/analyzer";
import { useBuildStore } from "@/lib/inventory/store";
import { formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";

const EXAMPLE_LISTING = `Ryzen 5 3600
RTX 3060 12GB
16GB RAM
250GB SSD
B550 motherboard
Liquid cooled
$450`;

export default function DealAnalyzerPage() {
  const [listing, setListing] = useState(EXAMPLE_LISTING);
  const [analyzed, setAnalyzed] = useState(false);
  const { loadBuild } = useBuildStore();

  const deal = useMemo(
    () => (analyzed ? analyzeDeal(listing) : null),
    [analyzed, listing]
  );

  const parts = useMemo(
    () => (analyzed ? parseDealListing(listing) : {}),
    [analyzed, listing]
  );

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
        description="Paste a listing to get buy/no-buy recommendations"
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Listing Details</CardTitle>
            <CardDescription>
              Paste the full listing text including price
            </CardDescription>
          </CardHeader>
          <Textarea
            value={listing}
            onChange={(e) => {
              setListing(e.target.value);
              setAnalyzed(false);
            }}
            rows={10}
            placeholder="Paste listing here..."
          />
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={handleAnalyze} className="w-full sm:w-auto">
              Analyze Deal
            </Button>
            {analyzed && (
              <Button
                variant="outline"
                onClick={handleLoadBuild}
                className="w-full sm:w-auto"
              >
                Load into Build
              </Button>
            )}
          </div>
        </Card>

        {deal && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <CardTitle>Deal Rating</CardTitle>
                  <DealRatingBadge rating={deal.rating} />
                </div>
              </CardHeader>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    Listing Price
                  </p>
                  <p className="text-xl font-bold">
                    {formatCurrency(deal.listingPrice)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    Est. Market Value
                  </p>
                  <p className="text-xl font-bold">
                    {formatCurrency(deal.estimatedMarketValue)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    Est. Resale Value
                  </p>
                  <p className="text-xl font-bold text-green-400">
                    {formatCurrency(deal.estimatedResaleValue)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    Profit Potential
                  </p>
                  <p
                    className={`text-xl font-bold ${deal.estimatedProfitPotential >= 0 ? "text-green-400" : "text-red-400"}`}
                  >
                    {formatCurrency(deal.estimatedProfitPotential)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    Max Purchase Price
                  </p>
                  <p className="text-lg font-bold">
                    {formatCurrency(deal.maxPurchasePrice)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    Suggested Offer
                  </p>
                  <p className="text-lg font-bold text-[var(--color-primary)]">
                    {formatCurrency(deal.suggestedOfferPrice)}
                  </p>
                </div>
              </div>
            </Card>

            {deal.parsedParts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Detected Parts</CardTitle>
                </CardHeader>
                <div className="flex flex-wrap gap-2">
                  {deal.parsedParts.map((p) => (
                    <Badge key={p} variant="secondary">
                      {p}
                    </Badge>
                  ))}
                </div>
              </Card>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-green-400 text-base">
                    Valuable Parts
                  </CardTitle>
                </CardHeader>
                {deal.valuableParts.length > 0 ? (
                  <ul className="text-sm space-y-1">
                    {deal.valuableParts.map((p) => (
                      <li key={p}>• {p}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-[var(--color-muted-foreground)]">
                    No standout parts detected
                  </p>
                )}
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-amber-400 text-base">
                    Weak Parts
                  </CardTitle>
                </CardHeader>
                {deal.weakParts.length > 0 ? (
                  <ul className="text-sm space-y-1">
                    {deal.weakParts.map((p) => (
                      <li key={p}>• {p}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-[var(--color-muted-foreground)]">
                    No weak parts detected
                  </p>
                )}
              </Card>
            </div>

            {recommendation && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <CardTitle>Reseller Verdict</CardTitle>
                    <VerdictBadge verdict={recommendation.verdict} />
                  </div>
                </CardHeader>
                <ul className="text-sm space-y-1 mb-3">
                  {recommendation.reasons.map((r, i) => (
                    <li key={i}>• {r}</li>
                  ))}
                </ul>
                {upgrades.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">
                      Recommended Upgrades:
                    </p>
                    {upgrades.slice(0, 3).map((u) => (
                      <p
                        key={u.id}
                        className="text-sm text-[var(--color-muted-foreground)]"
                      >
                        • {u.recommendedPart} — Cost{" "}
                        {formatCurrency(u.upgradeCost)}, Resale +$
                        {u.resaleIncreaseMin}–${u.resaleIncreaseMax}
                      </p>
                    ))}
                  </div>
                )}
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
