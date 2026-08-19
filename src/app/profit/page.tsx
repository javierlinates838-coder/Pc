"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useBuildStore, useInventoryStore, useSettingsStore } from "@/lib/inventory/store";
import { calculateProfit } from "@/lib/reseller/profit";
import { compareAllPlatforms } from "@/lib/marketplaces/calculate";
import { PlatformProfitTable } from "@/components/marketplace/platform-profit-table";
import { componentMapToEntries } from "@/lib/build/helpers";
import { estimateCompletePcValue } from "@/lib/pricing/estimator";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
import type { ResellerCosts } from "@/lib/types/reseller";

export default function ProfitCalculatorPage() {
  const { currentBuild } = useBuildStore();
  const { addPC } = useInventoryStore();
  const { defaultMarketplaceFee, defaultShippingCost } = useSettingsStore();

  const entries = useMemo(
    () => componentMapToEntries(currentBuild),
    [currentBuild]
  );
  const suggestedSale = useMemo(
    () => estimateCompletePcValue(entries).mid,
    [entries]
  );

  const [costs, setCosts] = useState<ResellerCosts>({
    purchasePrice: 300,
    repairCosts: 0,
    upgradeCosts: 80,
    shippingCosts: defaultShippingCost,
    marketplaceFeePercent: defaultMarketplaceFee,
    otherExpenses: 20,
    targetSellingPrice: suggestedSale || 600,
  });

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
    setCosts((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    addPC(currentBuild, costs, `PC Flip — ${formatCurrency(costs.purchasePrice)}`);
    alert("Saved to inventory!");
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
        description="Reseller mode — calculate ROI, break-even, and max purchase price"
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Costs & Pricing</CardTitle>
            <CardDescription>
              {suggestedSale > 0 &&
                `Suggested sale price based on build: ${formatCurrency(suggestedSale)}`}
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

          <Button onClick={handleSave} className="w-full">
            Save to inventory
          </Button>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sell on best platform</CardTitle>
              <CardDescription>
                Compare net profit after real fees (eBay, FB, Mercari, HWSwap…)
              </CardDescription>
            </CardHeader>
            <PlatformProfitTable results={platformResults} />
          </Card>
        </div>
      </div>
    </div>
  );
}
