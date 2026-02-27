export const MaterialType = {
  PET: "PET",
  BOPP: "BOPP",
  MET_PET: "MET_PET",
  MET_BOPP: "MET_BOPP",
  LDPE: "LDPE",
  CPP: "CPP",
  AL_FOIL: "AL_FOIL",
  NYLON: "NYLON",
  PAPER: "PAPER",
} as const;
export type MaterialType = typeof MaterialType[keyof typeof MaterialType];

export const PouchType = {
  CENTER_SEAL: "CENTER_SEAL",
  THREE_SIDE_SEAL: "THREE_SIDE_SEAL",
  STAND_UP_POUCH: "STAND_UP_POUCH",
  STAND_UP_ZIPPER: "STAND_UP_ZIPPER",
  SIDE_GUSSET: "SIDE_GUSSET",
} as const;
export type PouchType = typeof PouchType[keyof typeof PouchType];

export const PrintingMethod = {
  ROTOGRAVURE: "ROTOGRAVURE",
  FLEXO: "FLEXO",
} as const;
export type PrintingMethod = typeof PrintingMethod[keyof typeof PrintingMethod];

export interface Layer {
  material: string; // MaterialType enum values or custom material names
  thickness_micron: number;
}

export interface FilmStructure {
  layers: Layer[];
}

export interface ProductRequirements {
  pouch_type: PouchType;
  width_mm: number;
  height_mm: number;
  gusset_mm: number;
  quantity_kg?: number;
  quantity_pieces?: number;
  film_structure: FilmStructure;

  // New Fields
  number_of_colors: number;
  printing_method: PrintingMethod;
  cylinder_cost_per_unit: number;
  margin_percent: number;

  // Operational Cost Fields
  wastage_percent: number;
  labor_cost_per_kg: number;
  machine_usage_cost_per_kg: number;

  printing_cost_per_kg_override?: number;
  lamination_cost_per_kg_override?: number;
}

export interface CostBreakdown {
  total_gsm: number;
  total_thickness: number;
  weight_per_1000_pouches_kg: number;

  // Cost Components
  material_cost_per_kg: number;
  ink_cost_per_kg: number;
  printing_cost_per_kg: number;
  lamination_cost_per_kg: number;
  pouching_cost_per_kg: number;
  overhead_cost_per_kg: number;
  labor_cost_per_kg: number;
  machine_usage_cost_per_kg: number;
  wastage_cost_per_kg: number;
  cylinder_cost_total: number;
  cylinder_cost_amortized_per_kg: number;

  conversion_cost_per_kg: number;
  total_cost_per_kg: number;
  cost_per_1000_pouches: number;
  selling_price_per_1000: number;
  cost_per_pouch: number;
  selling_price_per_pouch: number;
  margin_percent: number;
}
