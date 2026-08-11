"use client";

import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSettingsStore, useInventoryStore } from "@/lib/inventory/store";
import { getDatabaseStats } from "@/lib/database";
import { PageHeader } from "@/components/layout/page-header";

export default function SettingsPage() {
  const dbStats = getDatabaseStats();
  const {
    defaultMarketplaceFee,
    defaultShippingCost,
    setDefaultMarketplaceFee,
    setDefaultShippingCost,
  } = useSettingsStore();
  const { pcs } = useInventoryStore();

  const handleExport = () => {
    const data = JSON.stringify(pcs, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pc-flip-inventory.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearInventory = () => {
    if (
      confirm(
        "Are you sure you want to clear all inventory data? This cannot be undone."
      )
    ) {
      localStorage.removeItem("pc-reseller-inventory");
      window.location.reload();
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        title="Settings"
        description="Configure defaults and manage data"
      />

      <Card>
        <CardHeader>
          <CardTitle>Default Costs</CardTitle>
          <CardDescription>
            These values pre-fill the Profit Calculator
          </CardDescription>
        </CardHeader>
        <div className="space-y-4 max-w-md">
          <div className="flex items-center gap-4">
            <label className="w-44 text-sm text-[var(--color-muted-foreground)]">
              Marketplace Fee (%)
            </label>
            <Input
              type="number"
              value={defaultMarketplaceFee}
              onChange={(e) =>
                setDefaultMarketplaceFee(parseFloat(e.target.value) || 0)
              }
            />
          </div>
          <div className="flex items-center gap-4">
            <label className="w-44 text-sm text-[var(--color-muted-foreground)]">
              Default Shipping ($)
            </label>
            <Input
              type="number"
              value={defaultShippingCost}
              onChange={(e) =>
                setDefaultShippingCost(parseFloat(e.target.value) || 0)
              }
            />
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>
            Inventory is stored locally in your browser
          </CardDescription>
        </CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button variant="outline" onClick={handleExport}>
            Export Inventory (JSON)
          </Button>
          <Button variant="destructive" onClick={handleClearInventory}>
            Clear Inventory
          </Button>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API Integrations (Future)</CardTitle>
          <CardDescription>
            The architecture supports adding live pricing APIs without changing
            core logic
          </CardDescription>
        </CardHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            "eBay Sold Listings API",
            "Amazon Pricing API",
            "PCPartPicker Data",
            "GPU/CPU Databases",
            "Used Marketplace Scrapers",
            "OpenAI Vision (Part Scanner)",
          ].map((api) => (
            <div
              key={api}
              className="p-3 rounded-lg bg-[var(--color-secondary)] flex items-center justify-between"
            >
              <span className="text-sm">{api}</span>
              <span className="text-xs text-[var(--color-muted-foreground)]">
                Not connected
              </span>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>About</CardTitle>
        </CardHeader>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          PC Flip Pro v0.1.0 — Professional PC Reseller Compatibility & Profit
          Calculator. All compatibility checks run locally with no API dependency.
          Component database contains {dbStats.total} parts across{" "}
          {Object.keys(dbStats.byCategory).length} categories and is designed
          for easy expansion.
        </p>
      </Card>
    </div>
  );
}
