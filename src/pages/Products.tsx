import { formatCurrency } from "@/lib/utils";
import React, { useState } from 'react';
import { useStore } from '../store/StoreContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Product } from '../types';
import { Plus, Edit, Trash2, PackagePlus, ImagePlus, X, DollarSign, TrendingUp, PiggyBank, Percent } from 'lucide-react';
import { toast } from 'sonner';

export const Products = () => {
  const { products, categories, addProduct, updateProduct, deleteProduct, addTransaction } = useStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isStockDialogOpen, setIsStockDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [stockProduct, setStockProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', price: '', costPrice: '', stock: '', categoryId: '', images: [] as string[] });
  const [stockData, setStockData] = useState({ quantity: '', totalCost: '' });
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const filteredProducts = filterCategory === 'all' 
    ? products 
    : products.filter(p => p.categoryId === filterCategory);

  const totalItems = filteredProducts.reduce((acc, p) => acc + p.stock, 0);
  const uniqueProducts = filteredProducts.length;
  const totalCost = filteredProducts.reduce((acc, p) => acc + ((p.costPrice || 0) * p.stock), 0);
  const totalSales = filteredProducts.reduce((acc, p) => acc + (p.price * p.stock), 0);
  const potentialProfit = totalSales - totalCost;
  const averageMargin = totalSales > 0 ? (potentialProfit / totalSales) * 100 : 0;

  const handleOpenDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price.toString(),
        costPrice: product.costPrice?.toString() || '',
        stock: product.stock.toString(),
        categoryId: product.categoryId,
        images: product.images || [],
      });
    } else {
      setEditingProduct(null);
      setFormData({ name: '', description: '', price: '', costPrice: '', stock: '', categoryId: '', images: [] });
    }
    setIsDialogOpen(true);
  };

  const handleOpenStockDialog = (product: Product) => {
    setStockProduct(product);
    setStockData({ quantity: '1', totalCost: product.costPrice ? product.costPrice.toString() : '' });
    setIsStockDialogOpen(true);
  };

  const handleStockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockProduct) return;

    const quantity = parseInt(stockData.quantity, 10);
    const totalCost = parseFloat(stockData.totalCost);

    if (isNaN(quantity) || quantity <= 0) {
      toast.error('Quantidade deve ser maior que zero.');
      return;
    }

    // Update stock
    updateProduct(stockProduct.id, { stock: stockProduct.stock + quantity });

    // Add transaction if there's a cost
    if (!isNaN(totalCost) && totalCost > 0) {
      addTransaction({
        type: 'expense',
        category: 'inventory',
        amount: totalCost,
        description: `Entrada de Estoque: ${stockProduct.name} (${quantity} un)`,
        date: new Date().toISOString(),
        referenceId: stockProduct.id
      });
    }

    toast.success('Entrada de estoque registrada com sucesso!');
    setIsStockDialogOpen(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (formData.images.length + files.length > 5) {
      toast.error('Você pode adicionar no máximo 5 imagens por produto.');
      return;
    }

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 800;

          if (width > height) {
            if (width > maxDim) {
              height *= maxDim / width;
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width *= maxDim / height;
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          setFormData(prev => ({
            ...prev,
            images: [...prev.images, dataUrl].slice(0, 5)
          }));
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
    
    // Reset input
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(formData.price);
    const costPrice = parseFloat(formData.costPrice);
    const stock = parseInt(formData.stock, 10);

    if (isNaN(price) || isNaN(stock)) {
      toast.error('Preço e estoque devem ser números válidos.');
      return;
    }

    if (!formData.categoryId) {
      toast.error('Selecione uma categoria.');
      return;
    }

    const productData = { 
      ...formData, 
      price, 
      costPrice: isNaN(costPrice) ? undefined : costPrice, 
      stock,
      images: formData.images
    };

    if (editingProduct) {
      updateProduct(editingProduct.id, productData);
      toast.success('Produto atualizado com sucesso!');
    } else {
      addProduct(productData);
      toast.success('Produto adicionado com sucesso!');
    }
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este produto?')) {
      deleteProduct(id);
      toast.success('Produto excluído com sucesso!');
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Produtos</h1>
        <div className="flex items-center gap-4">
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {categories.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" /> Adicionar Produto
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Valor Total em Custo</h3>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">{formatCurrency(totalCost)}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {uniqueProducts} produtos - {totalItems} itens
          </p>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Valor Total em Vendas</h3>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">{formatCurrency(totalSales)}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Potencial de receita
          </p>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Lucro Potencial</h3>
            <PiggyBank className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold text-emerald-600">{formatCurrency(potentialProfit)}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Venda - Custo
          </p>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Margem Média</h3>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">{averageMargin.toFixed(2)}%</div>
          <p className="text-xs text-muted-foreground mt-1">
            Lucro sobre venda
          </p>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Preço Venda</TableHead>
              <TableHead>Custo</TableHead>
              <TableHead>Estoque</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">Nenhum produto encontrado.</TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product) => {
                const category = categories.find(c => c.id === product.categoryId);
                return (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        {product.images && product.images.length > 0 ? (
                          <img src={product.images[0]} alt={product.name} className="w-10 h-10 rounded-md object-cover border" />
                        ) : (
                          <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center border">
                            <PackagePlus className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        {product.name}
                      </div>
                    </TableCell>
                    <TableCell>{category?.name || 'Sem Categoria'}</TableCell>
                    <TableCell>{formatCurrency(product.price)}</TableCell>
                    <TableCell>{product.costPrice ? `${formatCurrency(product.costPrice)}` : '-'}</TableCell>
                    <TableCell>{product.stock}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenStockDialog(product)} title="Registrar Entrada">
                        <PackagePlus className="h-4 w-4 text-emerald-500" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(product)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(product.id)}>
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Descrição</Label>
              <Input id="description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">Categoria</Label>
              <Select value={formData.categoryId} onValueChange={val => setFormData({...formData, categoryId: val})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="price">Preço Venda (R$)</Label>
                <Input id="price" type="number" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="costPrice">Preço Custo (R$)</Label>
                <Input id="costPrice" type="number" step="0.01" value={formData.costPrice} onChange={e => setFormData({...formData, costPrice: e.target.value})} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="stock">Estoque</Label>
                <Input id="stock" type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} required />
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label>Imagens do Produto (Máx 5)</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.images.map((img, index) => (
                  <div key={index} className="relative group w-20 h-20 border rounded-md overflow-hidden">
                    <img src={img} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {formData.images.length < 5 && (
                  <label className="w-20 h-20 border-2 border-dashed rounded-md flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors">
                    <ImagePlus className="w-6 h-6 text-muted-foreground mb-1" />
                    <span className="text-[10px] text-muted-foreground">Adicionar</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      multiple 
                      className="hidden" 
                      onChange={handleImageUpload} 
                    />
                  </label>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button type="submit">{editingProduct ? 'Salvar' : 'Adicionar'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isStockDialogOpen} onOpenChange={setIsStockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Entrada de Estoque</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleStockSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label>Produto</Label>
              <Input value={stockProduct?.name || ''} disabled />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="quantity">Quantidade Adicionada</Label>
                <Input id="quantity" type="number" min="1" value={stockData.quantity} onChange={e => {
                  const qty = e.target.value;
                  setStockData(prev => ({
                    ...prev, 
                    quantity: qty,
                    totalCost: stockProduct?.costPrice ? (parseInt(qty || '0', 10) * stockProduct.costPrice).toFixed(2) : prev.totalCost
                  }));
                }} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="totalCost">Custo Total (R$)</Label>
                <Input id="totalCost" type="number" step="0.01" min="0" value={stockData.totalCost} onChange={e => setStockData({...stockData, totalCost: e.target.value})} />
                <span className="text-xs text-muted-foreground">Isso gerará uma despesa no Fluxo de Caixa.</span>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Registrar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
