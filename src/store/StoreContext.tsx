import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product, Client, Order, Category, SalesChannel, PaymentMethod, Transaction, Receivable, Payable, Supplier } from '../types';

interface StoreContextType {
  products: Product[];
  clients: Client[];
  orders: Order[];
  categories: Category[];
  channels: SalesChannel[];
  paymentMethods: PaymentMethod[];
  transactions: Transaction[];
  receivables: Receivable[];
  payables: Payable[];
  suppliers: Supplier[];
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  addClient: (client: Omit<Client, 'id'>) => void;
  updateClient: (id: string, client: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  addOrder: (order: Omit<Order, 'id' | 'date'>) => void;
  updateOrderStatus: (id: string, status: Order['status']) => void;
  updateOrder: (id: string, order: Partial<Order>) => void;
  deleteOrder: (id: string) => void;
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, category: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  addChannel: (channel: Omit<SalesChannel, 'id'>) => void;
  updateChannel: (id: string, channel: Partial<SalesChannel>) => void;
  deleteChannel: (id: string) => void;
  addPaymentMethod: (method: Omit<PaymentMethod, 'id'>) => void;
  updatePaymentMethod: (id: string, method: Partial<PaymentMethod>) => void;
  deletePaymentMethod: (id: string) => void;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  addReceivable: (receivable: Omit<Receivable, 'id'>) => void;
  updateReceivable: (id: string, receivable: Partial<Receivable>) => void;
  deleteReceivable: (id: string) => void;
  addPayable: (payable: Omit<Payable, 'id'>) => void;
  updatePayable: (id: string, payable: Partial<Payable>) => void;
  deletePayable: (id: string) => void;
  addSupplier: (supplier: Omit<Supplier, 'id'>) => void;
  updateSupplier: (id: string, supplier: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};

const generateId = () => Math.random().toString(36).substr(2, 9);

export const StoreProvider = ({ children }: { children: ReactNode }) => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(() => {
    const saved = localStorage.getItem('vendamax_payment_methods');
    return saved ? JSON.parse(saved) : [
      { id: 'pm1', name: 'Pix', feePercentage: 0, feeFixed: 0 },
      { id: 'pm2', name: 'Boleto', feePercentage: 0, feeFixed: 3.50 },
      { id: 'pm3', name: 'Dinheiro', feePercentage: 0, feeFixed: 0 },
      { id: 'pm4', name: 'Cartão de Crédito', feePercentage: 4.99, feeFixed: 0.50 },
      { id: 'pm5', name: 'Cartão de Débito', feePercentage: 1.99, feeFixed: 0.50 },
    ];
  });

  const [channels, setChannels] = useState<SalesChannel[]>(() => {
    const saved = localStorage.getItem('vendamax_channels');
    return saved ? JSON.parse(saved) : [
      { id: 'ch1', name: 'Loja Física', description: 'Vendas presenciais' },
      { id: 'ch2', name: 'WhatsApp', description: 'Vendas pelo WhatsApp' },
      { id: 'ch3', name: 'Instagram', description: 'Vendas pelo Direct/Loja do Instagram' },
      { id: 'ch4', name: 'Marketplace (Facebook)', description: 'Facebook Marketplace' },
      { id: 'ch5', name: 'Coolcase', description: 'Plataforma Coolcase' },
    ];
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('vendamax_categories');
    return saved ? JSON.parse(saved) : [
      { id: 'cat1', name: 'Eletrônicos', description: 'Dispositivos eletrônicos em geral' },
      { id: 'cat2', name: 'Acessórios', description: 'Acessórios para computadores e celulares' },
    ];
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('vendamax_products');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.map((p: any) => ({
        ...p,
        categoryId: p.categoryId || (p.category === 'Electronics' ? 'cat1' : 'cat2')
      }));
    }
    return [
      { id: 'p1', name: 'Notebook Pro', description: 'High performance laptop', price: 4500, stock: 10, categoryId: 'cat1' },
      { id: 'p2', name: 'Wireless Mouse', description: 'Ergonomic mouse', price: 150, stock: 50, categoryId: 'cat2' },
    ];
  });

