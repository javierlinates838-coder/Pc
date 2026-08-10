import type { PCComponent } from "@/lib/types/components";

export interface SpecLine {
  label: string;
  value: string;
}

export function getComponentSpecLines(component: PCComponent): SpecLine[] {
  const lines: SpecLine[] = [];

  if (component.releaseYear) {
    lines.push({ label: "Release", value: String(component.releaseYear) });
  }

  switch (component.category) {
    case "cpu":
      lines.push(
        { label: "Socket", value: component.socket },
        { label: "Cores / Threads", value: `${component.cores}C / ${component.threads}T` },
        {
          label: "Clock",
          value: `${component.baseClockGhz}–${component.boostClockGhz} GHz`,
        },
        { label: "TDP", value: `${component.tdpWatts}W` },
        { label: "Memory", value: component.ddrGeneration },
        { label: "Chipsets", value: component.chipsetCompatibility.join(", ") },
        {
          label: "iGPU",
          value: component.integratedGraphics ? "Yes" : "No",
        }
      );
      break;
    case "gpu":
      lines.push(
        { label: "VRAM", value: `${component.vramGb} GB` },
        { label: "TDP", value: `${component.tdpWatts}W` },
        { label: "Length", value: `${component.lengthMm} mm` },
        { label: "Slots", value: `${component.slotWidth}-slot` },
        { label: "PCIe", value: `Gen ${component.pcieGen}` },
        {
          label: "Power",
          value: `${component.powerConnectors.join(" + ")} · ${component.minPsuWatts}W PSU min`,
        }
      );
      break;
    case "motherboard":
      lines.push(
        { label: "Socket", value: component.socket },
        { label: "Chipset", value: component.chipset },
        { label: "Form Factor", value: component.formFactor },
        {
          label: "RAM",
          value: `${component.ramType} · ${component.ramSlots} slots · up to ${component.maxRamGb}GB`,
        },
        {
          label: "M.2",
          value: `${component.m2Slots} slots (${component.m2Interfaces.join(", ")})`,
        },
        { label: "SATA", value: `${component.sataPorts} ports` },
        {
          label: "Wireless",
          value: component.wifiIncluded
            ? `WiFi + ${component.bluetoothIncluded ? "BT" : "no BT"}`
            : "None",
        }
      );
      break;
    case "ram":
      lines.push(
        { label: "Type", value: component.type },
        { label: "Capacity", value: `${component.capacityGb} GB` },
        { label: "Speed", value: `${component.speedMhz} MHz` },
        { label: "Modules", value: `${component.modules}x` },
        { label: "RGB", value: component.rgb ? "Yes" : "No" }
      );
      break;
    case "storage":
      lines.push(
        { label: "Type", value: component.type },
        { label: "Capacity", value: formatCapacity(component.capacityGb) },
        { label: "Interface", value: component.interface },
        { label: "Form Factor", value: component.formFactor }
      );
      if (component.readSpeedMbps) {
        lines.push({
          label: "Read / Write",
          value: `${component.readSpeedMbps} / ${component.writeSpeedMbps ?? "?"} MB/s`,
        });
      }
      break;
    case "psu":
      lines.push(
        { label: "Wattage", value: `${component.wattage}W` },
        { label: "Efficiency", value: `80+ ${component.efficiency}` },
        { label: "Modular", value: component.modular },
        { label: "Form Factor", value: component.formFactor },
        {
          label: "Connectors",
          value: `${component.pcieConnectors.length} PCIe · ${component.sataConnectors} SATA`,
        }
      );
      break;
    case "cooler":
      lines.push(
        { label: "Type", value: component.type === "aio" ? "AIO Liquid" : "Air" },
        {
          label: "Sockets",
          value: component.supportedSockets.join(", "),
        },
        { label: "TDP Rating", value: `${component.tdpRatingWatts}W` }
      );
      if (component.heightMm) {
        lines.push({ label: "Height", value: `${component.heightMm} mm` });
      }
      if (component.radiatorSizeMm) {
        lines.push({
          label: "Radiator",
          value: `${component.radiatorSizeMm} mm`,
        });
      }
      break;
    case "case":
      lines.push(
        {
          label: "Form Factors",
          value: component.supportedFormFactors.join(", "),
        },
        { label: "GPU Clearance", value: `${component.maxGpuLengthMm} mm` },
        {
          label: "CPU Cooler Max",
          value: `${component.maxCpuCoolerHeightMm} mm`,
        },
        {
          label: "Radiators",
          value: `${component.supportedRadiatorSizesMm.join(", ")} mm`,
        },
        { label: "Included Fans", value: String(component.includedFans) }
      );
      break;
    case "fans":
      lines.push(
        { label: "Size", value: `${component.sizeMm} mm` },
        { label: "Quantity", value: `${component.quantity}-pack` },
        { label: "PWM", value: component.pwm ? "Yes" : "No" },
        {
          label: "Lighting",
          value: component.argb ? "ARGB" : component.rgb ? "RGB" : "None",
        }
      );
      break;
    case "wifi":
      lines.push(
        { label: "WiFi", value: component.wifiStandard },
        { label: "Bluetooth", value: component.bluetooth },
        { label: "Interface", value: component.interface }
      );
      break;
    case "os":
      lines.push(
        { label: "Version", value: component.version },
        { label: "License", value: component.licenseType }
      );
      break;
  }

  return lines;
}

function formatCapacity(gb: number): string {
  if (gb >= 1000) return `${gb / 1000} TB`;
  return `${gb} GB`;
}

export function getSearchableText(component: PCComponent): string {
  const specLines = getComponentSpecLines(component)
    .map((l) => `${l.label} ${l.value}`)
    .join(" ");
  return `${component.name} ${component.brand} ${component.model} ${component.specsSummary ?? ""} ${component.tags?.join(" ") ?? ""} ${specLines}`.toLowerCase();
}
