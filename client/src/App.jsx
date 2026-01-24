import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import AdminLayout from './components/AdminLayout';
import TechDashboard from './pages/TechDashboard';
import TechTaskDetail from './pages/TechTaskDetail';
import ProjectDashboard from './pages/ProjectDashboard';
import ProjectDetail from './pages/ProjectDetail';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';
import PWAInstallPrompt from './components/PWAInstallPrompt';


function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Admin Routes (Managed by AdminLayout) */}
          <Route element={<PrivateRoute allowedRoles={['admin', 'depocu']} />}>
            <Route path="/admin/*" element={<AdminLayout />} />
          </Route>

          {/* Technician Routes */}
          <Route element={<PrivateRoute allowedRoles={['technician']} />}>
            <Route path="/tech/*" element={
              <>
                <Navbar />
                <Routes>
                  <Route path="/" element={<TechDashboard />} />
                  <Route path="/task/:id" element={<TechTaskDetail />} />
                  <Route path="/projects" element={<ProjectDashboard />} />
                  <Route path="/projects/:id" element={<ProjectDetail />} />
                </Routes>
              </>
            } />
          </Route>

          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
        <PWAInstallPrompt />
      </Router>
    </AuthProvider>
  );
}

export default App;
