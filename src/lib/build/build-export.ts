import type { ComponentMap } from "@/lib/types/components";
import { formatCurrency } from "@/lib/utils";
import { getPartCount } from "./helpers";

const CATEGORY_ORDER: (keyof ComponentMap)[] = [
  "cpu",
  "gpu",
  "motherboard",
  "ram",
  "cooler",
  "storage",
  "psu",
  "case",
  "fans",
  "wifi",
  "os",
];

export function formatBuildMarkdown(
  build: ComponentMap,
  name: string,
  extras?: { listPrice?: number; purchasePrice?: number; profit?: number }
): string {
  const lines: string[] = [`**${name}**`, "", "| Part | Component |", "| --- | --- |"];

  for (const key of CATEGORY_ORDER) {
    const val = build[key];
    if (!val) continue;
    if (key === "storage" && Array.isArray(val)) {
      for (const s of val) {
        lines.push(`| Storage | ${s.name} |`);
      }
    } else if (!Array.isArray(val)) {
      const label = key.charAt(0).toUpperCase() + key.slice(1);
      lines.push(`| ${label} | ${val.name} |`);
    }
  }

  if (extras?.listPrice) {
    lines.push("", `**List price est.** ${formatCurrency(extras.listPrice)}`);
  }
  if (extras?.purchasePrice) {
    lines.push(`**Purchase** ${formatCurrency(extras.purchasePrice)}`);
  }
  if (extras?.profit !== undefined) {
    lines.push(`**Profit est.** ${formatCurrency(extras.profit)}`);
  }

  lines.push("", "_Built with PC Flip Pro_");
  return lines.join("\n");
}

export function formatBuildPlainList(build: ComponentMap, name: string): string {
  const parts: string[] = [name];
  for (const key of CATEGORY_ORDER) {
    const val = build[key];
    if (!val) continue;
    if (key === "storage" && Array.isArray(val)) {
      for (const s of val) parts.push(s.name);
    } else if (!Array.isArray(val)) {
      parts.push(val.name);
    }
  }
  return parts.join(" · ");
}

export function getBuildPartCount(build: ComponentMap): number {
  return getPartCount(build);
}
