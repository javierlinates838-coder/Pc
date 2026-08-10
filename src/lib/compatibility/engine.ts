import type {
  CPU,
  GPU,
  Motherboard,
  RAM,
  Cooler,
  PSU,
  Storage,
  Case,
  Fans,
  ComponentMap,
} from "@/lib/types/components";
import type {
  CompatibilityResult,
  CompatibilityReport,
  CompatibilityStatus,
} from "@/lib/types/compatibility";

let resultCounter = 0;

function makeResult(
  status: CompatibilityStatus,
  title: string,
  message: string,
  category: string,
  partsInvolved: string[]
): CompatibilityResult {
  return {
    id: `compat-${++resultCounter}`,
    status,
    title,
    message,
    category,
    partsInvolved,
  };
}

function worstStatus(
  a: CompatibilityStatus,
  b: CompatibilityStatus
): CompatibilityStatus {
  const order: CompatibilityStatus[] = ["compatible", "warning", "incompatible"];
  return order[Math.max(order.indexOf(a), order.indexOf(b))];
}

function checkCpuMotherboardSocket(
  cpu: CPU,
  mb: Motherboard
): CompatibilityResult {
  if (cpu.socket === mb.socket) {
    return makeResult(
      "compatible",
      "CPU Socket Match",
      `${cpu.name} (${cpu.socket}) is compatible with ${mb.name} (${mb.socket} socket).`,
      "CPU ↔ Motherboard",
      [cpu.name, mb.name]
    );
  }
  return makeResult(
    "incompatible",
    "CPU Socket Mismatch",
    `${cpu.name} requires an ${cpu.socket} motherboard, but ${mb.name} uses an ${mb.socket} socket.`,
    "CPU ↔ Motherboard",
    [cpu.name, mb.name]
  );
}

function checkCpuChipset(cpu: CPU, mb: Motherboard): CompatibilityResult {
  if (cpu.chipsetCompatibility.includes(mb.chipset)) {
    return makeResult(
      "compatible",
      "Chipset Compatibility",
      `${cpu.name} is supported on ${mb.chipset} chipset motherboards.`,
      "CPU ↔ Chipset",
      [cpu.name, mb.name]
    );
  }
  return makeResult(
    "warning",
    "Chipset Compatibility",
    `${cpu.name} may not be officially supported on ${mb.chipset}. Verify BIOS compatibility before purchasing.`,
    "CPU ↔ Chipset",
    [cpu.name, mb.name]
  );
}

function checkRamType(ram: RAM, mb: Motherboard): CompatibilityResult {
  if (ram.type === mb.ramType) {
    return makeResult(
      "compatible",
      "RAM Type Match",
      `${ram.name} (${ram.type}) is compatible with ${mb.name} which supports ${mb.ramType}.`,
      "RAM ↔ Motherboard",
      [ram.name, mb.name]
    );
  }
  return makeResult(
    "incompatible",
    "RAM Type Mismatch",
    `${ram.name} uses ${ram.type}, but ${mb.name} only supports ${mb.ramType}.`,
    "RAM ↔ Motherboard",
    [ram.name, mb.name]
  );
}

function checkRamSpeed(ram: RAM, mb: Motherboard): CompatibilityResult {
  if (ram.speedMhz <= mb.maxRamSpeedMhz) {
    return makeResult(
      "compatible",
      "RAM Speed Support",
      `${ram.name} runs at ${ram.speedMhz}MHz, within ${mb.name}'s supported maximum of ${mb.maxRamSpeedMhz}MHz.`,
      "RAM Speed",
      [ram.name, mb.name]
    );
  }
  return makeResult(
    "warning",
    "RAM Speed Exceeds Motherboard",
    `${ram.name} is rated at ${ram.speedMhz}MHz, but ${mb.name} officially supports up to ${mb.maxRamSpeedMhz}MHz. RAM will likely run at the lower speed.`,
    "RAM Speed",
    [ram.name, mb.name]
  );
}

