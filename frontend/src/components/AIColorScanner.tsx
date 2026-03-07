import { useState, useRef } from 'react';
import { Upload, Camera, Loader, Check, Palette, X, Beaker, Layers } from 'lucide-react';
import imageCompression from 'browser-image-compression';

// ─── Industry Printing Ink Database ─────────────────────────────────────────
// Standard rotogravure / flexo inks used in flexible packaging printing
interface PrintingInk {
    name: string;
    pigmentCode: string;
    chemical: string;
    rgb: [number, number, number];
    category: 'process' | 'spot' | 'metallic' | 'base';
}

const PRINTING_INKS: PrintingInk[] = [
    { name: 'White', pigmentCode: 'PW-6', chemical: 'Titanium Dioxide (TiO₂)', rgb: [245, 245, 245], category: 'base' },
    { name: 'Yellow', pigmentCode: 'PY-14', chemical: 'Diarylide Yellow', rgb: [255, 210, 0], category: 'process' },
    { name: 'Orange', pigmentCode: 'PO-34', chemical: 'Diarylide Orange', rgb: [240, 130, 10], category: 'spot' },
    { name: 'Red', pigmentCode: 'PR-57:1', chemical: 'Rubine Red (Lithol)', rgb: [210, 30, 45], category: 'process' },
    { name: 'Magenta', pigmentCode: 'PR-122', chemical: 'Quinacridone Magenta', rgb: [195, 20, 100], category: 'process' },
    { name: 'Violet', pigmentCode: 'PV-23', chemical: 'Dioxazine Violet', rgb: [110, 20, 150], category: 'spot' },
    { name: 'Blue', pigmentCode: 'PB-15:3', chemical: 'Phthalocyanine Blue', rgb: [0, 90, 190], category: 'process' },
    { name: 'Green', pigmentCode: 'PG-7', chemical: 'Phthalocyanine Green', rgb: [0, 130, 60], category: 'spot' },
    { name: 'Black', pigmentCode: 'PBk-7', chemical: 'Carbon Black', rgb: [35, 35, 35], category: 'process' },
    { name: 'Brown', pigmentCode: 'PBr-7', chemical: 'Iron Oxide Brown', rgb: [140, 80, 30], category: 'spot' },
    { name: 'Gold', pigmentCode: 'Metal', chemical: 'Bronze Powder', rgb: [205, 170, 50], category: 'metallic' },
    { name: 'Silver', pigmentCode: 'Metal', chemical: 'Aluminium Paste', rgb: [190, 195, 200], category: 'metallic' },
];

// Known overprint (ink mixing) combinations
interface InkMix {
    result: string;
    inks: string[];
    rgb: [number, number, number];
}

const INK_MIXES: InkMix[] = [
    { result: 'Olive Green', inks: ['Yellow', 'Black'], rgb: [120, 120, 20] },
    { result: 'Light Green', inks: ['Yellow', 'Blue'], rgb: [60, 170, 80] },
    { result: 'Deep Green', inks: ['Yellow', 'Green'], rgb: [40, 150, 40] },
    { result: 'Rust Orange', inks: ['Red', 'Yellow'], rgb: [230, 120, 20] },
    { result: 'Maroon', inks: ['Red', 'Black'], rgb: [120, 20, 30] },
    { result: 'Purple', inks: ['Magenta', 'Blue'], rgb: [100, 40, 160] },
    { result: 'Dark Blue', inks: ['Blue', 'Black'], rgb: [10, 40, 100] },
    { result: 'Pink', inks: ['Magenta', 'White'], rgb: [230, 140, 160] },
    { result: 'Peach', inks: ['Red', 'White'], rgb: [235, 170, 150] },
    { result: 'Cream', inks: ['Yellow', 'White'], rgb: [250, 240, 200] },
    { result: 'Light Blue', inks: ['Blue', 'White'], rgb: [130, 170, 230] },
    { result: 'Grey', inks: ['Black', 'White'], rgb: [140, 140, 140] },
    { result: 'Teal', inks: ['Blue', 'Green'], rgb: [0, 120, 130] },
    { result: 'Coral', inks: ['Orange', 'White'], rgb: [240, 175, 130] },
];

