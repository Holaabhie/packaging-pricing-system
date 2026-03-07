import { useEffect, useRef } from 'react';

interface CostPieChartProps {
    data: {
        label: string;
        value: number;
        color: string;
    }[];
    size?: number;
}

export const CostPieChart: React.FC<CostPieChartProps> = ({ data, size = 200 }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        canvas.width = size * dpr;
        canvas.height = size * dpr;
        ctx.scale(dpr, dpr);
        canvas.style.width = size + 'px';
        canvas.style.height = size + 'px';

        const cx = size / 2;
        const cy = size / 2;
        const outerR = size / 2 - 12;
        const innerR = outerR * 0.58;
        const total = data.reduce((s, d) => s + d.value, 0);

        if (total === 0) return;

        let animProgress = 0;
        const animDuration = 1000;
        const startTime = performance.now();

        const draw = (now: number) => {
            animProgress = Math.min((now - startTime) / animDuration, 1);
            const ease = 1 - Math.pow(1 - animProgress, 3);

            ctx.clearRect(0, 0, size, size);

            // Outer glow ring
            ctx.beginPath();
            ctx.arc(cx, cy, outerR + 4, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(99, 102, 241, 0.08)';
            ctx.lineWidth = 1;
            ctx.stroke();

            let currentAngle = -Math.PI / 2;
            const targetAngle = ease * Math.PI * 2;

            data.forEach((segment) => {
                const sliceAngle = (segment.value / total) * Math.PI * 2;
                const drawAngle = Math.min(sliceAngle, Math.max(0, targetAngle - (currentAngle + Math.PI / 2)));

                if (drawAngle <= 0) {
                    currentAngle += sliceAngle;
                    return;
                }

                // Segment shadow/glow
                ctx.save();
                ctx.shadowColor = segment.color;
                ctx.shadowBlur = 8;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;

                ctx.beginPath();
                ctx.arc(cx, cy, outerR, currentAngle, currentAngle + drawAngle);
                ctx.arc(cx, cy, innerR, currentAngle + drawAngle, currentAngle, true);
                ctx.closePath();
                ctx.fillStyle = segment.color;
                ctx.fill();

                ctx.restore();

                // Segment gap
                ctx.beginPath();
                ctx.arc(cx, cy, outerR, currentAngle + drawAngle - 0.01, currentAngle + drawAngle + 0.01);
                ctx.arc(cx, cy, innerR, currentAngle + drawAngle + 0.01, currentAngle + drawAngle - 0.01, true);
                ctx.closePath();
                ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--card-bg').trim() || '#0c0f1c';
                ctx.fill();

                currentAngle += sliceAngle;
            });

            // Center circle background
            ctx.beginPath();
            ctx.arc(cx, cy, innerR - 2, 0, Math.PI * 2);
            const bgColor = getComputedStyle(document.documentElement).getPropertyValue('--card-bg').trim() || '#0c0f1c';
            ctx.fillStyle = bgColor;
            ctx.fill();

            // Center text
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            ctx.fillStyle = isDark ? '#e2e8f0' : '#1e293b';
            ctx.font = `800 ${size * 0.09}px Inter, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('₹/kg', cx, cy - 6);
            ctx.font = `500 ${size * 0.065}px Inter, sans-serif`;
            ctx.fillStyle = isDark ? '#64748b' : '#94a3b8';
            ctx.fillText('breakdown', cx, cy + 12);

            if (animProgress < 1) {
                requestAnimationFrame(draw);
            }
        };

        requestAnimationFrame(draw);
    }, [data, size]);

    const total = data.reduce((s, d) => s + d.value, 0);

    return (
        <div className="flex flex-col items-center gap-5">
            <div className="relative">
                <canvas ref={canvasRef} className="drop-shadow-lg" />
                {/* Outer decorative ring */}
                <div className="absolute inset-[-6px] rounded-full border border-indigo-500/10 pointer-events-none" />
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 w-full">
                {data.filter(d => d.value > 0).map((d, i) => (
                    <div key={i} className="flex items-center gap-2.5 text-xs group">
                        <div
                            className="w-3 h-3 rounded-sm shrink-0 shadow-sm"
                            style={{ backgroundColor: d.color, boxShadow: `0 0 8px ${d.color}40` }}
                        />
                        <span className="text-gray-500 dark:text-gray-400 truncate group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors">{d.label}</span>
                        <span
                            className="ml-auto font-bold text-gray-700 dark:text-gray-200"
                            style={{ fontFamily: 'var(--font-mono)' }}
                        >
                            {total > 0 ? Math.round((d.value / total) * 100) : 0}%
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};
