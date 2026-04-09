/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import LoginPage from './pages/LoginPage';
import Sidebar from './components/layout/Sidebar';
import AdminDashboard from './pages/AdminDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import EmployeeManagement from './pages/EmployeeManagement';
import PayrollManagement from './pages/PayrollManagement';
import EmployeePayslips from './pages/EmployeePayslips';
import { Toaster } from '@/components/ui/sonner';
import { Loader2 } from 'lucide-react';

const ProtectedRoute: React.FC<{ children: React.ReactNode; adminOnly?: boolean }> = ({ 
  children, 
  adminOnly = false 
}) => {
  const { user, isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/employee" replace />;
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          {/* Admin Routes */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute adminOnly>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/employees" 
            element={
              <ProtectedRoute adminOnly>
                <EmployeeManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/payroll" 
            element={
              <ProtectedRoute adminOnly>
                <PayrollManagement />
              </ProtectedRoute>
            } 
          />

          {/* Employee Routes */}
          <Route 
            path="/employee" 
            element={
              <ProtectedRoute>
                <EmployeeDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/employee/payslips" 
            element={
              <ProtectedRoute>
                <EmployeePayslips />
              </ProtectedRoute>
            } 
          />

          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
      <Toaster position="top-right" />
    </AuthProvider>
  );
}