// ─── K-Means Clustering ─────────────────────────────────────────────────────

function kMeans(pixels: number[][], k: number, maxIter = 15): { centers: number[][]; labels: number[] } {
    const shuffled = [...pixels].sort(() => Math.random() - 0.5);
    let centers = shuffled.slice(0, k).map(p => [...p]);
    let labels = new Array(pixels.length).fill(0);

    for (let iter = 0; iter < maxIter; iter++) {
        for (let i = 0; i < pixels.length; i++) {
            let minDist = Infinity;
            for (let c = 0; c < k; c++) {
                const dist =
                    (pixels[i][0] - centers[c][0]) ** 2 +
                    (pixels[i][1] - centers[c][1]) ** 2 +
                    (pixels[i][2] - centers[c][2]) ** 2;
                if (dist < minDist) { minDist = dist; labels[i] = c; }
            }
        }
        const sums = Array.from({ length: k }, () => [0, 0, 0]);
        const counts = new Array(k).fill(0);
        for (let i = 0; i < pixels.length; i++) {
            const l = labels[i];
            sums[l][0] += pixels[i][0]; sums[l][1] += pixels[i][1]; sums[l][2] += pixels[i][2];
            counts[l]++;
        }
        for (let c = 0; c < k; c++) {
            if (counts[c] > 0) centers[c] = [sums[c][0] / counts[c], sums[c][1] / counts[c], sums[c][2] / counts[c]];
        }
    }
    return { centers, labels };
}

function rgbDistance(a: number[], b: number[]): number {
    return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2);
}

function rgbToHex(r: number, g: number, b: number): string {
    return '#' + [r, g, b].map(c => Math.round(c).toString(16).padStart(2, '0')).join('');
}

// ─── Ink Matching Engine ─────────────────────────────────────────────────────

interface InkMatch {
    inkName: string;
    pigmentCode: string;
    chemical: string;
    inkRgb: [number, number, number];
    category: string;
    // If this color comes from mixing two inks
    isMixed: boolean;
    mixedFrom?: string[];   // e.g. ["Yellow", "Blue"]
    mixLabel?: string;      // e.g. "Light Green"
    // Original detected color
    detectedRgb: number[];
    detectedHex: string;
    percentage: number;
}

function matchColorToInk(rgb: number[]): { ink: PrintingInk; distance: number } {
    let bestInk = PRINTING_INKS[0];
    let bestDist = Infinity;
    for (const ink of PRINTING_INKS) {
        const d = rgbDistance(rgb, ink.rgb);
        if (d < bestDist) { bestDist = d; bestInk = ink; }
    }
    return { ink: bestInk, distance: bestDist };
}

function matchColorToMix(rgb: number[]): { mix: InkMix; distance: number } | null {
    let bestMix: InkMix | null = null;
    let bestDist = Infinity;
    for (const mix of INK_MIXES) {
        const d = rgbDistance(rgb, mix.rgb);
        if (d < bestDist) { bestDist = d; bestMix = mix; }
    }
    return bestMix ? { mix: bestMix, distance: bestDist } : null;
}

