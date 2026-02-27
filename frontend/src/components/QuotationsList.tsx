import React, { useEffect, useState } from 'react';
import { FileText, Calendar, Search, Trash2, ChevronDown, ChevronUp, GitCompare, X } from 'lucide-react';
import type { CostBreakdown, ProductRequirements } from '../types';
import { useToast } from './ToastProvider';
import { apiFetch } from '../utils/apiConfig';

interface Quotation {
  id: number;
  date: string;
  client_name: string;
  requirements: ProductRequirements;
  breakdown: CostBreakdown;
}

export const QuotationsList: React.FC = () => {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [compareIds, setCompareIds] = useState<number[]>([]);
  const [showCompare, setShowCompare] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    fetchQuotations();
  }, []);

  const fetchQuotations = async () => {
    try {
      const response = await apiFetch('/api/quotations');
      if (response.ok) {
        const data = await response.json();
        setQuotations(data.reverse());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await apiFetch(`/api/quotations/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setQuotations(prev => prev.filter(q => q.id !== id));
        setCompareIds(prev => prev.filter(cid => cid !== id));
        showToast(`Quotation #${id} deleted`, 'success');
      } else {
        showToast('Failed to delete quotation', 'error');
      }
    } catch {
      showToast('Error deleting quotation', 'error');
    }
  };

  const toggleCompare = (id: number) => {
    setCompareIds(prev => {
      if (prev.includes(id)) return prev.filter(cid => cid !== id);
      if (prev.length >= 2) {
        showToast('You can compare up to 2 quotations', 'warning');
        return prev;
      }
      return [...prev, id];
    });
  };

  const filteredQuotations = quotations.filter(q =>
    q.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.requirements.pouch_type.toLowerCase().includes(searchQuery.toLowerCase().replace(/ /g, '_'))
  );

  const compareQuotations = quotations.filter(q => compareIds.includes(q.id));

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 rounded-xl skeleton" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Quotations</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">History of generated cost estimates</p>
        </div>
        <div className="flex items-center gap-3">
          {compareIds.length === 2 && (
            <button
              onClick={() => setShowCompare(true)}
              className="nexus-btn-primary text-sm py-2 px-4"
            >
              <GitCompare className="w-4 h-4" /> Compare ({compareIds.length})
            </button>
          )}
          <div className="relative">
            <input
              type="text"
              placeholder="Search clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="nexus-input pl-10 w-64"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
          </div>
        </div>
      </div>

      <div className="nexus-card p-0 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="text-xs uppercase bg-gray-50/80 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-4 py-4 w-10">
                <GitCompare className="w-3.5 h-3.5 text-gray-400" />
              </th>
              <th className="px-4 py-4 text-gray-500 dark:text-gray-400">ID</th>
              <th className="px-4 py-4 text-gray-500 dark:text-gray-400">Client</th>
              <th className="px-4 py-4 text-gray-500 dark:text-gray-400">Date</th>
              <th className="px-4 py-4 text-gray-500 dark:text-gray-400">Product</th>
              <th className="px-4 py-4 text-gray-500 dark:text-gray-400">Price / 1000</th>
              <th className="px-4 py-4 text-gray-500 dark:text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredQuotations.map((quote) => (
              <React.Fragment key={quote.id}>
                <tr className={`border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors ${compareIds.includes(quote.id) ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}>
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={compareIds.includes(quote.id)}
                      onChange={() => toggleCompare(quote.id)}
                      className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </td>
                  <td className="px-4 py-4 font-medium text-gray-900 dark:text-gray-100">#{quote.id}</td>
                  <td className="px-4 py-4 font-semibold text-gray-800 dark:text-gray-200">{quote.client_name}</td>
                  <td className="px-4 py-4 text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      {new Date(quote.date).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-gray-500 dark:text-gray-400">
                    {quote.requirements.width_mm}×{quote.requirements.height_mm}mm {quote.requirements.pouch_type.replace(/_/g, ' ')}
                  </td>
                  <td className="px-4 py-4 font-bold text-emerald-600 dark:text-emerald-400">
                    ₹{quote.breakdown.selling_price_per_1000}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setExpandedId(expandedId === quote.id ? null : quote.id)}
                        className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 flex items-center gap-1 font-medium text-xs px-2 py-1 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                      >
                        {expandedId === quote.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        {expandedId === quote.id ? 'Hide' : 'View'}
                      </button>
                      <button
                        onClick={() => handleDelete(quote.id)}
                        className="text-gray-400 hover:text-red-500 p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
                {/* Expanded Detail Row */}
                {expandedId === quote.id && (
                  <tr className="animate-slide-in">
                    <td colSpan={7} className="px-6 py-6 bg-gray-50/50 dark:bg-gray-800/30">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <DetailItem label="Material Cost" value={`₹${quote.breakdown.material_cost_per_kg}/kg`} />
                        <DetailItem label="Ink Cost" value={`₹${quote.breakdown.ink_cost_per_kg}/kg`} />
                        <DetailItem label="Printing Cost" value={`₹${quote.breakdown.printing_cost_per_kg}/kg`} />
                        <DetailItem label="Lamination Cost" value={`₹${quote.breakdown.lamination_cost_per_kg}/kg`} />
                        <DetailItem label="Conversion Cost" value={`₹${quote.breakdown.conversion_cost_per_kg}/kg`} />
                        <DetailItem label="Total Cost" value={`₹${quote.breakdown.total_cost_per_kg}/kg`} />
                        <DetailItem label="Cost / Pouch" value={`₹${quote.breakdown.cost_per_pouch.toFixed(4)}`} />
                        <DetailItem label="Margin" value={`${quote.breakdown.margin_percent}%`} />
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {filteredQuotations.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                  <FileText className="w-10 h-10 mx-auto mb-2 opacity-20" />
                  {searchQuery ? 'No matching quotations found.' : 'No quotations yet. Create one in the Cost Estimator.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Comparison Modal */}
      {showCompare && compareQuotations.length === 2 && (
        <div className="modal-backdrop" onClick={() => setShowCompare(false)}>
          <div className="modal-content w-[800px]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <GitCompare className="w-5 h-5 text-indigo-600" />
                Quotation Comparison
              </h3>
              <button onClick={() => setShowCompare(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 text-gray-500 font-medium">Metric</th>
                  <th className="text-right py-3 font-semibold text-indigo-600">#{compareQuotations[0].id} — {compareQuotations[0].client_name}</th>
                  <th className="text-right py-3 font-semibold text-purple-600">#{compareQuotations[1].id} — {compareQuotations[1].client_name}</th>
                </tr>
              </thead>
              <tbody>
                <CompareRow label="Pouch Type" v1={compareQuotations[0].requirements.pouch_type.replace(/_/g, ' ')} v2={compareQuotations[1].requirements.pouch_type.replace(/_/g, ' ')} />
                <CompareRow label="Dimensions" v1={`${compareQuotations[0].requirements.width_mm}×${compareQuotations[0].requirements.height_mm}mm`} v2={`${compareQuotations[1].requirements.width_mm}×${compareQuotations[1].requirements.height_mm}mm`} />
                <CompareRow label="Material Cost" v1={`₹${compareQuotations[0].breakdown.material_cost_per_kg}/kg`} v2={`₹${compareQuotations[1].breakdown.material_cost_per_kg}/kg`} />
                <CompareRow label="Total Cost / kg" v1={`₹${compareQuotations[0].breakdown.total_cost_per_kg}`} v2={`₹${compareQuotations[1].breakdown.total_cost_per_kg}`} />
                <CompareRow label="Selling Price / 1000" v1={`₹${compareQuotations[0].breakdown.selling_price_per_1000}`} v2={`₹${compareQuotations[1].breakdown.selling_price_per_1000}`} highlight />
                <CompareRow label="Cost / Pouch" v1={`₹${compareQuotations[0].breakdown.cost_per_pouch.toFixed(4)}`} v2={`₹${compareQuotations[1].breakdown.cost_per_pouch.toFixed(4)}`} />
                <CompareRow label="Margin" v1={`${compareQuotations[0].breakdown.margin_percent}%`} v2={`${compareQuotations[1].breakdown.margin_percent}%`} />
                <CompareRow label="Conversion Cost" v1={`₹${compareQuotations[0].breakdown.conversion_cost_per_kg}/kg`} v2={`₹${compareQuotations[1].breakdown.conversion_cost_per_kg}/kg`} />
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

const DetailItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="bg-white/50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
    <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">{label}</div>
    <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">{value}</div>
  </div>
);

const CompareRow: React.FC<{ label: string; v1: string; v2: string; highlight?: boolean }> = ({ label, v1, v2, highlight }) => (
  <tr className={`border-b border-gray-100 dark:border-gray-700/50 ${highlight ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}>
    <td className="py-3 text-gray-500 dark:text-gray-400 font-medium">{label}</td>
    <td className="py-3 text-right font-semibold text-gray-800 dark:text-gray-200">{v1}</td>
    <td className="py-3 text-right font-semibold text-gray-800 dark:text-gray-200">{v2}</td>
  </tr>
);
