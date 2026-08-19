import type { ComponentMap } from "@/lib/types/components";
import { getVisualizerMeta, type VisualizerLabel } from "./visualizer-labels";

export interface VisualizerSceneData {
  labels: VisualizerLabel[];
  hasParts: boolean;
  caseLabel: string;
  boardLabel: string;
  dimensions: string;
  /** GPU length scale 0.4–1.2 relative to reference 300mm */
  gpuScale: number;
  gpuSlotHeight: number;
  coolerScale: number;
  coolerIsAio: boolean;
  radiatorMm?: number;
  hasRgb: boolean;
  fanCount: number;
  clearanceGpuMm?: number;
  clearanceCoolerMm?: number;
}

export function getVisualizerSceneData(build: ComponentMap): VisualizerSceneData {
  const meta = getVisualizerMeta(build);
  const gpu = build.gpu;
  const cooler = build.cooler;
  const casePart = build.case;

  const gpuScale = gpu
    ? Math.min(1.25, Math.max(0.45, gpu.lengthMm / 300))
    : 0.55;
  const gpuSlotHeight = gpu ? Math.min(1.4, 0.7 + gpu.slotWidth * 0.25) : 0.7;

  const coolerHeight = cooler?.heightMm ?? cooler?.radiatorSizeMm ?? 155;
  const coolerScale = Math.min(1.2, Math.max(0.5, coolerHeight / 160));
  const coolerIsAio = cooler?.type === "aio";

  const hasRgb =
    build.ram?.rgb ||
    build.cooler?.rgb ||
    build.fans?.rgb ||
    build.gpu?.tags?.includes("rgb");

  const fanCount = build.fans?.quantity ?? 0;
  const hasParts = Object.keys(build).length > 0;

  return {
    ...meta,
    hasParts,
    gpuScale,
    gpuSlotHeight,
    coolerScale,
    coolerIsAio,
    radiatorMm: cooler?.radiatorSizeMm,
    hasRgb: !!hasRgb,
    fanCount,
    clearanceGpuMm: casePart?.maxGpuLengthMm,
    clearanceCoolerMm: casePart?.maxCpuCoolerHeightMm,
  };
}
