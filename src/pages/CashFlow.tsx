import { formatCurrency } from "@/lib/utils";
import React, { useState } from 'react';
import { useStore } from '../store/StoreContext';
import { Button } from '../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Transaction } from '../types';
import { Plus, Trash2, Edit, ArrowUpCircle, ArrowDownCircle, DollarSign, TrendingUp } from 'lucide-react';

export const CashFlow = () => {
  const { transactions, addTransaction, updateTransaction, deleteTransaction } = useStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  
  const [type, setType] = useState<Transaction['type']>('income');
  const [category, setCategory] = useState<Transaction['category']>('other');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const handleOpenDialog = (transaction?: Transaction) => {
    if (transaction) {
      setEditingTransaction(transaction);
      setType(transaction.type);
      setCategory(transaction.category);
      setAmount(transaction.amount.toString());
      setDescription(transaction.description);
      setDate(transaction.date.split('T')[0]);
    } else {
      setEditingTransaction(null);
      setType('income');
      setCategory('other');
      setAmount('');
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description || !date) return;

    const transactionData = {
      type,
      category,
      amount: parseFloat(amount),
      description,
      date: new Date(date).toISOString(),
    };

    if (editingTransaction) {
      updateTransaction(editingTransaction.id, transactionData);
    } else {
      addTransaction(transactionData);
    }
    setIsDialogOpen(false);
  };

  const totalIncomes = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const balance = totalIncomes - totalExpenses;

  const sales = transactions.filter(t => t.type === 'income' && t.category === 'sale').reduce((acc, t) => acc + t.amount, 0);
  const inventoryCosts = transactions.filter(t => t.type === 'expense' && t.category === 'inventory').reduce((acc, t) => acc + t.amount, 0);
  const operationalCosts = transactions.filter(t => t.type === 'expense' && ['operational', 'taxes', 'payroll'].includes(t.category)).reduce((acc, t) => acc + t.amount, 0);
  const profitImpact = sales - inventoryCosts - operationalCosts;

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'sale': return 'Venda';
      case 'inventory': return 'Estoque';
      case 'operational': return 'Operacional';
      case 'adjustment': return 'Ajuste';
      case 'taxes': return 'Impostos';
      case 'payroll': return 'Folha de Pagamento';
      default: return 'Outros';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Fluxo de Caixa</h1>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" /> Nova Transação
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border bg-card text-card-foreground shadow">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Entradas</h3>
            <ArrowUpCircle className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold text-emerald-500">{formatCurrency(totalIncomes)}</div>
          </div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Saídas</h3>
            <ArrowDownCircle className="h-4 w-4 text-red-500" />
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold text-red-500">{formatCurrency(totalExpenses)}</div>
          </div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Resultado de Caixa</h3>
            <DollarSign className="h-4 w-4 text-primary" />
          </div>
          <div className="p-6 pt-0">
            <div className={`text-2xl font-bold ${balance >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {formatCurrency(balance)}
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Impacto no Lucro</h3>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </div>
          <div className="p-6 pt-0">
            <div className={`text-2xl font-bold ${profitImpact >= 0 ? 'text-blue-500' : 'text-red-500'}`}>
              {formatCurrency(profitImpact)}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(transaction => (
              <TableRow key={transaction.id}>
                <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                <TableCell>{transaction.description}</TableCell>
                <TableCell>{getCategoryLabel(transaction.category)}</TableCell>
                <TableCell>
                  <Badge variant={transaction.type === 'income' ? 'default' : 'destructive'} className={transaction.type === 'income' ? 'bg-emerald-500' : ''}>
                    {transaction.type === 'income' ? 'Entrada' : 'Saída'}
                  </Badge>
                </TableCell>
                <TableCell className={`text-right font-medium ${transaction.type === 'income' ? 'text-emerald-500' : 'text-red-500'}`}>
                  {transaction.type === 'income' ? '+' : '-'} {formatCurrency(transaction.amount)}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(transaction)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteTransaction(transaction.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {transactions.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nenhuma transação encontrada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTransaction ? 'Editar Transação' : 'Nova Transação'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Tipo</Label>
              <Select value={type} onValueChange={(val: any) => setType(val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Entrada</SelectItem>
                  <SelectItem value="expense">Saída</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Categoria</Label>
              <Select value={category} onValueChange={(val: any) => setCategory(val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sale">Venda</SelectItem>
                  <SelectItem value="inventory">Estoque</SelectItem>
                  <SelectItem value="operational">Operacional</SelectItem>
                  <SelectItem value="taxes">Impostos</SelectItem>
                  <SelectItem value="payroll">Folha de Pagamento</SelectItem>
                  <SelectItem value="adjustment">Ajuste</SelectItem>
                  <SelectItem value="other">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Descrição</Label>
              <Input value={description} onChange={e => setDescription(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label>Data</Label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label>Valor</Label>
              <Input type="number" step="0.01" min="0" value={amount} onChange={e => setAmount(e.target.value)} required />
            </div>
            <DialogFooter>
              <Button type="submit">Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
