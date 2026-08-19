"use client";

import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSettingsStore, useInventoryStore } from "@/lib/inventory/store";
import { getDatabaseStats } from "@/lib/database";
import { COMPETITOR_MATRIX } from "@/lib/database/intel/part-intel";
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

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const parsed = JSON.parse(text);
        if (!Array.isArray(parsed)) throw new Error("Invalid format");
        localStorage.setItem(
          "pc-reseller-inventory",
          JSON.stringify({ state: { pcs: parsed }, version: 0 })
        );
        window.location.reload();
      } catch {
        alert("Could not import file. Use exported inventory JSON.");
      }
    };
    input.click();
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
        description="Defaults, data, and how we beat the competition"
      />

      <Card>
        <CardHeader>
          <CardTitle>Default costs</CardTitle>
          <CardDescription>Pre-fill profit calculator</CardDescription>
        </CardHeader>
        <div className="space-y-4 max-w-md">
          <div className="flex items-center gap-4">
            <label className="w-44 text-sm text-[var(--color-muted-foreground)]">
              Marketplace fee (%)
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
              Default shipping ($)
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
          <CardTitle>Data management</CardTitle>
          <CardDescription>
            Builds auto-save locally · Inventory export/import
          </CardDescription>
        </CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button variant="outline" onClick={handleExport}>
            Export inventory
          </Button>
          <Button variant="outline" onClick={handleImport}>
            Import inventory JSON
          </Button>
          <Button variant="destructive" onClick={handleClearInventory}>
            Clear inventory
          </Button>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>vs. the competition</CardTitle>
          <CardDescription>
            We studied Rig Flip, BuildFlipper, PCPartPicker, fee calculators, and
            spreadsheets — then fixed their gaps
          </CardDescription>
        </CardHeader>
        <div className="space-y-4">
          {COMPETITOR_MATRIX.map((c) => (
            <div
              key={c.name}
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-secondary)]/30 p-4"
            >
              <p className="font-semibold text-[var(--color-primary)]">
                {c.name}
              </p>
              <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
                They do well: {c.strengths.join(" · ")}
              </p>
              <p className="mt-1 text-xs text-amber-300/80">
                Their flaw: {c.flaws.join(" · ")}
              </p>
              <p className="mt-2 text-sm">
                <span className="text-[var(--color-success)]">We win:</span>{" "}
                {c.weBeatThem}
              </p>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Live APIs (coming)</CardTitle>
          <CardDescription>
            Architecture ready — local engine works offline today
          </CardDescription>
        </CardHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            "eBay sold comps scraper",
            "Facebook Marketplace parser",
            "PCPartPicker price sync",
            "GPU/CPU benchmark API",
            "OpenAI Vision part ID",
            "CamelCamelCamel alerts",
          ].map((api) => (
            <div
              key={api}
              className="flex items-center justify-between rounded-lg bg-[var(--color-secondary)] p-3"
            >
              <span className="text-sm">{api}</span>
              <span className="text-xs text-[var(--color-muted-foreground)]">
                Planned
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
          PC Flip Pro — {dbStats.total} parts, 12-platform fee matrix, listing
          scraper with mining/OEM detection, 3D build visualizer, and full
          compatibility engine. All core tools run locally with no API required.
        </p>
      </Card>
    </div>
  );
}
