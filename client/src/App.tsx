import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './contexts/AuthContext';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { TwoFactorPage } from './pages/TwoFactorPage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { DashboardPage } from './pages/DashboardPage';
import { FinancePage } from './pages/FinancePage';
import { TasksPage } from './pages/TasksPage';
import { NotesPage } from './pages/NotesPage';
import { SettingsPage } from './pages/SettingsPage';

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public & Auth Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/get-started" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/two-factor-auth" element={<TwoFactorPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* Core Productivity & Workspace Routes */}
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/finance" element={<FinancePage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/notes" element={<NotesPage />} />
          <Route path="/settings" element={<SettingsPage />} />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster richColors position="top-right" closeButton />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
