import React, { useState, useRef } from 'react';
import { Upload, Camera, Loader, Check, Palette, X } from 'lucide-react';
import imageCompression from 'browser-image-compression';

interface ColorResult {
    hex: string;
    percentage: number;
    rgb: number[];
}

interface AIColorScannerProps {
    onColorsDetected: (count: number) => void;
}

/**
 * Simple K-means clustering for color extraction.
 * Runs entirely client-side using Canvas API — no backend needed.
 */
function kMeans(pixels: number[][], k: number, maxIter = 15): { centers: number[][]; labels: number[] } {
    // Initialize centers randomly from the pixel set
    const shuffled = [...pixels].sort(() => Math.random() - 0.5);
    let centers = shuffled.slice(0, k).map(p => [...p]);
    let labels = new Array(pixels.length).fill(0);

    for (let iter = 0; iter < maxIter; iter++) {
        // Assign labels
        for (let i = 0; i < pixels.length; i++) {
            let minDist = Infinity;
            for (let c = 0; c < k; c++) {
                const dist =
                    (pixels[i][0] - centers[c][0]) ** 2 +
                    (pixels[i][1] - centers[c][1]) ** 2 +
                    (pixels[i][2] - centers[c][2]) ** 2;
                if (dist < minDist) {
                    minDist = dist;
                    labels[i] = c;
                }
            }
        }

        // Update centers
        const sums = Array.from({ length: k }, () => [0, 0, 0]);
        const counts = new Array(k).fill(0);
        for (let i = 0; i < pixels.length; i++) {
            const l = labels[i];
            sums[l][0] += pixels[i][0];
            sums[l][1] += pixels[i][1];
            sums[l][2] += pixels[i][2];
            counts[l]++;
        }
        for (let c = 0; c < k; c++) {
            if (counts[c] > 0) {
                centers[c] = [sums[c][0] / counts[c], sums[c][1] / counts[c], sums[c][2] / counts[c]];
            }
        }
    }

    return { centers, labels };
}

function rgbToHex(r: number, g: number, b: number): string {
    return '#' + [r, g, b].map(c => Math.round(c).toString(16).padStart(2, '0')).join('');
}

function analyzeImageClientSide(imageElement: HTMLImageElement, numColors = 5): ColorResult[] {
    const canvas = document.createElement('canvas');
    // Resize to max 100x100 for fast processing
    const maxDim = 100;
    const scale = Math.min(maxDim / imageElement.naturalWidth, maxDim / imageElement.naturalHeight, 1);
    canvas.width = Math.round(imageElement.naturalWidth * scale);
    canvas.height = Math.round(imageElement.naturalHeight * scale);

    const ctx = canvas.getContext('2d');
    if (!ctx) return [];

    ctx.drawImage(imageElement, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Extract pixels (skip fully transparent ones)
    const pixels: number[][] = [];
    for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] > 128) { // alpha > 50%
            pixels.push([data[i], data[i + 1], data[i + 2]]);
        }
    }

    if (pixels.length === 0) return [];

    const k = Math.min(numColors, pixels.length);
    const { centers, labels } = kMeans(pixels, k);

    // Count labels
    const counts: Record<number, number> = {};
    for (const l of labels) {
        counts[l] = (counts[l] || 0) + 1;
    }

    // Sort by count descending
    const sorted = Object.entries(counts)
        .map(([idx, count]) => ({ idx: Number(idx), count }))
        .sort((a, b) => b.count - a.count);

    return sorted.map(({ idx, count }) => ({
        hex: rgbToHex(centers[idx][0], centers[idx][1], centers[idx][2]),
        percentage: Math.round((count / pixels.length) * 1000) / 10,
        rgb: centers[idx].map(c => Math.round(c)),
    }));
}

export const AIColorScanner: React.FC<AIColorScannerProps> = ({ onColorsDetected }) => {
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [colors, setColors] = useState<ColorResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFile = async (file: File) => {
        setLoading(true);
        try {
            // Compress image
            const options = {
                maxSizeMB: 1,
                maxWidthOrHeight: 800,
                useWebWorker: true
            };
            const compressedFile = await imageCompression(file, options);

            // Create preview
            const reader = new FileReader();
            reader.onload = (e) => {
                const dataUrl = e.target?.result as string;
                setImagePreview(dataUrl);

                // Analyze colors client-side using Canvas
                const img = new Image();
                img.onload = () => {
                    const detectedColors = analyzeImageClientSide(img, 5);
                    setColors(detectedColors);
                    setLoading(false);
                };
                img.onerror = () => {
                    console.error('Failed to load image for analysis');
                    setLoading(false);
                };
                img.src = dataUrl;
            };
            reader.readAsDataURL(compressedFile);
        } catch (error) {
            console.error(error);
            alert('Failed to analyze image');
            setLoading(false);
        }
    };

    const onDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(true);
    };

    const onDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
    };

    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const applyColors = () => {
        onColorsDetected(colors.length);
    };

    return (
        <div className="nexus-card">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4 text-gray-800">
                <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                    <Camera className="w-5 h-5" />
                </div>
                AI Color Recognition
            </h3>

            <div className="space-y-4">
                {/* Upload Area */}
                {!imagePreview ? (
                    <div
                        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer active:scale-[0.98] active:bg-gray-100
                            ${dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'}`}
                        onDragEnter={onDragEnter}
                        onDragLeave={onDragLeave}
                        onDragOver={onDragOver}
                        onDrop={onDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleChange}
                        />
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                                <Upload className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="font-medium text-gray-700">Tap to Upload or Take Photo</p>
                                <p className="text-xs text-gray-500 mt-1">Supports JPG, PNG (Max 5MB)</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-100">
                        <img src={imagePreview} alt="Preview" className="w-full h-48 object-contain" />
                        <button
                            onClick={() => {
                                setImagePreview(null);
                                setColors([]);
                            }}
                            className="absolute top-2 right-2 p-3 bg-white/80 rounded-full hover:bg-white text-gray-600 active:scale-90 transition-transform"
                        >
                            <X className="w-4 h-4" />
                        </button>
                        {loading && (
                            <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                                <div className="flex flex-col items-center gap-2">
                                    <Loader className="w-8 h-8 text-indigo-600 animate-spin" />
                                    <span className="text-sm font-medium text-indigo-800">Analyzing colors...</span>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Results */}
                {colors.length > 0 && (
                    <div className="space-y-3 animate-fade-in-up">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-600">Detected Palette ({colors.length})</span>
                            <button
                                onClick={applyColors}
                                className="text-xs flex items-center gap-1 bg-indigo-600 text-white px-3 py-1.5 rounded-full hover:bg-indigo-700 transition-colors"
                            >
                                <Check className="w-3 h-3" />
                                Use {colors.length} Colors
                            </button>
                        </div>

                        <div className="grid grid-cols-5 gap-2">
                            {colors.map((color, idx) => (
                                <div key={idx} className="group relative flex flex-col items-center gap-1">
                                    <div
                                        className="w-full aspect-square rounded-lg shadow-sm border border-gray-200"
                                        style={{ backgroundColor: color.hex }}
                                    />
                                    <span className="text-[10px] font-mono text-gray-500">{color.hex}</span>
                                    <div className="absolute -top-8 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                        {color.percentage}% Coverage
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 flex items-start gap-2">
                            <Palette className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                            <p className="text-xs text-blue-700">
                                AI has identified <strong>{colors.length} dominant colors</strong>.
                                Click "Use {colors.length} Colors" to update your production settings automatically.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
