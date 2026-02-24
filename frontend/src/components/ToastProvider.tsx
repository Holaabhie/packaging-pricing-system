import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, Info, X, AlertTriangle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: number;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType>({ showToast: () => { } });

export const useToast = () => useContext(ToastContext);

let toastIdCounter = 0;

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'success') => {
        const id = ++toastIdCounter;
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 4000);
    }, []);

    const removeToast = (id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    const icons = {
        success: <CheckCircle className="w-5 h-5 text-emerald-500" />,
        error: <XCircle className="w-5 h-5 text-red-500" />,
        info: <Info className="w-5 h-5 text-blue-500" />,
        warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
    };

    const bgColors = {
        success: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-700',
        error: 'bg-red-50 border-red-200 dark:bg-red-900/30 dark:border-red-700',
        info: 'bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-700',
        warning: 'bg-amber-50 border-amber-200 dark:bg-amber-900/30 dark:border-amber-700',
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {/* Toast Container */}
            <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`pointer-events-auto flex items-center gap-3 px-5 py-4 rounded-2xl border shadow-2xl backdrop-blur-sm min-w-[320px] max-w-[420px] animate-toast-in ${bgColors[toast.type]}`}
                    >
                        {icons[toast.type]}
                        <span className="flex-1 text-sm font-medium text-gray-800 dark:text-gray-100">{toast.message}</span>
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                        {/* Progress bar */}
                        <div className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full overflow-hidden bg-gray-200/50 dark:bg-gray-600/50">
                            <div className="h-full bg-current opacity-30 animate-toast-progress" />
                        </div>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};
