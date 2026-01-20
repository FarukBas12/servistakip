import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import TechDashboard from './pages/TechDashboard';
import TechTaskDetail from './pages/TechTaskDetail';
import TaskCreate from './pages/TaskCreate';
import UserCreate from './pages/UserCreate';
import StoreImport from './pages/StoreImport';
import TaskPool from './pages/TaskPool';
import GlobalMap from './pages/GlobalMap';
import Reports from './pages/Reports';
import Materials from './pages/Materials';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';
import PWAInstallPrompt from './components/PWAInstallPrompt';


function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <PWAInstallPrompt />
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<PrivateRoute allowedRoles={['admin']} />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/create-task" element={<TaskCreate />} />
            <Route path="/admin/create-user" element={<UserCreate />} />
            <Route path="/admin/import-stores" element={<StoreImport />} />
            <Route path="/admin/pool" element={<TaskPool />} />
            <Route path="/admin/map" element={<GlobalMap />} />
            <Route path="/admin/reports" element={<Reports />} />
            <Route path="/admin/materials" element={<Materials />} /> {/* Added Materials route */}
          </Route>

          <Route element={<PrivateRoute allowedRoles={['technician']} />}>
            <Route path="/tech" element={<TechDashboard />} />
            <Route path="/tech/task/:id" element={<TechTaskDetail />} />
          </Route>

          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
