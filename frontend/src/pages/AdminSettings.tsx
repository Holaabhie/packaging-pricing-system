import React, { useState, useEffect } from 'react';
import { Settings, Save, RefreshCw, AlertCircle } from 'lucide-react';
import { useToast } from '../components/ToastProvider';

interface Config {
    wastage_percent: number;
    labor_cost_per_kg: number;
    machine_usage_cost_per_kg: number;
    [key: string]: number;
}

export function AdminSettings() {
    const [config, setConfig] = useState<Config | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { showToast } = useToast();

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('http://localhost:8000/api/config');
            if (!res.ok) throw new Error('Failed to load configuration');
            const data = await res.json();
            setConfig({
                wastage_percent: data.wastage_percent ?? 5.0,
                labor_cost_per_kg: data.labor_cost_per_kg ?? 8.0,
                machine_usage_cost_per_kg: data.machine_usage_cost_per_kg ?? 15.0,
                ...data
            });
        } catch (err: any) {
            setError(err.message || 'Error connecting to server');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!config) return;
        setSaving(true);
        try {
            const res = await fetch('http://localhost:8000/api/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });
            if (!res.ok) throw new Error('Failed to save configuration');
            showToast('Global settings updated successfully', 'success');
        } catch (err: any) {
            showToast(err.message || 'Failed to update settings', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-6 rounded-xl border border-red-200 dark:border-red-800 flex items-center gap-3">
                <AlertCircle className="w-6 h-6" />
                <span className="font-semibold">{error}</span>
                <button onClick={loadConfig} className="ml-auto px-4 py-2 bg-red-100 dark:bg-red-900/40 rounded-lg hover:bg-red-200 transition-colors">
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-3xl space-y-6 animate-fade-in-up">
            <div className="nexus-card">
                <div className="flex items-center gap-3 mb-6 border-b border-gray-100 dark:border-gray-800 pb-4">
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
                        <Settings className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Global Operational Metrics</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">These settings affect all new calculations platform-wide.</p>
                    </div>
                </div>

                {config && (
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Default Wastage Allowance (%)</label>
                            <input
                                type="number"
                                value={config.wastage_percent}
                                onChange={(e) => setConfig({ ...config, wastage_percent: parseFloat(e.target.value) || 0 })}
                                className="nexus-input max-w-md"
                            />
                            <p className="text-xs text-gray-500 mt-1">Applied identically to all film structures.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Labor Rate Config (₹ / kg)</label>
                            <input
                                type="number"
                                value={config.labor_cost_per_kg}
                                onChange={(e) => setConfig({ ...config, labor_cost_per_kg: parseFloat(e.target.value) || 0 })}
                                className="nexus-input max-w-md"
                            />
                            <p className="text-xs text-gray-500 mt-1">Standard operator and packaging labor overhead.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Machine Power & Wear Base Setup (₹ / kg)</label>
                            <input
                                type="number"
                                value={config.machine_usage_cost_per_kg}
                                onChange={(e) => setConfig({ ...config, machine_usage_cost_per_kg: parseFloat(e.target.value) || 0 })}
                                className="nexus-input max-w-md"
                            />
                        </div>

                        <div className="pt-6 mt-6 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="nexus-btn-primary"
                            >
                                {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                {saving ? 'Saving...' : 'Save Configuration'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
