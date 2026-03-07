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
        <div className="relative w-14 h-14">
          <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20"></div>
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-indigo-500 animate-spin" style={{ boxShadow: '0 0 16px rgba(99,102,241,0.3)' }}></div>
        </div>
        <span className="text-sm text-gray-400 animate-pulse-soft font-medium">Analyzing cost structure...</span>
      </div>
    );
  }

  if (!breakdown) {
    return (
      <div className="nexus-card h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 min-h-[400px]">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 flex items-center justify-center mb-3">
          <IndianRupee className="w-8 h-8 opacity-30" />
        </div>
        <p className="text-sm font-medium">Enter specifications to calculate cost</p>
        <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">Results will appear here</p>
      </div>
    );
  }

  const pieData = [
    { label: 'Material', value: breakdown.material_cost_per_kg, color: '#6366f1' },
    { label: 'Ink', value: breakdown.ink_cost_per_kg, color: '#a855f7' },
    { label: 'Printing', value: breakdown.printing_cost_per_kg, color: '#ec4899' },
    { label: 'Lamination', value: breakdown.lamination_cost_per_kg, color: '#f59e0b' },
    { label: 'Pouching', value: breakdown.pouching_cost_per_kg, color: '#06b6d4' },
    { label: 'Overhead', value: breakdown.overhead_cost_per_kg, color: '#64748b' },
    { label: 'Cylinder', value: breakdown.cylinder_cost_amortized_per_kg, color: '#f97316' },
  ];

  return (
    <div className="nexus-card p-0 overflow-hidden print:shadow-none print:border-none animate-fade-in-up">
      {/* Header */}
      <div className="relative p-5 border-b border-indigo-500/10 flex justify-between items-center" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.04), rgba(6,182,212,0.02))' }}>
        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 tracking-tight">Cost Breakdown</h2>
        <span className="text-xs font-bold px-3 py-1.5 rounded-full" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(6,182,212,0.08))', color: '#10b981', border: '1px solid rgba(16,185,129,0.15)' }}>
          {breakdown.margin_percent}% Margin
        </span>
      </div>

      <div className="p-6 space-y-6">
        {/* ── Hero Metrics ── */}
        <div className="grid grid-cols-2 gap-4">
          <div className="cyber-metric">
            <div className="metric-label flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-indigo-400" />
              Weight / 1000 pcs
            </div>
            <div className="metric-value text-gray-900 dark:text-gray-100">
              {breakdown.weight_per_1000_pouches_kg}
              <span className="text-sm font-medium text-gray-400 ml-1">kg</span>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-2xl p-5" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #06b6d4)', boxShadow: '0 8px 32px rgba(99,102,241,0.3)' }}>
            <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/10 blur-sm" />
            <div className="absolute -left-2 -bottom-6 w-16 h-16 rounded-full bg-white/5" />
            <div className="flex items-center gap-1.5 text-indigo-100 mb-1 relative z-10">
              <IndianRupee className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Selling Price / 1000</span>
            </div>
            <div className="text-2xl font-black text-white relative z-10" style={{ fontFamily: 'var(--font-mono)' }}>
              ₹{breakdown.selling_price_per_1000}
            </div>
          </div>
        </div>

        {/* ── Per-Pouch Data ── */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex flex-col p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30">
            <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">Cost per pouch</span>
            <span className="font-bold text-gray-800 dark:text-gray-100" style={{ fontFamily: 'var(--font-mono)' }}>₹{breakdown.cost_per_pouch.toFixed(4)}</span>
          </div>
          <div className="flex flex-col p-3 rounded-xl border border-indigo-100 dark:border-indigo-900/30 bg-indigo-50/30 dark:bg-indigo-900/10">
            <span className="text-indigo-400 text-[10px] font-bold uppercase tracking-wider mb-1">Selling / pouch</span>
            <span className="font-bold text-indigo-700 dark:text-indigo-300" style={{ fontFamily: 'var(--font-mono)' }}>₹{breakdown.selling_price_per_pouch.toFixed(4)}</span>
          </div>
        </div>

        {/* ── Pie Chart ── */}
        <div className="pt-4 print:hidden">
          <div className="neon-divider" />
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4 text-center mt-4">Cost Distribution</h4>
          <CostPieChart data={pieData} size={180} />
        </div>

        {/* ── Detailed Breakdown Grid ── */}
        <div className="space-y-3 text-sm">
          <div className="neon-divider" />

          <div className="flex justify-between items-center py-2.5 px-3 rounded-lg hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
            <span className="text-gray-500 dark:text-gray-400 font-medium">Film Material</span>
            <span className="font-bold text-gray-700 dark:text-gray-200" style={{ fontFamily: 'var(--font-mono)' }}>₹{breakdown.material_cost_per_kg}/kg</span>
          </div>

          <div className="flex justify-between items-center py-2.5 px-3 rounded-lg hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
            <span className="text-gray-500 dark:text-gray-400 font-medium flex items-center gap-2">
              <Droplet className="w-4 h-4 text-purple-400" />
              Ink Cost
            </span>
            <span className="font-bold text-purple-600 dark:text-purple-400" style={{ fontFamily: 'var(--font-mono)' }}>₹{breakdown.ink_cost_per_kg}/kg</span>
          </div>

          {/* Operational Costs Block */}
          <div className="rounded-xl p-4 space-y-2.5 border border-gray-100 dark:border-gray-800" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.02), rgba(6,182,212,0.01))' }}>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Operational Costs</div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5"><Printer className="w-3.5 h-3.5 text-pink-400" /> Printing</span>
              <span className="font-bold text-gray-700 dark:text-gray-200" style={{ fontFamily: 'var(--font-mono)' }}>₹{breakdown.printing_cost_per_kg}/kg</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5"><Layers className="w-3.5 h-3.5 text-amber-400" /> Lamination</span>
              <span className="font-bold text-gray-700 dark:text-gray-200" style={{ fontFamily: 'var(--font-mono)' }}>₹{breakdown.lamination_cost_per_kg}/kg</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500 dark:text-gray-400">Pouching & Slitting</span>
              <span className="font-bold text-gray-700 dark:text-gray-200" style={{ fontFamily: 'var(--font-mono)' }}>₹{(breakdown.pouching_cost_per_kg + breakdown.overhead_cost_per_kg).toFixed(2)}/kg</span>
            </div>
            <div className="neon-divider" style={{ margin: '12px 0' }} />
            <div className="flex justify-between text-xs font-bold text-indigo-600 dark:text-indigo-400">
              <span>Total Conversion</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>₹{breakdown.conversion_cost_per_kg}/kg</span>
            </div>
          </div>

          {/* Cylinder Cost */}
          {breakdown.cylinder_cost_amortized_per_kg > 0 && (
            <div className="flex justify-between py-3 px-4 rounded-xl items-center" style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.06), rgba(249,115,22,0.02))', border: '1px solid rgba(249,115,22,0.12)' }}>
              <div className="flex flex-col">
                <span className="text-orange-700 dark:text-orange-400 text-xs font-bold uppercase">Cylinder Amortization</span>
                <span className="text-orange-500 dark:text-orange-500 text-[10px]" style={{ fontFamily: 'var(--font-mono)' }}>Total: ₹{breakdown.cylinder_cost_total}</span>
              </div>
              <span className="font-black text-orange-600 dark:text-orange-400" style={{ fontFamily: 'var(--font-mono)' }}>₹{breakdown.cylinder_cost_amortized_per_kg}/kg</span>
            </div>
          )}

          <div className="pt-2 mt-2">
            <div className="flex justify-between items-end mb-1">
              <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Total Cost (Ex. Factory)</span>
              <span className="font-black text-gray-800 dark:text-gray-100 text-lg" style={{ fontFamily: 'var(--font-mono)' }}>₹{breakdown.total_cost_per_kg}/kg</span>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 text-center print:hidden" style={{ borderTop: '1px solid rgba(99,102,241,0.08)' }}>
          <div className="text-gray-400 text-[10px] uppercase tracking-widest mb-1 font-bold">Internal Cost per 1000</div>
          <div className="text-xl font-black text-gray-600 dark:text-gray-300" style={{ fontFamily: 'var(--font-mono)' }}>₹{breakdown.cost_per_1000_pouches}</div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3 mt-6 pt-4 print:hidden" style={{ borderTop: '1px solid rgba(99,102,241,0.08)' }}>
          <button
            onClick={onSave}
            disabled={saving}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all hover:shadow-lg"
            style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', color: 'var(--text-main)' }}
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Quote'}
          </button>
          <button
            onClick={onPrint}
            className="nexus-btn-primary justify-center text-sm py-3"
          >
            <FileText className="w-4 h-4" />
            Export PDF
          </button>
        </div>
      </div>
    </div>
  );
};
