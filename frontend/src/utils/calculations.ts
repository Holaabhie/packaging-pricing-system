import { PouchType } from '../types';
import type { ProductRequirements, CostBreakdown } from '../types';

// Admin configurable assumptions (would normally be fetched from API and cached)
export const DEFAULT_RATES: Record<string, number> = {
    PET: 110,
    BOPP: 130,
    MET_PET: 120,
    MET_BOPP: 140,
    LDPE: 105,
    CPP: 115,
    AL_FOIL: 400,
    NYLON: 250,
    PAPER: 80,
};

export const DENSITIES: Record<string, number> = {
    PET: 1.4,
    BOPP: 0.905,
    MET_PET: 1.4,
    MET_BOPP: 0.905,
    LDPE: 0.92,
    CPP: 0.90,
    AL_FOIL: 2.7,
    NYLON: 1.15,
    PAPER: 0.8,
};

const ADHESIVE_GSM = 2.5;
const ADHESIVE_RATE = 250;

const INK_GSM_PER_COLOR = 0.5;
const INK_RATE = 300;

const PRINTING_COST_PER_KG_BASE = 15;
const PRINTING_COST_PER_KG_PER_COLOR = 2;

const LAMINATION_COST_PER_KG_BASE = 12;
const LAMINATION_COST_PER_LAYER = 5;

const POUCHING_COST_PER_KG = 20;
const SLITTING_COST_PER_KG = 5;
const OVERHEADS_PER_KG = 12;

export const calculatePouchOpenSize = (req: ProductRequirements) => {
    const { width_mm, height_mm, gusset_mm, pouch_type } = req;
    const CENTER_SEAL_OVERLAP = 20;
    const SEAL_WIDTH = 10;

    let open_width_mm, cut_length_mm;

    switch (pouch_type) {
        case PouchType.CENTER_SEAL:
            open_width_mm = (2 * width_mm) + (2 * gusset_mm) + CENTER_SEAL_OVERLAP;
            cut_length_mm = height_mm + (2 * SEAL_WIDTH);
            break;
        case PouchType.THREE_SIDE_SEAL:
            open_width_mm = 2 * width_mm;
            cut_length_mm = height_mm + (2 * SEAL_WIDTH);
            break;
        case PouchType.STAND_UP_POUCH:
            open_width_mm = (2 * width_mm) + (gusset_mm * 2) + 60;
            cut_length_mm = height_mm + 20;
            break;
        default:
            open_width_mm = 2 * width_mm;
            cut_length_mm = height_mm;
    }

    return { open_width_mm, cut_length_mm };
};

