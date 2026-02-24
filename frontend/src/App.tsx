import React, { useState, useEffect, useRef } from 'react';
import { FilmStructureBuilder } from './components/FilmStructureBuilder';
import { CostResult } from './components/CostResult';
import { MaterialLibrary } from './components/MaterialLibrary';
import { QuotationsList } from './components/QuotationsList';
import { AIColorScanner } from './components/AIColorScanner';
import { Dashboard } from './components/Dashboard';
import { PresetTemplates } from './components/PresetTemplates';
import { ToastProvider, useToast } from './components/ToastProvider';
import { MaterialType, PouchType, PrintingMethod } from './types';
import type { ProductRequirements, CostBreakdown } from './types';
import {
    Calculator, Package, Ruler, Settings, LayoutDashboard, Layers, FileText,
    Percent, Moon, Sun, Menu, X, IndianRupee
} from 'lucide-react';
import './nexus.css';

type ViewType = 'dashboard' | 'estimator' | 'quotations' | 'materials';

function AppContent() {
    const [view, setView] = useState<ViewType>('dashboard');
    const [quantityMode, setQuantityMode] = useState<'kg' | 'pieces'>('pieces');
    const [darkMode, setDarkMode] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { showToast } = useToast();

    const [requirements, setRequirements] = useState<ProductRequirements>({
        pouch_type: PouchType.CENTER_SEAL,
        width_mm: 150,
        height_mm: 200,
        gusset_mm: 0,
        film_structure: {
            layers: [
                { material: MaterialType.PET, thickness_micron: 12 },
                { material: MaterialType.LDPE, thickness_micron: 40 }
            ]
        },
        number_of_colors: 6,
        printing_method: PrintingMethod.ROTOGRAVURE,
        cylinder_cost_per_unit: 4500,
        quantity_pieces: 100000,
        margin_percent: 20
    });

    const [result, setResult] = useState<CostBreakdown | null>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Auto-calculate debounce
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isFirstRender = useRef(true);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        if (view !== 'estimator') return;

        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            handleCalculate();
        }, 600);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [requirements]);

    // Dark mode toggle
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    }, [darkMode]);

    const handleCalculate = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('http://localhost:8000/api/calculate-cost', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requirements),
            });
            if (!response.ok) throw new Error('Calculation failed');
            const data = await response.json();
            setResult(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveQuotation = async () => {
        if (!result) return;

        const clientName = window.prompt("Enter Client Name:", "New Client");
        if (!clientName) return;

        setSaving(true);
        try {
            const response = await fetch('http://localhost:8000/api/quotations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    client_name: clientName,
                    requirements: requirements,
                    breakdown: result
                })
            });
            if (response.ok) {
                showToast(`Quotation saved for "${clientName}"`, 'success');
                setView('quotations');
            } else {
                showToast('Failed to save quotation', 'error');
            }
        } catch {
            showToast('Error saving quotation', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handlePrint = () => window.print();

    const handlePresetSelect = (config: ProductRequirements) => {
        setRequirements(config);
        showToast('Preset applied! Auto-calculating...', 'info');
    };

    const navItems: { id: ViewType; label: string; icon: React.ReactNode; section: string }[] = [
        { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="nav-icon" />, section: 'Core Modules' },
        { id: 'estimator', label: 'Cost Estimator', icon: <Calculator className="nav-icon" />, section: 'Core Modules' },
        { id: 'quotations', label: 'Quotations', icon: <FileText className="nav-icon" />, section: 'Core Modules' },
        { id: 'materials', label: 'Material Library', icon: <Layers className="nav-icon" />, section: 'Core Modules' },
    ];

    const pageTitles: Record<ViewType, { title: string; subtitle: string }> = {
        dashboard: { title: 'Dashboard', subtitle: 'Overview of your packaging business analytics' },
        estimator: { title: 'Cost Estimator', subtitle: 'Calculate precise packaging costs with real-time material rates' },
        quotations: { title: 'Quotations', subtitle: 'View and manage saved cost estimates' },
        materials: { title: 'Material Library', subtitle: 'Update raw material costs and exchange rates' },
    };

    return (
        <div className="app-layout">
            {/* Mobile Menu Button */}
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Sidebar Overlay (mobile) */}
            <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />

            {/* SIDEBAR */}
            <aside className={`sidebar print:hidden ${sidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        <Calculator className="w-5 h-5" />
                    </div>
                    <div className="sidebar-brand">
                        <span>Nexus</span> Analytics
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <div className="nav-section">
                        <div className="nav-section-title">Core Modules</div>
                        {navItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => { setView(item.id); setSidebarOpen(false); }}
                                className={`nav-item w-full text-left ${view === item.id ? 'active' : ''}`}
                            >
                                {item.icon}
                                <span>{item.label}</span>
                            </button>
                        ))}
                    </div>
                </nav>

                {/* Dark mode toggle at bottom */}
                <div className="p-6 border-t border-gray-100 dark:border-gray-800" style={{ borderTopColor: 'var(--card-border)' }}>
                    <button
                        onClick={() => setDarkMode(!darkMode)}
                        className="nav-item w-full text-left"
                    >
                        {darkMode ? <Sun className="nav-icon" /> : <Moon className="nav-icon" />}
                        <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="main-content">
                {/* Top Header */}
                <div className="top-header print:hidden flex justify-between items-start mb-8">
                    <div>
                        <h1 className="page-title">{pageTitles[view].title}</h1>
                        <p className="page-subtitle" style={{ marginBottom: 0 }}>{pageTitles[view].subtitle}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setDarkMode(!darkMode)}
                            className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                            style={{ background: 'var(--input-bg)' }}
                            title={darkMode ? 'Light Mode' : 'Dark Mode'}
                        >
                            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Bottom Navigation */}
                <nav className="mobile-bottom-nav">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => { setView(item.id); setSidebarOpen(false); }}
                            className={`mobile-nav-item ${view === item.id ? 'active' : ''}`}
                        >
                            {item.icon}
                            <span>{item.label}</span>
                        </button>
                    ))}
                </nav>

                {/* Views */}
                {view === 'dashboard' && <Dashboard onNavigate={(v) => setView(v as ViewType)} />}
                {view === 'materials' && <MaterialLibrary />}
                {view === 'quotations' && <QuotationsList />}

                {view === 'estimator' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column: Inputs */}
                        <div className="lg:col-span-2 space-y-6 print:hidden">

                            {/* Preset Templates */}
                            <PresetTemplates onSelect={handlePresetSelect} />

                            {/* AI Color Scanner */}
                            <AIColorScanner
                                onColorsDetected={(count) => setRequirements(prev => ({ ...prev, number_of_colors: count }))}
                            />

                            {/* Section 1: Dimensions & Type */}
                            <div className="nexus-card">
                                <h3 className="text-lg font-semibold flex items-center gap-2 mb-6 text-gray-800 dark:text-gray-100">
                                    <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                                        <Package className="w-5 h-5" />
                                    </div>
                                    Product Specifications
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <div className="col-span-1 md:col-span-2 lg:col-span-1">
                                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Pouch Type</label>
                                        <select
                                            value={requirements.pouch_type}
                                            onChange={(e) => setRequirements({ ...requirements, pouch_type: e.target.value as PouchType })}
                                            className="nexus-input w-full"
                                        >
                                            {Object.values(PouchType).map((type) => (
                                                <option key={type} value={type}>{type.replace(/_/g, ' ')}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="col-span-1 md:col-span-1">
                                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Width (mm)</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={requirements.width_mm}
                                                onChange={(e) => setRequirements({ ...requirements, width_mm: parseFloat(e.target.value) || 0 })}
                                                className="nexus-input pl-10 w-full"
                                            />
                                            <Ruler className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                                        </div>
                                    </div>

                                    <div className="col-span-1 md:col-span-1">
                                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Height (mm)</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={requirements.height_mm}
                                                onChange={(e) => setRequirements({ ...requirements, height_mm: parseFloat(e.target.value) || 0 })}
                                                className="nexus-input pl-10 w-full"
                                            />
                                            <Ruler className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                                        </div>
                                    </div>

                                    <div className="col-span-1 md:col-span-1">
                                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Gusset (mm)</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={requirements.gusset_mm}
                                                onChange={(e) => setRequirements({ ...requirements, gusset_mm: parseFloat(e.target.value) || 0 })}
                                                className="nexus-input pl-10 w-full"
                                            />
                                            <Ruler className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Film Structure */}
                            <div className="nexus-card">
                                <FilmStructureBuilder
                                    layers={requirements.film_structure.layers}
                                    onChange={(layers) => setRequirements({
                                        ...requirements,
                                        film_structure: { layers }
                                    })}
                                />
                            </div>

                            {/* Section 3: Production Parameters */}
                            <div className="nexus-card">
                                <h3 className="text-lg font-semibold flex items-center gap-2 mb-6 text-gray-800 dark:text-gray-100">
                                    <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                                        <Settings className="w-5 h-5" />
                                    </div>
                                    Production Parameters
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                    {/* Quantity */}
                                    <div className="col-span-1 md:col-span-2">
                                        <div className="flex justify-between mb-2">
                                            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Quantity</label>
                                            <div className="flex text-xs rounded-lg p-1" style={{ background: 'var(--input-bg)' }}>
                                                <button
                                                    className={`px-3 py-1 rounded-md transition-all ${quantityMode === 'pieces' ? 'bg-white dark:bg-gray-700 shadow-sm text-indigo-600 dark:text-indigo-400 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
                                                    onClick={() => {
                                                        setQuantityMode('pieces');
                                                        setRequirements({ ...requirements, quantity_pieces: 100000, quantity_kg: undefined });
                                                    }}
                                                >Pieces</button>
                                                <button
                                                    className={`px-3 py-1 rounded-md transition-all ${quantityMode === 'kg' ? 'bg-white dark:bg-gray-700 shadow-sm text-indigo-600 dark:text-indigo-400 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
                                                    onClick={() => {
                                                        setQuantityMode('kg');
                                                        setRequirements({ ...requirements, quantity_kg: 1000, quantity_pieces: undefined });
                                                    }}
                                                >Kg</button>
                                            </div>
                                        </div>
                                        <input
                                            type="number"
                                            value={quantityMode === 'pieces' ? (requirements.quantity_pieces || '') : (requirements.quantity_kg || '')}
                                            onChange={(e) => {
                                                const val = parseFloat(e.target.value) || 0;
                                                if (quantityMode === 'pieces') {
                                                    setRequirements({ ...requirements, quantity_pieces: val, quantity_kg: undefined });
                                                } else {
                                                    setRequirements({ ...requirements, quantity_kg: val, quantity_pieces: undefined });
                                                }
                                            }}
                                            className="nexus-input"
                                        />
                                    </div>

                                    {/* Printing Method */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Printing Method</label>
                                        <select
                                            value={requirements.printing_method}
                                            onChange={(e) => setRequirements({ ...requirements, printing_method: e.target.value as PrintingMethod })}
                                            className="nexus-input"
                                        >
                                            {Object.values(PrintingMethod).map((method) => (
                                                <option key={method} value={method}>{method}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Number of Colors */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Number of Colors</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="10"
                                            value={requirements.number_of_colors}
                                            onChange={(e) => setRequirements({ ...requirements, number_of_colors: parseInt(e.target.value) || 0 })}
                                            className="nexus-input"
                                        />
                                    </div>

                                    {/* Section 4: Operational Cost Rates */}
                                    <div className="nexus-card">
                                        <div className="flex justify-between items-center mb-6">
                                            <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-800 dark:text-gray-100">
                                                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                                                    <Settings className="w-5 h-5" />
                                                </div>
                                                Operational Cost Rates
                                            </h3>
                                            <button
                                                onClick={() => setRequirements({
                                                    ...requirements,
                                                    printing_cost_per_kg_override: 180,
                                                    lamination_cost_per_kg_override: 110
                                                })}
                                                className="text-xs font-semibold px-3 py-1.5 rounded-full bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900/50 dark:text-indigo-300 dark:hover:bg-indigo-800 transition-colors"
                                            >
                                                Apply Company Std (180/110)
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Printing Cost Override (₹ / kg)</label>
                                                <input
                                                    type="number"
                                                    value={requirements.printing_cost_per_kg_override ?? ''}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setRequirements({
                                                            ...requirements,
                                                            printing_cost_per_kg_override: val === '' ? undefined : parseFloat(val) || 0
                                                        });
                                                    }}
                                                    className="nexus-input"
                                                    placeholder="Auto calculation"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Lamination Cost Override (₹ / kg)</label>
                                                <input
                                                    type="number"
                                                    value={requirements.lamination_cost_per_kg_override ?? ''}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setRequirements({
                                                            ...requirements,
                                                            lamination_cost_per_kg_override: val === '' ? undefined : parseFloat(val) || 0
                                                        });
                                                    }}
                                                    className="nexus-input"
                                                    placeholder="Auto calculation"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Cylinder Cost */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Cylinder Cost (per unit)</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-3.5 text-gray-500 font-medium">₹</span>
                                            <input
                                                type="number"
                                                value={requirements.cylinder_cost_per_unit}
                                                onChange={(e) => setRequirements({ ...requirements, cylinder_cost_per_unit: parseFloat(e.target.value) || 0 })}
                                                className="nexus-input pl-8"
                                            />
                                        </div>
                                    </div>

                                    {/* Margin */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Profit Margin (%)</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={requirements.margin_percent}
                                                onChange={(e) => setRequirements({ ...requirements, margin_percent: parseFloat(e.target.value) || 0 })}
                                                className="nexus-input pl-10"
                                            />
                                            <Percent className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end hidden lg:flex">
                                <button
                                    onClick={handleCalculate}
                                    disabled={loading}
                                    className="nexus-btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Calculating...' : 'Calculate Costs'}
                                </button>
                            </div>

                            {error && (
                                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl border border-red-200 dark:border-red-800 flex items-center gap-3 animate-slide-in">
                                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                    {error}
                                </div>
                            )}
                        </div>

                        {/* Right Column: Results */}
                        <div className="hidden lg:block lg:col-span-1 print:block print:col-span-3 print:w-full">
                            <div className="sticky top-8">
                                <CostResult
                                    breakdown={result}
                                    loading={loading}
                                    onSave={handleSaveQuotation}
                                    onPrint={handlePrint}
                                    saving={saving}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Mobile Sticky Bottom Action Bar (Estimator only) */}
                {view === 'estimator' && (
                    <div className="sticky-bottom-action-bar lg:hidden visible has-nav">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex flex-col">
                                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium tracking-wide uppercase">Est. Cost / 1000</span>
                                {loading ? (
                                    <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 animate-pulse rounded mt-1"></div>
                                ) : result ? (
                                    <span className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1">
                                        <IndianRupee className="w-5 h-5 text-indigo-500" />
                                        {result.selling_price_per_1000}
                                    </span>
                                ) : (
                                    <span className="text-sm font-semibold text-gray-400 dark:text-gray-500 mt-1">Pending</span>
                                )}
                            </div>
                            <button
                                onClick={handleCalculate}
                                disabled={loading}
                                className="nexus-btn-primary flex-1 justify-center py-3 text-sm shadow-xl shadow-indigo-500/20"
                            >
                                {loading ? 'Calculating...' : result ? 'Update Cost' : 'Calculate Cost'}
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

function App() {
    return (
        <ToastProvider>
            <AppContent />
        </ToastProvider>
    );
}

export default App;
