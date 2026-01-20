import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from './Sidebar';
import AdminDashboard from '../pages/AdminDashboard';
import TaskCreate from '../pages/TaskCreate';
import UserCreate from '../pages/UserCreate';
import StoreImport from '../pages/StoreImport';
import TaskPool from '../pages/TaskPool';
import GlobalMap from '../pages/GlobalMap';
import Reports from '../pages/Reports';

const AdminLayout = () => {
    return (
        <div style={{ display: 'flex' }}>
            <Sidebar />
            <div style={{ flex: 1, paddingLeft: '80px', minHeight: '100vh', background: 'var(--bg-color)' }}>
                <Routes>
                    <Route path="/" element={<AdminDashboard />} />
                    <Route path="/create-task" element={<TaskCreate />} />
                    <Route path="/create-user" element={<UserCreate />} />
                    <Route path="/import-stores" element={<StoreImport />} />
                    <Route path="/pool" element={<TaskPool />} />
                    <Route path="/map" element={<GlobalMap />} />
                    <Route path="/reports" element={<Reports />} />
                </Routes>
            </div>
        </div>
    );
};

export default AdminLayout;
