"use client";

import { useState, useMemo } from "react";
import { componentDatabase, componentsByCategory } from "@/lib/database";
import type { PartCategory, ComponentMap } from "@/lib/types/components";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { useBuildStore } from "@/lib/inventory/store";
import { PageHeader } from "@/components/layout/page-header";

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

  const filtered = useMemo(() => {
    const pool =
      category === "all"
        ? componentDatabase
        : componentsByCategory[category];
    if (!search.trim()) return pool;
    const q = search.toLowerCase();
    return pool.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.brand.toLowerCase().includes(q) ||
        c.model.toLowerCase().includes(q)
    );
  }, [search, category]);

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        title="Parts Database"
        description={`${componentDatabase.length} components — expandable local database`}
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder="Search parts..."
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

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4">
        {filtered.map((component) => (
          <Card key={component.id} className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-medium text-sm">{component.name}</p>
                <p className="text-xs text-[var(--color-muted-foreground)]">
                  {component.brand} • {component.model}
                </p>
              </div>
              <Badge variant="secondary">{component.performanceTier}</Badge>
            </div>
            <div className="flex items-center justify-between mt-3">
              <span className="text-sm">
                Used: {formatCurrency(component.pricing.usedMin)}–
                {formatCurrency(component.pricing.usedMax)}
              </span>
              <button
                onClick={() => {
                  if (component.category === "storage") {
                    setPart("storage", component);
                  } else {
                    setPart(
                      component.category,
                      component as ComponentMap[typeof component.category]
                    );
                  }
                }}
                className="text-xs text-[var(--color-primary)] hover:underline"
              >
                Add to Build
              </button>
            </div>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <Card>
          <p className="text-[var(--color-muted-foreground)]">
            No parts match your search.
          </p>
        </Card>
      )}
    </div>
  );
}
