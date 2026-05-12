import { formatCurrency } from "@/lib/utils";
import React, { useState } from 'react';
import { useStore } from '../store/StoreContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { CreditCard, Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export const PaymentMethods = () => {
  const { paymentMethods, addPaymentMethod, updatePaymentMethod, deletePaymentMethod, orders } = useStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    feePercentage: 0,
    feeFixed: 0,
  });

  const handleOpenDialog = (method?: any) => {
    if (method) {
      setEditingId(method.id);
      setFormData({
        name: method.name,
        feePercentage: method.feePercentage,
        feeFixed: method.feeFixed,
      });
    } else {
      setEditingId(null);
      setFormData({ name: '', feePercentage: 0, feeFixed: 0 });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updatePaymentMethod(editingId, formData);
      toast.success('Forma de pagamento atualizada com sucesso!');
    } else {
      addPaymentMethod(formData);
      toast.success('Forma de pagamento criada com sucesso!');
    }
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    const isUsed = orders.some(o => o.paymentMethodId === id);
    if (isUsed) {
      toast.error('Não é possível excluir esta forma de pagamento pois existem pedidos vinculados a ela.');
      return;
    }
    
    if (window.confirm('Tem certeza que deseja excluir esta forma de pagamento?')) {
      deletePaymentMethod(id);
      toast.success('Forma de pagamento excluída com sucesso!');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <CreditCard className="h-8 w-8 text-primary" />
          Formas de Pagamento
        </h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={<Button onClick={() => handleOpenDialog()} className="gap-2" />}>
              <Plus className="h-4 w-4" /> Nova Forma
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Editar Forma de Pagamento' : 'Nova Forma de Pagamento'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Pix, Cartão de Crédito..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="feePercentage">Taxa (%)</Label>
                  <Input
                    id="feePercentage"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.feePercentage}
                    onChange={(e) => setFormData({ ...formData, feePercentage: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="feeFixed">Taxa Fixa (R$)</Label>
                  <Input
                    id="feeFixed"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.feeFixed}
                    onChange={(e) => setFormData({ ...formData, feeFixed: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <Button type="submit" className="w-full">
                {editingId ? 'Salvar Alterações' : 'Criar Forma de Pagamento'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white rounded-lg shadow border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Taxa (%)</TableHead>
              <TableHead>Taxa Fixa (R$)</TableHead>
              <TableHead>Vendas</TableHead>
              <TableHead>Total Recebido</TableHead>
              <TableHead>Total em Taxas</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paymentMethods.map((method) => {
              const methodOrders = orders.filter(o => o.paymentMethodId === method.id && o.status !== 'cancelled');
              const salesCount = methodOrders.length;
              let totalReceived = 0;
              let totalFees = 0;

              methodOrders.forEach(order => {
                totalReceived += order.total;
                const subtotal = order.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
                totalFees += (order.total - subtotal);
              });

              return (
                <TableRow key={method.id}>
                  <TableCell className="font-medium">{method.name}</TableCell>
                  <TableCell>{method.feePercentage}%</TableCell>
                  <TableCell>{formatCurrency(method.feeFixed)}</TableCell>
                  <TableCell>{salesCount}</TableCell>
                  <TableCell className="text-green-600 font-medium">{formatCurrency(totalReceived)}</TableCell>
                  <TableCell className="text-red-500 font-medium">{formatCurrency(totalFees)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(method)}>
                        <Edit className="h-4 w-4 text-blue-500" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(method.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {paymentMethods.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  Nenhuma forma de pagamento cadastrada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
