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
import { Plus, Search, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Receivable } from '../types';

export const Receivables = () => {
  const { receivables, addReceivable, updateReceivable, deleteReceivable, clients } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newReceivable, setNewReceivable] = useState<Partial<Receivable>>({
    description: '',
    amount: 0,
    dueDate: new Date().toISOString().split('T')[0],
    status: 'pending',
    clientId: 'none'
  });

  const filteredReceivables = receivables.filter(r => 
    r.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.clientId && clients.find(c => c.id === r.clientId)?.name.toLowerCase().includes(searchTerm.toLowerCase()))
  ).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const totalPending = receivables.filter(r => r.status === 'pending').reduce((acc, r) => acc + r.amount, 0);
  const totalPaid = receivables.filter(r => r.status === 'paid').reduce((acc, r) => acc + r.amount, 0);

  const handleAddReceivable = () => {
    if (!newReceivable.description || !newReceivable.amount || !newReceivable.dueDate) return;
    
    addReceivable({
      description: newReceivable.description,
      amount: Number(newReceivable.amount),
      dueDate: newReceivable.dueDate,
      status: newReceivable.status as Receivable['status'],
      clientId: newReceivable.clientId === 'none' ? undefined : newReceivable.clientId
    });
    
    setIsAddDialogOpen(false);
    setNewReceivable({
      description: '',
      amount: 0,
      dueDate: new Date().toISOString().split('T')[0],
      status: 'pending',
      clientId: 'none'
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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Contas a Receber</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="mr-2 h-4 w-4" /> Novo Recebimento
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Conta a Receber</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="description">Descrição</Label>
                <Input
                  id="description"
                  value={newReceivable.description}
                  onChange={(e) => setNewReceivable({ ...newReceivable, description: e.target.value })}
                  placeholder="Ex: Pagamento de serviço"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="amount">Valor (R$)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={newReceivable.amount || ''}
                  onChange={(e) => setNewReceivable({ ...newReceivable, amount: parseFloat(e.target.value) })}
                  placeholder="0.00"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dueDate">Data de Vencimento</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={newReceivable.dueDate}
                  onChange={(e) => setNewReceivable({ ...newReceivable, dueDate: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="client">Cliente (Opcional)</Label>
                <Select
                  value={newReceivable.clientId}
                  onValueChange={(value) => setNewReceivable({ ...newReceivable, clientId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {clients.map(client => (
                      <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={newReceivable.status}
                  onValueChange={(value: any) => setNewReceivable({ ...newReceivable, status: value })}
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
            <Button onClick={handleAddReceivable} className="w-full">Salvar</Button>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pendente</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{formatCurrency(totalPending)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recebido</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lançamentos</CardTitle>
          <div className="relative mt-2">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar lançamentos..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReceivables.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Nenhuma conta a receber encontrada.
                  </TableCell>
                </TableRow>
              ) : (
                filteredReceivables.map((receivable) => (
                  <TableRow key={receivable.id}>
                    <TableCell className="font-medium">{receivable.description}</TableCell>
                    <TableCell>
                      {receivable.clientId ? clients.find(c => c.id === receivable.clientId)?.name : '-'}
                    </TableCell>
                    <TableCell>{new Date(receivable.dueDate).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell>{formatCurrency(receivable.amount)}</TableCell>
                    <TableCell>{getStatusBadge(receivable.status)}</TableCell>
                    <TableCell className="text-right">
                      {receivable.status === 'pending' && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mr-2 text-green-600 border-green-200 hover:bg-green-50"
                          onClick={() => updateReceivable(receivable.id, { status: 'paid' })}
                        >
                          Marcar como Pago
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-600 hover:text-red-800 hover:bg-red-50"
                        onClick={() => deleteReceivable(receivable.id)}
                      >
                        Excluir
                      </Button>
                    </TableCell>
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
