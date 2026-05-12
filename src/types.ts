export type Category = {
  id: string;
  name: string;
  description: string;
};

export type SalesChannel = {
  id: string;
  name: string;
  description: string;
};

export type PaymentMethod = {
  id: string;
  name: string;
  feePercentage: number;
  feeFixed: number;
};

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  costPrice?: number;
  stock: number;
  categoryId: string;
  images?: string[];
};

export type Client = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
};

export type Supplier = {
  id: string;
  name: string;
  email: string;
  phone: string;
  document: string; // CNPJ or CPF
  address: string;
};

export type OrderItem = {
  productId: string;
  quantity: number;
  price: number;
};

export type Order = {
  id: string;
  clientId: string;
  channelId: string;
  paymentMethodId: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'completed' | 'cancelled';
  date: string;
};

export type Transaction = {
  id: string;
  type: 'income' | 'expense';
  category: 'sale' | 'inventory' | 'operational' | 'adjustment' | 'taxes' | 'payroll' | 'other';
  amount: number;
  description: string;
  date: string;
  referenceId?: string; // e.g., orderId, productId
};

export type Receivable = {
  id: string;
  description: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'paid' | 'cancelled';
  clientId?: string;
  orderId?: string;
  paymentDate?: string;
};

export type Payable = {
  id: string;
  description: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'paid' | 'cancelled';
  category: 'operational' | 'inventory' | 'taxes' | 'payroll' | 'other';
  paymentDate?: string;
};
