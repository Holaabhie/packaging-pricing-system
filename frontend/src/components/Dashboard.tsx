import React, { useEffect, useState, useRef } from 'react';
import { TrendingUp, FileText, Percent, IndianRupee, Package, Layers, ArrowRight, BarChart3, Activity } from 'lucide-react';
import { apiFetch } from '../utils/apiConfig';

interface DashboardStats {
    total_quotations: number;
    avg_margin: number;
    total_revenue: number;
    avg_cost_per_kg: number;
    popular_pouch_type: string;
    popular_material: string;
    material_usage: Record<string, number>;
    pouch_type_usage: Record<string, number>;
    recent_quotations: any[];
    cost_distribution: Record<string, number>;
}

// Animated counter hook
function useAnimatedCount(target: number, duration = 1200) {
    const [count, setCount] = useState(0);
    const ref = useRef<number>(0);

    useEffect(() => {
        const start = ref.current;
        const diff = target - start;
        if (diff === 0) return;
        const startTime = performance.now();

        const animate = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 3);
            const value = start + diff * ease;
            setCount(value);
            ref.current = value;
            if (progress < 1) requestAnimationFrame(animate);
        };

        requestAnimationFrame(animate);
    }, [target, duration]);

    return count;
}

const KPICard: React.FC<{
    icon: React.ReactNode;
    label: string;
    value: number;
    prefix?: string;
    suffix?: string;
    decimals?: number;
    gradient: string;
    iconBg: string;
}> = ({ icon, label, value, prefix = '', suffix = '', decimals = 0, gradient, iconBg }) => {
    const animated = useAnimatedCount(value);

    return (
        <div className={`relative overflow-hidden rounded-2xl p-6 text-white shadow-xl ${gradient}`}>
            <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/10 blur-sm" />
            <div className="absolute -right-2 -bottom-6 w-20 h-20 rounded-full bg-white/5" />
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${iconBg}`}>
                {icon}
            </div>
            <div className="text-xs font-medium uppercase tracking-wider text-white/70 mb-1">{label}</div>
            <div className="text-2xl font-bold">
                {prefix}{decimals > 0 ? animated.toFixed(decimals) : Math.round(animated)}{suffix}
            </div>
        </div>
    );
};

interface DashboardProps {
    onNavigate: (view: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiFetch('/api/dashboard/stats')
            .then(res => res.json())
            .then(data => setStats(data))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-36 rounded-2xl bg-gray-200/50 dark:bg-gray-700/50 animate-pulse" />
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 h-64 rounded-2xl bg-gray-200/50 dark:bg-gray-700/50 animate-pulse" />
                    <div className="h-64 rounded-2xl bg-gray-200/50 dark:bg-gray-700/50 animate-pulse" />
                </div>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="nexus-card text-center py-16 text-gray-400">
                <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Could not load dashboard data. Make sure the backend is running.</p>
            </div>
        );
    }

    const costDist = stats.cost_distribution;
    const costColors: Record<string, string> = {
        material: '#6366f1', ink: '#a855f7', printing: '#ec4899',
        lamination: '#f59e0b', pouching: '#10b981', overhead: '#64748b', cylinder: '#f97316'
    };
    const totalCost = Object.values(costDist).reduce((a, b) => a + b, 0);

    // Material usage bar chart
    const matEntries = Object.entries(stats.material_usage).sort((a, b) => b[1] - a[1]);
    const maxMatCount = matEntries.length > 0 ? matEntries[0][1] : 1;

    const matColors: Record<string, string> = {
        PET: '#6366f1', BOPP: '#8b5cf6', MET_PET: '#a855f7', MET_BOPP: '#c084fc',
        LDPE: '#22c55e', CPP: '#10b981', AL_FOIL: '#f59e0b', NYLON: '#ef4444', PAPER: '#78716c'
    };

    return (
        <div className="space-y-8 animate-fade-in-up">
            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard
                    icon={<FileText className="w-5 h-5" />}
                    label="Total Quotations"
                    value={stats.total_quotations}
                    gradient="bg-gradient-to-br from-indigo-500 to-indigo-700"
                    iconBg="bg-white/20"
                />
                <KPICard
                    icon={<Percent className="w-5 h-5" />}
                    label="Avg Margin"
                    value={stats.avg_margin}
                    suffix="%"
                    decimals={1}
                    gradient="bg-gradient-to-br from-emerald-500 to-teal-700"
                    iconBg="bg-white/20"
                />
                <KPICard
                    icon={<IndianRupee className="w-5 h-5" />}
                    label="Total Revenue Est."
                    value={stats.total_revenue}
                    prefix="₹"
                    gradient="bg-gradient-to-br from-purple-500 to-purple-800"
                    iconBg="bg-white/20"
                />
                <KPICard
                    icon={<TrendingUp className="w-5 h-5" />}
                    label="Avg Cost / kg"
                    value={stats.avg_cost_per_kg}
                    prefix="₹"
                    decimals={1}
                    gradient="bg-gradient-to-br from-pink-500 to-rose-700"
                    iconBg="bg-white/20"
                />
            </div>

            {/* Second Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Cost Distribution */}
                <div className="nexus-card lg:col-span-1">
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Activity className="w-4 h-4" /> Avg Cost Breakdown
                    </h3>
                    {totalCost > 0 ? (
                        <div className="space-y-3">
                            {/* Stacked bar */}
                            <div className="flex h-5 rounded-full overflow-hidden shadow-inner">
                                {Object.entries(costDist).filter(([, v]) => v > 0).map(([key, value]) => (
                                    <div
                                        key={key}
                                        className="h-full transition-all duration-700"
                                        style={{
                                            width: `${(value / totalCost) * 100}%`,
                                            backgroundColor: costColors[key] || '#94a3b8'
                                        }}
                                    />
                                ))}
                            </div>
                            {/* Legend */}
                            <div className="grid grid-cols-2 gap-2 mt-4">
                                {Object.entries(costDist).filter(([, v]) => v > 0).map(([key, value]) => (
                                    <div key={key} className="flex items-center gap-2 text-xs">
                                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: costColors[key] }} />
                                        <span className="text-gray-500 dark:text-gray-400 capitalize">{key}</span>
                                        <span className="ml-auto font-semibold text-gray-700 dark:text-gray-200">₹{value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-gray-400 text-center py-8">No data yet</p>
                    )}
                </div>

                {/* Material Usage Chart */}
                <div className="nexus-card lg:col-span-1">
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Layers className="w-4 h-4" /> Material Usage
                    </h3>
                    {matEntries.length > 0 ? (
                        <div className="space-y-3">
                            {matEntries.map(([mat, count]) => (
                                <div key={mat} className="space-y-1">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-medium text-gray-700 dark:text-gray-200">{mat}</span>
                                        <span className="text-gray-400">{count}x</span>
                                    </div>
                                    <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-1000 ease-out"
                                            style={{
                                                width: `${(count / maxMatCount) * 100}%`,
                                                backgroundColor: matColors[mat] || '#6366f1'
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-400 text-center py-8">No data yet</p>
                    )}
                </div>

                {/* Quick Info Panel */}
                <div className="nexus-card lg:col-span-1">
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Package className="w-4 h-4" /> Quick Insights
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-xl">
                            <div>
                                <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Top Pouch Type</div>
                                <div className="text-sm font-bold text-indigo-700 dark:text-indigo-300 mt-0.5">{stats.popular_pouch_type}</div>
                            </div>
                            <Package className="w-8 h-8 text-indigo-200 dark:text-indigo-700" />
                        </div>
                        <div className="flex items-center justify-between p-3 bg-purple-50/50 dark:bg-purple-900/20 rounded-xl">
                            <div>
                                <div className="text-[10px] font-bold uppercase tracking-wider text-purple-400">Top Material</div>
                                <div className="text-sm font-bold text-purple-700 dark:text-purple-300 mt-0.5">{stats.popular_material}</div>
                            </div>
                            <Layers className="w-8 h-8 text-purple-200 dark:text-purple-700" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Quotations */}
            <div className="nexus-card">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
                        <FileText className="w-4 h-4" /> Recent Quotations
                    </h3>
                    <button
                        onClick={() => onNavigate('quotations')}
                        className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 font-medium flex items-center gap-1"
                    >
                        View All <ArrowRight className="w-3 h-3" />
                    </button>
                </div>
                {stats.recent_quotations.length > 0 ? (
                    <div className="space-y-3">
                        {stats.recent_quotations.map((q: any) => (
                            <div key={q.id} className="flex items-center justify-between p-3 bg-white/50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                                        #{q.id}
                                    </div>
                                    <div>
                                        <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">{q.client_name}</div>
                                        <div className="text-[11px] text-gray-400">
                                            {q.requirements?.width_mm}×{q.requirements?.height_mm}mm • {(q.requirements?.pouch_type || '').replace(/_/g, ' ')}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">₹{q.breakdown?.selling_price_per_1000}</div>
                                    <div className="text-[10px] text-gray-400">per 1000</div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-gray-400 text-center py-8">No quotations yet. Create one in the Cost Estimator!</p>
                )}
            </div>
        </div>
    );
};
