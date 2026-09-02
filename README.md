# PC Flip Pro

Professional PC Reseller Compatibility & Profit Calculator — a full-stack web app for PC resellers to evaluate builds, check compatibility, analyze deals, and calculate profit.

## Features

- **Compatibility Engine** — Local rule-based checks (CPU socket, RAM type/speed, GPU clearance, PSU wattage, M.2 slots, cooler fit, and more)
- **Build Analyzer** — Quality score, performance estimates, part value breakdown, upgrade recommendations
- **Deal Analyzer** — Paste listings for GREAT/GOOD/FAIR/BAD ratings with buy/no-buy guidance
- **Profit Calculator** — ROI, break-even, max purchase price, marketplace fees
- **Parts Database** — 60+ expandable components (AMD/Intel CPUs, NVIDIA/AMD GPUs, motherboards, RAM, storage, PSUs, cases, coolers)
- **Inventory Dashboard** — Track multiple PC flips with charts and business metrics
- **Part Scanner** — Image upload + text identification with confirm flow
- **No API Required** — All compatibility and pricing logic runs locally; architecture supports future API integrations

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS 4
- Zustand (state + localStorage persistence)
- Recharts (inventory charts)

## Architecture

```
src/lib/
├── database/          # Component specs (expandable JSON-like structures)
├── compatibility/   # Rule-based compatibility engine
├── pricing/           # Local price estimation + API provider interfaces
├── reseller/          # Profit, deal analysis, upgrades, quality scoring
├── performance/       # Performance classification
├── image/             # Part scanner + vision API hooks
├── inventory/         # Zustand store with persistence
└── types/             # Shared TypeScript types
```

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Workflow

1. **See PC** → Enter parts in Build Analyzer or paste a listing in Deal Analyzer
2. **Check Compatibility** → Automatic analysis across all component pairs
3. **Estimate Value** → Part-out vs complete PC comparison
4. **Find Weak Parts** → Upgrade recommendations ranked by profit
5. **Calculate Profit** → Enter costs, get ROI and max purchase price
6. **Get Recommendation** → GOOD FLIP / PASS verdict with reasoning

## Adding Components

Add new parts to `src/lib/database/` following the typed interfaces in `src/lib/types/components.ts`. The database index auto-aggregates all category files.

## Future API Integrations

Provider interfaces are ready for:
- **eBay Browse API** — live used-listing comps (see `.env.example`)
- Amazon pricing
- PCPartPicker data
- OpenAI Vision (part scanner)

### eBay API setup

1. Create a keyset at [developer.ebay.com](https://developer.ebay.com/my/keys) (start with **Sandbox**)
2. Copy `.env.example` to `.env.local` and fill in:
   - `EBAY_CLIENT_ID` — your App ID
   - `EBAY_CLIENT_SECRET` — your Cert ID
   - `EBAY_ENVIRONMENT=sandbox` (switch to `production` when ready)
3. Restart the dev server — Deal and Build pages will show live eBay comps