export const calculateCost = (req: ProductRequirements, rates: Record<string, number> = DEFAULT_RATES): CostBreakdown => {
    const { open_width_mm, cut_length_mm } = calculatePouchOpenSize(req);
    const area_per_pouch_sqm = (open_width_mm * cut_length_mm) / 1000000;

    let total_film_gsm = 0;
    let total_material_cost_per_sqm = 0;
    const num_layers = req.film_structure.layers.length;

    req.film_structure.layers.forEach((layer, i) => {
        const density = DENSITIES[layer.material] || 1.0;
        const layer_gsm = layer.thickness_micron * density;
        total_film_gsm += layer_gsm;

        const rate = rates[layer.material] || 100;
        const layer_cost_sqm = (layer_gsm / 1000) * rate;
        total_material_cost_per_sqm += layer_cost_sqm;

        if (i < num_layers - 1) {
            total_film_gsm += ADHESIVE_GSM;
            total_material_cost_per_sqm += (ADHESIVE_GSM / 1000) * ADHESIVE_RATE;
        }
    });

    let ink_gsm = 0;
    let ink_cost_per_sqm = 0;

    if (req.number_of_colors > 0) {
        ink_gsm = req.number_of_colors * INK_GSM_PER_COLOR;
        if (req.number_of_colors >= 1) ink_gsm += 1.0;

        total_film_gsm += ink_gsm;
        ink_cost_per_sqm = (ink_gsm / 1000) * INK_RATE;
        total_material_cost_per_sqm += ink_cost_per_sqm;
    }

    const weight_per_pouch_g = area_per_pouch_sqm * total_film_gsm;
    const weight_per_1000_pouches_kg = weight_per_pouch_g;

    let raw_material_cost_per_kg = 0;
    let ink_cost_per_kg = 0;

    if (total_film_gsm > 0) {
        raw_material_cost_per_kg = total_material_cost_per_sqm / (total_film_gsm / 1000);
        ink_cost_per_kg = ink_cost_per_sqm / (total_film_gsm / 1000);
    }

    const printing_cost = req.printing_cost_per_kg_override ?? (PRINTING_COST_PER_KG_BASE + (req.number_of_colors * PRINTING_COST_PER_KG_PER_COLOR));
    const lamination_passes = Math.max(0, num_layers - 1);
    const lamination_cost = req.lamination_cost_per_kg_override ?? (LAMINATION_COST_PER_KG_BASE + (lamination_passes * LAMINATION_COST_PER_LAYER));

    const conversion_cost = printing_cost + lamination_cost + POUCHING_COST_PER_KG + SLITTING_COST_PER_KG + OVERHEADS_PER_KG + req.labor_cost_per_kg + req.machine_usage_cost_per_kg;

    const cylinder_cost_total = req.number_of_colors * req.cylinder_cost_per_unit;
    let cylinder_cost_amortized_per_kg = 0;

    if (req.quantity_kg && req.quantity_kg > 0) {
        cylinder_cost_amortized_per_kg = cylinder_cost_total / req.quantity_kg;
    } else if (req.quantity_pieces && req.quantity_pieces > 0) {
        const total_job_weight_kg = (req.quantity_pieces * weight_per_pouch_g) / 1000;
        if (total_job_weight_kg > 0) cylinder_cost_amortized_per_kg = cylinder_cost_total / total_job_weight_kg;
    }

    const base_cost_for_wastage = raw_material_cost_per_kg + conversion_cost + cylinder_cost_amortized_per_kg;
    const wastage_cost_per_kg = base_cost_for_wastage * (req.wastage_percent / 100.0);

    const total_cost_per_kg = base_cost_for_wastage + wastage_cost_per_kg;
    const cost_per_1000_pouches = total_cost_per_kg * weight_per_1000_pouches_kg;
    const selling_price = cost_per_1000_pouches * (1 + (req.margin_percent / 100));

    return {
        total_gsm: Number(total_film_gsm.toFixed(2)),
        total_thickness: req.film_structure.layers.reduce((acc, layer) => acc + layer.thickness_micron, 0),
        weight_per_1000_pouches_kg: Number(weight_per_1000_pouches_kg.toFixed(2)),

        material_cost_per_kg: Number((raw_material_cost_per_kg - ink_cost_per_kg).toFixed(2)),
        ink_cost_per_kg: Number(ink_cost_per_kg.toFixed(2)),
        printing_cost_per_kg: Number(printing_cost.toFixed(2)),
        lamination_cost_per_kg: Number(lamination_cost.toFixed(2)),
        pouching_cost_per_kg: Number(POUCHING_COST_PER_KG.toFixed(2)),
        overhead_cost_per_kg: Number((OVERHEADS_PER_KG + SLITTING_COST_PER_KG).toFixed(2)),
        labor_cost_per_kg: Number(req.labor_cost_per_kg.toFixed(2)),
        machine_usage_cost_per_kg: Number(req.machine_usage_cost_per_kg.toFixed(2)),
        wastage_cost_per_kg: Number(wastage_cost_per_kg.toFixed(2)),

        cylinder_cost_total: Number(cylinder_cost_total.toFixed(2)),
        cylinder_cost_amortized_per_kg: Number(cylinder_cost_amortized_per_kg.toFixed(2)),

        conversion_cost_per_kg: Number(conversion_cost.toFixed(2)),
        total_cost_per_kg: Number(total_cost_per_kg.toFixed(2)),

        cost_per_1000_pouches: Number(cost_per_1000_pouches.toFixed(2)),
        selling_price_per_1000: Number(selling_price.toFixed(2)),
        cost_per_pouch: Number((cost_per_1000_pouches / 1000 || 0).toFixed(4)),
        selling_price_per_pouch: Number((selling_price / 1000 || 0).toFixed(4)),
        margin_percent: req.margin_percent
    };
};
