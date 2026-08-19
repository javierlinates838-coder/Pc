"use client";

import { useState } from "react";
import type { GeneratedListing } from "@/lib/reseller/listing-generator";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { Copy, Check } from "lucide-react";

interface ListingGeneratorPanelProps {
  listing: GeneratedListing;
}

export function ListingGeneratorPanel({ listing }: ListingGeneratorPanelProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Listing copy generator</CardTitle>
        <p className="text-xs text-[var(--color-muted-foreground)]">
          Suggested {formatCurrency(listing.suggestedPriceRange.min)}–
          {formatCurrency(listing.suggestedPriceRange.max)} (mid{" "}
          {formatCurrency(listing.suggestedPriceRange.mid)})
        </p>
      </CardHeader>

      <div className="space-y-3">
        <div className="rounded-xl bg-[var(--color-secondary)]/50 p-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[10px] uppercase tracking-wide text-[var(--color-muted-foreground)]">
                Title
              </p>
              <p className="text-sm font-medium">{listing.title}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copy(listing.title, "title")}
            >
              {copied === "title" ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="rounded-xl bg-[var(--color-secondary)]/50 p-3">
          <div className="flex items-start justify-between gap-2">
            <pre className="max-h-40 overflow-auto whitespace-pre-wrap text-xs text-[var(--color-muted-foreground)]">
              {listing.description}
            </pre>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0"
              onClick={() => copy(listing.description, "desc")}
            >
              {copied === "desc" ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <div>
          <p className="mb-2 text-[10px] uppercase tracking-wide text-[var(--color-muted-foreground)]">
            Photo checklist
          </p>
          <ul className="grid grid-cols-1 gap-1 text-xs sm:grid-cols-2">
            {listing.photoChecklist.map((item) => (
              <li key={item} className="text-[var(--color-muted-foreground)]">
                📷 {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}
