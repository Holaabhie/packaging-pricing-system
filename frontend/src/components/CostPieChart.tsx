import React, { useEffect, useRef } from 'react';

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
        const outerR = size / 2 - 8;
        const innerR = outerR * 0.6;
        const total = data.reduce((s, d) => s + d.value, 0);

        if (total === 0) return;

        // Animate drawing
        let animProgress = 0;
        const animDuration = 800;
        const startTime = performance.now();

        const draw = (now: number) => {
            animProgress = Math.min((now - startTime) / animDuration, 1);
            const ease = 1 - Math.pow(1 - animProgress, 3); // ease out cubic

            ctx.clearRect(0, 0, size, size);

            let currentAngle = -Math.PI / 2;
            const targetAngle = ease * Math.PI * 2;

            data.forEach((segment) => {
                const sliceAngle = (segment.value / total) * Math.PI * 2;
                const drawAngle = Math.min(sliceAngle, Math.max(0, targetAngle - (currentAngle + Math.PI / 2)));

                if (drawAngle <= 0) {
                    currentAngle += sliceAngle;
                    return;
                }

                ctx.beginPath();
                ctx.arc(cx, cy, outerR, currentAngle, currentAngle + drawAngle);
                ctx.arc(cx, cy, innerR, currentAngle + drawAngle, currentAngle, true);
                ctx.closePath();
                ctx.fillStyle = segment.color;
                ctx.fill();

                currentAngle += sliceAngle;
            });

            // Center text
            ctx.fillStyle = '#1e293b';
            ctx.font = `bold ${size * 0.09}px Inter, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('₹/kg', cx, cy - 6);
            ctx.font = `600 ${size * 0.07}px Inter, sans-serif`;
            ctx.fillStyle = '#64748b';
            ctx.fillText('breakdown', cx, cy + 12);

            if (animProgress < 1) {
                requestAnimationFrame(draw);
            }
        };

        requestAnimationFrame(draw);
    }, [data, size]);

    const total = data.reduce((s, d) => s + d.value, 0);

    return (
        <div className="flex flex-col items-center gap-4">
            <canvas ref={canvasRef} className="drop-shadow-sm" />
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 w-full">
                {data.filter(d => d.value > 0).map((d, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                        <span className="text-gray-500 dark:text-gray-400 truncate">{d.label}</span>
                        <span className="ml-auto font-semibold text-gray-700 dark:text-gray-200">
                            {total > 0 ? Math.round((d.value / total) * 100) : 0}%
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};
