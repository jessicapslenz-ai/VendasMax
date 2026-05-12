/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { StoreProvider } from './store/StoreContext';
import { ThemeProvider } from './components/ThemeProvider';
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
import { Toaster } from './components/ui/sonner';

export default function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vendamax-theme">
      <StoreProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Layout />}>
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
    </ThemeProvider>
  );
}