function checkRamCapacity(ram: RAM, mb: Motherboard): CompatibilityResult {
  if (ram.capacityGb <= mb.maxRamGb) {
    const status: CompatibilityStatus =
      ram.capacityGb < 16 ? "warning" : "compatible";
    const message =
      ram.capacityGb < 16
        ? `${ram.name} provides only ${ram.capacityGb}GB. 16GB+ is recommended for modern gaming and resale appeal.`
        : `${ram.name} (${ram.capacityGb}GB) is within ${mb.name}'s maximum of ${mb.maxRamGb}GB.`;
    return makeResult(
      status,
      "RAM Capacity",
      message,
      "RAM Capacity",
      [ram.name, mb.name]
    );
  }
  return makeResult(
    "incompatible",
    "RAM Capacity Exceeded",
    `${ram.name} (${ram.capacityGb}GB) exceeds ${mb.name}'s maximum supported ${mb.maxRamGb}GB.`,
    "RAM Capacity",
    [ram.name, mb.name]
  );
}

function checkRamSlots(ram: RAM, mb: Motherboard): CompatibilityResult {
  if (ram.modules <= mb.ramSlots) {
    return makeResult(
      "compatible",
      "RAM Slot Availability",
      `${ram.name} uses ${ram.modules} module(s) and ${mb.name} has ${mb.ramSlots} RAM slots available.`,
      "RAM Slots",
      [ram.name, mb.name]
    );
  }
  return makeResult(
    "incompatible",
    "Insufficient RAM Slots",
    `${ram.name} requires ${ram.modules} slots but ${mb.name} only has ${mb.ramSlots}.`,
    "RAM Slots",
    [ram.name, mb.name]
  );
}

function checkGpuCaseClearance(gpu: GPU, pcCase: Case): CompatibilityResult {
  if (gpu.lengthMm <= pcCase.maxGpuLengthMm) {
    return makeResult(
      "compatible",
      "GPU Case Clearance",
      `${gpu.name} (${gpu.lengthMm}mm) fits within ${pcCase.name}'s ${pcCase.maxGpuLengthMm}mm GPU clearance.`,
      "GPU ↔ Case",
      [gpu.name, pcCase.name]
    );
  }
  return makeResult(
    "incompatible",
    "GPU Too Long for Case",
    `${gpu.name} is ${gpu.lengthMm}mm long, but ${pcCase.name} only supports GPUs up to ${pcCase.maxGpuLengthMm}mm.`,
    "GPU ↔ Case",
    [gpu.name, pcCase.name]
  );
}

function checkGpuThickness(gpu: GPU): CompatibilityResult {
  if (gpu.slotWidth <= 2.5) {
    return makeResult(
      "compatible",
      "GPU Slot Width",
      `${gpu.name} is a ${gpu.slotWidth}-slot card, fitting standard PCIe slots.`,
      "GPU Slots",
      [gpu.name]
    );
  }
  return makeResult(
    "warning",
    "GPU Slot Width",
    `${gpu.name} is a ${gpu.slotWidth}-slot card. Ensure adjacent PCIe slots are clear and case has adequate width.`,
    "GPU Slots",
    [gpu.name]
  );
}

function checkPsuWattage(
  psu: PSU,
  cpu: CPU | undefined,
  gpu: GPU | undefined
): CompatibilityResult {
  const cpuWatts = cpu?.tdpWatts ?? 65;
  const gpuWatts = gpu?.tdpWatts ?? 0;
  const systemEstimate = Math.ceil(cpuWatts + gpuWatts + 100);
  const recommended = Math.ceil(systemEstimate * 1.3);
  const gpuMin = gpu?.minPsuWatts ?? 0;

  if (psu.wattage >= recommended && psu.wattage >= gpuMin) {
    return makeResult(
      "compatible",
      "PSU Wattage",
      `This ${psu.wattage}W PSU provides enough power for the estimated ${systemEstimate}W system (recommended: ${recommended}W with headroom).`,
      "PSU Wattage",
      [psu.name, cpu?.name, gpu?.name].filter(Boolean) as string[]
    );
  }
  if (psu.wattage >= systemEstimate) {
    return makeResult(
      "warning",
      "PSU Wattage Tight",
      `${psu.wattage}W PSU meets minimum requirements (~${systemEstimate}W) but has limited headroom. ${recommended}W+ recommended for stability and upgrades.`,
      "PSU Wattage",
      [psu.name]
    );
  }
  return makeResult(
    "incompatible",
    "Insufficient PSU Wattage",
    `${psu.wattage}W PSU is insufficient. Estimated system draw is ~${systemEstimate}W. Minimum recommended: ${recommended}W.`,
    "PSU Wattage",
    [psu.name]
  );
}

