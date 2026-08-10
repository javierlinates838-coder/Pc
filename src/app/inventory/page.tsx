"use client";

import { useInventoryStore } from "@/lib/inventory/store";
import { useInventoryStats } from "@/lib/inventory/use-inventory-stats";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { calculateProfit } from "@/lib/reseller/profit";
import { ProfitChart } from "@/components/inventory/profit-chart-loader";
import { PageHeader } from "@/components/layout/page-header";

export default function InventoryPage() {
  const { pcs, removePC } = useInventoryStore();
  const stats = useInventoryStats();

  const chartData = pcs.map((pc) => {
    const profit = calculateProfit(pc.costs);
    return {
      name: pc.name,
      invested: profit.totalInvestment,
      profit: profit.estimatedProfit,
      sale: profit.expectedSalePrice,
    };
  });

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        title="PC Inventory"
        description="Track all your PC flips and business metrics"
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold">{stats.totalPCs}</p>
          <p className="text-xs text-[var(--color-muted-foreground)]">
            Total PCs
          </p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold">
            {formatCurrency(stats.totalInvested)}
          </p>
          <p className="text-xs text-[var(--color-muted-foreground)]">
            Total Invested
          </p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold">
            {formatCurrency(stats.totalRevenue)}
          </p>
          <p className="text-xs text-[var(--color-muted-foreground)]">
            Total Revenue
          </p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-green-400">
            {formatCurrency(stats.totalEstimatedProfit)}
          </p>
          <p className="text-xs text-[var(--color-muted-foreground)]">
            Est. Profit
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 text-center">
          <p className="text-lg font-bold">
            {stats.averageProfitPerPC > 0
              ? formatCurrency(stats.averageProfitPerPC)
              : "—"}
          </p>
          <p className="text-xs text-[var(--color-muted-foreground)]">
            Avg Profit / PC
          </p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-lg font-bold">
            {stats.averageROI > 0 ? formatPercent(stats.averageROI) : "—"}
          </p>
          <p className="text-xs text-[var(--color-muted-foreground)]">
            Avg ROI
          </p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-lg font-bold">
            {stats.bestFlip?.name ?? "—"}
          </p>
          <p className="text-xs text-[var(--color-muted-foreground)]">
            Best Flip
          </p>
        </Card>
      </div>

      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Profit Overview</CardTitle>
          </CardHeader>
          <ProfitChart data={chartData} />
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Saved Builds</CardTitle>
          <CardDescription>
            {pcs.length === 0
              ? "No PCs saved yet. Use the Profit Calculator to add builds."
              : `${pcs.length} PC(s) in inventory`}
          </CardDescription>
        </CardHeader>
        {pcs.length > 0 ? (
          <div className="table-scroll">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  <th className="text-left py-2">Name</th>
                  <th className="text-left py-2">Status</th>
                  <th className="text-right py-2">Purchase</th>
                  <th className="text-right py-2">Investment</th>
                  <th className="text-right py-2">Target Sale</th>
                  <th className="text-right py-2">Est. Profit</th>
                  <th className="text-right py-2">ROI</th>
                  <th className="text-right py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pcs.map((pc) => {
                  const profit = calculateProfit(pc.costs);
                  return (
                    <tr
                      key={pc.id}
                      className="border-b border-[var(--color-border)]/50"
                    >
                      <td className="py-2.5 font-medium">{pc.name}</td>
                      <td className="py-2.5">
                        <Badge variant="secondary">{pc.status}</Badge>
                      </td>
                      <td className="py-2.5 text-right">
                        {formatCurrency(pc.costs.purchasePrice)}
                      </td>
                      <td className="py-2.5 text-right">
                        {formatCurrency(profit.totalInvestment)}
                      </td>
                      <td className="py-2.5 text-right">
                        {formatCurrency(profit.expectedSalePrice)}
                      </td>
                      <td
                        className={`py-2.5 text-right ${profit.estimatedProfit >= 0 ? "text-green-400" : "text-red-400"}`}
                      >
                        {formatCurrency(profit.estimatedProfit)}
                      </td>
                      <td className="py-2.5 text-right">
                        {formatPercent(profit.roi)}
                      </td>
                      <td className="py-2.5 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removePC(pc.id)}
                        >
                          Remove
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Build a PC, calculate profit, and save it here to track your
            inventory.
          </p>
        )}
      </Card>
    </div>
  );
}
