"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSettingsStore, useInventoryStore } from "@/lib/inventory/store";
import { getDatabaseStats } from "@/lib/database";
import { COMPETITOR_MATRIX } from "@/lib/database/intel/part-intel";
import { PageHeader } from "@/components/layout/page-header";
import type { EbayStatus } from "@/lib/ebay/types";
import { CheckCircle2, CircleDashed } from "lucide-react";

export default function SettingsPage() {
  const dbStats = getDatabaseStats();
  const [ebayStatus, setEbayStatus] = useState<EbayStatus | null>(null);
  const {
    defaultMarketplaceFee,
    defaultShippingCost,
    setDefaultMarketplaceFee,
    setDefaultShippingCost,
  } = useSettingsStore();
  const { pcs } = useInventoryStore();

  useEffect(() => {
    fetch("/api/ebay/status")
      .then((r) => r.json())
      .then((data: EbayStatus) => setEbayStatus(data))
      .catch(() =>
        setEbayStatus({
          configured: false,
          environment: "sandbox",
          message: "Could not check eBay status.",
        })
      );
  }, []);

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

      <Card className="neon-border">
        <CardHeader>
          <CardTitle>eBay API</CardTitle>
          <CardDescription>
            Live used-listing comps on Deal and Build pages — powered by eBay
            Browse API
          </CardDescription>
        </CardHeader>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {ebayStatus?.configured ? (
              <Badge variant="secondary" className="gap-1">
                <CheckCircle2 className="h-3 w-3 text-[var(--color-success)]" />
                Connected
              </Badge>
            ) : (
              <Badge variant="warning" className="gap-1">
                <CircleDashed className="h-3 w-3" />
                Not configured
              </Badge>
            )}
            {ebayStatus && (
              <Badge variant="secondary">
                {ebayStatus.environment === "sandbox" ? "Sandbox" : "Production"}
              </Badge>
            )}
          </div>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            {ebayStatus?.message ??
              "Checking eBay connection…"}
          </p>
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-secondary)]/30 p-4 text-xs text-[var(--color-muted-foreground)]">
            <p className="font-semibold text-[var(--color-foreground)]">
              Setup (server env vars)
            </p>
            <ol className="mt-2 list-decimal space-y-1 pl-4">
              <li>Create a <strong>Production</strong> keyset at developer.ebay.com</li>
              <li>Copy App ID → <code className="text-[var(--color-primary)]">EBAY_CLIENT_ID</code></li>
              <li>Copy Cert ID → <code className="text-[var(--color-primary)]">EBAY_CLIENT_SECRET</code></li>
              <li>Set <code className="text-[var(--color-primary)]">EBAY_ENVIRONMENT=production</code></li>
              <li>Redeploy (Vercel) or restart <code>npm run dev</code></li>
            </ol>
            <p className="mt-3">
              See <code>.env.example</code> in the repo. Keys stay server-side —
              never exposed to the browser.
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Live APIs</CardTitle>
          <CardDescription>
            Integrations — local engine still works offline without keys
          </CardDescription>
        </CardHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { name: "eBay Browse API (used comps)", status: ebayStatus?.configured ? "Active" : "Needs keys" },
            { name: "Facebook Marketplace parser", status: "Planned" },
            { name: "PCPartPicker price sync", status: "Planned" },
            { name: "GPU/CPU benchmark API", status: "Planned" },
            { name: "OpenAI Vision part ID", status: "Planned" },
            { name: "CamelCamelCamel alerts", status: "Planned" },
          ].map((api) => (
            <div
              key={api.name}
              className="flex items-center justify-between rounded-lg bg-[var(--color-secondary)] p-3"
            >
              <span className="text-sm">{api.name}</span>
              <span
                className={`text-xs ${
                  api.status === "Active"
                    ? "text-[var(--color-success)]"
                    : "text-[var(--color-muted-foreground)]"
                }`}
              >
                {api.status}
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