function analyzeForInks(imageElement: HTMLImageElement, numColors = 6): { matches: InkMatch[]; cylinderCount: number; uniqueInks: string[] } {
    const canvas = document.createElement('canvas');
    const maxDim = 100;
    const scale = Math.min(maxDim / imageElement.naturalWidth, maxDim / imageElement.naturalHeight, 1);
    canvas.width = Math.round(imageElement.naturalWidth * scale);
    canvas.height = Math.round(imageElement.naturalHeight * scale);

    const ctx = canvas.getContext('2d');
    if (!ctx) return { matches: [], cylinderCount: 0, uniqueInks: [] };

    ctx.drawImage(imageElement, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    const pixels: number[][] = [];
    for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] > 128) pixels.push([data[i], data[i + 1], data[i + 2]]);
    }
    if (pixels.length === 0) return { matches: [], cylinderCount: 0, uniqueInks: [] };

    const k = Math.min(numColors, pixels.length);
    const { centers, labels } = kMeans(pixels, k);

    const counts: Record<number, number> = {};
    for (const l of labels) counts[l] = (counts[l] || 0) + 1;

    const sorted = Object.entries(counts)
        .map(([idx, count]) => ({ idx: Number(idx), count }))
        .sort((a, b) => b.count - a.count);

    const matches: InkMatch[] = [];
    const usedInks = new Set<string>();

    for (const { idx, count } of sorted) {
        const rgb = centers[idx];
        const percentage = Math.round((count / pixels.length) * 1000) / 10;
        const hex = rgbToHex(rgb[0], rgb[1], rgb[2]);

        // Try direct ink match
        const direct = matchColorToInk(rgb);
        // Try mix match
        const mixResult = matchColorToMix(rgb);

        // Use mix if it's significantly closer than the direct ink
        const useMix = mixResult && mixResult.distance < direct.distance * 0.85;

        if (useMix && mixResult) {
            const mix = mixResult.mix;
            // Find the inks in the mix
            const ink1 = PRINTING_INKS.find(i => i.name === mix.inks[0])!;
            const ink2 = PRINTING_INKS.find(i => i.name === mix.inks[1])!;
            mix.inks.forEach(n => usedInks.add(n));

            matches.push({
                inkName: mix.result,
                pigmentCode: `${ink1.pigmentCode} + ${ink2.pigmentCode}`,
                chemical: `${ink1.chemical} + ${ink2.chemical}`,
                inkRgb: mix.rgb,
                category: 'mix',
                isMixed: true,
                mixedFrom: mix.inks,
                mixLabel: mix.result,
                detectedRgb: rgb.map(c => Math.round(c)),
                detectedHex: hex,
                percentage,
            });
        } else {
            const ink = direct.ink;
            usedInks.add(ink.name);

            matches.push({
                inkName: ink.name,
                pigmentCode: ink.pigmentCode,
                chemical: ink.chemical,
                inkRgb: ink.rgb,
                category: ink.category,
                isMixed: false,
                detectedRgb: rgb.map(c => Math.round(c)),
                detectedHex: hex,
                percentage,
            });
        }
    }

    return {
        matches,
        cylinderCount: usedInks.size,
        uniqueInks: Array.from(usedInks),
    };
}

// ─── Component ───────────────────────────────────────────────────────────────

interface ColorScannerProps {
    onColorsDetected: (count: number) => void;
}

