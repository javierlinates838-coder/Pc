import type { ComponentMap, Storage } from "@/lib/types/components";

export interface VisualizerLabel {
  id: string;
  text: string;
  subtext?: string;
  /** Normalized position in case interior (0–1) */
  x: number;
  y: number;
  z: number;
}

export interface VisualizerMeta {
  caseLabel: string;
  boardLabel: string;
  dimensions: string;
  labels: VisualizerLabel[];
}

export function getVisualizerMeta(build: ComponentMap): VisualizerMeta {
  const labels: VisualizerLabel[] = [];
  const mb = build.motherboard;
  const gpu = build.gpu;
  const cooler = build.cooler;
  const psu = build.psu;
  const ram = build.ram;
  const storage = build.storage;

  const caseName = build.case?.name ?? "Full Tower XL";
  const boardFf = mb?.formFactor ?? "MATX";
  const caseLabel = build.case
    ? `${build.case.name.split(" ").slice(0, 2).join(" ")}`
    : "FULL TOWER XL";
  const boardLabel = mb
    ? `${mb.model.split(" ").slice(0, 2).join(" ")} · ${mb.formFactor}`
    : "NO BOARD";

  const caseW = build.case?.maxGpuLengthMm ? 520 : 480;
  const caseH = build.case?.maxCpuCoolerHeightMm ? 590 : 520;
  const dimensions = `${caseW}mm × ${caseH}mm`;

  if (mb) {
    labels.push({
      id: "mb",
      text: `${shortName(mb)} · ${mb.formFactor}`,
      subtext: `${mb.chipset} · ${mb.socket}`,
      x: 0.35,
      y: 0.42,
      z: 0.15,
    });
  }

  if (gpu) {
    labels.push({
      id: "gpu",
      text: `${shortName(gpu)} · ${gpu.vramGb}GB`,
      subtext: `${gpu.lengthMm}mm · ${gpu.tdpWatts}W`,
      x: 0.55,
      y: 0.38,
      z: 0.45,
    });
  }

  if (cooler) {
    const height =
      cooler.type === "aio"
        ? `${cooler.radiatorSizeMm ?? 240}mm AIO`
        : `${cooler.heightMm ?? 155}mm tall`;
    labels.push({
      id: "cooler",
      text: `${shortName(cooler)}`,
      subtext: height,
      x: 0.38,
      y: 0.62,
      z: 0.2,
    });
  }

  if (psu) {
    labels.push({
      id: "psu",
      text: `${psu.wattage}W ${psu.efficiency}`,
      subtext: psu.modular.replace("-", " "),
      x: 0.72,
      y: 0.18,
      z: 0.25,
    });
  }

  if (ram) {
    labels.push({
      id: "ram",
      text: `${ram.capacityGb}GB ${ram.type}-${ram.speedMhz}`,
      subtext: `${ram.modules}×${ram.capacityGb / ram.modules}GB`,
      x: 0.42,
      y: 0.48,
      z: 0.08,
    });
  }

  if (build.cpu) {
    labels.push({
      id: "cpu",
      text: shortName(build.cpu),
      subtext: build.cpu.socket,
      x: 0.38,
      y: 0.52,
      z: 0.12,
    });
  }

  if (storage?.length) {
    const totalGb = storage.reduce((s, d) => s + d.capacityGb, 0);
    const primary = storage[0] as Storage;
    labels.push({
      id: "storage",
      text: formatStorageLabel(storage),
      subtext: primary.interface,
      x: 0.28,
      y: 0.35,
      z: 0.05,
    });
  }

  return {
    caseLabel: caseLabel.toUpperCase(),
    boardLabel: boardLabel.toUpperCase(),
    dimensions,
    labels,
  };
}

function shortName(component: { brand: string; model: string; name: string }): string {
  const model = component.model;
  if (model.length <= 24) return model;
  return component.name.length <= 28 ? component.name : model.slice(0, 22) + "…";
}

function formatStorageLabel(storage: Storage[]): string {
  const total = storage.reduce((s, d) => s + d.capacityGb, 0);
  const label =
    total >= 1000 ? `${total / 1000}TB` : `${total}GB`;
  const type = storage[0]?.type === "NVMe" ? "NVMe" : storage[0]?.type ?? "Storage";
  return `${label} ${type}`;
}
