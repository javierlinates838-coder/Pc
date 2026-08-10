"use client";

import { useState, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { scanFromImageFile, scanFromText } from "@/lib/image/scanner";
import { useBuildStore } from "@/lib/inventory/store";
import type { ComponentMap } from "@/lib/types/components";
import { Upload, Camera, Search } from "lucide-react";
import type { ScanMatch } from "@/lib/image/scanner";
import { PageHeader } from "@/components/layout/page-header";

export default function ScannerPage() {
  const [scanResult, setScanResult] = useState<{
    matches: ScanMatch[];
    extractedText: string;
  } | null>(null);
  const [textInput, setTextInput] = useState("");
  const [pendingMatch, setPendingMatch] = useState<ScanMatch | null>(null);
  const { setPart } = useBuildStore();

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const result = await scanFromImageFile(file);
      setScanResult(result);
      if (result.matches.length > 0) {
        setPendingMatch(result.matches[0]);
      }
    },
    []
  );

  const handleTextScan = () => {
    const result = scanFromText(textInput);
    setScanResult(result);
    if (result.matches.length > 0) {
      setPendingMatch(result.matches[0]);
    }
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
    alert(`Added ${component.name} to build!`);
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
        description="Upload a photo or enter text to identify PC components"
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
              Type or paste component name/model text
            </CardDescription>
          </CardHeader>
          <Textarea
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="e.g. NVIDIA GeForce RTX 3060 12GB"
            rows={4}
          />
          <Button onClick={handleTextScan} className="mt-3">
            Identify Component
          </Button>
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
                  <Button
                    size="sm"
                    onClick={() => confirmMatch(match)}
                  >
                    {match.confidence === "low" ? "Confirm & Add" : "Add to Build"}
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--color-muted-foreground)]">
              No matches found. Try the Parts Database to search manually.
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

      <Card>
        <CardHeader>
          <CardTitle>API Integration (Future)</CardTitle>
          <CardDescription>
            Architecture supports adding vision APIs for better image recognition
          </CardDescription>
        </CardHeader>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <div className="p-3 rounded-lg bg-[var(--color-secondary)]">
            <p className="font-medium">OpenAI Vision</p>
            <p className="text-xs text-[var(--color-muted-foreground)]">
              Not configured
            </p>
          </div>
          <div className="p-3 rounded-lg bg-[var(--color-secondary)]">
            <p className="font-medium">Google Cloud Vision</p>
            <p className="text-xs text-[var(--color-muted-foreground)]">
              Not configured
            </p>
          </div>
          <div className="p-3 rounded-lg bg-[var(--color-secondary)]">
            <p className="font-medium">Local Pattern Matcher</p>
            <p className="text-xs text-green-400">Active</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
