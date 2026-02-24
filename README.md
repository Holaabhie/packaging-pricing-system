# 📦 Nexus — Flexible Packaging Cost Estimation & Analytics

> An end-to-end cost estimation system for the **flexible packaging industry**. Built for converters, packaging businesses, and sales teams who need accurate, fast, and transparent pricing for pouches, sachets, and laminates.

---

## 📋 Table of Contents

- [The Problem](#the-problem)
- [How Nexus Solves It](#how-nexus-solves-it)
- [Core Calculation Engine](#core-calculation-engine)
  - [Step 1 — Pouch Dimensions](#step-1--pouch-dimensions)
  - [Step 2 — Film Structure & Material Cost](#step-2--film-structure--material-cost)
  - [Step 3 — Ink Cost](#step-3--ink-cost)
  - [Step 4 — Weight Calculation](#step-4--weight-calculation)
  - [Step 5 — Conversion & Operational Costs](#step-5--conversion--operational-costs)
  - [Step 6 — Cylinder Amortization](#step-6--cylinder-amortization)
  - [Step 7 — Total Cost & Pricing](#step-7--total-cost--pricing)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
- [Industry Presets](#industry-presets)
- [Screenshots](#screenshots)

---

## The Problem

In the **flexible packaging industry** (think chips packets, pharma sachets, detergent pouches), pricing a job is surprisingly complex. A business owner or sales person must account for:

| Factor | Why it's hard |
|--------|---------------|
| **Multi-layer film structure** | Each pouch is made of 2–4 laminated layers (PET, BOPP, LDPE, Aluminium Foil, Nylon, etc.), each with different densities, thicknesses, and rates per kg. |
| **Pouch type geometry** | A center-seal bag, a 3-side-seal sachet, and a stand-up pouch all have different open-width and cut-length formulas. Getting dimensions wrong means wrong weight → wrong cost. |
| **Ink & printing costs** | Rotogravure vs Flexo, number of colors, white base coat — each changes the cost per kg. |
| **Conversion costs** | Printing, lamination (dry/solvent), pouching, slitting, and overheads — each is an operational cost per kg that stacks up. |
| **Cylinder / plate amortization** | A rotogravure cylinder set can cost ₹25,000–₹50,000+. This must be amortized over the job quantity (in kg or pieces). Shorter runs = higher per-unit cost. |
| **Margin & selling price** | After computing the total cost, a profit margin must be applied to arrive at the selling price per 1000 pouches — the industry-standard quoting unit. |

**Most packaging businesses still do this on Excel sheets**, with hardcoded formulas, no version history, no analytics, and no way for the sales team to self-serve quotes.

---

## How Nexus Solves It

Nexus replaces the Excel approach with a **real-time web application** that:

1. **Accepts full product specifications** (pouch type, dimensions, film layers, colors, quantity, margin)
2. **Runs the complete cost calculation** on the backend in milliseconds
3. **Returns a detailed breakdown** — material cost, ink, printing, lamination, pouching, overheads, cylinder amortization — all per kg
4. **Shows the final price per 1000 pouches** and per-pouch cost
5. **Saves quotations** for clients, with search, compare, and delete
6. **Provides a dashboard** with KPIs — total quotes, avg margin, revenue, popular materials, cost distribution
7. **Supports industry presets** — one-click templates for Snacks, Pharma, Sweets, MOP, Dairy, Agro sectors

---

## Core Calculation Engine

Here's exactly how the pricing works, step by step. This mirrors the logic in `backend/calculations.py`.

### Step 1 — Pouch Dimensions

The first step is converting the pouch's finished size into the **open web width** and **cut length** (the actual film dimensions before conversion).

| Pouch Type | Open Width Formula | Cut Length |
|------------|-------------------|------------|
| **Center Seal** | `(2 × Width) + (2 × Gusset) + 20mm overlap` | `Height + 20mm (top + bottom seal)` |
| **3-Side Seal** | `2 × Width` | `Height + 20mm` |
| **Stand-up Pouch** | `(2 × Width) + (2 × Gusset) + 60mm allowance` | `Height + 20mm` |

**Example:** A Center Seal pouch of 150mm × 200mm with 40mm gusset:
```
Open Width = (2 × 150) + (2 × 40) + 20 = 400 mm
Cut Length = 200 + 20 = 220 mm
Area per pouch = 0.400 × 0.220 = 0.088 m²
```

### Step 2 — Film Structure & Material Cost

Each layer has:
- **Thickness** (in microns, μ)
- **Density** (g/cm³ — PET: 1.4, BOPP: 0.905, LDPE: 0.92, AL Foil: 2.7, etc.)
- **Rate** (₹/kg — fetched from the database, configurable)

**GSM (grams per square meter)** of each layer:
```
Layer GSM = Thickness (μ) × Density (g/cm³)
```

**Cost per m²** of each layer:
```
Layer Cost (₹/m²) = (GSM / 1000) × Rate (₹/kg)
```

**Adhesive** is added between every pair of layers:
```
Adhesive GSM = 2.5 g/m² per interface
Adhesive Rate = ₹250/kg
```

**Example:** PET 12μ + MET PET 12μ + LDPE 50μ:
```
PET GSM    = 12 × 1.4   = 16.8      → Cost: (16.8/1000) × 180 = ₹3.02/m²
MET PET    = 12 × 1.4   = 16.8      → Cost: (16.8/1000) × 220 = ₹3.70/m²
LDPE       = 50 × 0.92  = 46.0      → Cost: (46.0/1000) × 130 = ₹5.98/m²
Adhesive   = 2.5 × 2    = 5.0       → Cost: (5.0/1000) × 250  = ₹1.25/m²
─────────────────────────────────────────────────────
Total GSM  = 84.6                     Total: ₹13.95/m²
```

### Step 3 — Ink Cost

```
Ink GSM = (Number of Colors × 0.5) + 1.0 (white base)
Ink Cost/m² = (Ink GSM / 1000) × ₹300/kg
```

For 6 colors:
```
Ink GSM = (6 × 0.5) + 1.0 = 4.0
Ink Cost = (4.0 / 1000) × 300 = ₹1.20/m²
```

### Step 4 — Weight Calculation

```
Total GSM (with ink) = Film GSM + Adhesive GSM + Ink GSM
Weight of 1 pouch = Area (m²) × Total GSM (g/m²) → in grams
Weight per 1000 pouches = in kg
```

Example:
```
Total GSM = 84.6 + 4.0 = 88.6
Weight/pouch = 0.088 × 88.6 = 7.80 g
Weight/1000 = 7.80 kg
```

### Step 5 — Conversion & Operational Costs

All costs below are in **₹ per kg** of finished material:

| Cost Head | Formula | Typical Value |
|-----------|---------|---------------|
| **Printing** | Base ₹15 + (₹2 × number of colors) | ₹27/kg for 6 colors |
| **Lamination** | Base ₹12 + (₹5 × number of layer interfaces) | ₹22/kg for 3-layer |
| **Pouching** | Fixed | ₹20/kg |
| **Slitting** | Fixed | ₹5/kg |
| **Overheads** | Fixed | ₹12/kg |
| **Total Conversion** | Sum of above | ~₹86/kg |

> Users can **override** Printing and Lamination costs per-job if their factory rates differ.

### Step 6 — Cylinder Amortization

Rotogravure cylinders are expensive and must be amortized over the job quantity:

```
Cylinder Total = Number of Colors × Cost per Cylinder
Cylinder ₹/kg  = Cylinder Total ÷ Total Job Weight (kg)
```

**Example:** 6 colors × ₹5,000/cylinder = ₹30,000 total, for a 100,000 piece job:
```
Job Weight = 100,000 × 7.80g / 1000 = 780 kg
Cylinder ₹/kg = 30,000 / 780 = ₹38.46/kg
```

> This is why **small runs are expensive** — the same ₹30,000 cylinder cost is spread over fewer kg.

### Step 7 — Total Cost & Pricing

```
Total Cost/kg        = Material/kg + Conversion/kg + Cylinder/kg
Cost per 1000 pouches = Total Cost/kg × Weight per 1000 pouches (kg)
Selling Price / 1000  = Cost per 1000 × (1 + Margin%)
```

Final example:
```
Material Cost/kg  = ~₹165/kg (derived from cost/m² ÷ GSM conversion)
Conversion        = ₹86/kg
Cylinder          = ₹38.46/kg
────────────────────────────
Total Cost/kg     = ₹289.46/kg
Cost / 1000       = 289.46 × 7.80 = ₹2,257.79
Selling / 1000    = 2,257.79 × 1.20 = ₹2,709.35  (at 20% margin)
Cost / pouch      = ₹2.26
Selling / pouch   = ₹2.71
```

---

## Features

### 🧮 Cost Estimator
- Full product specification form (pouch type, dimensions, gusset, quantity)
- Dynamic film structure builder — add/remove/reorder layers
- Material + thickness per layer with live rate lookup
- Number of colors, printing method (Rotogravure / Flexo)
- Cylinder cost amortization over job quantity (pieces or kg)
- Optional per-job overrides for printing & lamination rates
- **Auto-calculation** with 600ms debounce — results update as you type
- Cost breakdown donut chart for visual analysis

### 📊 Analytics Dashboard
- KPI cards with animated counters: Total Quotations, Average Margin, Revenue, Avg Cost/kg
- Cost distribution bar chart (material, ink, printing, lamination, pouching, overhead, cylinder)
- Material usage breakdown
- Quick insights — most popular pouch type, most used material
- Recent quotations list

### 📁 Quotation Management
- Save quotations with client name
- Search/filter by client name or pouch type
- Expandable detail rows showing full cost breakdown
- **Side-by-side comparison** — select 2 quotations and compare all metrics in a modal
- Delete with toast confirmation

### 🏭 Industry Presets
One-click templates for major sectors with realistic packaging configurations:
- 🍿 **Snacks & Chips** — nitrogen-flushed MET barrier center-seal pouches
- 💊 **Pharma & Healthcare** — high-barrier AL foil sachets
- 🍬 **Sweets & Mithai** — premium printed pillow packs
- 🧴 **MOP & Detergents** — heavy-duty liquid-resistant pouches
- 🥛 **Dairy & Beverages** — liquid-fill stand-up pouches
- 🌾 **Agro & Fertilizers** — heavy-gauge multi-layer sacks

### 🧪 Material Library
- View and edit rates for all 9+ standard materials (PET, BOPP, LDPE, CPP, etc.)
- **Add custom materials** — enter name + rate, auto-saves to the database
- Custom materials become available in the Film Structure Builder dropdowns
- Delete custom materials (standard ones are protected)

### 🎨 AI Color Scanner
- Upload a product design image
- Automated dominant color detection using K-Means clustering
- Returns detected colors + auto-sets number of colors for the estimator

### 🌙 Dark Mode
- Full dark/light theme toggle
- CSS custom properties for seamless theming
- Persists across all components

### 📱 Responsive Design
- Collapsible sidebar with hamburger menu on mobile
- Fluid grid layouts for all screen sizes

### 🔔 Toast Notifications
- Non-intrusive success / error / warning / info toasts
- Auto-dismiss with animated progress bar

### 🖨️ Print / Export
- Print-optimized CSS (hides sidebar, navigation, buttons)
- Clean cost breakdown output for client-facing PDF generation

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19 + TypeScript + Vite |
| **Styling** | Vanilla CSS with custom properties (glassmorphism theme) |
| **Icons** | Lucide React |
| **Backend** | Python + FastAPI |
| **Data Models** | Pydantic v2 |
| **Database** | JSON file storage (rates.json, quotations.json) |
| **AI / Image** | scikit-learn (KMeans), Pillow |

---

## Project Structure

```
packaging-pricing-system/
├── backend/
│   ├── main.py              # FastAPI app — all API routes
│   ├── models.py            # Pydantic models (Layer, FilmStructure, ProductRequirements, CostBreakdown)
│   ├── calculations.py      # CostCalculator — the core pricing engine
│   ├── database.py          # JSON file DB — rates, quotations, stats
│   ├── ai_service.py        # Image color detection (K-Means + Pillow)
│   ├── rates.json           # Material rate data (₹/kg)
│   └── quotations.json      # Saved quotation history
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx           # Main app — routing, form, dark mode, auto-calc
│   │   ├── types.ts          # TypeScript enums & interfaces
│   │   ├── nexus.css         # Full design system — themes, animations, responsive
│   │   └── components/
│   │       ├── Dashboard.tsx         # Analytics dashboard with KPIs & charts
│   │       ├── CostResult.tsx        # Cost breakdown display + donut chart
│   │       ├── CostPieChart.tsx      # Animated canvas donut chart
│   │       ├── QuotationsList.tsx    # Quotation table, search, compare, delete
│   │       ├── MaterialLibrary.tsx   # Material rates editor + add custom
│   │       ├── FilmStructureBuilder.tsx  # Dynamic layer builder
│   │       ├── PresetTemplates.tsx   # Industry sector presets
│   │       ├── AIColorScanner.tsx    # Image upload + color detection
│   │       └── ToastProvider.tsx     # Toast notification system
│   ├── package.json
│   └── vite.config.ts
│
└── README.md                 # ← You are here
```

---

## Quick Start

### Prerequisites
- **Python 3.9+** with pip
- **Node.js 18+** with npm

### 1. Backend

```bash
cd backend

# Install dependencies
pip install fastapi uvicorn pydantic python-multipart scikit-learn pillow numpy

# Start the server (auto-reloads on code changes)
python -m uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`. Verify: `http://localhost:8000/` should return:
```json
{"message": "Packaging Job Analyzer API v2.0 is running"}
```

### 2. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Health check |
| `POST` | `/api/calculate-cost` | Calculate cost breakdown from `ProductRequirements` |
| `GET` | `/api/rates` | Get current material rates (₹/kg) |
| `POST` | `/api/rates` | Update material rates |
| `POST` | `/api/quotations` | Save a new quotation |
| `GET` | `/api/quotations` | List all saved quotations |
| `GET` | `/api/quotations/search?q=term` | Search quotations by client/pouch type |
| `DELETE` | `/api/quotations/{id}` | Delete a quotation |
| `GET` | `/api/dashboard/stats` | Aggregated dashboard statistics |
| `GET` | `/api/presets` | Industry sector preset configurations |
| `POST` | `/api/analyze-image` | Upload image → dominant color detection |

### Example: Calculate Cost

```bash
curl -X POST http://localhost:8000/api/calculate-cost \
  -H "Content-Type: application/json" \
  -d '{
    "pouch_type": "CENTER_SEAL",
    "width_mm": 150,
    "height_mm": 200,
    "gusset_mm": 40,
    "film_structure": {
      "layers": [
        {"material": "PET", "thickness_micron": 12},
        {"material": "LDPE", "thickness_micron": 40}
      ]
    },
    "number_of_colors": 6,
    "printing_method": "ROTOGRAVURE",
    "cylinder_cost_per_unit": 4500,
    "quantity_pieces": 100000,
    "margin_percent": 20
  }'
```

**Response:**
```json
{
  "total_gsm": 66.66,
  "weight_per_1000_pouches_kg": 5.87,
  "material_cost_per_kg": 152.73,
  "ink_cost_per_kg": 18.0,
  "printing_cost_per_kg": 27.0,
  "lamination_cost_per_kg": 17.0,
  "pouching_cost_per_kg": 20.0,
  "overhead_cost_per_kg": 17.0,
  "cylinder_cost_total": 27000.0,
  "cylinder_cost_amortized_per_kg": 46.0,
  "total_cost_per_kg": 297.73,
  "cost_per_1000_pouches": 1747.68,
  "selling_price_per_1000": 2097.22,
  "cost_per_pouch": 1.7477,
  "selling_price_per_pouch": 2.0972,
  "margin_percent": 20.0
}
```

---

## Industry Presets

| Sector | Pouch Type | Film Structure | Key Characteristic |
|--------|-----------|----------------|-------------------|
| 🍿 Snacks & Chips | Center Seal | BOPP / MET BOPP / LDPE | Nitrogen-flush barrier, high color |
| 💊 Pharma | 3-Side Seal | PET / AL Foil / LDPE | Highest barrier, small sachet |
| 🍬 Sweets | Center Seal | BOPP / MET BOPP / CPP | Premium print, pillow pack |
| 🧴 MOP & Detergents | 3-Side Seal | PET / Nylon / LDPE | Liquid-resistant, heavy gauge |
| 🥛 Dairy | Stand-up Pouch | PET / AL Foil / LDPE | Liquid-fill, gusset bottom |
| 🌾 Agro | Stand-up Pouch | BOPP / LDPE | Heavy gauge, low color, flexo |

---

## Material Densities Reference

| Material | Density (g/cm³) | Common Use |
|----------|----------------|------------|
| PET | 1.40 | Outer print layer, clarity |
| BOPP | 0.905 | Outer layer, snack packs |
| MET PET | 1.40 | Barrier, moisture protection |
| MET BOPP | 0.905 | Barrier, cost-effective metallic |
| LDPE | 0.92 | Sealant layer (inner) |
| CPP | 0.90 | Sealant layer, retort packs |
| AL Foil | 2.70 | Highest barrier (pharma, dairy) |
| Nylon | 1.15 | Puncture resistance, liquid packs |
| Paper | 0.80 | Eco-friendly, bakery, sugar |

---

## License

This project is proprietary. For licensing inquiries, contact the project owner.
