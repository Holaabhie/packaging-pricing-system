import React from 'react';
import { Dashboard } from '../components/Dashboard';
import { useNavigate } from 'react-router-dom';

export function AdminDashboard() {
    const navigate = useNavigate();

    return <Dashboard onNavigate={(v) => navigate(`/${v}`)} />;
}
