import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from './Sidebar';
import DashboardV2 from '../pages/DashboardV2'; // Fixed & Safe
// import AdminDashboard from '../pages/AdminDashboard'; // Legacy
import TaskCreate from '../pages/TaskCreate';

// ... (imports)

const AdminLayout = () => {
    return (
        <div style={{ display: 'flex' }}>
            <Sidebar />
            <div className="admin-content" style={{ flex: 1, minHeight: '100vh', background: 'var(--bg-color)' }}>
                <Routes>
                    <Route path="/" element={<DashboardV2 />} />
                    <Route path="/create-task" element={<TaskCreate />} />
                    <Route path="/create-user" element={<UserCreate />} />
                    <Route path="/import-stores" element={<StoreImport />} />
                    <Route path="/pool" element={<TaskPool />} />
                    <Route path="/users" element={<UsersPage />} />
                    <Route path="/map" element={<GlobalMap />} />
                    <Route path="/daily" element={<DailyTracking />} />
                    <Route path="/archive" element={<CompletedTasks />} />
                    <Route path="subs" element={<SubcontractorDashboard />} />
                    <Route path="subs/:id" element={<SubcontractorDetail />} />
                    <Route path="subs/:id/payment" element={<SubPaymentPage />} />
                    <Route path="subs/:id/ledger" element={<SubLedger />} />
                    <Route path="/reports" element={<Reports />} />

                    <Route path="/daily-report" element={<DailyPlanReport />} />
                    <Route path="/projects" element={<ProjectDashboard />} />
                    <Route path="/projects/:id" element={<ProjectDetail />} />
                    <Route path="/stocks" element={<StockPage />} />
                    <Route path="/suppliers" element={<Suppliers />} />
                    <Route path="/settings" element={<SettingsPage />} />
                </Routes>
            </div>
        </div>
    );
};

export default AdminLayout;
