import React, { useEffect, useState } from 'react';
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

export const PresetTemplates: React.FC<PresetTemplatesProps> = ({ onSelect }) => {
    const [presets, setPresets] = useState<Preset[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeId, setActiveId] = useState<string | null>(null);

    useEffect(() => {
        fetch('http://localhost:8000/api/presets')
            .then(res => res.json())
            .then(data => setPresets(data))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    const handleSelect = (preset: Preset) => {
        setActiveId(preset.id);
        onSelect(preset.config);
        setTimeout(() => setActiveId(null), 1500);
    };

    if (loading || presets.length === 0) return null;

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
                {presets.map((preset) => (
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
