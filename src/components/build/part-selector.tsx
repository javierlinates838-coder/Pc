"use client";

import type { PartCategory, ComponentMap } from "@/lib/types/components";
import { componentsByCategory } from "@/lib/database";
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

  return (
    <div className="space-y-4">
      {BUILD_CATEGORIES.map((category) => {
        const selected = currentBuild[category];
        const hasSelection = !!selected;

        return (
          <div key={category} className="flex items-center gap-3">
            <label className="w-36 text-sm font-medium text-[var(--color-muted-foreground)] shrink-0">
              {CATEGORY_LABELS[category]}
            </label>
            <Select
              value={getSelectedId(category)}
              onChange={(e) => handleSelect(category, e.target.value)}
              className="flex-1"
            >
              <option value="">Select {CATEGORY_LABELS[category]}...</option>
              {componentsByCategory[category].map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            {hasSelection && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removePart(category)}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}
