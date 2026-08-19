"use client";

import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

const ROWS = [
  {
    feature: "3D interior view",
    us: "Proportional GPU/cooler + RGB preview",
    them: "5000+ photoreal models",
    usWin: false,
  },
  {
    feature: "Paste Facebook listing → parts",
    us: "Built in",
    them: "Not available",
    usWin: true,
  },
  {
    feature: "Deal profit after platform fees",
    us: "12 marketplaces",
    them: "Retail price compare only",
    usWin: true,
  },
  {
    feature: "Flip inventory + ROI tracking",
    us: "Full workflow",
    them: "Save builds only",
    usWin: true,
  },
  {
    feature: "Mining / OEM red flags",
    us: "Listing scraper",
    them: "No",
    usWin: true,
  },
  {
    feature: "Listing copy for resale",
    us: "Auto-generated",
    them: "Part list export",
    usWin: true,
  },
  {
    feature: "Game FPS table",
    us: "10 popular titles",
    them: "3DMark integration",
    usWin: false,
  },
  {
    feature: "Live retailer prices",
    us: "Used value estimates",
    them: "Amazon/Newegg live",
    usWin: false,
  },
];

export function BeatBuildCoresCard() {
  return (
    <Card className="border-[var(--color-primary)]/25">
      <CardHeader>
        <CardTitle className="text-base">Why flippers beat BuildCores here</CardTitle>
        <CardDescription>
          BuildCores is great for showcase builds. PC Flip Pro is built to{" "}
          <strong className="text-[var(--color-foreground)]">buy, upgrade, and sell</strong>.
        </CardDescription>
      </CardHeader>
      <ul className="space-y-2">
        {ROWS.map((row) => (
          <li
            key={row.feature}
            className="flex flex-col gap-1 rounded-lg bg-[var(--color-secondary)]/40 px-3 py-2 text-xs sm:flex-row sm:items-center sm:justify-between"
          >
            <span className="font-medium">{row.feature}</span>
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant={row.usWin ? "success" : "secondary"}
                className="gap-1"
              >
                {row.usWin ? <Check className="h-3 w-3" /> : null}
                Us: {row.us}
              </Badge>
              <span className="text-[var(--color-muted-foreground)]">
                BC: {row.them}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
