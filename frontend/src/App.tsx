import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ToastProvider } from './components/ToastProvider';
import { RoleProvider, useRole } from './context/RoleContext';

// Lazy loaded Pages
const Wizard = React.lazy(() => import('./pages/Wizard').then(module => ({ default: module.Wizard })));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard').then(module => ({ default: module.AdminDashboard })));
const MaterialLibrary = React.lazy(() => import('./components/MaterialLibrary').then(module => ({ default: module.MaterialLibrary })));
const QuotationsList = React.lazy(() => import('./components/QuotationsList').then(module => ({ default: module.QuotationsList })));
const AdminSettings = React.lazy(() => import('./pages/AdminSettings').then(module => ({ default: module.AdminSettings })));

function ProtectedAdminRoute({ children }: { children: React.ReactNode }) {
    const { isAdmin } = useRole();
    if (!isAdmin) {
        return <Navigate to="/estimator" replace />;
    }
    return <>{children}</>;
}

function App() {
    return (
        <RoleProvider>
            <ToastProvider>
                <BrowserRouter>
                    <React.Suspense fallback={<div className="flex h-screen w-full items-center justify-center p-8 bg-gray-50/50 dark:bg-gray-900/50"><div className="w-8 h-8 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin"></div></div>}>
                        <Routes>
                            <Route path="/" element={<Navigate to="/estimator" replace />} />

                            <Route path="/" element={<Layout />}>
                                {/* Operator accessible routes */}
                                <Route path="estimator" element={<Wizard />} />
                                <Route path="quotations" element={<QuotationsList />} />

                                {/* Admin only routes */}
                                <Route path="dashboard" element={
                                    <ProtectedAdminRoute>
                                        <AdminDashboard />
                                    </ProtectedAdminRoute>
                                } />
                                <Route path="materials" element={
                                    <ProtectedAdminRoute>
                                        <MaterialLibrary />
                                    </ProtectedAdminRoute>
                                } />
                                <Route path="settings" element={
                                    <ProtectedAdminRoute>
                                        <AdminSettings />
                                    </ProtectedAdminRoute>
                                } />
                            </Route>

                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </React.Suspense>
                </BrowserRouter>
            </ToastProvider>
        </RoleProvider>
    );
}

export default App;
