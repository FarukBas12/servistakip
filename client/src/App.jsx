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
import Sidebar from './components/Sidebar';
import PWAInstallPrompt from './components/PWAInstallPrompt';


function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Admin Routes with Sidebar */}
          <Route element={<PrivateRoute allowedRoles={['admin']} />}>
            <Route path="/admin/*" element={
              <div style={{ display: 'flex' }}>
                <Sidebar />
                <div style={{ flex: 1, paddingLeft: '90px', minHeight: '100vh', background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)' }}>
                  <Routes>
                    <Route path="/" element={<AdminDashboard />} />
                    <Route path="/create-task" element={<TaskCreate />} />
                    <Route path="/create-user" element={<UserCreate />} />
                    <Route path="/import-stores" element={<StoreImport />} />
                    <Route path="/pool" element={<TaskPool />} />
                    <Route path="/map" element={<GlobalMap />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/materials" element={<Materials />} />
                  </Routes>
                </div>
              </div>
            } />
          </Route>

          {/* Technician Routes with Top Navbar (Mobile Friendly) */}
          <Route element={<PrivateRoute allowedRoles={['technician']} />}>
            <Route path="/tech/*" element={
              <>
                <Navbar />
                <Routes>
                  <Route path="/" element={<TechDashboard />} />
                  <Route path="/task/:id" element={<TechTaskDetail />} />
                </Routes>
              </>
            } />
          </Route>

          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
