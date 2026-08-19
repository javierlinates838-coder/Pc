import type { PerformanceTier } from "@/lib/types/components";

export interface GameFpsEstimate {
  game: string;
  fps1080p: number;
  fps1440p: number;
  settings: string;
}

/** Estimated FPS by GPU tier — conservative used for flip listings */
const TIER_MULTIPLIER: Record<PerformanceTier, number> = {
  entry: 0.35,
  budget: 0.55,
  mid: 0.75,
  "upper-mid": 0.9,
  high: 1.0,
  enthusiast: 1.15,
};

const GAME_BASE: Array<{
  game: string;
  base1080p: number;
  base1440p: number;
  settings: string;
}> = [
  { game: "Fortnite", base1080p: 180, base1440p: 110, settings: "Competitive" },
  { game: "Valorant", base1080p: 280, base1440p: 180, settings: "High" },
  { game: "CS2", base1080p: 220, base1440p: 140, settings: "High" },
  { game: "GTA V", base1080p: 120, base1440p: 75, settings: "High" },
  { game: "Cyberpunk 2077", base1080p: 85, base1440p: 52, settings: "Medium" },
  { game: "Elden Ring", base1080p: 95, base1440p: 62, settings: "High" },
  { game: "Call of Duty", base1080p: 130, base1440p: 88, settings: "High" },
  { game: "Minecraft", base1080p: 300, base1440p: 200, settings: "High" },
  { game: "Apex Legends", base1080p: 165, base1440p: 105, settings: "High" },
  { game: "Red Dead 2", base1080p: 78, base1440p: 48, settings: "Medium" },
];

export function estimateGameFps(gpuTier: PerformanceTier): GameFpsEstimate[] {
  const mult = TIER_MULTIPLIER[gpuTier];
  return GAME_BASE.map((g) => ({
    game: g.game,
    fps1080p: Math.round(g.base1080p * mult),
    fps1440p: Math.round(g.base1440p * mult),
    settings: g.settings,
  }));
}

export function getFpsSummary(gpuTier: PerformanceTier): string {
  const estimates = estimateGameFps(gpuTier);
  const top = estimates.find((e) => e.game === "Fortnite") ?? estimates[0];
  return `~${top.fps1080p} FPS Fortnite 1080p · ~${top.fps1440p} FPS 1440p (${gpuTier} GPU tier)`;
}
