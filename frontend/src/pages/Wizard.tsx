import { useState, useEffect, useRef } from 'react';
import { FilmStructureBuilder } from '../components/FilmStructureBuilder';
import { CostResult } from '../components/CostResult';
import { PresetTemplates } from '../components/PresetTemplates';
import { ColorScanner } from '../components/AIColorScanner';
import { useToast } from '../components/ToastProvider';
import { MaterialType, PouchType, PrintingMethod } from '../types';
import type { ProductRequirements, CostBreakdown } from '../types';
import { calculateCost } from '../utils/calculations';
import { apiFetch } from '../utils/apiConfig';
import { Package, Ruler, Settings, Percent, ChevronRight, ChevronLeft, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const WIZARD_STEPS = [
    { id: 1, title: 'Specs & Setup' },
    { id: 2, title: 'Film Structure' },
    { id: 3, title: 'Process & Cost' },
    { id: 4, title: 'Results & Save' },
];

export function Wizard() {
    const [currentStep, setCurrentStep] = useState(1);
    const [quantityMode, setQuantityMode] = useState<'kg' | 'pieces'>('pieces');
    const { showToast } = useToast();
    const navigate = useNavigate();

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
        margin_percent: 20,
        wastage_percent: 5.0,
        labor_cost_per_kg: 8.0,
        machine_usage_cost_per_kg: 15.0
    });

    const [result, setResult] = useState<CostBreakdown | null>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const printRef = useRef<HTMLDivElement>(null);

    // Auto-calculate on requirement change
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isFirstRender = useRef(true);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            handleCalculate();
        }, 600);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [requirements]);

    const handleCalculate = async () => {
        setLoading(true);
        setError(null);
        try {
            // Client-side calculation — no backend needed
            const data = calculateCost(requirements);
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
            const response = await apiFetch('/api/quotations', {
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
                navigate('/quotations');
            } else {
                showToast('Failed to save quotation', 'error');
            }
        } catch {
            showToast('Error saving quotation', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handlePrint = async () => {
        if (!printRef.current) return;
        try {
            const canvas = await html2canvas(printRef.current, { scale: 2, useCORS: true });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Quotation_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (err) {
            showToast('Failed to generate PDF export', 'error');
        }
    };

    const handlePresetSelect = (config: ProductRequirements) => {
        setRequirements(config);
        showToast('Preset applied! Auto-calculating...', 'info');
        setCurrentStep(2); // Move to next step smoothly
    };

    const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 4));
    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

    return (
        <div className="max-w-4xl mx-auto pb-24">

            {/* Stepper Header */}
            <div className="mb-10 print:hidden">
                <div className="flex justify-between items-center relative">
                    {/* Background track line */}
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full step-line z-0">
                        <div
                            className="step-line-fill"
                            style={{ width: `${((currentStep - 1) / (WIZARD_STEPS.length - 1)) * 100}%` }}
                        />
                    </div>

                    {WIZARD_STEPS.map((step) => {
                        const isCompleted = currentStep > step.id;
                        const isCurrent = currentStep === step.id;
                        return (
                            <div key={step.id} className="relative z-10 flex flex-col items-center gap-2.5">
                                <div className={`step-circle ${isCompleted ? 'completed' : isCurrent ? 'active' : ''}`}>
                                    {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : step.id}
                                </div>
                                <span className={`text-[10px] md:text-xs font-bold transition-colors ${isCurrent ? 'text-indigo-500' : isCompleted ? 'text-emerald-500' : 'text-gray-400 dark:text-gray-600'}`}>
                                    {step.title}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Error Banner */}
            {error && (
                <div className="p-4 rounded-xl flex items-center gap-3 animate-slide-in mb-6" style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.08), rgba(239,68,68,0.03))', border: '1px solid rgba(239,68,68,0.15)' }}>
                    <div className="w-2 h-2 rounded-full bg-red-500" style={{ boxShadow: '0 0 8px rgba(239,68,68,0.5)' }}></div>
                    <span className="text-red-600 dark:text-red-400 text-sm font-medium">{error}</span>
                </div>
            )}

            {/* Step Contents */}
            <div className="animate-fade-in-up">

                {/* STEP 1: Specs & AI Upload */}
                {currentStep === 1 && (
                    <div className="space-y-6">
                        <PresetTemplates onSelect={handlePresetSelect} />

                        <ColorScanner
                            onColorsDetected={(count) => setRequirements(prev => ({ ...prev, number_of_colors: count }))}
                        />

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
                    </div>
                )}

                {/* STEP 2: Film Structure */}
                {currentStep === 2 && (
                    <div className="nexus-card">
                        <FilmStructureBuilder
                            layers={requirements.film_structure.layers}
                            onChange={(layers) => setRequirements({
                                ...requirements,
                                film_structure: { layers }
                            })}
                        />
                    </div>
                )}

                {/* STEP 3: Process & Costs */}
                {currentStep === 3 && (
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
                                    {Object.values(PrintingMethod).map(method => (
                                        <option key={method} value={method}>{method.replace(/_/g, ' ')}</option>
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
                            <div className="nexus-card col-span-1 md:col-span-2">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-800 dark:text-gray-100">
                                        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                                            <Settings className="w-5 h-5" />
                                        </div>
                                        Operational Cost Overrides
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
                )}

                {/* STEP 4: Live Results & Save */}
                {currentStep === 4 && (
                    <div className="animate-slide-in" ref={printRef}>
                        <div className="print-header hidden print:block text-center mb-8">
                            <h1 className="text-2xl font-bold">Nexus Quotation Report</h1>
                            <p className="text-gray-500">Generated on {new Date().toLocaleDateString()}</p>
                        </div>
                        <CostResult
                            breakdown={result}
                            loading={loading}
                            quantityMode={quantityMode}
                            onSave={handleSaveQuotation}
                            onPrint={handlePrint}
                            saving={saving}
                        />
                    </div>
                )}
            </div>

            {/* Stepper Navigation Actions */}
            <div className="mt-8 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 print:hidden pt-6" style={{ borderTop: '1px solid rgba(99,102,241,0.08)' }}>
                <button
                    onClick={prevStep}
                    disabled={currentStep === 1}
                    className="flex items-center justify-center gap-2 px-6 py-3 font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors order-2 sm:order-1 rounded-xl" style={{ border: '1px solid var(--card-border)' }}
                >
                    <ChevronLeft className="w-5 h-5" /> Back
                </button>

                {currentStep < 4 ? (
                    <button
                        onClick={nextStep}
                        className="nexus-btn-primary px-8 order-1 sm:order-2"
                    >
                        Next <ChevronRight className="w-5 h-5" />
                    </button>
                ) : (
                    <button
                        onClick={handleCalculate}
                        disabled={loading}
                        className="nexus-btn-primary px-8 shadow-indigo-500/30 order-1 sm:order-2"
                    >
                        {loading ? 'Recalculating...' : 'Refresh Quote'}
                    </button>
                )}
            </div>

            {/* Mobile Bottom Quick Actions Placeholder - can be empty since Next/Back is above */}

        </div>
    );
}
