import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, Users, ShoppingCart, Menu, Tags, Store, CreditCard, DollarSign, Receipt, Wallet, LineChart, FileText, Building2 } from 'lucide-react';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { SearchBar } from './SearchBar';
import { ThemeToggle } from './ThemeToggle';

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Categorias', path: '/categorias', icon: Tags },
  { name: 'Canais', path: '/canais', icon: Store },
  { name: 'Pagamento', path: '/pagamento', icon: CreditCard },
  { name: 'Produtos', path: '/produtos', icon: Package },
  { name: 'Clientes', path: '/clientes', icon: Users },
  { name: 'Fornecedores', path: '/fornecedores', icon: Building2 },
  { name: 'Pedidos', path: '/pedidos', icon: ShoppingCart },
  { name: 'Analytics', path: '/analytics', icon: LineChart },
  { name: 'Relatórios', path: '/relatorios', icon: FileText },
  { name: 'Fluxo de Caixa', path: '/fluxo-de-caixa', icon: DollarSign },
  { name: 'Contas a Receber', path: '/contas-a-receber', icon: Receipt },
  { name: 'Gastos Operacionais', path: '/gastos-operacionais', icon: Wallet },
];

export const Layout = () => {
  const location = useLocation();

  const NavLinks = () => (
    <>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <Icon className="h-5 w-5" />
            {item.name}
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 flex-col border-r bg-background sm:flex">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <ShoppingCart className="h-6 w-6 text-primary" />
            <span className="">VendaMax</span>
          </Link>
        </div>
        <div className="flex-1 overflow-auto py-2">
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4 gap-1">
            <NavLinks />
          </nav>
        </div>
      </aside>
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-64">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
          <Sheet>
            <SheetTrigger render={<Button size="icon" variant="outline" className="sm:hidden" />}>
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </SheetTrigger>
            <SheetContent side="left" className="sm:max-w-xs">
              <nav className="grid gap-6 text-lg font-medium">
                <Link
                  to="/"
                  className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                >
                  <ShoppingCart className="h-5 w-5" />
                  VendaMax
                </Link>
                <div className="grid gap-2">
                  <NavLinks />
                </div>
              </nav>
            </SheetContent>
          </Sheet>
          <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
            <div className="ml-auto flex-1 sm:flex-initial">
              <SearchBar />
            </div>
            <ThemeToggle />
          </div>
        </header>
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