export const ColorScanner: React.FC<ColorScannerProps> = ({ onColorsDetected }) => {
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [inkResults, setInkResults] = useState<InkMatch[]>([]);
    const [cylinderCount, setCylinderCount] = useState(0);
    const [uniqueInks, setUniqueInks] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFile = async (file: File) => {
        setLoading(true);
        try {
            const options = { maxSizeMB: 1, maxWidthOrHeight: 800, useWebWorker: true };
            const compressedFile = await imageCompression(file, options);

            const reader = new FileReader();
            reader.onload = (e) => {
                const dataUrl = e.target?.result as string;
                setImagePreview(dataUrl);

                const img = new Image();
                img.onload = () => {
                    const result = analyzeForInks(img, 6);
                    setInkResults(result.matches);
                    setCylinderCount(result.cylinderCount);
                    setUniqueInks(result.uniqueInks);
                    setLoading(false);
                };
                img.onerror = () => setLoading(false);
                img.src = dataUrl;
            };
            reader.readAsDataURL(compressedFile);
        } catch (error) {
            console.error(error);
            alert('Failed to analyze image');
            setLoading(false);
        }
    };

    const onDragEnter = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragActive(true); };
    const onDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); };
    const onDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };
    const onDrop = (e: React.DragEvent) => {
        e.preventDefault(); e.stopPropagation(); setDragActive(false);
        if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
    };
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) handleFile(e.target.files[0]);
    };

    const applyColors = () => {
        onColorsDetected(cylinderCount);
    };

    const categoryBadge = (cat: string) => {
        const styles: Record<string, string> = {
            process: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
            spot: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
            metallic: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200',
            base: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
            mix: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
        };
        return styles[cat] || styles.spot;
    };

    return (
        <div className="nexus-card">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4 text-gray-800 dark:text-gray-100">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                    <Camera className="w-5 h-5" />
                </div>
                Printing Ink Scanner
            </h3>

            <div className="space-y-4">
                {/* Upload Area */}
                {!imagePreview ? (
                    <div
                        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer active:scale-[0.98] active:bg-gray-100 dark:active:bg-gray-800
                            ${dragActive ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}
                        onDragEnter={onDragEnter} onDragLeave={onDragLeave}
                        onDragOver={onDragOver} onDrop={onDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleChange} />
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                <Upload className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="font-medium text-gray-700 dark:text-gray-200">Upload Packaging Design</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Detects printing inks & cylinder count • JPG, PNG (Max 5MB)</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
                        <img src={imagePreview} alt="Preview" className="w-full h-48 object-contain" />
                        <button
                            onClick={() => { setImagePreview(null); setInkResults([]); setCylinderCount(0); setUniqueInks([]); }}
                            className="absolute top-2 right-2 p-3 bg-white/80 dark:bg-gray-900/80 rounded-full hover:bg-white dark:hover:bg-gray-900 text-gray-600 dark:text-gray-300 active:scale-90 transition-transform"
                        >
                            <X className="w-4 h-4" />
                        </button>
                        {loading && (
                            <div className="absolute inset-0 bg-white/60 dark:bg-gray-900/60 flex items-center justify-center">
                                <div className="flex flex-col items-center gap-2">
                                    <Loader className="w-8 h-8 text-indigo-600 animate-spin" />
                                    <span className="text-sm font-medium text-indigo-800 dark:text-indigo-300">Matching printing inks...</span>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Results */}
                {inkResults.length > 0 && (
                    <div className="space-y-4 animate-fade-in-up">

                        {/* Cylinder Count Summary */}
                        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-200 dark:shadow-indigo-900/50">
                                    {cylinderCount}
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-gray-800 dark:text-gray-100">Printing Cylinders Required</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                        {uniqueInks.join(' • ')}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={applyColors}
                                className="flex items-center gap-1.5 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-semibold shadow-sm"
                            >
                                <Check className="w-4 h-4" />
                                Apply
                            </button>
                        </div>

                        {/* Ink List */}
                        <div className="space-y-2">
                            {inkResults.map((match, idx) => (
                                <div key={idx} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 hover:shadow-sm transition-shadow">
                                    {/* Ink color swatch */}
                                    <div className="shrink-0 flex items-center gap-1.5">
                                        <div
                                            className="w-9 h-9 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600"
                                            style={{ backgroundColor: rgbToHex(match.inkRgb[0], match.inkRgb[1], match.inkRgb[2]) }}
                                        />
                                        {match.isMixed && (
                                            <>
                                                <span className="text-[10px] text-gray-400">←</span>
                                                <div
                                                    className="w-5 h-5 rounded border border-gray-200 dark:border-gray-600 opacity-60"
                                                    style={{ backgroundColor: match.detectedHex }}
                                                    title={`Detected: ${match.detectedHex}`}
                                                />
                                            </>
                                        )}
                                    </div>

                                    {/* Ink details */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-gray-800 dark:text-gray-100">{match.inkName}</span>
                                            <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${categoryBadge(match.category)}`}>
                                                {match.category}
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                                            <Beaker className="w-3 h-3 shrink-0" />
                                            <span className="truncate">{match.chemical}</span>
                                        </div>
                                        {match.isMixed && match.mixedFrom && (
                                            <div className="text-[11px] text-green-600 dark:text-green-400 flex items-center gap-1 mt-0.5">
                                                <Layers className="w-3 h-3 shrink-0" />
                                                Mixed from: {match.mixedFrom.join(' + ')}
                                            </div>
                                        )}
                                    </div>

                                    {/* Pigment code + coverage */}
                                    <div className="text-right shrink-0">
                                        <div className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">{match.pigmentCode}</div>
                                        <div className="text-[10px] text-gray-400">{match.percentage}%</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Info Banner */}
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800 flex items-start gap-2">
                            <Palette className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                            <p className="text-xs text-blue-700 dark:text-blue-300">
                                Detected <strong>{cylinderCount} unique printing inks</strong> with chemical pigment mapping.
                                Click "Apply" to set the cylinder count in your cost calculation.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
