"use client";

import type { PCComponent } from "@/lib/types/components";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { getComponentSpecLines } from "@/lib/database/component-specs";
import { getPartIntel } from "@/lib/database/intel/part-intel";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface ComponentCardProps {
  component: PCComponent;
  onAdd?: () => void;
  compact?: boolean;
}

export function ComponentCard({
  component,
  onAdd,
  compact = false,
}: ComponentCardProps) {
  const [expanded, setExpanded] = useState(false);
  const specs = getComponentSpecLines(component);
  const intel = getPartIntel(component);

  return (
    <Card className="flex flex-col p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-sm leading-snug">{component.name}</p>
          <p className="mt-0.5 text-xs text-[var(--color-muted-foreground)]">
            {component.brand} · {component.model}
          </p>
        </div>
        <Badge variant="secondary" className="shrink-0 capitalize">
          {component.performanceTier}
        </Badge>
      </div>

      {component.specsSummary && (
        <p className="mt-2 text-xs leading-relaxed text-[var(--color-muted-foreground)]">
          {component.specsSummary}
        </p>
      )}

      {intel.flipTips[0] && (
        <p className="mt-2 text-[10px] leading-relaxed text-[var(--color-accent-foreground)]">
          💡 {intel.flipTips[0]}
        </p>
      )}

      {!compact && (
        <div className="mt-3 flex flex-wrap gap-1">
          {specs.slice(0, expanded ? specs.length : 3).map((spec) => (
            <span
              key={spec.label}
              className="rounded-md bg-[var(--color-secondary)] px-2 py-1 text-[10px] text-[var(--color-muted-foreground)]"
            >
              <span className="text-[var(--color-foreground)]">{spec.label}:</span>{" "}
              {spec.value}
            </span>
          ))}
        </div>
      )}

      {specs.length > 3 && !compact && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="mt-2 flex items-center gap-1 text-[10px] text-[var(--color-primary)]"
        >
          {expanded ? (
            <>
              <ChevronUp className="h-3 w-3" /> Show less
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3" /> +{specs.length - 3} more specs
            </>
          )}
        </button>
      )}

      <div className="mt-auto flex items-center justify-between gap-2 pt-3">
        <div className="text-xs sm:text-sm">
          <span className="text-[var(--color-muted-foreground)]">Used </span>
          {formatCurrency(component.pricing.usedMin)}–
          {formatCurrency(component.pricing.usedMax)}
        </div>
        {onAdd && (
          <button
            type="button"
            onClick={onAdd}
            className="shrink-0 rounded-lg bg-[var(--color-primary)]/15 px-3 py-1.5 text-xs font-medium text-[var(--color-accent-foreground)] active:scale-95"
          >
            Add
          </button>
        )}
      </div>
    </Card>
  );
}
