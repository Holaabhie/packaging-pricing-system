import React, { useState } from 'react';
import { Zap } from 'lucide-react';
import type { ProductRequirements } from '../types';

interface Preset {
    id: string;
    name: string;
    description: string;
    icon: string;
    config: ProductRequirements;
}

interface PresetTemplatesProps {
    onSelect: (config: ProductRequirements) => void;
}

// Inline presets — no backend fetch needed
const PRESETS: Preset[] = [
    {
        id: 'snacks', name: 'Snacks & Chips', icon: '🍿',
        description: 'Namkeen, chips, kurkure — nitrogen-flushed MET barrier pouches',
        config: {
            pouch_type: 'CENTER_SEAL' as any, width_mm: 160, height_mm: 240, gusset_mm: 50,
            number_of_colors: 8, printing_method: 'ROTOGRAVURE' as any, cylinder_cost_per_unit: 5000,
            quantity_pieces: 200000, margin_percent: 20, wastage_percent: 5, labor_cost_per_kg: 8, machine_usage_cost_per_kg: 15,
            film_structure: { layers: [{ material: 'BOPP' as any, thickness_micron: 20 }, { material: 'MET_BOPP' as any, thickness_micron: 20 }, { material: 'LDPE' as any, thickness_micron: 50 }] }
        }
    },
    {
        id: 'pharma', name: 'Pharma & Healthcare', icon: '💊',
        description: 'Tablets, sachets, ORS — high-barrier AL foil laminates',
        config: {
            pouch_type: 'THREE_SIDE_SEAL' as any, width_mm: 80, height_mm: 120, gusset_mm: 0,
            number_of_colors: 4, printing_method: 'ROTOGRAVURE' as any, cylinder_cost_per_unit: 4500,
            quantity_pieces: 500000, margin_percent: 30, wastage_percent: 5, labor_cost_per_kg: 8, machine_usage_cost_per_kg: 15,
            film_structure: { layers: [{ material: 'PET' as any, thickness_micron: 12 }, { material: 'AL_FOIL' as any, thickness_micron: 9 }, { material: 'LDPE' as any, thickness_micron: 37.5 }] }
        }
    },
    {
        id: 'sweets', name: 'Sweets & Mithai', icon: '🍬',
        description: 'Laddu, barfi, bakery — premium printed trays & pillow packs',
        config: {
            pouch_type: 'CENTER_SEAL' as any, width_mm: 200, height_mm: 150, gusset_mm: 0,
            number_of_colors: 7, printing_method: 'ROTOGRAVURE' as any, cylinder_cost_per_unit: 5500,
            quantity_pieces: 100000, margin_percent: 25, wastage_percent: 5, labor_cost_per_kg: 8, machine_usage_cost_per_kg: 15,
            film_structure: { layers: [{ material: 'BOPP' as any, thickness_micron: 20 }, { material: 'MET_BOPP' as any, thickness_micron: 20 }, { material: 'CPP' as any, thickness_micron: 30 }] }
        }
    },
    {
        id: 'mop_detergent', name: 'MOP & Detergents', icon: '🧴',
        description: 'Surf, shampoo sachets, phenyl — heavy-duty liquid-resistant pouches',
        config: {
            pouch_type: 'THREE_SIDE_SEAL' as any, width_mm: 120, height_mm: 175, gusset_mm: 0,
            number_of_colors: 5, printing_method: 'ROTOGRAVURE' as any, cylinder_cost_per_unit: 4000,
            quantity_pieces: 300000, margin_percent: 18, wastage_percent: 5, labor_cost_per_kg: 8, machine_usage_cost_per_kg: 15,
            film_structure: { layers: [{ material: 'PET' as any, thickness_micron: 12 }, { material: 'NYLON' as any, thickness_micron: 15 }, { material: 'LDPE' as any, thickness_micron: 80 }] }
        }
    },
    {
        id: 'dairy', name: 'Dairy & Beverages', icon: '🥛',
        description: 'Milk, lassi, juice — liquid-fill stand-up & pillow pouches',
        config: {
            pouch_type: 'STAND_UP_POUCH' as any, width_mm: 140, height_mm: 220, gusset_mm: 60,
            number_of_colors: 6, printing_method: 'ROTOGRAVURE' as any, cylinder_cost_per_unit: 5000,
            quantity_pieces: 200000, margin_percent: 22, wastage_percent: 5, labor_cost_per_kg: 8, machine_usage_cost_per_kg: 15,
            film_structure: { layers: [{ material: 'PET' as any, thickness_micron: 12 }, { material: 'AL_FOIL' as any, thickness_micron: 7 }, { material: 'LDPE' as any, thickness_micron: 75 }] }
        }
    },
    {
        id: 'agro', name: 'Agro & Fertilizers', icon: '🌾',
        description: 'Seeds, fertilizers, pesticides — heavy-gauge multi-layer sacks',
        config: {
            pouch_type: 'STAND_UP_POUCH' as any, width_mm: 250, height_mm: 350, gusset_mm: 80,
            number_of_colors: 3, printing_method: 'FLEXO' as any, cylinder_cost_per_unit: 3000,
            quantity_pieces: 50000, margin_percent: 15, wastage_percent: 5, labor_cost_per_kg: 8, machine_usage_cost_per_kg: 15,
            film_structure: { layers: [{ material: 'BOPP' as any, thickness_micron: 25 }, { material: 'LDPE' as any, thickness_micron: 100 }] }
        }
    },
];

export const PresetTemplates: React.FC<PresetTemplatesProps> = ({ onSelect }) => {
    const [activeId, setActiveId] = useState<string | null>(null);

    const handleSelect = (preset: Preset) => {
        setActiveId(preset.id);
        onSelect(preset.config);
        setTimeout(() => setActiveId(null), 1500);
    };

    return (
        <div className="nexus-card">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4 text-gray-800 dark:text-gray-100">
                <div className="p-2 bg-amber-50 dark:bg-amber-900/30 rounded-lg text-amber-600">
                    <Zap className="w-5 h-5" />
                </div>
                Quick Presets
                <span className="ml-2 text-xs font-normal text-gray-400">One-click setup</span>
            </h3>
            <div className="flex overflow-x-auto snap-x hide-scrollbar gap-3 pb-2 -mx-1 px-1">
                {PRESETS.map((preset) => (
                    <button
                        key={preset.id}
                        onClick={() => handleSelect(preset)}
                        className={`group relative flex flex-col items-center gap-2 p-4 min-w-[100px] min-h-[44px] snap-center shrink-0 rounded-xl border-2 transition-all duration-300 text-center
              ${activeId === preset.id
                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 scale-95 shadow-lg shadow-indigo-200 dark:shadow-indigo-900/40'
                                : 'border-gray-100 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-md bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800'
                            }`}
                    >
                        <span className="text-2xl">{preset.icon}</span>
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 leading-tight whitespace-normal">{preset.name}</span>
                        {/* Tooltip */}
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none hidden md:block">
                            {preset.description}
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};
