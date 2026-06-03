import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import { ChatFloatProvider } from './contexts/ChatFloatContext';
import { DashboardLayout } from './layouts/DashboardLayout';
import { AgendaPage } from './pages/AgendaPage';
import { DashboardPage } from './pages/DashboardPage';
import { FilaPage } from './pages/FilaPage';
import { FinanceiroPage } from './pages/FinanceiroPage';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';
import { SystemsPage } from './pages/SystemsPage';
import { UsersPage } from './pages/UsersPage';
import { ChatPage } from './pages/ChatPage';

export default function App() {
  return (
    <AuthProvider>
      <ChatFloatProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/sistemas" element={<SystemsPage />} />
              <Route path="/fila" element={<FilaPage />} />
              <Route path="/perfil" element={<ProfilePage />} />
              <Route path="/configuracoes" element={<SettingsPage />} />
              <Route element={<ProtectedRoute requireGestao />}>
                <Route path="/usuarios" element={<UsersPage />} />
              </Route>
              <Route element={<ProtectedRoute requireFinanceiro />}>
                <Route path="/financeiro" element={<FinanceiroPage />} />
                <Route path="/agenda" element={<AgendaPage />} />
              </Route>
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      </ChatFloatProvider>
    </AuthProvider>
  );
}
