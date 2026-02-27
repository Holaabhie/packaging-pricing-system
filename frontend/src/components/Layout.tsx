import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useRole } from '../context/RoleContext';
import { Calculator, LayoutDashboard, Layers, FileText, Moon, Sun, Menu, X, Settings } from 'lucide-react';
import '../nexus.css';

export function Layout() {
    const { isAdmin } = useRole();
    const navigate = useNavigate();
    const location = useLocation();

    const [darkMode, setDarkMode] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Dark mode toggle
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    }, [darkMode]);

    const navItems = [];

    // Operator/Admin common nav items
    navItems.push({ id: '/estimator', label: 'Estimator', icon: <Calculator className="nav-icon" /> });
    navItems.push({ id: '/quotations', label: 'Quotations', icon: <FileText className="nav-icon" /> });

    if (isAdmin) {
        navItems.unshift({ id: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="nav-icon" /> });
        navItems.push({ id: '/materials', label: 'Material Library', icon: <Layers className="nav-icon" /> });
        navItems.push({ id: '/settings', label: 'Admin Settings', icon: <Settings className="nav-icon" /> });
    }

    const pageTitles: Record<string, { title: string; subtitle: string }> = {
        '/dashboard': { title: 'Dashboard', subtitle: 'Overview of your packaging business analytics' },
        '/estimator': { title: 'Cost Estimator', subtitle: 'Calculate precise packaging costs with real-time material rates' },
        '/quotations': { title: 'Quotations', subtitle: 'View and manage saved cost estimates' },
        '/materials': { title: 'Material Library', subtitle: 'Update raw material costs and exchange rates' },
        '/settings': { title: 'Admin Settings', subtitle: 'Manage operational costs and configurations' },
    };

    const currentPath = Object.keys(pageTitles).find(path => location.pathname.startsWith(path)) || '/estimator';
    const { title, subtitle } = pageTitles[currentPath] || { title: 'Nexus', subtitle: 'Packaging Cost Estimation' };

    return (
        <div className="app-layout">
            {/* Mobile Menu Button */}
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Sidebar Overlay (mobile) */}
            <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />

            {/* SIDEBAR */}
            <aside className={`sidebar print:hidden ${sidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-header border-b border-gray-100 dark:border-gray-800" style={{ borderBottomColor: 'var(--card-border)' }}>
                    <div className="sidebar-logo">
                        <Calculator className="w-5 h-5" />
                    </div>
                    <div className="sidebar-brand">
                        <span>Nexus</span> Analytics
                    </div>
                </div>

                <nav className="sidebar-nav overflow-y-auto">
                    <div className="nav-section">
                        <div className="nav-section-title">Core Modules</div>
                        {navItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => { navigate(item.id); setSidebarOpen(false); }}
                                className={`nav-item w-full text-left ${location.pathname.startsWith(item.id) ? 'active' : ''}`}
                            >
                                {item.icon}
                                <span>{item.label}</span>
                            </button>
                        ))}
                    </div>
                </nav>

                {/* Dark mode toggle at bottom */}
                <div className="p-6 border-t border-gray-100 dark:border-gray-800" style={{ borderTopColor: 'var(--card-border)' }}>
                    <button
                        onClick={() => setDarkMode(!darkMode)}
                        className="nav-item w-full text-left"
                    >
                        {darkMode ? <Sun className="nav-icon" /> : <Moon className="nav-icon" />}
                        <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="main-content">
                {/* Top Header */}
                <div className="top-header print:hidden flex justify-between items-start mb-8">
                    <div>
                        <h1 className="page-title">{title}</h1>
                        <p className="page-subtitle" style={{ marginBottom: 0 }}>{subtitle}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setDarkMode(!darkMode)}
                            className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors border border-gray-200 dark:border-gray-700 shadow-sm"
                            style={{ background: 'var(--card-bg)' }}
                            title={darkMode ? 'Light Mode' : 'Dark Mode'}
                        >
                            {darkMode ? <Sun className="w-4 h-4 text-gray-800 dark:text-gray-200" /> : <Moon className="w-4 h-4 text-gray-800 dark:text-gray-200" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Bottom Navigation */}
                <nav className="mobile-bottom-nav print:hidden">
                    {navItems.slice(0, 4).map((item) => ( // limit to 4 items on mobile
                        <button
                            key={item.id}
                            onClick={() => { navigate(item.id); setSidebarOpen(false); }}
                            className={`mobile-nav-item ${location.pathname.startsWith(item.id) ? 'active' : ''}`}
                        >
                            {React.cloneElement(item.icon, { className: 'w-5 h-5' })}
                            <span>{item.label}</span>
                        </button>
                    ))}
                </nav>

                {/* Views */}
                <Outlet />
            </main>
        </div>
    );
}
