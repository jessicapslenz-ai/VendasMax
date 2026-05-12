import React, { useState } from 'react';
import { useStore } from '../store/StoreContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Store, Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export const Channels = () => {
  const { channels, addChannel, updateChannel, deleteChannel, orders } = useStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  const handleOpenDialog = (channel?: any) => {
    if (channel) {
      setEditingId(channel.id);
      setFormData({
        name: channel.name,
        description: channel.description || '',
      });
    } else {
      setEditingId(null);
      setFormData({ name: '', description: '' });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateChannel(editingId, formData);
      toast.success('Canal atualizado com sucesso!');
    } else {
      addChannel(formData);
      toast.success('Canal criado com sucesso!');
    }
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    const isUsed = orders.some(o => o.channelId === id);
    if (isUsed) {
      toast.error('Não é possível excluir este canal pois existem pedidos vinculados a ele.');
      return;
    }
    
    if (window.confirm('Tem certeza que deseja excluir este canal de venda?')) {
      deleteChannel(id);
      toast.success('Canal excluído com sucesso!');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Store className="h-8 w-8 text-primary" />
          Canais de Venda
        </h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={<Button onClick={() => handleOpenDialog()} className="gap-2" />}>
              <Plus className="h-4 w-4" /> Novo Canal
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Editar Canal' : 'Novo Canal'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Canal</Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Loja Física, WhatsApp..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição opcional"
                />
              </div>
              <Button type="submit" className="w-full">
                {editingId ? 'Salvar Alterações' : 'Criar Canal'}
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
              <TableHead>Descrição</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {channels.map((channel) => (
              <TableRow key={channel.id}>
                <TableCell className="font-medium">{channel.name}</TableCell>
                <TableCell className="text-gray-500">{channel.description}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(channel)}>
                      <Edit className="h-4 w-4 text-blue-500" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(channel.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {channels.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-gray-500">
                  Nenhum canal de venda cadastrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
