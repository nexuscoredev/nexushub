import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppUpdateProvider } from './contexts/AppUpdateContext';
import { AuthProvider } from './contexts/AuthContext';
import { ChatFloatProvider } from './contexts/ChatFloatContext';
import { DashboardLayout } from './layouts/DashboardLayout';
import { AgendaPage } from './pages/AgendaPage';
import { DashboardPage } from './pages/DashboardPage';
import { FilaPage } from './pages/FilaPage';
import { FinanceiroPage } from './pages/FinanceiroPage';
import { ClientProtectedRoute } from './components/ClientProtectedRoute';
import { ClientPortalLayout } from './layouts/ClientPortalLayout';
import { LigeirinhoClientRoute } from './components/LigeirinhoClientRoute';
import { ClienteLoginPage } from './pages/cliente/ClienteLoginPage';
import { ClientePortalPage } from './pages/cliente/ClientePortalPage';
import { LoginPage } from './pages/LoginPage';
import { SiteRedirectPage } from './pages/SiteRedirectPage';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';
import { LigeirinhoDocumentacaoPage } from './pages/LigeirinhoDocumentacaoPage';
import { SystemsPage } from './pages/SystemsPage';
import { UsersPage } from './pages/UsersPage';
import { ChatPage } from './pages/ChatPage';
import { JarvisChatsPage } from './pages/JarvisChatsPage';
import { PessoalPage } from './pages/PessoalPage';
import { VaultPage } from './pages/VaultPage';
import { DesenvolvimentoPage } from './pages/DesenvolvimentoPage';
import { SistemaDemoPage } from './pages/SistemaDemoPage';
import { VaultProvider } from './contexts/VaultContext';

export default function App() {
  return (
    <AuthProvider>
      <AppUpdateProvider>
      <ChatFloatProvider>
      <VaultProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<SiteRedirectPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/cliente/entrar" element={<ClienteLoginPage />} />
          <Route element={<ClientProtectedRoute />}>
            <Route element={<ClientPortalLayout />}>
              <Route path="/cliente" element={<ClientePortalPage />} />
              <Route path="/cliente/ligeirinho" element={<LigeirinhoClientRoute report="hub" />} />
              <Route path="/cliente/ligeirinho-parceiros" element={<LigeirinhoClientRoute report="parceiros" />} />
              <Route path="/cliente/documentacao/ligeirinho-contrato" element={<LigeirinhoClientRoute report="documentacao" />} />
            </Route>
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route path="/sistemas/demo/:demoId" element={<SistemaDemoPage />} />
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/sistemas" element={<SystemsPage />} />
              <Route element={<ProtectedRoute requireDocumentacao />}>
                <Route path="/sistemas/ligeirinho/documentacao" element={<LigeirinhoDocumentacaoPage />} />
              </Route>
              <Route path="/fila" element={<FilaPage />} />
              <Route path="/perfil" element={<ProfilePage />} />
              <Route path="/configuracoes" element={<SettingsPage />} />
              <Route path="/desenvolvimento" element={<DesenvolvimentoPage />} />
              <Route element={<ProtectedRoute requireGestao />}>
                <Route path="/usuarios" element={<UsersPage />} />
              </Route>
              <Route element={<ProtectedRoute requireCofre />}>
                <Route path="/cofre" element={<VaultPage />} />
              </Route>
              <Route element={<ProtectedRoute requireJarvis />}>
                <Route path="/jarvis" element={<JarvisChatsPage />} />
              </Route>
              <Route element={<ProtectedRoute requirePessoal />}>
                <Route path="/pessoal" element={<PessoalPage />} />
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
      </VaultProvider>
      </ChatFloatProvider>
      </AppUpdateProvider>
    </AuthProvider>
  );
}
