/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import LoginPage from './pages/LoginPage';
import Sidebar from './components/layout/Sidebar';
import { Toaster } from '@/components/ui/sonner';
import { Loader2 } from 'lucide-react';
import { EmployeeSkeleton, PayrollSkeleton } from './components/skeletons/PageSkeletons';

// Lazy load pages
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const EmployeeDashboard = lazy(() => import('./pages/EmployeeDashboard'));
const EmployeeManagement = lazy(() => import('./pages/EmployeeManagement'));
const PayrollManagement = lazy(() => import('./pages/PayrollManagement'));
const EmployeePayslips = lazy(() => import('./pages/EmployeePayslips'));
const OrganizationSettings = lazy(() => import('./pages/OrganizationSettings'));

const PageLoader = () => (
  <div className="h-full w-full flex items-center justify-center bg-slate-50">
    <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
  </div>
);

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
                <Suspense fallback={<PageLoader />}>
                  <AdminDashboard />
                </Suspense>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/employees" 
            element={
              <ProtectedRoute adminOnly>
                <Suspense fallback={<EmployeeSkeleton />}>
                  <EmployeeManagement />
                </Suspense>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/payroll" 
            element={
              <ProtectedRoute adminOnly>
                <Suspense fallback={<PayrollSkeleton />}>
                  <PayrollManagement />
                </Suspense>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/settings" 
            element={
              <ProtectedRoute adminOnly>
                <Suspense fallback={<PageLoader />}>
                  <OrganizationSettings />
                </Suspense>
              </ProtectedRoute>
            } 
          />

          {/* Employee Routes */}
          <Route 
            path="/employee" 
            element={
              <ProtectedRoute>
                <Suspense fallback={<PageLoader />}>
                  <EmployeeDashboard />
                </Suspense>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/employee/payslips" 
            element={
              <ProtectedRoute>
                <Suspense fallback={<PageLoader />}>
                  <EmployeePayslips />
                </Suspense>
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
