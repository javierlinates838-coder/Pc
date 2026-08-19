"use client";

import { useState } from "react";
import { Copy, Check, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatBuildMarkdown, formatBuildPlainList } from "@/lib/build/build-export";
import type { ComponentMap } from "@/lib/types/components";

interface BuildExportPanelProps {
  build: ComponentMap;
  buildName: string;
  listPrice?: number;
  purchasePrice?: number;
  profit?: number;
}

export function BuildExportPanel({
  build,
  buildName,
  listPrice,
  purchasePrice,
  profit,
}: BuildExportPanelProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const markdown = formatBuildMarkdown(build, buildName, {
    listPrice,
    purchasePrice,
    profit,
  });
  const plain = formatBuildPlainList(build, buildName);

  const copy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Share2 className="h-4 w-4 text-[var(--color-primary)]" />
          Share build
        </CardTitle>
        <CardDescription>
          Reddit / Discord table export — plus flip numbers BuildCores doesn&apos;t show.
        </CardDescription>
      </CardHeader>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => copy(markdown, "md")}
        >
          {copied === "md" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          Reddit markdown
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => copy(plain, "plain")}
        >
          {copied === "plain" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          One-line title
        </Button>
      </div>
      <pre className="mt-3 max-h-32 overflow-auto rounded-xl bg-[var(--color-secondary)]/50 p-3 text-[10px] text-[var(--color-muted-foreground)] whitespace-pre-wrap">
        {markdown}
      </pre>
    </Card>
  );
}
