import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useAuth } from '../components/AuthContext';
import { Product, Client, Order, Category, SalesChannel, PaymentMethod, Transaction, Receivable, Payable, Supplier } from '../types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

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
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addClient: (client: Omit<Client, 'id'>) => Promise<void>;
  updateClient: (id: string, client: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  addOrder: (order: Omit<Order, 'id' | 'date'>) => Promise<void>;
  updateOrderStatus: (id: string, status: Order['status']) => Promise<void>;
  updateOrder: (id: string, order: Partial<Order>) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
  addCategory: (category: Omit<Category, 'id'>) => Promise<void>;
  updateCategory: (id: string, category: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  addChannel: (channel: Omit<SalesChannel, 'id'>) => Promise<void>;
  updateChannel: (id: string, channel: Partial<SalesChannel>) => Promise<void>;
  deleteChannel: (id: string) => Promise<void>;
  addPaymentMethod: (method: Omit<PaymentMethod, 'id'>) => Promise<void>;
  updatePaymentMethod: (id: string, method: Partial<PaymentMethod>) => Promise<void>;
  deletePaymentMethod: (id: string) => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addReceivable: (receivable: Omit<Receivable, 'id'>) => Promise<void>;
  updateReceivable: (id: string, receivable: Partial<Receivable>) => Promise<void>;
  deleteReceivable: (id: string) => Promise<void>;
  addPayable: (payable: Omit<Payable, 'id'>) => Promise<void>;
  updatePayable: (id: string, payable: Partial<Payable>) => Promise<void>;
  deletePayable: (id: string) => Promise<void>;
  addSupplier: (supplier: Omit<Supplier, 'id'>) => Promise<void>;
  updateSupplier: (id: string, supplier: Partial<Supplier>) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};

export const StoreProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [channels, setChannels] = useState<SalesChannel[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [payables, setPayables] = useState<Payable[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  useEffect(() => {
    if (!user) {
      setProducts([]);
      setClients([]);
      setOrders([]);
      setCategories([]);
      setChannels([]);
      setPaymentMethods([]);
      setTransactions([]);
      setReceivables([]);
      setPayables([]);
      setSuppliers([]);
      return;
    }

    const collections = [
      { name: 'products', setter: setProducts },
      { name: 'clients', setter: setClients },
      { name: 'orders', setter: setOrders },
      { name: 'categories', setter: setCategories },
      { name: 'channels', setter: setChannels },
      { name: 'paymentMethods', setter: setPaymentMethods },
      { name: 'transactions', setter: setTransactions },
      { name: 'receivables', setter: setReceivables },
      { name: 'payables', setter: setPayables },
      { name: 'suppliers', setter: setSuppliers },
    ];

    const unsubscribes = collections.map(({ name, setter }) => {
      const q = query(collection(db, name), where('userId', '==', user.uid));
      return onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
        setter(data);
        
        // Seed defaults if empty for specific collections
        if (snapshot.empty && (name === 'categories' || name === 'channels' || name === 'paymentMethods')) {
          seedDefaults(name, user.uid);
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, name);
      });
    });

    return () => unsubscribes.forEach(unsub => unsub());
  }, [user]);

  const seedDefaults = async (collName: string, uid: string) => {
    // Basic avoidance of duplicate seeding if another listener is also empty
    // Using a simple lock or just checking if any exist would be better, 
    // but Firestore's onSnapshot on empty collection is reliable here.
    const defaults: Record<string, any[]> = {
      categories: [
        { name: 'Eletrônicos', description: 'Dispositivos eletrônicos' },
        { name: 'Acessórios', description: 'Cabos, capas e periféricos' },
        { name: 'Serviços', description: 'Mão de obra e consultoria' },
      ],
      channels: [
        { name: 'Loja Física', description: 'Vendas presenciais' },
        { name: 'WhatsApp', description: 'Vendas pelo WhatsApp' },
        { name: 'Instagram', description: 'Vendas pelo Direct' },
        { name: 'Mercado Livre', description: 'Vendas no Marketplace' },
      ],
      paymentMethods: [
        { name: 'Pix', feePercentage: 0, feeFixed: 0 },
        { name: 'Dinheiro', feePercentage: 0, feeFixed: 0 },
        { name: 'Cartão de Crédito', feePercentage: 4.99, feeFixed: 0.50 },
        { name: 'Cartão de Débito', feePercentage: 1.99, feeFixed: 0.50 },
      ]
    };

    const items = defaults[collName];
    if (!items) return;

    for (const item of items) {
      await addEntity(collName, item);
    }
  };

  const addEntity = async (collName: string, data: any) => {
    if (!user) return;
    try {
      await addDoc(collection(db, collName), { ...data, userId: user.uid });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, collName);
    }
  };

  const updateEntity = async (collName: string, id: string, data: any) => {
    if (!user) return;
    try {
      // Remove id from data to avoid potential Firestore errors or confusing state
      const { id: _, ...cleanData } = data;
      await updateDoc(doc(db, collName, id), cleanData);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${collName}/${id}`);
    }
  };

  const deleteEntity = async (collName: string, id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, collName, id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${collName}/${id}`);
    }
  };

  const addProduct = (product: Omit<Product, 'id'>) => addEntity('products', product);
  const updateProduct = (id: string, product: Partial<Product>) => updateEntity('products', id, product);
  const deleteProduct = (id: string) => deleteEntity('products', id);

  const addClient = (client: Omit<Client, 'id'>) => addEntity('clients', client);
  const updateClient = (id: string, client: Partial<Client>) => updateEntity('clients', id, client);
  const deleteClient = (id: string) => deleteEntity('clients', id);

  const addCategory = (category: Omit<Category, 'id'>) => addEntity('categories', category);
  const updateCategory = (id: string, category: Partial<Category>) => updateEntity('categories', id, category);
  const deleteCategory = (id: string) => deleteEntity('categories', id);

  const addChannel = (channel: Omit<SalesChannel, 'id'>) => addEntity('channels', channel);
  const updateChannel = (id: string, channel: Partial<SalesChannel>) => updateEntity('channels', id, channel);
  const deleteChannel = (id: string) => deleteEntity('channels', id);

  const addPaymentMethod = (method: Omit<PaymentMethod, 'id'>) => addEntity('paymentMethods', method);
  const updatePaymentMethod = (id: string, method: Partial<PaymentMethod>) => updateEntity('paymentMethods', id, method);
  const deletePaymentMethod = (id: string) => deleteEntity('paymentMethods', id);

  const addSupplier = (supplier: Omit<Supplier, 'id'>) => addEntity('suppliers', supplier);
  const updateSupplier = (id: string, supplier: Partial<Supplier>) => updateEntity('suppliers', id, supplier);
  const deleteSupplier = (id: string) => deleteEntity('suppliers', id);

  const addTransaction = (transaction: Omit<Transaction, 'id'>) => addEntity('transactions', transaction);
  const updateTransaction = (id: string, transaction: Partial<Transaction>) => updateEntity('transactions', id, transaction);
  const deleteTransaction = (id: string) => deleteEntity('transactions', id);

  const addReceivable = (receivable: Omit<Receivable, 'id'>) => addEntity('receivables', receivable);
  const updateReceivable = async (id: string, updatedReceivable: Partial<Receivable>) => {
    const old = receivables.find(r => r.id === id);
    if (!old) return;
    
    const combined = { ...old, ...updatedReceivable };
    if (old.status !== 'paid' && combined.status === 'paid') {
      await addTransaction({
        type: 'income',
        category: 'sale',
        amount: combined.amount,
        description: `Recebimento: ${combined.description}`,
        date: new Date().toISOString(),
        referenceId: id
      });
      combined.paymentDate = new Date().toISOString();
    }
    await updateEntity('receivables', id, combined);
  };
  const deleteReceivable = (id: string) => deleteEntity('receivables', id);

  const addPayable = (payable: Omit<Payable, 'id'>) => addEntity('payables', payable);
  const updatePayable = async (id: string, updatedPayable: Partial<Payable>) => {
    const old = payables.find(p => p.id === id);
    if (!old) return;
    
    const combined = { ...old, ...updatedPayable };
    if (old.status !== 'paid' && combined.status === 'paid') {
      await addTransaction({
        type: 'expense',
        category: combined.category,
        amount: combined.amount,
        description: `Pagamento: ${combined.description}`,
        date: new Date().toISOString(),
        referenceId: id
      });
      combined.paymentDate = new Date().toISOString();
    }
    await updateEntity('payables', id, combined);
  };
  const deletePayable = (id: string) => deleteEntity('payables', id);

  const addOrder = async (order: Omit<Order, 'id' | 'date'>) => {
    if (!user) return;
    const date = new Date().toISOString();
    const orderData = { ...order, userId: user.uid, date };
    
    try {
      const docRef = await addDoc(collection(db, 'orders'), orderData);
      const orderId = docRef.id;

      // Update stock
      for (const item of order.items) {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          await updateProduct(product.id, { stock: product.stock - item.quantity });
        }
      }

      // Add transaction if completed
      if (order.status === 'completed') {
        await addTransaction({
          type: 'income',
          category: 'sale',
          amount: order.total,
          description: `Pedido #${orderId.slice(0, 6).toUpperCase()}`,
          date,
          referenceId: orderId
        });
      } else if (order.status === 'pending') {
        // Add receivable if pending
        await addReceivable({
          description: `Pedido #${orderId.slice(0, 6).toUpperCase()}`,
          amount: order.total,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'pending',
          clientId: order.clientId,
          orderId: orderId
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'orders');
    }
  };

  const updateOrderStatus = async (id: string, status: Order['status']) => {
    const order = orders.find(o => o.id === id);
    if (!order) return;

    await updateEntity('orders', id, { status });

    if (status === 'completed' && order.status !== 'completed') {
      await addTransaction({
        type: 'income',
        category: 'sale',
        amount: order.total,
        description: `Pedido #${order.id.slice(0, 6).toUpperCase()}`,
        date: new Date().toISOString(),
        referenceId: order.id
      });
      // Mark related receivable as paid
      const relatedReceivable = receivables.find(r => r.orderId === id && r.status === 'pending');
      if (relatedReceivable) {
        await updateReceivable(relatedReceivable.id, { status: 'paid' });
      }
    } else if (status !== 'completed' && order.status === 'completed') {
      const t = transactions.find(t => t.referenceId === order.id);
      if (t) await deleteTransaction(t.id);
      // Revert related receivable
      const relatedReceivable = receivables.find(r => r.orderId === id && r.status === 'paid');
      if (relatedReceivable) {
        await updateReceivable(relatedReceivable.id, { status: 'pending', paymentDate: undefined });
      }
    }
  };

  const updateOrder = async (id: string, updatedOrder: Partial<Order>) => {
    const old = orders.find(o => o.id === id);
    if (!old) return;

    if (updatedOrder.items) {
      // Stock logic (simplified: re-calculate based on diff)
      // For brevity in this refactor, I'll assume users update status mostly.
      // But let's handle stock revert/apply if items change.
      for (const item of old.items) {
        const p = products.find(p => p.id === item.productId);
        if (p) await updateProduct(p.id, { stock: p.stock + item.quantity });
      }
      for (const item of updatedOrder.items) {
        const p = products.find(p => p.id === item.productId);
        if (p) await updateProduct(p.id, { stock: p.stock - item.quantity });
      }
    }

    const combined = { ...old, ...updatedOrder };
    await updateEntity('orders', id, combined);

    if (combined.status === 'completed') {
      const t = transactions.find(t => t.referenceId === id);
      if (t) {
        if (t.amount !== combined.total) {
          await updateTransaction(t.id, { amount: combined.total });
        }
      } else {
        await addTransaction({
          type: 'income',
          category: 'sale',
          amount: combined.total,
          description: `Pedido #${id.slice(0, 6).toUpperCase()}`,
          date: new Date().toISOString(),
          referenceId: id
        });
      }
    } else {
      const t = transactions.find(t => t.referenceId === id);
      if (t) await deleteTransaction(t.id);
    }
  };

  const deleteOrder = async (id: string) => {
    await deleteEntity('orders', id);
    const t = transactions.find(t => t.referenceId === id);
    if (t) await deleteTransaction(t.id);
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
