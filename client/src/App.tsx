import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './contexts/AuthContext';
import { ReminderAlertProvider } from './contexts/ReminderAlertContext';
import { PageTransition } from './components/motion/PageTransition';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { TwoFactorPage } from './pages/TwoFactorPage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { AuthCallbackPage } from './pages/AuthCallbackPage';
import { DashboardPage } from './pages/DashboardPage';
import { FinancePage } from './pages/FinancePage';
import { TasksPage } from './pages/TasksPage';
import { RemindersPage } from './pages/RemindersPage';
import { NotesPage } from './pages/NotesPage';
import { SettingsPage } from './pages/SettingsPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <Routes location={location}>
      {/* Public & Auth Routes */}
      <Route path="/" element={<PageTransition><LandingPage /></PageTransition>} />
      <Route path="/get-started" element={<PageTransition><LandingPage /></PageTransition>} />
      <Route path="/login" element={<PageTransition><LoginPage /></PageTransition>} />
      <Route path="/register" element={<PageTransition><RegisterPage /></PageTransition>} />
      <Route path="/auth/callback" element={<PageTransition><AuthCallbackPage /></PageTransition>} />
      <Route path="/two-factor-auth" element={<PageTransition><TwoFactorPage /></PageTransition>} />
      <Route path="/verify-email" element={<PageTransition><VerifyEmailPage /></PageTransition>} />
      <Route path="/forgot-password" element={<PageTransition><ForgotPasswordPage /></PageTransition>} />

      {/* Core Productivity & Workspace Routes (Persistent AppLayout + Directional Tab Transitions) */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/finance" element={<FinancePage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/reminders" element={<RemindersPage />} />
        <Route path="/notes" element={<NotesPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export function App() {
  return (
    <AuthProvider>
      <ReminderAlertProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AnimatedRoutes />
          <Toaster richColors position="top-right" closeButton />
        </BrowserRouter>
      </ReminderAlertProvider>
    </AuthProvider>
  );
}

export default App;
