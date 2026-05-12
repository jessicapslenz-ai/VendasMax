import { formatCurrency } from "@/lib/utils";
import React, { useMemo } from 'react';
import { useStore } from '../store/StoreContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';
import { TrendingUp, ShoppingBag, CreditCard, DollarSign, Package } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

export const Analytics = () => {
  const { orders, products, categories, channels, paymentMethods } = useStore();

  const completedOrders = useMemo(() => orders.filter(o => o.status === 'completed'), [orders]);

  // KPIs
  const totalRevenue = completedOrders.reduce((acc, order) => acc + order.total, 0);
  const totalOrders = completedOrders.length;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const totalItemsSold = completedOrders.reduce((acc, order) => {
    return acc + order.items.reduce((sum, item) => sum + item.quantity, 0);
  }, 0);

  // Revenue over time (Last 30 days)
  const revenueOverTime = useMemo(() => {
    const last30Days = Array.from({ length: 30 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    return last30Days.map(date => {
      const dayOrders = completedOrders.filter(o => o.date.startsWith(date));
      const total = dayOrders.reduce((acc, o) => acc + o.total, 0);
      return {
        date: date.split('-').slice(1).join('/'),
        receita: total
      };
    });
  }, [completedOrders]);

  // Sales by Category
  const salesByCategory = useMemo(() => {
    const categorySales: Record<string, number> = {};
    
    completedOrders.forEach(order => {
      order.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          const category = categories.find(c => c.id === product.categoryId);
          const catName = category ? category.name : 'Sem Categoria';
          categorySales[catName] = (categorySales[catName] || 0) + (item.price * item.quantity);
        }
      });
    });

    return Object.entries(categorySales)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [completedOrders, products, categories]);

  // Sales by Channel
  const salesByChannel = useMemo(() => {
    return channels.map(channel => {
      const channelOrders = completedOrders.filter(o => o.channelId === channel.id);
      const total = channelOrders.reduce((acc, o) => acc + o.total, 0);
      return {
        name: channel.name,
        total
      };
    }).filter(data => data.total > 0).sort((a, b) => b.total - a.total);
  }, [completedOrders, channels]);

  // Sales by Payment Method
  const salesByPaymentMethod = useMemo(() => {
    return paymentMethods.map(pm => {
      const pmOrders = completedOrders.filter(o => o.paymentMethodId === pm.id);
      const total = pmOrders.reduce((acc, o) => acc + o.total, 0);
      return {
        name: pm.name,
        value: total
      };
    }).filter(data => data.value > 0).sort((a, b) => b.value - a.value);
  }, [completedOrders, paymentMethods]);

  // Top Selling Products
  const topProducts = useMemo(() => {
    const productSales: Record<string, { name: string, quantity: number, revenue: number }> = {};
    
    completedOrders.forEach(order => {
      order.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          if (!productSales[product.id]) {
            productSales[product.id] = { name: product.name, quantity: 0, revenue: 0 };
          }
          productSales[product.id].quantity += item.quantity;
          productSales[product.id].revenue += (item.price * item.quantity);
        }
      });
    });

    return Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [completedOrders, products]);



  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Analytics de Vendas</h1>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              Soma de todos os pedidos concluídos
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{formatCurrency(averageOrderValue)}</div>
            <p className="text-xs text-muted-foreground">
              Valor médio por pedido
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Pedidos</CardTitle>
            <ShoppingBag className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              Pedidos finalizados com sucesso
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Itens Vendidos</CardTitle>
            <Package className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-500">{totalItemsSold}</div>
            <p className="text-xs text-muted-foreground">
              Quantidade total de produtos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Receita ao Longo do Tempo (Últimos 30 dias)</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueOverTime}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => formatCurrency(value)} />
                <RechartsTooltip formatter={(value: number) => [formatCurrency(value), 'Receita']} />
                <Line type="monotone" dataKey="receita" stroke="#10b981" strokeWidth={2} dot={false} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Vendas por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              {salesByCategory.length > 0 ? (
                <PieChart>
                  <Pie
                    data={salesByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {salesByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  Sem dados suficientes.
                </div>
              )}
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Vendas por Canal</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={300}>
              {salesByChannel.length > 0 ? (
                <BarChart data={salesByChannel} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => formatCurrency(value)} />
                  <YAxis dataKey="name" type="category" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} width={100} />
                  <RechartsTooltip formatter={(value: number) => [formatCurrency(value), 'Total']} />
                  <Bar dataKey="total" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  Nenhuma venda registrada por canal.
                </div>
              )}
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Métodos de Pagamento</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              {salesByPaymentMethod.length > 0 ? (
                <PieChart>
                  <Pie
                    data={salesByPaymentMethod}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {salesByPaymentMethod.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  Sem dados suficientes.
                </div>
              )}
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Top 5 Produtos Mais Vendidos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum produto vendido ainda.</p>
            ) : (
              topProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                  <div className="flex items-center gap-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.quantity} unidades vendidas</p>
                    </div>
                  </div>
                  <div className="font-medium text-emerald-500">
                    {formatCurrency(product.revenue)}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
