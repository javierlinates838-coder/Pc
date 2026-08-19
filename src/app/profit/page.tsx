"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  useBuildStore,
  useInventoryStore,
  useSettingsStore,
} from "@/lib/inventory/store";
import { calculateProfit } from "@/lib/reseller/profit";
import { compareAllPlatforms } from "@/lib/marketplaces/calculate";
import { PlatformProfitTable } from "@/components/marketplace/platform-profit-table";
import { componentMapToEntries, getPartCount } from "@/lib/build/helpers";
import { estimateFlipResale } from "@/lib/flip/resale";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
import type { ResellerCosts } from "@/lib/types/reseller";

export default function ProfitCalculatorPage() {
  const router = useRouter();
  const {
    currentBuild,
    conditions,
    buildName,
    flipCosts,
    setFlipCosts,
    activeInventoryId,
    updateActiveInventory,
  } = useBuildStore();
  const { addPC } = useInventoryStore();
  const { defaultMarketplaceFee, defaultShippingCost } = useSettingsStore();

  const partCount = getPartCount(currentBuild);
  const entries = useMemo(
    () => componentMapToEntries(currentBuild, conditions),
    [currentBuild, conditions]
  );
  const suggestedSale = useMemo(
    () => (entries.length > 0 ? estimateFlipResale(entries).mid : 0),
    [entries]
  );

  const [costs, setCosts] = useState<ResellerCosts>(flipCosts);
  const [salePriceTouched, setSalePriceTouched] = useState(
    flipCosts.targetSellingPrice > 0
  );

  // Hydrate from shared flip session when navigating from Deal / Inventory
  useEffect(() => {
    setCosts(flipCosts);
    setSalePriceTouched(flipCosts.targetSellingPrice > 0);
  }, [flipCosts]);

  // Sync suggested sale when build changes (unless user set sale price manually)
  useEffect(() => {
    if (!salePriceTouched && suggestedSale > 0) {
      const next = { ...costs, targetSellingPrice: suggestedSale };
      setCosts(next);
      setFlipCosts({ targetSellingPrice: suggestedSale });
    }
  }, [suggestedSale, salePriceTouched]); // intentionally not including costs

  const profit = useMemo(() => calculateProfit(costs), [costs]);

  const platformResults = useMemo(
    () =>
      compareAllPlatforms({
        salePrice: costs.targetSellingPrice,
        purchasePrice: costs.purchasePrice,
        repairCosts: costs.repairCosts,
        upgradeCosts: costs.upgradeCosts,
        shippingCost: costs.shippingCosts,
        otherExpenses: costs.otherExpenses,
      }),
    [costs]
  );

  const updateCost = (key: keyof ResellerCosts, value: number) => {
    if (key === "targetSellingPrice") setSalePriceTouched(true);
    setCosts((prev) => {
      const next = { ...prev, [key]: value };
      setFlipCosts(next);
      return next;
    });
  };

  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const handleSave = () => {
    if (partCount === 0) {
      setSaveMessage("Add parts first — analyze a deal or open the builder.");
      setTimeout(() => setSaveMessage(null), 2500);
      return;
    }

    if (activeInventoryId) {
      const ok = updateActiveInventory();
      setSaveMessage(
        ok ? "Updated inventory PC with these costs." : "Could not update inventory."
      );
    } else {
      const pc = addPC(
        currentBuild,
        costs,
        buildName || `PC Flip — ${formatCurrency(costs.purchasePrice)}`,
        conditions
      );
      if (pc) {
        useBuildStore.setState({ activeInventoryId: pc.id });
        setSaveMessage("Saved to inventory — linked to this session.");
      }
    }
    setTimeout(() => setSaveMessage(null), 2500);
  };

  const fields: { key: keyof ResellerCosts; label: string }[] = [
    { key: "purchasePrice", label: "Purchase Price" },
    { key: "repairCosts", label: "Repair Costs" },
    { key: "upgradeCosts", label: "Upgrade Costs" },
    { key: "shippingCosts", label: "Shipping Costs" },
    { key: "otherExpenses", label: "Other Expenses" },
    { key: "marketplaceFeePercent", label: "Marketplace Fee (%)" },
    { key: "targetSellingPrice", label: "Target Selling Price" },
  ];

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        title="Profit Calculator"
        description="Same numbers as Deal and Build — purchase price, fees, and resale stay in sync"
      />

      <Card className="border-[var(--color-border)]">
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-base">Current rig</CardTitle>
            {partCount > 0 ? (
              <Badge variant="secondary">{partCount} parts loaded</Badge>
            ) : (
              <Badge variant="warning">No parts — analyze a deal first</Badge>
            )}
            {activeInventoryId && (
              <Badge variant="secondary">Editing inventory PC</Badge>
            )}
          </div>
          <CardDescription>
            {buildName}
            {suggestedSale > 0 &&
              ` · Suggested list price: ${formatCurrency(suggestedSale)}`}
          </CardDescription>
        </CardHeader>
        <div className="flex flex-wrap gap-2 px-4 pb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/build")}
          >
            Open 3D builder
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/deal")}
          >
            Analyze listing
          </Button>
        </div>
      </Card>

      {saveMessage && (
        <p className="text-center text-sm text-[var(--color-primary)]">
          {saveMessage}
        </p>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Costs & Pricing</CardTitle>
            <CardDescription>
              Changes here update Build and Deal-linked sessions automatically
            </CardDescription>
          </CardHeader>
          <div className="space-y-4">
            {fields.map(({ key, label }) => (
              <div key={key} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                <label className="text-sm font-medium text-[var(--color-muted-foreground)] sm:w-44 sm:shrink-0">
                  {label}
                </label>
                <Input
                  type="number"
                  value={costs[key]}
                  onChange={(e) =>
                    updateCost(key, parseFloat(e.target.value) || 0)
                  }
                  className="flex-1"
                />
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profit Analysis</CardTitle>
            </CardHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-[var(--color-secondary)]">
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    Total Investment
                  </p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(profit.totalInvestment)}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-[var(--color-secondary)]">
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    Expected Sale
                  </p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(profit.expectedSalePrice)}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-[var(--color-secondary)]">
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    Marketplace Fees
                  </p>
                  <p className="text-2xl font-bold text-amber-400">
                    {formatCurrency(profit.estimatedFees)}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-[var(--color-secondary)]">
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    Estimated Profit
                  </p>
                  <p
                    className={`text-2xl font-bold ${profit.estimatedProfit >= 0 ? "text-green-400" : "text-red-400"}`}
                  >
                    {formatCurrency(profit.estimatedProfit)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    Profit %
                  </p>
                  <p className="text-lg font-bold">
                    {formatPercent(profit.profitPercentage)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    ROI
                  </p>
                  <p className="text-lg font-bold">
                    {formatPercent(profit.roi)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    Break-Even
                  </p>
                  <p className="text-lg font-bold">
                    {formatCurrency(profit.breakEvenPrice)}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-lg border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10">
                <p className="text-xs text-[var(--color-muted-foreground)]">
                  Maximum Price You Should Pay
                </p>
                <p className="text-3xl font-bold text-[var(--color-primary)]">
                  {formatCurrency(profit.maxPurchasePrice)}
                </p>
              </div>
            </div>
          </Card>

          <Button onClick={handleSave} className="w-full" disabled={partCount === 0}>
            {activeInventoryId ? "Update inventory PC" : "Save to inventory"}
          </Button>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sell on best platform</CardTitle>
              <CardDescription>
                Same platform table as Deal analyzer
              </CardDescription>
            </CardHeader>
            <PlatformProfitTable results={platformResults} />
          </Card>
        </div>
      </div>
    </div>
  );
}
