import { formatCurrency } from "@/lib/utils";
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useStore } from '../store/StoreContext';
import { DollarSign, Package, Users, ShoppingCart, TrendingUp, TrendingDown, PiggyBank, Percent, Receipt, Tag, Wallet } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export const Dashboard = () => {
  const { products, clients, orders, channels, transactions } = useStore();

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const currentMonthTransactions = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const monthIncome = currentMonthTransactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);

  const monthExpense = currentMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  const monthProfit = monthIncome - monthExpense;

  const completedOrders = orders.filter(o => o.status === 'completed');
  const totalVendas = completedOrders.reduce((acc, order) => acc + order.total, 0);
  const ticketMedio = completedOrders.length > 0 ? totalVendas / completedOrders.length : 0;
  
  let custoTotalProdutos = 0;
  completedOrders.forEach(order => {
    order.items.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      const cost = product?.costPrice || 0;
      custoTotalProdutos += cost * item.quantity;
    });
  });

  const margemGeral = totalVendas > 0 ? ((totalVendas - custoTotalProdutos) / totalVendas) * 100 : 0;

  const totalProducts = products.length;
  const totalClients = clients.length;
  const totalOrders = orders.length;

  const recentOrders = [...orders].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  // Simple chart data: last 7 days financial flow
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  }).reverse();

  const chartData = last7Days.map(date => {
    const dayTransactions = transactions.filter(t => t.date.startsWith(date));
    const receitas = dayTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const despesas = dayTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    const lucro = receitas - despesas;
    
    return {
      name: date.split('-').slice(1).join('/'),
      Receitas: receitas,
      Despesas: despesas,
      Lucro: lucro
    };
  });

  const salesByChannelData = channels.map(channel => {
    const channelOrders = orders.filter(o => o.channelId === channel.id && o.status === 'completed');
    const total = channelOrders.reduce((acc, o) => acc + o.total, 0);
    return {
      name: channel.name,
      total
    };
  }).filter(data => data.total > 0).sort((a, b) => b.total - a.total);

  const salesVsProfitData = last7Days.map(date => {
    const dayOrders = orders.filter(o => o.date.startsWith(date) && o.status === 'completed');
    const vendas = dayOrders.reduce((acc, o) => acc + o.total, 0);
    
    let custoTotal = 0;
    dayOrders.forEach(order => {
      order.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        const cost = product?.costPrice || 0;
        custoTotal += cost * item.quantity;
      });
    });
    
    const lucro = vendas - custoTotal;
    
    return {
      name: date.split('-').slice(1).join('/'),
      Vendas: vendas,
      Lucro: lucro
    };
  });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Row 1 */}
        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-none shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-50">Lucro Líquido (Mês)</CardTitle>
            <PiggyBank className="h-4 w-4 text-emerald-100" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(monthProfit)}</div>
            <p className="text-xs text-emerald-100 mt-1">
              Receitas - Despesas
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-none shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-50">Receitas (Mês)</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-100" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(monthIncome)}</div>
            <p className="text-xs text-blue-100 mt-1">
              Vendas e outras entradas
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-rose-500 to-rose-600 text-white border-none shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-rose-50">Despesas (Mês)</CardTitle>
            <TrendingDown className="h-4 w-4 text-rose-100" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(monthExpense)}</div>
            <p className="text-xs text-rose-100 mt-1">
              Compras, ajustes e custos
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-teal-500 to-teal-600 text-white border-none shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-teal-50">Margem Média (Geral)</CardTitle>
            <Percent className="h-4 w-4 text-teal-100" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{margemGeral.toFixed(2)}%</div>
            <p className="text-xs text-teal-100 mt-1">
              Lucro sobre vendas
            </p>
          </CardContent>
        </Card>

        {/* Row 2 */}
        <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white border-none shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-indigo-50">Total em Vendas</CardTitle>
            <Wallet className="h-4 w-4 text-indigo-100" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalVendas)}</div>
            <p className="text-xs text-indigo-100 mt-1">
              Faturamento histórico
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white border-none shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-50">Ticket Médio</CardTitle>
            <Receipt className="h-4 w-4 text-amber-100" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(ticketMedio)}</div>
            <p className="text-xs text-amber-100 mt-1">
              Valor médio por pedido
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-none shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-50">Custo de Produto</CardTitle>
            <Tag className="h-4 w-4 text-orange-100" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(custoTotalProdutos)}</div>
            <p className="text-xs text-orange-100 mt-1">
              Custo total de produtos vendidos
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-700 to-slate-800 text-white border-none shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Pedidos Totais</CardTitle>
            <ShoppingCart className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{totalOrders}</div>
            <p className="text-xs text-slate-300 mt-1">
              Histórico completo
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Fluxo Financeiro (Últimos 7 dias)</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => formatCurrency(value)} />
                <Tooltip formatter={(value) => [`${formatCurrency(Number(value))}`]} />
                <Legend />
                <Bar dataKey="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Lucro" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Pedidos Recentes e Lucro</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {recentOrders.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum pedido recente.</p>
              ) : (
                recentOrders.map(order => {
                  const client = clients.find(c => c.id === order.clientId);
                  
                  const orderProfit = order.items.reduce((acc, item) => {
                    const product = products.find(p => p.id === item.productId);
                    const cost = product?.costPrice || 0;
                    return acc + ((item.price - cost) * item.quantity);
                  }, 0);

                  return (
                    <div key={order.id} className="flex flex-col space-y-3 border-b pb-4 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-medium leading-none">{client?.name || 'Cliente Desconhecido'}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(order.date).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">+{formatCurrency(order.total)}</p>
                          <p className="text-xs text-emerald-600 font-medium">Lucro: {formatCurrency(orderProfit)}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-1.5 pl-2 border-l-2 border-muted">
                        {order.items.map((item, idx) => {
                          const product = products.find(p => p.id === item.productId);
                          const cost = product?.costPrice || 0;
                          const itemProfit = (item.price - cost) * item.quantity;
                          
                          return (
                            <div key={idx} className="flex justify-between text-xs text-muted-foreground">
                              <span>{item.quantity}x {product?.name || 'Produto Excluído'}</span>
                              <span className="text-emerald-600 font-medium">+{formatCurrency(itemProfit)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Vendas por Canal</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={350}>
              {salesByChannelData.length > 0 ? (
                <BarChart data={salesByChannelData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => formatCurrency(value)} />
                  <YAxis dataKey="name" type="category" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} width={100} />
                  <Tooltip formatter={(value) => [`${formatCurrency(Number(value))}`, 'Total']} />
                  <Bar dataKey="total" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              ) : (
                <div className="flex h-[350px] items-center justify-center text-sm text-muted-foreground">
                  Nenhuma venda registrada por canal.
                </div>
              )}
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Vendas vs Lucro Bruto (7 dias)</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={salesVsProfitData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => formatCurrency(value)} />
                <Tooltip formatter={(value) => [`${formatCurrency(Number(value))}`]} />
                <Legend />
                <Line type="monotone" dataKey="Vendas" stroke="#3b82f6" strokeWidth={2} activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="Lucro" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
