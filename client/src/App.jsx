import React, { Suspense } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import VersionManager from './components/VersionManager';
import LoadingSpinner from './components/LoadingSpinner';

// Lazy Load Pages
const Login = React.lazy(() => import('./pages/Login'));
const AdminLayout = React.lazy(() => import('./components/AdminLayout'));
const TechDashboard = React.lazy(() => import('./pages/TechDashboard'));
const TechTaskDetail = React.lazy(() => import('./pages/TechTaskDetail'));
const ProjectDashboard = React.lazy(() => import('./pages/ProjectDashboard'));
const ProjectDetail = React.lazy(() => import('./pages/ProjectDetail'));


import { Toaster } from 'react-hot-toast';

const AppContent = () => {
  const { isDarkMode } = useTheme();

  return (
    <AuthProvider>
      <Router>
        <Suspense fallback={<LoadingSpinner />}>
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
        </Suspense>
        <PWAInstallPrompt />
        <VersionManager />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: isDarkMode ? '#1e293b' : '#fff',
              color: isDarkMode ? '#fff' : '#1e293b',
              border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)',
              backdropFilter: 'blur(10px)'
            }
          }}
        />
      </Router>
    </AuthProvider>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
