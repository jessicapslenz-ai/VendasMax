import { formatCurrency } from "@/lib/utils";
import React, { useMemo, useState } from 'react';
import { useStore } from '../store/StoreContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';
import { Package, Tags, ArrowDown, ArrowUp, TrendingUp } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Button } from '../components/ui/button';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

export const Reports = () => {
  const { orders, products, categories } = useStore();
  const [reportType, setReportType] = useState<'products' | 'categories'>('products');
  const [timeGrouping, setTimeGrouping] = useState<'weekly' | 'monthly'>('weekly');
  const [sortBy, setSortBy] = useState<'revenue' | 'quantity'>('revenue');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const completedOrders = useMemo(() => orders.filter(o => o.status === 'completed'), [orders]);

  // Margin data over time
  const marginData = useMemo(() => {
    const marginStats: Record<string, { date: string, profit: number, revenue: number, cost: number, quantity: number }> = {};
    
    completedOrders.forEach(order => {
      const date = new Date(order.date);
      let groupKey = '';
      
      if (timeGrouping === 'monthly') {
        groupKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      } else {
        // Weekly: Get the Monday of that week
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(date.setDate(diff));
        groupKey = monday.toISOString().split('T')[0];
      }

      if (!marginStats[groupKey]) {
        marginStats[groupKey] = { date: groupKey, profit: 0, revenue: 0, cost: 0, quantity: 0 };
      }

      order.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        const costPrice = product?.costPrice || 0;
        const revenue = item.price * item.quantity;
        const totalCost = costPrice * item.quantity;
        const profit = revenue - totalCost;
        
        marginStats[groupKey].revenue += revenue;
        marginStats[groupKey].profit += profit;
        marginStats[groupKey].cost += totalCost;
        marginStats[groupKey].quantity += item.quantity;
      });
    });

    return Object.values(marginStats)
      .map(stat => ({
        ...stat,
        margin: stat.revenue > 0 ? (stat.profit / stat.revenue) * 100 : 0,
        avgPrice: stat.quantity > 0 ? stat.revenue / stat.quantity : 0,
        avgCost: stat.quantity > 0 ? stat.cost / stat.quantity : 0,
        displayDate: timeGrouping === 'monthly' 
          ? new Date(stat.date + '-01').toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
          : new Date(stat.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [completedOrders, products, timeGrouping]);

  // Data Aggregation
  const { productStats, categoryStats } = useMemo(() => {
    const pStats: Record<string, { id: string, name: string, category: string, quantity: number, revenue: number }> = {};
    const cStats: Record<string, { id: string, name: string, quantity: number, revenue: number }> = {};

    completedOrders.forEach(order => {
      order.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          const category = categories.find(c => c.id === product.categoryId);
          const catName = category ? category.name : 'Sem Categoria';
          const catId = category ? category.id : 'no-cat';

          // Product Stats
          if (!pStats[product.id]) {
            pStats[product.id] = { id: product.id, name: product.name, category: catName, quantity: 0, revenue: 0 };
          }
          pStats[product.id].quantity += item.quantity;
          pStats[product.id].revenue += (item.price * item.quantity);

          // Category Stats
          if (!cStats[catId]) {
            cStats[catId] = { id: catId, name: catName, quantity: 0, revenue: 0 };
          }
          cStats[catId].quantity += item.quantity;
          cStats[catId].revenue += (item.price * item.quantity);
        }
      });
    });

    return {
      productStats: Object.values(pStats),
      categoryStats: Object.values(cStats)
    };
  }, [completedOrders, products, categories]);

  // Sorting
  const sortedData = useMemo(() => {
    const data = reportType === 'products' ? productStats : categoryStats;
    return [...data].sort((a, b) => {
      const valA = a[sortBy];
      const valB = b[sortBy];
      if (sortOrder === 'asc') {
        return valA > valB ? 1 : -1;
      } else {
        return valA < valB ? 1 : -1;
      }
    });
  }, [reportType, productStats, categoryStats, sortBy, sortOrder]);



  const toggleSort = (field: 'revenue' | 'quantity') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const SortIcon = ({ field }: { field: 'revenue' | 'quantity' }) => {
    if (sortBy !== field) return null;
    return sortOrder === 'asc' ? <ArrowUp className="inline h-4 w-4 ml-1" /> : <ArrowDown className="inline h-4 w-4 ml-1" />;
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
          <p className="text-muted-foreground">Analise o desempenho de vendas por {reportType === 'products' ? 'produto' : 'categoria'}.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-muted p-1 rounded-lg">
            <button
              onClick={() => setReportType('products')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                reportType === 'products' ? 'bg-background shadow-sm' : 'hover:text-foreground/80'
              }`}
            >
              Produtos
            </button>
            <button
              onClick={() => setReportType('categories')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                reportType === 'categories' ? 'bg-background shadow-sm' : 'hover:text-foreground/80'
              }`}
            >
              Categorias
            </button>
          </div>
        </div>
      </div>

      <Card className="col-span-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
          <div className="space-y-1">
            <CardTitle className="text-xl flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Ranking de Desempenho
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Comparação entre Receita (R$) e Volume (unidades)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Ordenar por:</span>
            <Select value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="revenue">Receita</SelectItem>
                <SelectItem value="quantity">Quantidade</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full">
            {sortedData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={sortedData.slice(0, 10)}
                  margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                  barGap={8}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#888888" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                    tick={{ fill: 'currentColor' }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis 
                    yAxisId="left"
                    stroke="#3b82f6" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(value) => `R$${value >= 1000 ? (value/1000).toFixed(1) + 'k' : value}`}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    stroke="#10b981" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                    formatter={(value: any, name: string) => [
                      name === 'revenue' ? formatCurrency(value) : value,
                      name === 'revenue' ? 'Receita Total' : 'Qtd Vendida'
                    ]}
                  />
                  <Legend verticalAlign="top" align="right" height={36}/>
                  <Bar 
                    yAxisId="left"
                    dataKey="revenue" 
                    name="revenue"
                    fill="#3b82f6" 
                    radius={[4, 4, 0, 0]} 
                    barSize={24}
                  />
                  <Bar 
                    yAxisId="right"
                    dataKey="quantity" 
                    name="quantity"
                    fill="#10b981" 
                    radius={[4, 4, 0, 0]} 
                    barSize={24}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center border-2 border-dashed rounded-xl bg-muted/30">
                <div className="text-center space-y-2">
                  <Package className="h-10 w-10 text-muted-foreground mx-auto opacity-20" />
                  <p className="text-sm text-muted-foreground">Sem dados suficientes para gerar o gráfico.</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
                Margem de Lucro ao Longo do Tempo
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Média de margem percentual por período
              </p>
            </div>
            <div className="flex bg-muted p-1 rounded-lg h-8">
              <button
                onClick={() => setTimeGrouping('weekly')}
                className={`px-3 py-0 text-xs font-medium rounded-md transition-all ${
                  timeGrouping === 'weekly' ? 'bg-background shadow-sm' : 'hover:text-foreground/80'
                }`}
              >
                Semanal
              </button>
              <button
                onClick={() => setTimeGrouping('monthly')}
                className={`px-3 py-0 text-xs font-medium rounded-md transition-all ${
                  timeGrouping === 'monthly' ? 'bg-background shadow-sm' : 'hover:text-foreground/80'
                }`}
              >
                Mensal
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {marginData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={marginData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="displayDate" 
                      stroke="#888888" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="#888888" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(value) => `${value.toFixed(0)}%`}
                    />
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                      formatter={(value: any) => [`${value.toFixed(2)}%`, 'Margem de Lucro']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="margin" 
                      stroke="#10b981" 
                      strokeWidth={3}
                      dot={{ fill: '#10b981', r: 4, strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center border-2 border-dashed rounded-xl bg-muted/30">
                  <p className="text-sm text-muted-foreground">Sem dados suficientes para gerar a tendência.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-500" />
                Preço Médio de Venda vs Custo
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Comparativo histórico entre preço médio praticado e custo médio
              </p>
            </div>
            <div className="flex bg-muted p-1 rounded-lg h-8">
              <button
                onClick={() => setTimeGrouping('weekly')}
                className={`px-3 py-0 text-xs font-medium rounded-md transition-all ${
                  timeGrouping === 'weekly' ? 'bg-background shadow-sm' : 'hover:text-foreground/80'
                }`}
              >
                Semanal
              </button>
              <button
                onClick={() => setTimeGrouping('monthly')}
                className={`px-3 py-0 text-xs font-medium rounded-md transition-all ${
                  timeGrouping === 'monthly' ? 'bg-background shadow-sm' : 'hover:text-foreground/80'
                }`}
              >
                Mensal
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {marginData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={marginData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="displayDate" 
                      stroke="#888888" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="#888888" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(value) => `R$${value.toFixed(0)}`}
                    />
                    <Legend verticalAlign="top" align="right" height={36} />
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                      formatter={(value: any, name: string) => [
                        formatCurrency(value), 
                        name === 'avgPrice' ? 'Preço Médio de Venda' : 'Custo Médio'
                      ]}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="avgPrice" 
                      name="avgPrice"
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      dot={{ fill: '#3b82f6', r: 4, strokeWidth: 2, stroke: '#fff' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="avgCost" 
                      name="avgCost"
                      stroke="#ef4444" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ fill: '#ef4444', r: 4, strokeWidth: 2, stroke: '#fff' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center border-2 border-dashed rounded-xl bg-muted/30">
                  <p className="text-sm text-muted-foreground">Sem dados suficientes para gerar a tendência de preços.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Tags className="h-5 w-5 text-indigo-500" />
              Distribuição por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {categoryStats.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryStats}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="quantity"
                      nameKey="name"
                    >
                      {categoryStats.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value: number) => [value, 'Unidades Vendidas']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground italic">
                  Nenhuma categoria com vendas.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Keeping the table for detailed view as requested "allowing sorting" */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Resumo de Itens</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[300px] overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead className="text-right cursor-pointer hover:text-primary transition-colors" onClick={() => toggleSort('quantity')}>
                      Qtd <SortIcon field="quantity" />
                    </TableHead>
                    <TableHead className="text-right cursor-pointer hover:text-primary transition-colors" onClick={() => toggleSort('revenue')}>
                      Total <SortIcon field="revenue" />
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium truncate max-w-[120px]">{item.name}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right font-medium text-emerald-600">{formatCurrency(item.revenue)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Full table moved to bottom or removed if redundant, checking user preference. I'll keep one detailed table */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhamento Completo</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                {reportType === 'products' && <TableHead>Categoria</TableHead>}
                <TableHead className="text-right cursor-pointer hover:bg-muted/50" onClick={() => toggleSort('quantity')}>
                  Quantidade Vendida <SortIcon field="quantity" />
                </TableHead>
                <TableHead className="text-right cursor-pointer hover:bg-muted/50" onClick={() => toggleSort('revenue')}>
                  Receita Total <SortIcon field="revenue" />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={reportType === 'products' ? 4 : 3} className="text-center py-8 text-muted-foreground font-medium underline decoration-primary/20 decoration-2">
                    Nenhum dado encontrado para o período.
                  </TableCell>
                </TableRow>
              ) : (
                sortedData.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    {reportType === 'products' && <TableCell>{(item as any).category}</TableCell>}
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right text-emerald-600 font-bold">{formatCurrency(item.revenue)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
