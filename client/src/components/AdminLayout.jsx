import React, { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from './Sidebar';
import LoadingSpinner from './LoadingSpinner';

// Lazy Load Admin Pages
const AdminDashboard = lazy(() => import('../pages/AdminDashboard'));
const TaskCreate = lazy(() => import('../pages/TaskCreate'));
const UserCreate = lazy(() => import('../pages/UserCreate'));
const UsersPage = lazy(() => import('../pages/Users'));
const StoreImport = lazy(() => import('../pages/StoreImport'));
const TaskPool = lazy(() => import('../pages/TaskPool'));
const GlobalMap = lazy(() => import('../pages/GlobalMap'));
const DailyTracking = lazy(() => import('../pages/DailyTracking'));
const CompletedTasks = lazy(() => import('../pages/CompletedTasks'));
const SubcontractorDashboard = lazy(() => import('../pages/SubcontractorDashboard'));
const SubcontractorDetail = lazy(() => import('../pages/SubcontractorDetail'));
const SubPaymentPage = lazy(() => import('../pages/SubPaymentPage'));
const SubLedger = lazy(() => import('../pages/SubLedger'));
const Reports = lazy(() => import('../pages/Reports'));
const DailyPlanReport = lazy(() => import('../pages/DailyPlanReport'));
const ProjectDashboard = lazy(() => import('../pages/ProjectDashboard'));
const ProjectDetail = lazy(() => import('../pages/ProjectDetail'));
const StockPage = lazy(() => import('../pages/StockPage'));
const Suppliers = lazy(() => import('../pages/Suppliers'));
const NotesPage = lazy(() => import('../pages/NotesPage'));
const SettingsPage = lazy(() => import('../pages/SettingsPage'));
const HierarchyPage = lazy(() => import('../pages/HierarchyPage'));

const AdminLayout = () => {
    return (
        <div style={{ display: 'flex' }}>
            <Sidebar />
            <div className="admin-content" style={{ flex: 1, minHeight: '100vh', background: 'var(--bg-color)' }}>
                <Suspense fallback={<LoadingSpinner />}>
                    <Routes>
                        <Route path="/" element={<AdminDashboard />} />
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
                        <Route path="/notes" element={<NotesPage />} />
                        <Route path="/projects" element={<ProjectDashboard />} />
                        <Route path="/projects/:id" element={<ProjectDetail />} />
                        <Route path="/stocks" element={<StockPage />} />
                        <Route path="/suppliers" element={<Suppliers />} />
                        <Route path="/settings" element={<SettingsPage />} />
                        <Route path="/hierarchy" element={<HierarchyPage />} />
                    </Routes>
                </Suspense>
            </div>
        </div>
    );
};

export default AdminLayout;
