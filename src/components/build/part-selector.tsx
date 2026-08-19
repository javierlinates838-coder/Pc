"use client";

import type { PartCategory, ComponentMap, PCComponent, CPU, Motherboard, RAM, Storage } from "@/lib/types/components";
import { componentsByCategory, searchComponents, getComponentSpecLines } from "@/lib/database";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Search } from "lucide-react";
import { useBuildStore } from "@/lib/inventory/store";
import { formatCurrency } from "@/lib/utils";
import { estimatePartValue } from "@/lib/pricing/estimator";
import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";

const CATEGORY_LABELS: Record<PartCategory, string> = {
  cpu: "CPU",
  gpu: "GPU",
  motherboard: "Motherboard",
  ram: "RAM",
  cooler: "CPU Cooler",
  psu: "PSU",
  storage: "Storage",
  case: "PC Case",
  fans: "Case Fans",
  wifi: "WiFi",
  os: "OS",
};

const BUILD_CATEGORIES: PartCategory[] = [
  "cpu",
  "gpu",
  "motherboard",
  "ram",
  "cooler",
  "psu",
  "storage",
  "case",
  "fans",
  "wifi",
  "os",
];

function filterPool(
  category: PartCategory,
  build: ComponentMap,
  query: string
): PCComponent[] {
  const normalized = query.trim().toLowerCase();
  let pool = normalized
    ? searchComponents(query, category)
    : componentsByCategory[category];

  if (category === "cpu" && build.motherboard) {
    pool = pool.filter(
      (c) => (c as CPU).socket === build.motherboard!.socket
    );
  }
  if (category === "motherboard" && build.cpu) {
    pool = pool.filter(
      (c) => (c as Motherboard).socket === build.cpu!.socket
    );
  }
  if (category === "ram" && build.motherboard) {
    pool = pool.filter(
      (c) => (c as RAM).type === build.motherboard!.ramType
    );
  }

  return pool.slice(0, 48);
}

export function PartSelector() {
  const { currentBuild, setPart, removePart } = useBuildStore();
  const [activeCategory, setActiveCategory] =
    useState<PartCategory>("cpu");
  const [query, setQuery] = useState("");

  const pool = useMemo(
    () => filterPool(activeCategory, currentBuild, query),
    [activeCategory, currentBuild, query]
  );

  const selected = currentBuild[activeCategory];
  const selectedComponent =
    selected && !Array.isArray(selected)
      ? selected
      : Array.isArray(selected)
        ? selected[selected.length - 1]
        : undefined;

  const handlePick = (component: PCComponent) => {
    if (activeCategory === "storage") {
      setPart("storage", component as Storage);
    } else {
      setPart(
        activeCategory,
        component as ComponentMap[typeof activeCategory]
      );
    }
    setQuery("");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5">
        {BUILD_CATEGORIES.map((cat) => {
          const has = !!currentBuild[cat];
          return (
            <button
              key={cat}
              type="button"
              onClick={() => {
                setActiveCategory(cat);
                setQuery("");
              }}
              className={cn(
                "rounded-lg px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide transition-colors",
                activeCategory === cat
                  ? "bg-[var(--color-primary)] text-white"
                  : "bg-[var(--color-secondary)] text-[var(--color-muted-foreground)]",
                has && activeCategory !== cat && "ring-1 ring-[var(--color-primary)]/40"
              )}
            >
              {CATEGORY_LABELS[cat]}
              {has && " ✓"}
            </button>
          );
        })}
      </div>

      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]"
        />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${CATEGORY_LABELS[activeCategory]}…`}
          className="pl-9"
        />
      </div>

      {selectedComponent && (
        <div className="flex items-start justify-between gap-2 rounded-xl border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5 p-3">
          <div>
            <p className="text-sm font-semibold">{selectedComponent.name}</p>
            <p className="text-xs text-[var(--color-muted-foreground)]">
              {selectedComponent.specsSummary}
            </p>
            <p className="mt-1 text-xs font-medium text-[var(--color-success)]">
              Used ~{formatCurrency(estimatePartValue(selectedComponent, "used").mid)}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => removePart(activeCategory)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="grid max-h-[min(50vh,420px)] gap-1 overflow-y-auto pr-1">
        {pool.map((c) => {
          const isSelected = selectedComponent?.id === c.id;
          const usedMid = estimatePartValue(c, "used").mid;
          const specs = getComponentSpecLines(c).slice(0, 2);

          return (
            <button
              key={c.id}
              type="button"
              onClick={() => handlePick(c)}
              className={cn(
                "rounded-xl border px-3 py-2.5 text-left transition-colors",
                isSelected
                  ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10"
                  : "border-[var(--color-border)]/60 hover:border-[var(--color-primary)]/40 hover:bg-[var(--color-secondary)]/40"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium leading-snug">{c.name}</p>
                <Badge variant="secondary" className="shrink-0 tabular-nums">
                  ~{formatCurrency(usedMid)}
                </Badge>
              </div>
              <p className="mt-0.5 text-[10px] text-[var(--color-muted-foreground)]">
                {specs.map((s) => `${s.label}: ${s.value}`).join(" · ")}
              </p>
            </button>
          );
        })}
        {pool.length === 0 && (
          <p className="py-6 text-center text-sm text-[var(--color-muted-foreground)]">
            No parts match — try another search or category.
          </p>
        )}
      </div>
    </div>
  );
}
