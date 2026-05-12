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
import { Order } from '../types';
import { Plus, Trash2, Edit, Store, CreditCard, Eye } from 'lucide-react';
import { toast } from 'sonner';

export const Orders = () => {
  const { orders, products, clients, channels, paymentMethods, addOrder, updateOrder, deleteOrder } = useStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  
  const [clientId, setClientId] = useState('');
  const [channelId, setChannelId] = useState('');
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [status, setStatus] = useState<Order['status']>('completed');
  const [orderItems, setOrderItems] = useState<{productId: string, quantity: number, price: number}[]>([]);

  const handleViewOrder = (order: Order) => {
    setViewingOrder(order);
    setIsViewDialogOpen(true);
  };

  const handleOpenDialog = (order?: Order) => {
    if (order) {
      setEditingOrder(order);
      setClientId(order.clientId);
      setChannelId(order.channelId || channels[0]?.id || '');
      setPaymentMethodId(order.paymentMethodId || paymentMethods[0]?.id || '');
      setOrderItems(order.items);
      setStatus(order.status);
    } else {
      setEditingOrder(null);
      setClientId('');
      setChannelId(channels[0]?.id || '');
      setPaymentMethodId(paymentMethods[0]?.id || '');
      setOrderItems([]);
      setStatus('completed');
    }
    setSelectedProductId('');
    setQuantity('1');
    setIsDialogOpen(true);
  };

  const handleAddItem = () => {
    if (!selectedProductId) return;
    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      toast.error('Quantidade inválida');
      return;
    }

    if (qty > product.stock && (!editingOrder || !editingOrder.items.find(i => i.productId === selectedProductId))) {
      toast.error(`Estoque insuficiente. Disponível: ${product.stock}`);
      return;
    }

    const existingItemIndex = orderItems.findIndex(item => item.productId === selectedProductId);
    if (existingItemIndex >= 0) {
      const newItems = [...orderItems];
      newItems[existingItemIndex].quantity += qty;
      setOrderItems(newItems);
    } else {
      setOrderItems([...orderItems, { productId: selectedProductId, quantity: qty, price: product.price }]);
    }
    
    setSelectedProductId('');
    setQuantity('1');
  };

  const handleRemoveItem = (productId: string) => {
    setOrderItems(orderItems.filter(item => item.productId !== productId));
  };

  const handleUpdateItemQuantity = (productId: string, newQuantity: string) => {
    const qty = parseInt(newQuantity, 10);
    if (isNaN(qty) || qty <= 0) return;

    const product = products.find(p => p.id === productId);
    if (!product) return;

    const originalQty = editingOrder?.items.find(i => i.productId === productId)?.quantity || 0;
    const availableStock = product.stock + originalQty;

    if (qty > availableStock) {
      toast.error(`Estoque insuficiente. Disponível: ${availableStock}`);
      return;
    }

    setOrderItems(orderItems.map(item => 
      item.productId === productId ? { ...item, quantity: qty } : item
    ));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) {
      toast.error('Selecione um cliente');
      return;
    }
    if (!channelId) {
      toast.error('Selecione um canal de venda');
      return;
    }
    if (!paymentMethodId) {
      toast.error('Selecione uma forma de pagamento');
      return;
    }
    if (orderItems.length === 0) {
      toast.error('Adicione pelo menos um produto');
      return;
    }

    const subtotal = orderItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const paymentMethod = paymentMethods.find(pm => pm.id === paymentMethodId);
    let total = subtotal;
    
    if (paymentMethod) {
      total = subtotal + (subtotal * (paymentMethod.feePercentage / 100)) + paymentMethod.feeFixed;
    }

    if (editingOrder) {
      updateOrder(editingOrder.id, {
        clientId,
        channelId,
        paymentMethodId,
        items: orderItems,
        total,
        status
      });
      toast.success('Pedido atualizado com sucesso!');
    } else {
      addOrder({
        clientId,
        channelId,
        paymentMethodId,
        items: orderItems,
        total,
        status
      });
      toast.success('Pedido criado com sucesso!');
    }

    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este pedido?')) {
      deleteOrder(id);
      toast.success('Pedido excluído com sucesso!');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <Badge className="bg-green-500">Concluído</Badge>;
      case 'pending': return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Pendente</Badge>;
      case 'cancelled': return <Badge variant="destructive">Cancelado</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Pedidos</h1>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" /> Novo Pedido
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Produtos</TableHead>
              <TableHead>Qtd</TableHead>
              <TableHead>Canal</TableHead>
              <TableHead>Pagamento</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Lucro</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center">Nenhum pedido encontrado.</TableCell>
              </TableRow>
            ) : (
              orders.map((order) => {
                const client = clients.find(c => c.id === order.clientId);
                
                const productsSummary = order.items.map(item => {
                  const product = products.find(p => p.id === item.productId);
                  return `${product?.name || 'Excluído'}`;
                }).join(', ');
                
                const totalQuantity = order.items.reduce((acc, item) => acc + item.quantity, 0);
                
                const orderProfit = order.items.reduce((acc, item) => {
                  const product = products.find(p => p.id === item.productId);
                  const cost = product?.costPrice || 0;
                  return acc + ((item.price - cost) * item.quantity);
                }, 0);

                return (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.id.slice(0, 8)}...</TableCell>
                    <TableCell>{client?.name || 'Desconhecido'}</TableCell>
                    <TableCell className="max-w-[200px] truncate" title={productsSummary}>
                      {productsSummary}
                    </TableCell>
                    <TableCell>{totalQuantity}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="flex w-fit items-center gap-1">
                        <Store className="h-3 w-3" />
                        {channels.find(c => c.id === order.channelId)?.name || 'Desconhecido'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="flex w-fit items-center gap-1">
                        <CreditCard className="h-3 w-3" />
                        {paymentMethods.find(pm => pm.id === order.paymentMethodId)?.name || 'Desconhecido'}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(order.date).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell>{formatCurrency(order.total)}</TableCell>
                    <TableCell className="text-emerald-600 font-medium">{formatCurrency(orderProfit)}</TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleViewOrder(order)}>
                        <Eye className="h-4 w-4 text-blue-500" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(order)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(order.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Pedido #{viewingOrder?.id.slice(0, 8).toUpperCase()}</DialogTitle>
          </DialogHeader>
          {viewingOrder && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-semibold text-gray-500">Cliente:</span>
                  <p className="text-base">{clients.find(c => c.id === viewingOrder.clientId)?.name || 'Desconhecido'}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-500">Data e Hora:</span>
                  <p className="text-base">{new Date(viewingOrder.date).toLocaleString('pt-BR')}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-500">Canal de Venda:</span>
                  <p className="text-base flex items-center gap-1 mt-1">
                    <Store className="h-4 w-4" />
                    {channels.find(c => c.id === viewingOrder.channelId)?.name || 'Desconhecido'}
                  </p>
                </div>
                <div>
                  <span className="font-semibold text-gray-500">Forma de Pagamento:</span>
                  <p className="text-base flex items-center gap-1 mt-1">
                    <CreditCard className="h-4 w-4" />
                    {paymentMethods.find(pm => pm.id === viewingOrder.paymentMethodId)?.name || 'Desconhecido'}
                  </p>
                </div>
                <div>
                  <span className="font-semibold text-gray-500">Status:</span>
                  <div className="mt-1">{getStatusBadge(viewingOrder.status)}</div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-3">Itens do Pedido</h3>
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead className="text-center">Qtd</TableHead>
                        <TableHead className="text-right">Preço Unit.</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                        <TableHead className="text-right">Lucro</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {viewingOrder.items.map(item => {
                        const product = products.find(p => p.id === item.productId);
                        const cost = product?.costPrice || 0;
                        const itemProfit = (item.price - cost) * item.quantity;
                        return (
                          <TableRow key={item.productId}>
                            <TableCell>{product?.name || 'Produto Removido'}</TableCell>
                            <TableCell className="text-center">{item.quantity}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
                            <TableCell className="text-right">{formatCurrency((item.price * item.quantity))}</TableCell>
                            <TableCell className="text-right text-emerald-600 font-medium">{formatCurrency(itemProfit)}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="flex justify-end border-t pt-4">
                <div className="text-right space-y-1">
                  <p className="text-sm text-gray-500">
                    Subtotal: {formatCurrency(viewingOrder.items.reduce((acc, item) => acc + (item.price * item.quantity), 0))}
                  </p>
                  <p className="text-xl font-bold">
                    Total: {formatCurrency(viewingOrder.total)}
                  </p>
                  <p className="text-sm font-medium text-emerald-600">
                    Lucro Total: {formatCurrency(viewingOrder.items.reduce((acc, item) => {
                      const product = products.find(p => p.id === item.productId);
                      const cost = product?.costPrice || 0;
                      return acc + ((item.price - cost) * item.quantity);
                    }, 0))}
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsViewDialogOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingOrder ? 'Editar Pedido' : 'Novo Pedido'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Cliente</Label>
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map(client => (
                      <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Canal de Venda</Label>
                <Select value={channelId} onValueChange={setChannelId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um canal" />
                  </SelectTrigger>
                  <SelectContent>
                    {channels.map(channel => (
                      <SelectItem key={channel.id} value={channel.id}>{channel.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Forma de Pagamento</Label>
                <Select value={paymentMethodId} onValueChange={setPaymentMethodId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma forma de pagamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map(method => (
                      <SelectItem key={method.id} value={method.id}>
                        {method.name} 
                        {(method.feePercentage > 0 || method.feeFixed > 0) && 
                          ` (Taxa: ${method.feePercentage}% + ${formatCurrency(method.feeFixed)})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {editingOrder && (
                <div className="grid gap-2">
                  <Label>Status</Label>
                  <Select value={status} onValueChange={(val: any) => setStatus(val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="completed">Concluído</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="border rounded-md p-4 space-y-4">
              <h3 className="font-medium">Adicionar Produtos</h3>
              <div className="flex gap-2 items-end">
                <div className="grid gap-2 flex-1">
                  <Label>Produto</Label>
                  <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um produto" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.filter(p => p.stock > 0).map(product => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} - {formatCurrency(product.price)} (Estoque: {product.stock})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2 w-24">
                  <Label>Qtd</Label>
                  <Input 
                    type="number" 
                    min="1" 
                    value={quantity} 
                    onChange={e => setQuantity(e.target.value)} 
                  />
                </div>
                <Button type="button" onClick={handleAddItem}>Adicionar</Button>
              </div>

              {orderItems.length > 0 && (
                <div className="mt-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead>Qtd</TableHead>
                        <TableHead>Preço Unit.</TableHead>
                        <TableHead>Subtotal</TableHead>
                        <TableHead>Lucro</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orderItems.map(item => {
                        const product = products.find(p => p.id === item.productId);
                        const cost = product?.costPrice || 0;
                        const itemProfit = (item.price - cost) * item.quantity;
                        return (
                          <TableRow key={item.productId}>
                            <TableCell>{product?.name}</TableCell>
                            <TableCell>
                              <Input 
                                type="number" 
                                min="1" 
                                className="w-20 h-8"
                                value={item.quantity} 
                                onChange={e => handleUpdateItemQuantity(item.productId, e.target.value)} 
                              />
                            </TableCell>
                            <TableCell>{formatCurrency(item.price)}</TableCell>
                            <TableCell>{formatCurrency((item.price * item.quantity))}</TableCell>
                            <TableCell className="text-emerald-600 font-medium">{formatCurrency(itemProfit)}</TableCell>
                            <TableCell>
                              <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.productId)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  <div className="text-right font-bold mt-4 space-y-1">
                    <p>Total: {formatCurrency(orderItems.reduce((acc, item) => acc + (item.price * item.quantity), 0))}</p>
                    <p className="text-sm text-emerald-600">
                      Lucro Total: {formatCurrency(orderItems.reduce((acc, item) => {
                        const product = products.find(p => p.id === item.productId);
                        const cost = product?.costPrice || 0;
                        return acc + ((item.price - cost) * item.quantity);
                      }, 0))}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit}>{editingOrder ? 'Salvar Alterações' : 'Finalizar Pedido'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
