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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Parts Database</h1>
        <p className="text-[var(--color-muted-foreground)] mt-1">
          {componentDatabase.length} components — expandable local database
        </p>
      </div>

      <div className="flex gap-4">
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
