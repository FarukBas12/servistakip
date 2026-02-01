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
import SubcontractorDashboard from '../pages/SubcontractorDashboard'; // NEW
import SubPaymentPage from '../pages/SubPaymentPage'; // NEW
import SubLedger from '../pages/SubLedger'; // NEW
import DailyTracking from '../pages/DailyTracking';
import CompletedTasks from '../pages/CompletedTasks';
import DailyPlanReport from '../pages/DailyPlanReport';
import ProjectDashboard from '../pages/ProjectDashboard';
import ProjectDetail from '../pages/ProjectDetail';
import StockPage from '../pages/StockPage'; // NEW

import Suppliers from '../pages/Suppliers'; // NEW


const AdminLayout = () => {
    return (
        <div style={{ display: 'flex' }}>
            <Sidebar />
            <div className="admin-content" style={{ flex: 1, minHeight: '100vh', background: 'var(--bg-color)' }}>
                <Routes>
                    <Route path="/" element={<AdminDashboard />} />
                    <Route path="/create-task" element={<TaskCreate />} />
                    <Route path="/create-user" element={<UserCreate />} />
                    <Route path="/import-stores" element={<StoreImport />} />
                    <Route path="/pool" element={<TaskPool />} />
                    <Route path="/map" element={<GlobalMap />} />
                    <Route path="/daily" element={<DailyTracking />} />
                    <Route path="/archive" element={<CompletedTasks />} />
                    <Route path="subs" element={<SubcontractorDashboard />} />
                    <Route path="subs/:id/payment" element={<SubPaymentPage />} />
                    <Route path="subs/:id/ledger" element={<SubLedger />} />
                    <Route path="/reports" element={<Reports />} />

                    <Route path="/daily-report" element={<DailyPlanReport />} />
                    <Route path="/projects" element={<ProjectDashboard />} />
                    <Route path="/projects/:id" element={<ProjectDetail />} />
                    <Route path="/stocks" element={<StockPage />} />
                    <Route path="/suppliers" element={<Suppliers />} />
                </Routes>
            </div>
        </div>
    );
};

export default AdminLayout;