function checkGpuPowerConnectors(gpu: GPU, psu: PSU): CompatibilityResult {
  const needed = gpu.powerConnectors.length;
  const available = psu.pcieConnectors.length;

  if (available >= needed) {
    return makeResult(
      "compatible",
      "GPU Power Connectors",
      `${psu.name} has ${available} PCIe power connector(s) for ${gpu.name} which requires ${gpu.powerConnectors.join(", ")}.`,
      "PSU ↔ GPU",
      [psu.name, gpu.name]
    );
  }
  return makeResult(
    "incompatible",
    "Insufficient GPU Power Connectors",
    `${gpu.name} requires ${gpu.powerConnectors.join(" + ")} but ${psu.name} only has ${available} PCIe connector(s).`,
    "PSU ↔ GPU",
    [psu.name, gpu.name]
  );
}

function checkCoolerSocket(cooler: Cooler, cpu: CPU): CompatibilityResult {
  if (cooler.supportedSockets.includes(cpu.socket)) {
    return makeResult(
      "compatible",
      "Cooler Socket Compatibility",
      `${cooler.name} supports ${cpu.socket} socket for ${cpu.name}.`,
      "Cooler ↔ CPU",
      [cooler.name, cpu.name]
    );
  }
  return makeResult(
    "incompatible",
    "Cooler Socket Incompatible",
    `${cooler.name} does not support ${cpu.socket} socket required by ${cpu.name}. Supported: ${cooler.supportedSockets.join(", ")}.`,
    "Cooler ↔ CPU",
    [cooler.name, cpu.name]
  );
}

function checkCoolerCaseClearance(
  cooler: Cooler,
  pcCase: Case
): CompatibilityResult {
  if (cooler.type === "aio" && cooler.radiatorSizeMm) {
    if (pcCase.supportedRadiatorSizesMm.includes(cooler.radiatorSizeMm)) {
      return makeResult(
        "compatible",
        "AIO Radiator Mounting",
        `${cooler.name} (${cooler.radiatorSizeMm}mm radiator) is supported by ${pcCase.name}.`,
        "Cooler ↔ Case",
        [cooler.name, pcCase.name]
      );
    }
    return makeResult(
      "incompatible",
      "AIO Radiator Not Supported",
      `${cooler.name} requires a ${cooler.radiatorSizeMm}mm radiator mount, but ${pcCase.name} supports: ${pcCase.supportedRadiatorSizesMm.join(", ")}mm.`,
      "Cooler ↔ Case",
      [cooler.name, pcCase.name]
    );
  }

  if (cooler.heightMm && cooler.heightMm > pcCase.maxCpuCoolerHeightMm) {
    return makeResult(
      "incompatible",
      "CPU Cooler Too Tall",
      `${cooler.name} is ${cooler.heightMm}mm tall, exceeding ${pcCase.name}'s ${pcCase.maxCpuCoolerHeightMm}mm CPU cooler clearance.`,
      "Cooler ↔ Case",
      [cooler.name, pcCase.name]
    );
  }
  return makeResult(
    "compatible",
    "CPU Cooler Clearance",
    `${cooler.name} fits within ${pcCase.name}'s CPU cooler clearance.`,
    "Cooler ↔ Case",
    [cooler.name, pcCase.name]
  );
}

function checkCoolerTdp(cooler: Cooler, cpu: CPU): CompatibilityResult {
  if (cooler.tdpRatingWatts >= cpu.tdpWatts) {
    return makeResult(
      "compatible",
      "Cooler TDP Rating",
      `${cooler.name} (${cooler.tdpRatingWatts}W TDP rating) can handle ${cpu.name} (${cpu.tdpWatts}W TDP).`,
      "Cooler TDP",
      [cooler.name, cpu.name]
    );
  }
  return makeResult(
    "warning",
    "Cooler TDP May Be Insufficient",
    `${cooler.name} is rated for ${cooler.tdpRatingWatts}W but ${cpu.name} has a ${cpu.tdpWatts}W TDP. May run hot under load.`,
    "Cooler TDP",
    [cooler.name, cpu.name]
  );
}

