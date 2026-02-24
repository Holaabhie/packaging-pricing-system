import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Layers } from 'lucide-react';
import { MaterialType } from '../types';
import type { Layer } from '../types';

interface FilmStructureBuilderProps {
  layers: Layer[];
  onChange: (layers: Layer[]) => void;
}

const defaultMaterialLabels: Record<string, string> = {
  PET: 'PET (Polyester)',
  BOPP: 'BOPP (Bi-axial PP)',
  MET_PET: 'Metalized PET',
  MET_BOPP: 'Metalized BOPP',
  LDPE: 'LDPE (Low Density PE)',
  CPP: 'CPP (Cast PP)',
  AL_FOIL: 'Aluminium Foil',
  NYLON: 'Nylon (PA)',
  PAPER: 'Paper',
};

export const FilmStructureBuilder: React.FC<FilmStructureBuilderProps> = ({ layers, onChange }) => {
  const [availableMaterials, setAvailableMaterials] = useState<string[]>(Object.values(MaterialType));

  // Fetch materials from rates API to include custom ones
  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/rates');
        if (res.ok) {
          const data = await res.json();
          const allKeys = Object.keys(data);
          // Merge enum values with any custom materials from rates
          const merged = new Set([...Object.values(MaterialType), ...allKeys]);
          setAvailableMaterials(Array.from(merged));
        }
      } catch {
        // Fall back to enum values
      }
    };
    fetchMaterials();
  }, []);

  const addLayer = () => {
    onChange([...layers, { material: MaterialType.PET, thickness_micron: 12 }]);
  };

  const removeLayer = (index: number) => {
    const newLayers = [...layers];
    newLayers.splice(index, 1);
    onChange(newLayers);
  };

  const updateLayer = (index: number, field: keyof Layer, value: string | number) => {
    const newLayers = [...layers];
    newLayers[index] = { ...newLayers[index], [field]: value };
    onChange(newLayers);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-800 dark:text-gray-100">
          <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400">
            <Layers className="w-5 h-5" />
          </div>
          Film Structure
          {layers.length > 0 && (
            <span className="text-xs font-normal text-gray-400 ml-1">({layers.length} layers)</span>
          )}
        </h3>
        <button
          onClick={addLayer}
          className="flex items-center gap-1 text-sm bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors font-medium"
        >
          <Plus className="w-4 h-4" /> Add Layer
        </button>
      </div>

      <div className="space-y-3">
        {layers.map((layer, index) => (
          <div key={index} className="flex items-center gap-4 p-4 bg-white/50 dark:bg-gray-800/30 rounded-xl border border-gray-100 dark:border-gray-700 group hover:border-indigo-200 dark:hover:border-indigo-700 transition-all hover:shadow-sm">
            <div className="flex flex-col items-center gap-1">
              <span className="text-[10px] font-bold text-gray-300 dark:text-gray-600 uppercase">L{index + 1}</span>
              <div className="w-1 h-4 bg-gradient-to-b from-indigo-400 to-purple-400 rounded-full opacity-30"></div>
            </div>

            <div className="flex-1">
              <label className="block text-[10px] text-gray-400 dark:text-gray-500 mb-1 font-bold uppercase tracking-wider">Material</label>
              <select
                value={layer.material}
                onChange={(e) => updateLayer(index, 'material', e.target.value)}
                className="nexus-input py-2 text-sm"
              >
                {availableMaterials.map((mat) => (
                  <option key={mat} value={mat}>{defaultMaterialLabels[mat] || mat}</option>
                ))}
              </select>
            </div>

            <div className="w-28">
              <label className="block text-[10px] text-gray-400 dark:text-gray-500 mb-1 font-bold uppercase tracking-wider">Thickness (µ)</label>
              <input
                type="number"
                value={layer.thickness_micron}
                onChange={(e) => updateLayer(index, 'thickness_micron', parseFloat(e.target.value))}
                className="nexus-input py-2 text-sm"
                min="1"
              />
            </div>

            <div className="pt-5">
              <button
                onClick={() => removeLayer(index)}
                className="text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                title="Remove Layer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {layers.length === 0 && (
          <div className="text-center py-10 text-gray-400 dark:text-gray-500 text-sm border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl bg-white/30 dark:bg-gray-800/20">
            <Layers className="w-8 h-8 mx-auto mb-2 opacity-20" />
            No layers added. Start by adding a substrate.
          </div>
        )}
      </div>
    </div>
  );
};
