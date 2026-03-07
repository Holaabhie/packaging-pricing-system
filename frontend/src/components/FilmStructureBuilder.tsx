import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Layers } from 'lucide-react';
import { MaterialType } from '../types';
import type { Layer } from '../types';
import { apiFetch } from '../utils/apiConfig';

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

// Colors for material layer accents
const materialColors: Record<string, string> = {
  PET: '#6366f1',
  BOPP: '#8b5cf6',
  MET_PET: '#a78bfa',
  MET_BOPP: '#c4b5fd',
  LDPE: '#22d3ee',
  CPP: '#06b6d4',
  AL_FOIL: '#fbbf24',
  NYLON: '#f472b6',
  PAPER: '#a1a1aa',
};

export const FilmStructureBuilder: React.FC<FilmStructureBuilderProps> = ({ layers, onChange }) => {
  const [availableMaterials, setAvailableMaterials] = useState<string[]>(Object.values(MaterialType));

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const res = await apiFetch('/api/rates');
        if (res.ok) {
          const data = await res.json();
          const allKeys = Object.keys(data);
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

  const getLayerColor = (mat: string) => materialColors[mat] || '#6366f1';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-bold flex items-center gap-2.5 text-gray-800 dark:text-gray-100 tracking-tight">
          <div className="p-2 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.1), rgba(99,102,241,0.08))', border: '1px solid rgba(6,182,212,0.15)' }}>
            <Layers className="w-5 h-5 text-cyan-500" />
          </div>
          Film Structure
          {layers.length > 0 && (
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(6,182,212,0.08))', color: '#818cf8', border: '1px solid rgba(99,102,241,0.15)' }}
            >
              {layers.length}L
            </span>
          )}
        </h3>
        <button
          onClick={addLayer}
          className="flex items-center gap-1.5 text-sm px-3.5 py-2 rounded-xl font-semibold transition-all"
          style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(6,182,212,0.05))', color: '#818cf8', border: '1px solid rgba(99,102,241,0.15)' }}
        >
          <Plus className="w-4 h-4" /> Add Layer
        </button>
      </div>

      <div className="space-y-0">
        {layers.map((layer, index) => (
          <React.Fragment key={index}>
            {/* Connector line between layers */}
            {index > 0 && <div className="layer-connector" />}

            <div
              className="layer-card flex items-center gap-4 group"
              style={{ '--layer-color': getLayerColor(layer.material) } as React.CSSProperties}
            >
              {/* Layer number badge */}
              <div className="flex flex-col items-center gap-1 shrink-0">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                  style={{ background: getLayerColor(layer.material), boxShadow: `0 4px 12px ${getLayerColor(layer.material)}40` }}
                >
                  L{index + 1}
                </div>
              </div>

              {/* Material select */}
              <div className="flex-1">
                <label className="block text-[10px] text-gray-400 dark:text-gray-500 mb-1.5 font-bold uppercase tracking-wider">Material</label>
                <select
                  value={layer.material}
                  onChange={(e) => updateLayer(index, 'material', e.target.value)}
                  className="nexus-input py-2.5 text-sm"
                >
                  {availableMaterials.map((mat) => (
                    <option key={mat} value={mat}>{defaultMaterialLabels[mat] || mat}</option>
                  ))}
                </select>
              </div>

              {/* Thickness */}
              <div className="w-28 shrink-0">
                <label className="block text-[10px] text-gray-400 dark:text-gray-500 mb-1.5 font-bold uppercase tracking-wider">Thickness</label>
                <div className="relative">
                  <input
                    type="number"
                    value={layer.thickness_micron}
                    onChange={(e) => updateLayer(index, 'thickness_micron', parseFloat(e.target.value))}
                    className="nexus-input py-2.5 text-sm pr-8"
                    style={{ fontFamily: 'var(--font-mono)' }}
                    min="1"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-bold">µ</span>
                </div>
              </div>

              {/* Delete */}
              <div className="pt-5 shrink-0">
                <button
                  onClick={() => removeLayer(index)}
                  className="p-2 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  style={{ color: 'var(--text-light)' }}
                  title="Remove Layer"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#ef4444';
                    e.currentTarget.style.background = 'rgba(239,68,68,0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--text-light)';
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </React.Fragment>
        ))}

        {layers.length === 0 && (
          <div
            className="text-center py-12 text-sm rounded-xl"
            style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.03), rgba(6,182,212,0.02))', border: '2px dashed rgba(99,102,241,0.12)', color: 'var(--text-light)' }}
          >
            <Layers className="w-10 h-10 mx-auto mb-3 opacity-15" />
            <p className="font-medium">No layers configured</p>
            <p className="text-xs mt-1 opacity-60">Add substrate, barrier, and sealant layers</p>
          </div>
        )}
      </div>
    </div>
  );
};
