"use client";

import { useState, useMemo } from "react";
import {
  componentDatabase,
  getDatabaseStats,
  searchComponents,
} from "@/lib/database";
import type { PartCategory, ComponentMap } from "@/lib/types/components";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useBuildStore } from "@/lib/inventory/store";
import { PageHeader } from "@/components/layout/page-header";
import { ComponentCard } from "@/components/database/component-card";

const CATEGORIES: { value: PartCategory | "all"; label: string }[] = [
  { value: "all", label: "All Categories" },
  { value: "cpu", label: "CPUs" },
  { value: "gpu", label: "GPUs" },
  { value: "motherboard", label: "Motherboards" },
  { value: "ram", label: "RAM" },
  { value: "storage", label: "Storage" },
  { value: "psu", label: "PSUs" },
  { value: "cooler", label: "Coolers" },
  { value: "case", label: "Cases" },
  { value: "fans", label: "Fans" },
  { value: "wifi", label: "WiFi" },
  { value: "os", label: "OS" },
];

export default function DatabasePage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<PartCategory | "all">("all");
  const { setPart } = useBuildStore();
  const stats = getDatabaseStats();

  const filtered = useMemo(() => {
    if (category === "all") {
      return searchComponents(search);
    }
    return searchComponents(search, category);
  }, [search, category]);

  const categoryCounts = useMemo(
    () =>
      CATEGORIES.filter((c) => c.value !== "all").map((c) => ({
        ...c,
        count: stats.byCategory[c.value as PartCategory] ?? 0,
      })),
    [stats.byCategory]
  );

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        title="Parts Database"
        description={`${stats.total} components with full specs, pricing, and compatibility data`}
      />

      <div className="flex flex-wrap gap-2">
        {categoryCounts.map((c) => (
          <button
            key={c.value}
            type="button"
            onClick={() => setCategory(c.value)}
            className={
              category === c.value
                ? "inline-flex items-center rounded-full bg-[var(--color-primary)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-primary-foreground)]"
                : "inline-flex items-center rounded-full bg-[var(--color-secondary)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-secondary-foreground)]"
            }
          >
            {c.label} ({c.count})
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder="Search by name, socket, chipset, VRAM..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
        <Select
          value={category}
          onChange={(e) =>
            setCategory(e.target.value as PartCategory | "all")
          }
          className="max-w-xs"
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </Select>
      </div>

      <p className="text-xs text-[var(--color-muted-foreground)]">
        Showing {filtered.length} of {componentDatabase.length} parts
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4">
        {filtered.map((component) => (
          <ComponentCard
            key={component.id}
            component={component}
            onAdd={() => {
              if (component.category === "storage") {
                setPart("storage", component);
              } else {
                setPart(
                  component.category,
                  component as ComponentMap[typeof component.category]
                );
              }
            }}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <Card className="p-6">
          <p className="text-[var(--color-muted-foreground)]">
            No parts match your search. Try a model number (e.g. 5600, 3060,
            B550).
          </p>
        </Card>
      )}
    </div>
  );
}
