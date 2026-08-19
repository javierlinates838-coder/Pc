"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { scanFromImageFile, scanFromText } from "@/lib/image/scanner";
import { scrapeListingText } from "@/lib/reseller/analyzer";
import { listingHintToCondition } from "@/lib/flip/conditions";
import { useBuildStore } from "@/lib/inventory/store";
import type { ComponentMap } from "@/lib/types/components";
import { Upload, Camera, Search } from "lucide-react";
import type { ScanMatch } from "@/lib/image/scanner";
import { PageHeader } from "@/components/layout/page-header";

function looksLikeFullListing(text: string): boolean {
  const lines = text.split(/\n/).filter((l) => l.trim().length > 3);
  return lines.length >= 2 || /\brtx|ryzen|i[3579]|16gb|nvme|gaming pc\b/i.test(text);
}

export default function ScannerPage() {
  const router = useRouter();
  const [scanResult, setScanResult] = useState<{
    matches: ScanMatch[];
    extractedText: string;
  } | null>(null);
  const [textInput, setTextInput] = useState("");
  const [pendingMatch, setPendingMatch] = useState<ScanMatch | null>(null);
  const [listingMode, setListingMode] = useState(false);
  const { setPart, loadBuild } = useBuildStore();

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const result = await scanFromImageFile(file);
      setScanResult(result);
      setListingMode(false);
      if (result.matches.length > 0) {
        setPendingMatch(result.matches[0]);
      }
    },
    []
  );

  const handleTextScan = () => {
    if (looksLikeFullListing(textInput)) {
      const scrape = scrapeListingText(textInput);
      const partCount = Object.keys(scrape.parts).length;
      setListingMode(true);
      setScanResult({
        matches: [],
        extractedText: `Full listing detected — ${partCount} parts matched. Load into builder to continue.`,
      });
      setPendingMatch(null);
      return;
    }

    const result = scanFromText(textInput);
    setListingMode(false);
    setScanResult(result);
    if (result.matches.length > 0) {
      setPendingMatch(result.matches[0]);
    }
  };

  const handleLoadListing = () => {
    const scrape = scrapeListingText(textInput);
    loadBuild(scrape.parts, {
      name: "Scanned Listing",
      defaultCondition: listingHintToCondition(scrape.hints.condition),
      costs: {
        purchasePrice: scrape.listingPrice,
        targetSellingPrice: 0,
      },
      inventoryId: null,
    });
    router.push("/build");
  };

  const confirmMatch = (match: ScanMatch) => {
    const { component } = match;
    if (component.category === "storage") {
      setPart("storage", component);
    } else {
      setPart(
        component.category,
        component as ComponentMap[typeof component.category]
      );
    }
    setPendingMatch(null);
    setScanResult((prev) =>
      prev
        ? {
            ...prev,
            extractedText: `Added ${component.name}. Open builder to see full rig.`,
          }
        : null
    );
  };

  const confidenceColor = {
    high: "success" as const,
    medium: "warning" as const,
    low: "destructive" as const,
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        title="Part Scanner"
        description="Single part ID or paste a full listing — same parser as Deal analyzer"
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Image Upload
            </CardTitle>
            <CardDescription>
              Upload a photo of a component label, GPU, RAM stick, etc.
            </CardDescription>
          </CardHeader>
          <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-[var(--color-border)] rounded-xl cursor-pointer hover:border-[var(--color-primary)] transition-colors">
            <Upload className="w-8 h-8 text-[var(--color-muted-foreground)] mb-2" />
            <span className="text-sm text-[var(--color-muted-foreground)]">
              Click to upload or drag and drop
            </span>
            <span className="text-xs text-[var(--color-muted-foreground)] mt-1">
              PNG, JPG up to 10MB
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Text Identification
            </CardTitle>
            <CardDescription>
              One part name, or paste a multi-line listing
            </CardDescription>
          </CardHeader>
          <Textarea
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="e.g. RTX 3060 — or paste full Facebook listing"
            rows={4}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <Button onClick={handleTextScan}>Identify</Button>
            {listingMode && (
              <Button variant="outline" onClick={handleLoadListing}>
                Load listing into builder
              </Button>
            )}
          </div>
        </Card>
      </div>

      {scanResult && (
        <Card>
          <CardHeader>
            <CardTitle>Scan Results</CardTitle>
            <CardDescription>{scanResult.extractedText}</CardDescription>
          </CardHeader>

          {scanResult.matches.length > 0 ? (
            <div className="space-y-3">
              {scanResult.matches.map((match) => (
                <div
                  key={match.component.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-[var(--color-secondary)] border border-[var(--color-border)]"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">
                        {match.component.name}
                      </span>
                      <Badge variant={confidenceColor[match.confidence]}>
                        {match.confidence === "low"
                          ? "Possible Match"
                          : `${match.confidence} confidence`}
                      </Badge>
                    </div>
                    <p className="text-xs text-[var(--color-muted-foreground)]">
                      Matched on: {match.matchedOn.join(", ")}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => confirmMatch(match)}>
                      {match.confidence === "low" ? "Confirm & Add" : "Add to Build"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => router.push("/build")}
                    >
                      Open builder
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : listingMode ? (
            <Button onClick={handleLoadListing}>Load all parts into builder</Button>
          ) : (
            <p className="text-sm text-[var(--color-muted-foreground)]">
              No matches found. Try the Parts Database or paste a full listing.
            </p>
          )}
        </Card>
      )}

      {pendingMatch && pendingMatch.confidence === "low" && (
        <Card className="border-amber-500/30">
          <CardHeader>
            <CardTitle className="text-amber-400">Confirm Match</CardTitle>
            <CardDescription>
              Identification is uncertain. Please confirm this is the correct
              part before adding to your build.
            </CardDescription>
          </CardHeader>
          <div className="flex gap-3">
            <Button onClick={() => confirmMatch(pendingMatch)}>
              Yes, add {pendingMatch.component.name}
            </Button>
            <Button variant="outline" onClick={() => setPendingMatch(null)}>
              Cancel
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