  const [clients, setClients] = useState<Client[]>(() => {
    const saved = localStorage.getItem('vendamax_clients');
    return saved ? JSON.parse(saved) : [
      { id: 'c1', name: 'João Silva', email: 'joao@example.com', phone: '(11) 99999-9999', address: 'Rua A, 123' },
      { id: 'c2', name: 'Maria Souza', email: 'maria@example.com', phone: '(11) 88888-8888', address: 'Avenida B, 456' },
    ];
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('vendamax_orders');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.map((o: any) => ({
        ...o,
        channelId: o.channelId || 'ch1',
        paymentMethodId: o.paymentMethodId || 'pm1'
      }));
    }
    return [
      { id: 'o1', clientId: 'c1', channelId: 'ch1', paymentMethodId: 'pm1', items: [{ productId: 'p1', quantity: 1, price: 4500 }], total: 4500, status: 'completed', date: new Date().toISOString() },
    ];
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('vendamax_transactions');
    if (saved) {
      return JSON.parse(saved);
    }
    return [
      { id: 't1', type: 'income', category: 'sale', amount: 4500, description: 'Pedido #O1', date: new Date().toISOString(), referenceId: 'o1' }
    ];
  });

  const [receivables, setReceivables] = useState<Receivable[]>(() => {
    const saved = localStorage.getItem('vendamax_receivables');
    if (saved) {
      return JSON.parse(saved);
    }
    return [];
  });

  const [payables, setPayables] = useState<Payable[]>(() => {
    const saved = localStorage.getItem('vendamax_payables');
    if (saved) {
      return JSON.parse(saved);
    }
    return [];
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem('vendamax_suppliers');
    if (saved) {
      return JSON.parse(saved);
    }
    return [
      { id: 's1', name: 'Fornecedor Exemplo', email: 'contato@fornecedor.com', phone: '(11) 3333-3333', document: '00.000.000/0001-00', address: 'Rua das Indústrias, 1000' }
    ];
  });

  useEffect(() => {
    localStorage.setItem('vendamax_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('vendamax_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('vendamax_channels', JSON.stringify(channels));
  }, [channels]);

  useEffect(() => {
    localStorage.setItem('vendamax_payment_methods', JSON.stringify(paymentMethods));
  }, [paymentMethods]);

  useEffect(() => {
    localStorage.setItem('vendamax_clients', JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem('vendamax_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('vendamax_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('vendamax_receivables', JSON.stringify(receivables));
  }, [receivables]);

  useEffect(() => {
    localStorage.setItem('vendamax_payables', JSON.stringify(payables));
  }, [payables]);

  useEffect(() => {
    localStorage.setItem('vendamax_suppliers', JSON.stringify(suppliers));
  }, [suppliers]);

  const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
    setTransactions(prev => [...prev, { ...transaction, id: generateId() }]);
  };

  const updateTransaction = (id: string, updatedTransaction: Partial<Transaction>) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updatedTransaction } : t));
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const addReceivable = (receivable: Omit<Receivable, 'id'>) => {
    setReceivables(prev => [...prev, { ...receivable, id: generateId() }]);
  };

  const updateReceivable = (id: string, updatedReceivable: Partial<Receivable>) => {
    setReceivables(prev => {
      const oldReceivable = prev.find(r => r.id === id);
      if (!oldReceivable) return prev;
      
      const newReceivable = { ...oldReceivable, ...updatedReceivable };
      
      // If status changed to paid, add a transaction
      if (oldReceivable.status !== 'paid' && newReceivable.status === 'paid') {
        addTransaction({
          type: 'income',
          category: 'sale',
          amount: newReceivable.amount,
          description: `Recebimento: ${newReceivable.description}`,
          date: new Date().toISOString(),
          referenceId: newReceivable.id
        });
        newReceivable.paymentDate = new Date().toISOString();
      }
      
      return prev.map(r => r.id === id ? newReceivable : r);
    });
  };

  const deleteReceivable = (id: string) => {
    setReceivables(prev => prev.filter(r => r.id !== id));
  };

  const addPayable = (payable: Omit<Payable, 'id'>) => {
    setPayables(prev => [...prev, { ...payable, id: generateId() }]);
  };

  const updatePayable = (id: string, updatedPayable: Partial<Payable>) => {
    setPayables(prev => {
      const oldPayable = prev.find(p => p.id === id);
      if (!oldPayable) return prev;
      
      const newPayable = { ...oldPayable, ...updatedPayable };
      
      // If status changed to paid, add a transaction
      if (oldPayable.status !== 'paid' && newPayable.status === 'paid') {
        addTransaction({
          type: 'expense',
          category: newPayable.category,
          amount: newPayable.amount,
          description: `Pagamento: ${newPayable.description}`,
          date: new Date().toISOString(),
          referenceId: newPayable.id
        });
        newPayable.paymentDate = new Date().toISOString();
      }
      
      return prev.map(p => p.id === id ? newPayable : p);
    });
  };

  const deletePayable = (id: string) => {
    setPayables(prev => prev.filter(p => p.id !== id));
  };

  const addProduct = (product: Omit<Product, 'id'>) => {
    setProducts([...products, { ...product, id: generateId() }]);
  };

  const updateProduct = (id: string, updatedProduct: Partial<Product>) => {
    setProducts(products.map(p => p.id === id ? { ...p, ...updatedProduct } : p));
  };

  const deleteProduct = (id: string) => {
    setProducts(products.filter(p => p.id !== id));
  };

  const addClient = (client: Omit<Client, 'id'>) => {
    setClients([...clients, { ...client, id: generateId() }]);
  };

  const updateClient = (id: string, updatedClient: Partial<Client>) => {
    setClients(clients.map(c => c.id === id ? { ...c, ...updatedClient } : c));
  };

  const deleteClient = (id: string) => {
    setClients(clients.filter(c => c.id !== id));
  };

  const addOrder = (order: Omit<Order, 'id' | 'date'>) => {
    const newOrder: Order = {
      ...order,
      id: generateId(),
      date: new Date().toISOString(),
    };
    setOrders([...orders, newOrder]);
    
    // Update stock
    const updatedProducts = [...products];
    order.items.forEach(item => {
      const productIndex = updatedProducts.findIndex(p => p.id === item.productId);
      if (productIndex !== -1) {
        updatedProducts[productIndex] = {
          ...updatedProducts[productIndex],
          stock: updatedProducts[productIndex].stock - item.quantity
        };
      }
    });
    setProducts(updatedProducts);

    // Add transaction if completed
    if (newOrder.status === 'completed') {
      setTransactions(prev => [...prev, {
        id: generateId(),
        type: 'income',
        category: 'sale',
        amount: newOrder.total,
        description: `Pedido #${newOrder.id.slice(0, 6).toUpperCase()}`,
        date: newOrder.date,
        referenceId: newOrder.id
      }]);
    } else if (newOrder.status === 'pending') {
      // Add receivable if pending
      setReceivables(prev => [...prev, {
        id: generateId(),
        description: `Pedido #${newOrder.id.slice(0, 6).toUpperCase()}`,
        amount: newOrder.total,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
        status: 'pending',
        clientId: newOrder.clientId,
        orderId: newOrder.id
      }]);
    }
  };

  const updateOrderStatus = (id: string, status: Order['status']) => {
    const order = orders.find(o => o.id === id);
    if (!order) return;

    setOrders(orders.map(o => o.id === id ? { ...o, status } : o));

    // Handle transaction logic
    if (status === 'completed' && order.status !== 'completed') {
      setTransactions(prev => [...prev, {
        id: generateId(),
        type: 'income',
        category: 'sale',
        amount: order.total,
        description: `Pedido #${order.id.slice(0, 6).toUpperCase()}`,
        date: new Date().toISOString(),
        referenceId: order.id
      }]);
      // Mark related receivable as paid
      setReceivables(prev => prev.map(r => r.orderId === id && r.status === 'pending' ? { ...r, status: 'paid', paymentDate: new Date().toISOString() } : r));
    } else if (status !== 'completed' && order.status === 'completed') {
      setTransactions(prev => prev.filter(t => t.referenceId !== order.id));
      // Revert related receivable
      setReceivables(prev => prev.map(r => r.orderId === id && r.status === 'paid' ? { ...r, status: 'pending', paymentDate: undefined } : r));
    }
  };

  const updateOrder = (id: string, updatedOrder: Partial<Order>) => {
    const oldOrder = orders.find(o => o.id === id);
    if (!oldOrder) return;

    if (updatedOrder.items) {
      const updatedProducts = [...products];
      
      // Revert old stock
      oldOrder.items.forEach(item => {
        const productIndex = updatedProducts.findIndex(p => p.id === item.productId);
        if (productIndex !== -1) {
          updatedProducts[productIndex] = {
            ...updatedProducts[productIndex],
            stock: updatedProducts[productIndex].stock + item.quantity
          };
        }
      });
      
      // Apply new stock
      updatedOrder.items.forEach(item => {
        const productIndex = updatedProducts.findIndex(p => p.id === item.productId);
        if (productIndex !== -1) {
          updatedProducts[productIndex] = {
            ...updatedProducts[productIndex],
            stock: updatedProducts[productIndex].stock - item.quantity
          };
        }
      });
      
      setProducts(updatedProducts);
    }

    const newOrder = { ...oldOrder, ...updatedOrder };
    setOrders(orders.map(o => o.id === id ? newOrder : o));

    // Handle transaction logic
    if (newOrder.status === 'completed') {
      const existingTransaction = transactions.find(t => t.referenceId === id);
      if (existingTransaction) {
        if (existingTransaction.amount !== newOrder.total) {
          updateTransaction(existingTransaction.id, { amount: newOrder.total });
        }
      } else {
        addTransaction({
          type: 'income',
          category: 'sale',
          amount: newOrder.total,
          description: `Pedido #${newOrder.id.slice(0, 6).toUpperCase()}`,
          date: new Date().toISOString(),
          referenceId: newOrder.id
        });
      }
    } else {
      const existingTransaction = transactions.find(t => t.referenceId === id);
      if (existingTransaction) {
        deleteTransaction(existingTransaction.id);
      }
    }
  };

  const deleteOrder = (id: string) => {
    setOrders(orders.filter(o => o.id !== id));
    const existingTransaction = transactions.find(t => t.referenceId === id);
    if (existingTransaction) {
      deleteTransaction(existingTransaction.id);
    }
  };

  const addCategory = (category: Omit<Category, 'id'>) => {
    setCategories([...categories, { ...category, id: generateId() }]);
  };

  const updateCategory = (id: string, updatedCategory: Partial<Category>) => {
    setCategories(categories.map(c => c.id === id ? { ...c, ...updatedCategory } : c));
  };

  const deleteCategory = (id: string) => {
    setCategories(categories.filter(c => c.id !== id));
  };

  const addChannel = (channel: Omit<SalesChannel, 'id'>) => {
    setChannels([...channels, { ...channel, id: generateId() }]);
  };

  const updateChannel = (id: string, updatedChannel: Partial<SalesChannel>) => {
    setChannels(channels.map(c => c.id === id ? { ...c, ...updatedChannel } : c));
  };

  const deleteChannel = (id: string) => {
    setChannels(channels.filter(c => c.id !== id));
  };

  const addPaymentMethod = (method: Omit<PaymentMethod, 'id'>) => {
    setPaymentMethods([...paymentMethods, { ...method, id: generateId() }]);
  };

  const updatePaymentMethod = (id: string, updatedMethod: Partial<PaymentMethod>) => {
    setPaymentMethods(paymentMethods.map(pm => pm.id === id ? { ...pm, ...updatedMethod } : pm));
  };

  const deletePaymentMethod = (id: string) => {
    setPaymentMethods(paymentMethods.filter(pm => pm.id !== id));
  };

  const addSupplier = (supplier: Omit<Supplier, 'id'>) => {
    setSuppliers([...suppliers, { ...supplier, id: generateId() }]);
  };

  const updateSupplier = (id: string, updatedSupplier: Partial<Supplier>) => {
    setSuppliers(suppliers.map(s => s.id === id ? { ...s, ...updatedSupplier } : s));
  };

  const deleteSupplier = (id: string) => {
    setSuppliers(suppliers.filter(s => s.id !== id));
  };

  return (
    <StoreContext.Provider value={{
      products, clients, orders, categories, channels, paymentMethods, transactions, receivables, payables, suppliers,
      addProduct, updateProduct, deleteProduct,
      addClient, updateClient, deleteClient,
      addOrder, updateOrderStatus, updateOrder, deleteOrder,
      addCategory, updateCategory, deleteCategory,
      addChannel, updateChannel, deleteChannel,
      addPaymentMethod, updatePaymentMethod, deletePaymentMethod,
      addTransaction, updateTransaction, deleteTransaction,
      addReceivable, updateReceivable, deleteReceivable,
      addPayable, updatePayable, deletePayable,
      addSupplier, updateSupplier, deleteSupplier
    }}>
      {children}
    </StoreContext.Provider>
  );
};