function checkCaseFormFactor(
  mb: Motherboard,
  pcCase: Case
): CompatibilityResult {
  if (pcCase.supportedFormFactors.includes(mb.formFactor)) {
    return makeResult(
      "compatible",
      "Motherboard Form Factor",
      `${mb.name} (${mb.formFactor}) fits in ${pcCase.name} which supports ${pcCase.supportedFormFactors.join(", ")}.`,
      "Case ↔ Motherboard",
      [mb.name, pcCase.name]
    );
  }
  return makeResult(
    "incompatible",
    "Motherboard Form Factor Mismatch",
    `${mb.name} is ${mb.formFactor} but ${pcCase.name} only supports ${pcCase.supportedFormFactors.join(", ")}.`,
    "Case ↔ Motherboard",
    [mb.name, pcCase.name]
  );
}

function checkPsuFormFactor(psu: PSU, pcCase: Case): CompatibilityResult {
  if (pcCase.psuFormFactor.includes(psu.formFactor)) {
    return makeResult(
      "compatible",
      "PSU Form Factor",
      `${psu.name} (${psu.formFactor}) is compatible with ${pcCase.name}.`,
      "PSU ↔ Case",
      [psu.name, pcCase.name]
    );
  }
  return makeResult(
    "incompatible",
    "PSU Form Factor Mismatch",
    `${psu.name} is ${psu.formFactor} but ${pcCase.name} only supports ${pcCase.psuFormFactor.join(", ")} PSU.`,
    "PSU ↔ Case",
    [psu.name, pcCase.name]
  );
}

function checkStorageCompatibility(
  storage: Storage,
  mb: Motherboard,
  index: number
): CompatibilityResult[] {
  const results: CompatibilityResult[] = [];

  if (storage.type === "NVMe") {
    if (index < mb.m2Slots) {
      const iface = mb.m2Interfaces[index] ?? mb.m2Interfaces[0];
      results.push(
        makeResult(
          "compatible",
          `M.2 Slot ${index + 1}`,
          `${storage.name} can use M.2 slot ${index + 1} on ${mb.name} (${iface}).`,
          "Storage ↔ M.2",
          [storage.name, mb.name]
        )
      );
    } else {
      results.push(
        makeResult(
          "incompatible",
          "No M.2 Slot Available",
          `${storage.name} requires an M.2 slot but ${mb.name} only has ${mb.m2Slots} M.2 slot(s). Already using ${index} slot(s).`,
          "Storage ↔ M.2",
          [storage.name, mb.name]
        )
      );
    }
  }

  if (storage.type === "SATA SSD" || storage.type === "HDD") {
    results.push(
      makeResult(
        "compatible",
        "SATA Storage",
        `${storage.name} connects via SATA. ${mb.name} has ${mb.sataPorts} SATA port(s) available.`,
        "Storage ↔ SATA",
        [storage.name, mb.name]
      )
    );
  }

  return results;
}

function checkFanHeaders(
  fans: Fans,
  mb: Motherboard,
  pcCase: Case | undefined
): CompatibilityResult {
  const totalFans = fans.quantity + (pcCase?.includedFans ?? 0);
  if (totalFans <= mb.fanHeaders) {
    return makeResult(
      "compatible",
      "Fan Headers",
      `${totalFans} fan(s) can be connected to ${mb.name}'s ${mb.fanHeaders} fan header(s).`,
      "Fans ↔ Motherboard",
      [fans.name, mb.name]
    );
  }
  return makeResult(
    "warning",
    "Insufficient Fan Headers",
    `${totalFans} fan(s) exceed ${mb.name}'s ${mb.fanHeaders} fan header(s). A fan hub/splitter may be required.`,
    "Fans ↔ Motherboard",
    [fans.name, mb.name]
  );
}

function checkArgbCompatibility(
  fans: Fans,
  mb: Motherboard
): CompatibilityResult | null {
  if (!fans.argb && !fans.rgb) return null;

  if (mb.argbHeaders > 0 || mb.rgbHeaders > 0) {
    return makeResult(
      "compatible",
      "RGB/ARGB Headers",
      `${fans.name} RGB lighting can connect to ${mb.name}'s ${mb.argbHeaders} ARGB / ${mb.rgbHeaders} RGB header(s).`,
      "RGB Compatibility",
      [fans.name, mb.name]
    );
  }
  return makeResult(
    "warning",
    "No RGB Headers on Motherboard",
    `${fans.name} has RGB lighting but ${mb.name} has no ARGB/RGB headers. Use a separate RGB controller.`,
    "RGB Compatibility",
    [fans.name, mb.name]
  );
}

