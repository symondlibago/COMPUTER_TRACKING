import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Layout from './components/layout/Layout';
import HomePage from './components/pages/HomePage';
import LoginPage from './components/pages/LoginPage';
import StudentPortal from './components/pages/StudentPortal';
import Dashboard from './components/pages/admin/Dashboard';
import PCManagement from './components/pages/admin/PCManagement';
import StudentManagement from './components/pages/admin/StudentManagement';
import QueueMonitor from './components/pages/admin/QueueMonitor';
import UsageHistory from './components/pages/admin/UsageHistory';
import Analytics from './components/pages/admin/Analytics';
import './App.css';

// Protected Route Component
function ProtectedRoute({ children, requiredRole }) {
  const { state } = useApp();
  
  if (!state.currentUser) {
    return <Navigate to="/login" replace />;
  }
  
  if (requiredRole && state.userType !== requiredRole) {
    return <Navigate to="/" replace />;
  }
  
  return children;
}

function AppRoutes() {
  const { state } = useApp();
  
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* Homepage - displayed first when starting the system */}
        <Route path="/" element={<HomePage />} />
        
        {/* Routes with Layout (includes header) */}
        <Route path="/student" element={<Layout />}>
          <Route index element={<StudentPortal />} />
        </Route>
        
        {/* Protected Admin Routes with Layout */}
        <Route path="/admin" element={<Layout />}>
          <Route index element={
            <ProtectedRoute requiredRole="admin">
              <Navigate to="/admin/dashboard" replace />
            </ProtectedRoute>
          } />
          
          <Route path="dashboard" element={
            <ProtectedRoute requiredRole="admin">
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="pc-management" element={
            <ProtectedRoute requiredRole="admin">
              <PCManagement />
            </ProtectedRoute>
          } />
          <Route path="student-management" element={
            <ProtectedRoute requiredRole="admin">
              <StudentManagement />
            </ProtectedRoute>
          } />
          <Route path="queue-monitor" element={
            <ProtectedRoute requiredRole="admin">
              <QueueMonitor />
            </ProtectedRoute>
          } />
          <Route path="usage-history" element={
            <ProtectedRoute requiredRole="admin">
              <UsageHistory />
            </ProtectedRoute>
          } />
          <Route path="analytics" element={
            <ProtectedRoute requiredRole="admin">
              <Analytics />
            </ProtectedRoute>
          } />
        </Route>
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <AppProvider>
      <AppRoutes />
    </AppProvider>
  );
}

export default App;

