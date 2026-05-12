import { formatCurrency } from "@/lib/utils";
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { useStore } from '../store/StoreContext';
import { Plus, Search, CheckCircle2, XCircle, Clock, Wallet } from 'lucide-react';
import { Payable } from '../types';

export const OperationalExpenses = () => {
  const { payables, addPayable, updatePayable, deletePayable } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newPayable, setNewPayable] = useState<Partial<Payable>>({
    description: '',
    amount: 0,
    dueDate: new Date().toISOString().split('T')[0],
    status: 'pending',
    category: 'operational'
  });

  const filteredPayables = payables.filter(p => 
    p.description.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const totalPending = payables.filter(p => p.status === 'pending').reduce((acc, p) => acc + p.amount, 0);
  const totalPaid = payables.filter(p => p.status === 'paid').reduce((acc, p) => acc + p.amount, 0);

  const handleAddPayable = () => {
    if (!newPayable.description || !newPayable.amount || !newPayable.dueDate || !newPayable.category) return;
    
    addPayable({
      description: newPayable.description,
      amount: Number(newPayable.amount),
      dueDate: newPayable.dueDate,
      status: newPayable.status as Payable['status'],
      category: newPayable.category as Payable['category']
    });
    
    setIsAddDialogOpen(false);
    setNewPayable({
      description: '',
      amount: 0,
      dueDate: new Date().toISOString().split('T')[0],
      status: 'pending',
      category: 'operational'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <span className="flex items-center text-green-600 bg-green-100 px-2 py-1 rounded-full text-xs font-medium"><CheckCircle2 className="w-3 h-3 mr-1" /> Pago</span>;
      case 'pending':
        return <span className="flex items-center text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full text-xs font-medium"><Clock className="w-3 h-3 mr-1" /> Pendente</span>;
      case 'cancelled':
        return <span className="flex items-center text-red-600 bg-red-100 px-2 py-1 rounded-full text-xs font-medium"><XCircle className="w-3 h-3 mr-1" /> Cancelado</span>;
      default:
        return null;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'operational': return 'Operacional';
      case 'inventory': return 'Estoque';
      case 'taxes': return 'Impostos';
      case 'payroll': return 'Folha de Pagamento';
      case 'other': return 'Outros';
      default: return category;
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Gastos Operacionais</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="mr-2 h-4 w-4" /> Nova Despesa
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Gasto Operacional</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="description">Descrição</Label>
                <Input
                  id="description"
                  value={newPayable.description}
                  onChange={(e) => setNewPayable({ ...newPayable, description: e.target.value })}
                  placeholder="Ex: Conta de Luz"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="amount">Valor (R$)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={newPayable.amount || ''}
                  onChange={(e) => setNewPayable({ ...newPayable, amount: parseFloat(e.target.value) })}
                  placeholder="0.00"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dueDate">Data de Vencimento</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={newPayable.dueDate}
                  onChange={(e) => setNewPayable({ ...newPayable, dueDate: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">Categoria</Label>
                <Select
                  value={newPayable.category}
                  onValueChange={(value: any) => setNewPayable({ ...newPayable, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="operational">Operacional</SelectItem>
                    <SelectItem value="inventory">Estoque</SelectItem>
                    <SelectItem value="taxes">Impostos</SelectItem>
                    <SelectItem value="payroll">Folha de Pagamento</SelectItem>
                    <SelectItem value="other">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={newPayable.status}
                  onValueChange={(value: any) => setNewPayable({ ...newPayable, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="paid">Pago</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleAddPayable} className="w-full">Salvar</Button>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total a Pagar</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {formatCurrency(totalPending)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pago</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalPaid)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Despesas</CardTitle>
          <div className="flex items-center gap-2 mt-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar despesas..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayables.map((payable) => (
                <TableRow key={payable.id}>
                  <TableCell className="font-medium">{payable.description}</TableCell>
                  <TableCell>{getCategoryLabel(payable.category)}</TableCell>
                  <TableCell>{new Date(payable.dueDate).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell>{formatCurrency(payable.amount)}</TableCell>
                  <TableCell>{getStatusBadge(payable.status)}</TableCell>
                  <TableCell className="text-right">
                    {payable.status === 'pending' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mr-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={() => updatePayable(payable.id, { status: 'paid' })}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Pagar
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deletePayable(payable.id)}
                    >
                      Excluir
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredPayables.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                    Nenhuma despesa encontrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
