"use client";

import type { PartCategory, ComponentMap, PCComponent } from "@/lib/types/components";
import { componentsByCategory, getComponentSpecLines } from "@/lib/database";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useBuildStore } from "@/lib/inventory/store";

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
  wifi: "WiFi/Bluetooth",
  os: "Operating System",
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

export function PartSelector() {
  const { currentBuild, setPart, removePart } = useBuildStore();

  const handleSelect = (category: PartCategory, componentId: string) => {
    if (!componentId) {
      removePart(category);
      return;
    }
    const component = componentsByCategory[category].find(
      (c) => c.id === componentId
    );
    if (component) {
      if (category === "storage") {
        setPart("storage", component as import("@/lib/types/components").Storage);
      } else {
        setPart(category, component as Exclude<ComponentMap[typeof category], Storage[] | undefined>);
      }
    }
  };

  const getSelectedId = (category: PartCategory): string => {
    const part = currentBuild[category];
    if (!part) return "";
    if (Array.isArray(part)) return part[part.length - 1]?.id ?? "";
    return part.id;
  };

  const getSelectedComponent = (category: PartCategory): PCComponent | undefined => {
    const id = getSelectedId(category);
    if (!id) return undefined;
    return componentsByCategory[category].find((c) => c.id === id);
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {BUILD_CATEGORIES.map((category) => {
        const selected = currentBuild[category];
        const hasSelection = !!selected;
        const selectedComponent = getSelectedComponent(category);
        const specLines = selectedComponent
          ? getComponentSpecLines(selectedComponent).slice(0, 4)
          : [];

        return (
          <div
            key={category}
            className="rounded-xl border border-[var(--color-border)]/60 bg-[var(--color-secondary)]/30 p-3 sm:border-0 sm:bg-transparent sm:p-0"
          >
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)] sm:sr-only">
              {CATEGORY_LABELS[category]}
            </label>
            <div className="flex items-stretch gap-2">
              <Select
                value={getSelectedId(category)}
                onChange={(e) => handleSelect(category, e.target.value)}
                className="min-w-0 flex-1"
                aria-label={CATEGORY_LABELS[category]}
              >
                <option value="">
                  {CATEGORY_LABELS[category]} — tap to select
                </option>
                {componentsByCategory[category].map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
              {hasSelection && (
                <Button
                  variant="outline"
                  size="md"
                  className="shrink-0 px-3"
                  onClick={() => removePart(category)}
                  aria-label={`Remove ${CATEGORY_LABELS[category]}`}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            {selectedComponent && (
              <div className="mt-2 space-y-1">
                {selectedComponent.specsSummary && (
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    {selectedComponent.specsSummary}
                  </p>
                )}
                {specLines.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {specLines.map((spec) => (
                      <span
                        key={spec.label}
                        className="rounded bg-[var(--color-secondary)] px-1.5 py-0.5 text-[10px] text-[var(--color-muted-foreground)]"
                      >
                        {spec.label}: {spec.value}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
