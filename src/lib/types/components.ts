export type PartCategory =
  | "cpu"
  | "gpu"
  | "motherboard"
  | "ram"
  | "cooler"
  | "psu"
  | "storage"
  | "case"
  | "fans"
  | "wifi"
  | "os";

export type Condition = "new" | "like-new" | "used" | "fair" | "parts";

export type PerformanceTier =
  | "entry"
  | "budget"
  | "mid"
  | "upper-mid"
  | "high"
  | "enthusiast";

export interface PriceRange {
  usedMin: number;
  usedMax: number;
  newMin: number;
  newMax: number;
}

export interface BaseComponent {
  id: string;
  name: string;
  brand: string;
  model: string;
  category: PartCategory;
  performanceTier: PerformanceTier;
  pricing: PriceRange;
  releaseYear?: number;
  tags?: string[];
  /** Short human-readable summary for UI / deal parsing */
  specsSummary?: string;
}

export interface CPU extends BaseComponent {
  category: "cpu";
  socket: string;
  cores: number;
  threads: number;
  baseClockGhz: number;
  boostClockGhz: number;
  tdpWatts: number;
  integratedGraphics: boolean;
  chipsetCompatibility: string[];
  pcieGen: number;
  ddrGeneration: "DDR4" | "DDR5" | "DDR4|DDR5";
  maxMemorySpeedMhz?: number;
}

export interface GPU extends BaseComponent {
  category: "gpu";
  chipset: string;
  vramGb: number;
  tdpWatts: number;
  lengthMm: number;
  slotWidth: number;
  pcieGen: number;
  powerConnectors: string[];
  minPsuWatts: number;
}

export interface Motherboard extends BaseComponent {
  category: "motherboard";
  socket: string;
  chipset: string;
  formFactor: "ATX" | "Micro-ATX" | "Mini-ITX";
  ramType: "DDR4" | "DDR5";
  ramSlots: number;
  maxRamGb: number;
  maxRamSpeedMhz: number;
  m2Slots: number;
  m2Interfaces: ("NVMe PCIe 3.0" | "NVMe PCIe 4.0" | "NVMe PCIe 5.0" | "SATA")[];
  sataPorts: number;
  pcieX16Slots: number;
  pcieGen: number;
  fanHeaders: number;
  argbHeaders: number;
  rgbHeaders: number;
  usb2Headers: number;
  usb3Headers: number;
  usbCFrontHeader: boolean;
  cpuPowerConnectors: string[];
  atxPowerConnector: string;
  wifiIncluded: boolean;
  bluetoothIncluded: boolean;
}

export interface RAM extends BaseComponent {
  category: "ram";
  type: "DDR4" | "DDR5";
  capacityGb: number;
  speedMhz: number;
  modules: number;
  rgb: boolean;
}

export interface Cooler extends BaseComponent {
  category: "cooler";
  type: "air" | "aio";
  supportedSockets: string[];
  heightMm?: number;
  radiatorSizeMm?: 120 | 140 | 240 | 280 | 360;
  tdpRatingWatts: number;
  rgb: boolean;
}

export interface PSU extends BaseComponent {
  category: "psu";
  wattage: number;
  efficiency: "Bronze" | "Gold" | "Platinum" | "Titanium";
  modular: "non-modular" | "semi-modular" | "fully-modular";
  formFactor: "ATX" | "SFX";
  cpuConnectors: string[];
  pcieConnectors: string[];
  sataConnectors: number;
  epsConnectors: number;
}

export interface Storage extends BaseComponent {
  category: "storage";
  type: "NVMe" | "SATA SSD" | "HDD";
  capacityGb: number;
  interface: "NVMe PCIe 3.0" | "NVMe PCIe 4.0" | "NVMe PCIe 5.0" | "SATA III";
  formFactor: "M.2" | "2.5\"" | "3.5\"";
  readSpeedMbps?: number;
  writeSpeedMbps?: number;
}

export interface Case extends BaseComponent {
  category: "case";
  supportedFormFactors: ("ATX" | "Micro-ATX" | "Mini-ITX")[];
  maxGpuLengthMm: number;
  maxCpuCoolerHeightMm: number;
  supportedRadiatorSizesMm: number[];
  psuFormFactor: ("ATX" | "SFX")[];
  maxPsuLengthMm?: number;
  includedFans: number;
  fanSizesSupported: number[];
  driveBays25: number;
  driveBays35: number;
}

export interface Fans extends BaseComponent {
  category: "fans";
  sizeMm: number;
  quantity: number;
  rgb: boolean;
  argb: boolean;
  pwm: boolean;
}

export interface WiFiModule extends BaseComponent {
  category: "wifi";
  wifiStandard: string;
  bluetooth: string;
  interface: "M.2 Key E" | "PCIe" | "USB";
}

export interface OperatingSystem extends BaseComponent {
  category: "os";
  version: string;
  licenseType: "retail" | "oem" | "digital";
}

export type PCComponent =
  | CPU
  | GPU
  | Motherboard
  | RAM
  | Cooler
  | PSU
  | Storage
  | Case
  | Fans
  | WiFiModule
  | OperatingSystem;

export type ComponentMap = {
  cpu?: CPU;
  gpu?: GPU;
  motherboard?: Motherboard;
  ram?: RAM;
  cooler?: Cooler;
  psu?: PSU;
  storage?: Storage[];
  case?: Case;
  fans?: Fans;
  wifi?: WiFiModule;
  os?: OperatingSystem;
};

export interface BuildPartEntry {
  component: PCComponent;
  condition: Condition;
  customPrice?: number;
}

export interface PCBuild {
  id: string;
  name: string;
  parts: Partial<Record<PartCategory, BuildPartEntry | BuildPartEntry[]>>;
  createdAt: string;
  updatedAt: string;
}

export function isStorageArray(
  entry: BuildPartEntry | BuildPartEntry[] | undefined
): entry is BuildPartEntry[] {
  return Array.isArray(entry);
}

export function getSinglePart(
  entry: BuildPartEntry | BuildPartEntry[] | undefined
): BuildPartEntry | undefined {
  if (!entry) return undefined;
  return Array.isArray(entry) ? entry[0] : entry;
}

export function getStorageParts(
  entry: BuildPartEntry | BuildPartEntry[] | undefined
): BuildPartEntry[] {
  if (!entry) return [];
  return Array.isArray(entry) ? entry : [entry];
}