function checkFanSize(fans: Fans, pcCase: Case): CompatibilityResult {
  if (pcCase.fanSizesSupported.includes(fans.sizeMm)) {
    return makeResult(
      "compatible",
      "Fan Size Compatibility",
      `${fans.name} (${fans.sizeMm}mm) is supported by ${pcCase.name}.`,
      "Fans ↔ Case",
      [fans.name, pcCase.name]
    );
  }
  return makeResult(
    "warning",
    "Fan Size May Not Fit",
    `${fans.name} is ${fans.sizeMm}mm but ${pcCase.name} supports ${pcCase.fanSizesSupported.join(", ")}mm fans.`,
    "Fans ↔ Case",
    [fans.name, pcCase.name]
  );
}

export function analyzeCompatibility(parts: ComponentMap): CompatibilityReport {
  resultCounter = 0;
  const results: CompatibilityResult[] = [];

  const { cpu, gpu, motherboard, ram, cooler, psu, storage, case: pcCase, fans } =
    parts;

  if (cpu && motherboard) {
    results.push(checkCpuMotherboardSocket(cpu, motherboard));
    results.push(checkCpuChipset(cpu, motherboard));
  }

  if (ram && motherboard) {
    results.push(checkRamType(ram, motherboard));
    results.push(checkRamSpeed(ram, motherboard));
    results.push(checkRamCapacity(ram, motherboard));
    results.push(checkRamSlots(ram, motherboard));
  }

  if (cpu && ram && motherboard) {
    const cpuDdr = cpu.ddrGeneration;
    if (
      cpuDdr !== "DDR4|DDR5" &&
      ram.type !== cpuDdr &&
      motherboard.ramType !== ram.type
    ) {
      results.push(
        makeResult(
          "warning",
          "CPU RAM Generation",
          `${cpu.name} platform typically uses ${cpuDdr}. Verify RAM and motherboard match.`,
          "CPU ↔ RAM",
          [cpu.name, ram.name]
        )
      );
    }
  }

  if (gpu && pcCase) {
    results.push(checkGpuCaseClearance(gpu, pcCase));
    results.push(checkGpuThickness(gpu));
  }

  if (psu) {
    results.push(checkPsuWattage(psu, cpu, gpu));
    if (gpu) results.push(checkGpuPowerConnectors(gpu, psu));
  }

  if (cooler && cpu) {
    results.push(checkCoolerSocket(cooler, cpu));
    results.push(checkCoolerTdp(cooler, cpu));
  }

  if (cooler && pcCase) {
    results.push(checkCoolerCaseClearance(cooler, pcCase));
  }

  if (motherboard && pcCase) {
    results.push(checkCaseFormFactor(motherboard, pcCase));
  }

  if (psu && pcCase) {
    results.push(checkPsuFormFactor(psu, pcCase));
  }

  if (storage && motherboard) {
    let m2Index = 0;
    for (const drive of storage) {
      if (drive.type === "NVMe") {
        results.push(...checkStorageCompatibility(drive, motherboard, m2Index));
        m2Index++;
      } else {
        results.push(...checkStorageCompatibility(drive, motherboard, 0));
      }
    }
  }

  if (fans && motherboard) {
    results.push(checkFanHeaders(fans, motherboard, pcCase));
    const argbResult = checkArgbCompatibility(fans, motherboard);
    if (argbResult) results.push(argbResult);
  }

  if (fans && pcCase) {
    results.push(checkFanSize(fans, pcCase));
  }

  if (gpu && motherboard) {
    results.push(
      makeResult(
        "compatible",
        "GPU PCIe Compatibility",
        `${gpu.name} (PCIe ${gpu.pcieGen}.0) works with ${motherboard.name} (PCIe ${motherboard.pcieGen}.0 x16 slot).`,
        "GPU ↔ Motherboard",
        [gpu.name, motherboard.name]
      )
    );
  }

  if (results.length === 0) {
    results.push(
      makeResult(
        "warning",
        "Insufficient Parts",
        "Add more components to run a full compatibility analysis.",
        "General",
        []
      )
    );
  }

  const compatibleCount = results.filter((r) => r.status === "compatible").length;
  const warningCount = results.filter((r) => r.status === "warning").length;
  const incompatibleCount = results.filter(
    (r) => r.status === "incompatible"
  ).length;

  let overallStatus: CompatibilityStatus = "compatible";
  for (const r of results) {
    overallStatus = worstStatus(overallStatus, r.status);
  }

  return {
    results,
    overallStatus,
    compatibleCount,
    warningCount,
    incompatibleCount,
  };
}
