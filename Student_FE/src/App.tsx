import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute, RoleGuard } from './components/ProtectedRoute';
import { MainLayout } from './components/Layout/MainLayout';
import { LoginView } from './views/LoginView';
import { DashboardView } from './views/DashboardView';
import { StudentsView } from './views/StudentsView';
import { TeachersView } from './views/TeachersView';
import { CoursesView } from './views/CoursesView';
import { ClassesView } from './views/ClassesView';
import { EnrollmentsView } from './views/EnrollmentsView';
import { AttendanceView } from './views/AttendanceView';
import { BillingView } from './views/BillingView';
import { PaymentsView } from './views/PaymentsView';
import { PromotionsView } from './views/PromotionsView';
import { RoomsView } from './views/RoomsView';
import { ScheduleSlotsView } from './views/ScheduleSlotsView';
import { ReportsView } from './views/ReportsView';
import { ParentPortalView } from './views/ParentPortalView';

// Initialize React Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// App Router Component that checks user state and handles home path redirection
const AppRouter: React.FC = () => {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={!user ? <LoginView /> : <Navigate to={user.role === 'PARENT' ? '/parent' : '/dashboard'} replace />} />

      {/* Protected Layout Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        {/* Dynamic Root Redirect */}
        <Route
          index
          element={
            user?.role === 'PARENT' ? (
              <Navigate to="/parent" replace />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />

        {/* Dashboards */}
        <Route
          path="dashboard"
          element={
            <RoleGuard allowedRoles={['ADMIN', 'ACADEMIC_STAFF', 'CASHIER']}>
              <DashboardView />
            </RoleGuard>
          }
        />
        <Route
          path="parent"
          element={
            <RoleGuard allowedRoles={['PARENT']}>
              <ParentPortalView />
            </RoleGuard>
          }
        />

        {/* Academic Staff & Admin Routes */}
        <Route
          path="students"
          element={
            <RoleGuard allowedRoles={['ADMIN', 'ACADEMIC_STAFF']}>
              <StudentsView />
            </RoleGuard>
          }
        />
        <Route
          path="teachers"
          element={
            <RoleGuard allowedRoles={['ADMIN', 'ACADEMIC_STAFF']}>
              <TeachersView />
            </RoleGuard>
          }
        />
        <Route
          path="courses"
          element={
            <RoleGuard allowedRoles={['ADMIN', 'ACADEMIC_STAFF']}>
              <CoursesView />
            </RoleGuard>
          }
        />
        <Route
          path="classes"
          element={
            <RoleGuard allowedRoles={['ADMIN', 'ACADEMIC_STAFF']}>
              <ClassesView />
            </RoleGuard>
          }
        />
        <Route
          path="enrollments"
          element={
            <RoleGuard allowedRoles={['ADMIN', 'ACADEMIC_STAFF']}>
              <EnrollmentsView />
            </RoleGuard>
          }
        />
        <Route
          path="attendance"
          element={
            <RoleGuard allowedRoles={['ADMIN', 'ACADEMIC_STAFF']}>
              <AttendanceView />
            </RoleGuard>
          }
        />

        {/* Billing & Cashier Routes */}
        <Route
          path="billing"
          element={
            <RoleGuard allowedRoles={['ADMIN', 'CASHIER']}>
              <BillingView />
            </RoleGuard>
          }
        />
        <Route
          path="payments"
          element={
            <RoleGuard allowedRoles={['ADMIN', 'CASHIER']}>
              <PaymentsView />
            </RoleGuard>
          }
        />
        <Route
          path="promotions"
          element={
            <RoleGuard allowedRoles={['ADMIN', 'CASHIER']}>
              <PromotionsView />
            </RoleGuard>
          }
        />

        {/* Admin Only Routes */}
        <Route
          path="rooms"
          element={
            <RoleGuard allowedRoles={['ADMIN']}>
              <RoomsView />
            </RoleGuard>
          }
        />
        <Route
          path="schedule-slots"
          element={
            <RoleGuard allowedRoles={['ADMIN']}>
              <ScheduleSlotsView />
            </RoleGuard>
          }
        />

        {/* Common Reports */}
        <Route
          path="reports"
          element={
            <RoleGuard allowedRoles={['ADMIN', 'ACADEMIC_STAFF', 'CASHIER']}>
              <ReportsView />
            </RoleGuard>
          }
        />

        {/* Fallback inside layout */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>

      {/* Catch-all global route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <AppRouter />
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;
