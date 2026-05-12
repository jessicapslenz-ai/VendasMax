import { formatCurrency } from "@/lib/utils";
import React, { useMemo, useState } from 'react';
import { useStore } from '../store/StoreContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { Package, Tags, ArrowDown, ArrowUp } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

export const Reports = () => {
  const { orders, products, categories } = useStore();
  const [reportType, setReportType] = useState<'products' | 'categories'>('products');
  const [sortBy, setSortBy] = useState<'revenue' | 'quantity'>('revenue');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const completedOrders = useMemo(() => orders.filter(o => o.status === 'completed'), [orders]);

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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
        <div className="flex items-center gap-2">
          <Select value={reportType} onValueChange={(val: any) => setReportType(val)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tipo de Relatório" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="products">Por Produto</SelectItem>
              <SelectItem value="categories">Por Categoria</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {reportType === 'products' ? <Package className="h-5 w-5" /> : <Tags className="h-5 w-5" />}
              Receita por {reportType === 'products' ? 'Produto' : 'Categoria'} (Top 10)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              {sortedData.length > 0 ? (
                <BarChart data={sortedData.slice(0, 10)} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => formatCurrency(value)} />
                  <YAxis dataKey="name" type="category" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} width={100} />
                  <RechartsTooltip formatter={(value: number) => [formatCurrency(value), 'Receita']} />
                  <Bar dataKey="revenue" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  Sem dados suficientes.
                </div>
              )}
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {reportType === 'products' ? <Package className="h-5 w-5" /> : <Tags className="h-5 w-5" />}
              Volume por {reportType === 'products' ? 'Produto' : 'Categoria'} (Top 10)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              {sortedData.length > 0 ? (
                <PieChart>
                  <Pie
                    data={sortedData.slice(0, 10)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="quantity"
                  >
                    {sortedData.slice(0, 10).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value: number) => [value, 'Quantidade']} />
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

      <Card>
        <CardHeader>
          <CardTitle>Detalhamento</CardTitle>
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
                  <TableCell colSpan={reportType === 'products' ? 4 : 3} className="text-center py-8 text-muted-foreground">
                    Nenhum dado encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                sortedData.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    {reportType === 'products' && <TableCell>{(item as any).category}</TableCell>}
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right text-emerald-500 font-medium">{formatCurrency(item.revenue)}</TableCell>
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
