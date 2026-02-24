import React from 'react';
import type { CostBreakdown } from '../types';
import { IndianRupee, Scale, Layers, Printer, Droplet, Save, FileText } from 'lucide-react';
import { CostPieChart } from './CostPieChart';

interface CostResultProps {
  breakdown: CostBreakdown | null;
  loading: boolean;
  onSave?: () => void;
  onPrint?: () => void;
  saving?: boolean;
}

export const CostResult: React.FC<CostResultProps> = ({ breakdown, loading, onSave, onPrint, saving }) => {
  if (loading) {
    return (
      <div className="nexus-card h-full flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-4 border-indigo-100 dark:border-indigo-900"></div>
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-600 animate-spin"></div>
        </div>
        <span className="text-sm text-gray-400 animate-pulse-soft">Calculating costs...</span>
      </div>
    );
  }

  if (!breakdown) {
    return (
      <div className="nexus-card h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 min-h-[400px]">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
          <IndianRupee className="w-8 h-8 opacity-30" />
        </div>
        <p className="text-sm">Enter specifications to calculate cost</p>
        <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">Results will appear here</p>
      </div>
    );
  }

  const pieData = [
    { label: 'Material', value: breakdown.material_cost_per_kg, color: '#6366f1' },
    { label: 'Ink', value: breakdown.ink_cost_per_kg, color: '#a855f7' },
    { label: 'Printing', value: breakdown.printing_cost_per_kg, color: '#ec4899' },
    { label: 'Lamination', value: breakdown.lamination_cost_per_kg, color: '#f59e0b' },
    { label: 'Pouching', value: breakdown.pouching_cost_per_kg, color: '#10b981' },
    { label: 'Overhead', value: breakdown.overhead_cost_per_kg, color: '#64748b' },
    { label: 'Cylinder', value: breakdown.cylinder_cost_amortized_per_kg, color: '#f97316' },
  ];

  return (
    <div className="nexus-card p-0 overflow-hidden print:shadow-none print:border-none animate-fade-in-up">
      <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center print:bg-white print:border-b-2 print:border-black">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Cost Breakdown</h2>
        <span className="text-xs font-medium px-2.5 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full">
          {breakdown.margin_percent}% Margin
        </span>
      </div>

      <div className="p-6 space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-indigo-50/50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100/50 dark:border-indigo-800/30">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-1">
              <Scale className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Weight / 1000</span>
            </div>
            <div className="text-xl font-bold text-gray-900 dark:text-gray-100">{breakdown.weight_per_1000_pouches_kg} <span className="text-sm font-normal text-gray-500 dark:text-gray-400">kg</span></div>
          </div>
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-4 rounded-xl text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/40">
            <div className="flex items-center gap-2 text-indigo-100 mb-1">
              <IndianRupee className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Price / 1000</span>
            </div>
            <div className="text-2xl font-bold">₹{breakdown.selling_price_per_1000}</div>
          </div>
        </div>

        {/* Per-pouch pricing */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex flex-col">
            <span className="text-gray-500 dark:text-gray-400 text-xs">Cost per pouch</span>
            <span className="font-semibold text-gray-800 dark:text-gray-100">₹{breakdown.cost_per_pouch.toFixed(4)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-gray-500 dark:text-gray-400 text-xs">Selling price per pouch</span>
            <span className="font-semibold text-indigo-700 dark:text-indigo-400">₹{breakdown.selling_price_per_pouch.toFixed(4)}</span>
          </div>
        </div>

        {/* Cost Pie Chart */}
        <div className="border-t border-gray-100 dark:border-gray-700 pt-6 print:hidden">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4 text-center">Cost Distribution</h4>
          <CostPieChart data={pieData} size={180} />
        </div>

        {/* Detailed List */}
        <div className="space-y-3 text-sm border-t border-gray-100 dark:border-gray-700 pt-4">
          <div className="flex justify-between py-2 border-b border-dashed border-gray-200 dark:border-gray-700">
            <span className="text-gray-500 dark:text-gray-400 font-medium">Film Material</span>
            <span className="font-semibold text-gray-700 dark:text-gray-200">₹{breakdown.material_cost_per_kg}/kg</span>
          </div>

          <div className="flex justify-between py-2 border-b border-dashed border-gray-200 dark:border-gray-700">
            <span className="text-gray-500 dark:text-gray-400 font-medium flex items-center gap-2">
              <Droplet className="w-4 h-4 text-purple-500" />
              Ink Cost
            </span>
            <span className="font-semibold text-purple-700 dark:text-purple-400">₹{breakdown.ink_cost_per_kg}/kg</span>
          </div>

          {/* Operational Costs */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 space-y-2">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Operational Costs</div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1"><Printer className="w-3 h-3" /> Printing</span>
              <span className="font-medium text-gray-700 dark:text-gray-200">₹{breakdown.printing_cost_per_kg}/kg</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1"><Layers className="w-3 h-3" /> Lamination</span>
              <span className="font-medium text-gray-700 dark:text-gray-200">₹{breakdown.lamination_cost_per_kg}/kg</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500 dark:text-gray-400">Pouching & Slitting</span>
              <span className="font-medium text-gray-700 dark:text-gray-200">₹{(breakdown.pouching_cost_per_kg + breakdown.overhead_cost_per_kg).toFixed(2)}/kg</span>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700 mt-2 pt-2 flex justify-between text-xs font-bold text-gray-600 dark:text-gray-300">
              <span>Total Conversion</span>
              <span>₹{breakdown.conversion_cost_per_kg}/kg</span>
            </div>
          </div>

          {/* Cylinder Cost */}
          {breakdown.cylinder_cost_amortized_per_kg > 0 && (
            <div className="flex justify-between py-3 px-3 border border-orange-100 dark:border-orange-800/30 bg-orange-50 dark:bg-orange-900/10 rounded-xl items-center">
              <div className="flex flex-col">
                <span className="text-orange-800 dark:text-orange-400 text-xs font-bold uppercase">Cylinder Amortization</span>
                <span className="text-orange-600 dark:text-orange-500 text-[10px]">Total: ₹{breakdown.cylinder_cost_total}</span>
              </div>
              <span className="font-bold text-orange-700 dark:text-orange-400">₹{breakdown.cylinder_cost_amortized_per_kg}/kg</span>
            </div>
          )}

          <div className="pt-2 mt-2">
            <div className="flex justify-between items-end mb-1">
              <span className="text-gray-500 dark:text-gray-400 text-xs">Total Cost (Ex. Factory)</span>
              <span className="font-bold text-gray-800 dark:text-gray-100">₹{breakdown.total_cost_per_kg}/kg</span>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 text-center print:hidden">
          <div className="text-gray-400 text-[10px] uppercase tracking-wider mb-1">Internal Cost per 1000</div>
          <div className="text-lg font-mono font-medium text-gray-600 dark:text-gray-300">₹{breakdown.cost_per_1000_pouches}</div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-gray-700 print:hidden">
          <button
            onClick={onSave}
            disabled={saving}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 transition-colors"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Quote'}
          </button>
          <button
            onClick={onPrint}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-800 dark:bg-gray-600 text-white rounded-xl text-sm font-medium hover:bg-gray-900 dark:hover:bg-gray-500 transition-colors shadow-lg shadow-gray-200 dark:shadow-gray-900"
          >
            <FileText className="w-4 h-4" />
            Export PDF
          </button>
        </div>
      </div>
    </div>
  );
};
