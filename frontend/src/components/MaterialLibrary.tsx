import React, { useEffect, useState } from 'react';
import { Save, Plus, X, Check } from 'lucide-react';
import { useToast } from './ToastProvider';
import { apiFetch } from '../utils/apiConfig';

const materialEmojis: Record<string, string> = {
  PET: '🔷', BOPP: '🟣', MET_PET: '🪞', MET_BOPP: '✨',
  LDPE: '🟢', CPP: '🟡', AL_FOIL: '🔶', NYLON: '🔴', PAPER: '📄'
};

export const MaterialLibrary: React.FC = () => {
  const [rates, setRates] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRate, setNewRate] = useState<number>(100);
  const { showToast } = useToast();

  useEffect(() => {
    fetchRates();
  }, []);

  const fetchRates = async () => {
    setLoading(true);
    try {
      const response = await apiFetch('/api/rates');
      if (!response.ok) throw new Error('Failed to fetch rates');
      const data = await response.json();
      setRates(data);
    } catch (err) {
      showToast('Could not load material rates', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRateChange = (material: string, value: number) => {
    setRates(prev => ({ ...prev, [material]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await apiFetch('/api/rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rates)
      });
      if (!response.ok) throw new Error('Failed to update rates');
      showToast('Material rates updated successfully', 'success');
    } catch (err) {
      showToast('Failed to save rates', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddMaterial = () => {
    const key = newName.trim().toUpperCase().replace(/\s+/g, '_');
    if (!key) {
      showToast('Material name cannot be empty', 'warning');
      return;
    }
    if (rates[key] !== undefined) {
      showToast(`"${key}" already exists`, 'warning');
      return;
    }
    setRates(prev => ({ ...prev, [key]: newRate }));
    showToast(`Added "${key}" — click Save Changes to persist`, 'info');
    setNewName('');
    setNewRate(100);
    setShowAddForm(false);
  };

  const handleDeleteMaterial = (material: string) => {
    setRates(prev => {
      const copy = { ...prev };
      delete copy[material];
      return copy;
    });
    showToast(`Removed "${material}" — click Save Changes to persist`, 'info');
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(9)].map((_, i) => (
          <div key={i} className="h-28 rounded-2xl skeleton" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Material Library</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Manage raw material costs (INR/kg)</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Material
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="nexus-btn-primary flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Add Material Modal */}
      {showAddForm && (
        <div className="modal-backdrop" onClick={() => setShowAddForm(false)}>
          <div className="modal-content w-[420px]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-600" />
                Add New Material
              </h3>
              <button onClick={() => setShowAddForm(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Material Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. EVOH, PVDC, PE_HD"
                  className="nexus-input"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleAddMaterial()}
                />
                <p className="text-[11px] text-gray-400 mt-1">Will be stored as uppercase with underscores (e.g. "High Density PE" → "HIGH_DENSITY_PE")</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Rate (₹/kg)</label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-400">₹</span>
                  <input
                    type="number"
                    value={newRate}
                    onChange={(e) => setNewRate(parseFloat(e.target.value) || 0)}
                    className="nexus-input pl-8"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddMaterial()}
                  />
                </div>
              </div>

              <button
                onClick={handleAddMaterial}
                className="nexus-btn-primary w-full justify-center"
              >
                <Check className="w-4 h-4" /> Add Material
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
        {Object.entries(rates).map(([material, rate]) => (
          <div key={material} className="nexus-card hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors group">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">{materialEmojis[material] || '📦'}</span>
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">{material}</label>
              </div>
              {/* Show delete for custom (non-standard) materials */}
              {!['PET', 'BOPP', 'MET_PET', 'MET_BOPP', 'LDPE', 'CPP', 'AL_FOIL', 'NYLON', 'PAPER'].includes(material) && (
                <button
                  onClick={() => handleDeleteMaterial(material)}
                  className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                  title="Remove material"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3 top-3 text-gray-400">₹</span>
              <input
                type="number"
                value={rate}
                onChange={(e) => handleRateChange(material, parseFloat(e.target.value) || 0)}
                className="nexus-input pl-8"
              />
              <span className="absolute right-3 top-3 text-gray-400 text-xs">/kg</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
