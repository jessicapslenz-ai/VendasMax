/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { StoreProvider } from './store/StoreContext';
import { ThemeProvider } from './components/ThemeProvider';
import { AuthProvider, useAuth } from './components/AuthContext';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Categories } from './pages/Categories';
import { Channels } from './pages/Channels';
import { PaymentMethods } from './pages/PaymentMethods';
import { Products } from './pages/Products';
import { Clients } from './pages/Clients';
import { Orders } from './pages/Orders';
import { CashFlow } from './pages/CashFlow';
import { Receivables } from './pages/Receivables';
import { OperationalExpenses } from './pages/OperationalExpenses';
import { Analytics } from './pages/Analytics';
import { Reports } from './pages/Reports';
import { Suppliers } from './pages/Suppliers';
import { LoginPage } from './pages/LoginPage';
import { Toaster } from './components/ui/sonner';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="animate-pulse text-2xl font-bold text-primary">VendaMax...</div>
    </div>
  );
  
  if (!user) return <Navigate to="/login" replace />;
  
  return <>{children}</>;
}

export default function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vendamax-theme">
      <AuthProvider>
        <StoreProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route 
                path="/" 
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="categorias" element={<Categories />} />
                <Route path="canais" element={<Channels />} />
                <Route path="pagamento" element={<PaymentMethods />} />
                <Route path="produtos" element={<Products />} />
                <Route path="clientes" element={<Clients />} />
                <Route path="fornecedores" element={<Suppliers />} />
                <Route path="pedidos" element={<Orders />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="relatorios" element={<Reports />} />
                <Route path="fluxo-de-caixa" element={<CashFlow />} />
                <Route path="contas-a-receber" element={<Receivables />} />
                <Route path="gastos-operacionais" element={<OperationalExpenses />} />
              </Route>
            </Routes>
          </Router>
          <Toaster />
        </StoreProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
