import { Product, Customer, Invoice, ShopSettings, User, DashboardMetrics, KhataTransaction } from '../types';

const BASE_URL = '/api';

export function getToken(): string | null {
  return localStorage.getItem('gt_auth_token');
}

export function setToken(token: string) {
  localStorage.setItem('gt_auth_token', token);
}

export function clearToken() {
  localStorage.removeItem('gt_auth_token');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    cache: 'no-store',
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }

  return data as T;
}

export const api = {
  // Auth
  login: (credentials: { username: string; password: string }) =>
    request<{ success: boolean; token: string; user: User; message: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  getMe: () =>
    request<{ success: boolean; user: User }>('/auth/me'),

  changePassword: (data: { current_password: string; new_password: string }) =>
    request<{ success: boolean; message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getUsers: () =>
    request<{ success: boolean; users: User[] }>('/auth/users'),

  createUser: (data: { username: string; password: string; full_name: string; role: 'admin' | 'cashier'; phone?: string; email?: string }) =>
    request<{ success: boolean; message: string; user_id: string }>('/auth/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateUser: (
    userId: string,
    data: { username?: string; full_name?: string; phone?: string; email?: string; role?: 'admin' | 'cashier'; is_active?: boolean; new_password?: string }
  ) =>
    request<{ success: boolean; message: string; user: User }>(`/auth/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Products
  getProducts: (params?: { category?: string; search?: string; active_only?: boolean; low_stock?: boolean }) => {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.search) query.set('search', params.search);
    if (params?.active_only !== undefined) query.set('active_only', String(params.active_only));
    if (params?.low_stock) query.set('low_stock', 'true');
    return request<{ success: boolean; count: number; products: Product[] }>(`/products?${query.toString()}`);
  },

  getCategories: () =>
    request<{ success: boolean; categories: string[] }>('/products/categories'),

  getUnits: () =>
    request<{ success: boolean; units: string[] }>('/products/units'),

  createProduct: (productData: Partial<Product>) =>
    request<{ success: boolean; message: string; product: Product }>('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    }),

  updateProduct: (id: string, productData: Partial<Product>) =>
    request<{ success: boolean; message: string; product: Product }>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    }),

  adjustStock: (id: string, quantity_change: number, reason: string) =>
    request<{ success: boolean; message: string; new_stock: number }>(`/products/${id}/stock`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity_change, reason }),
    }),

  deleteProduct: (id: string) =>
    request<{ success: boolean; message: string }>(`/products/${id}`, {
      method: 'DELETE',
    }),

  // Billing
  calculateBill: (data: any) =>
    request<{ success: boolean; calculation: any }>('/billing/calculate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  createInvoice: (invoiceData: any) =>
    request<{ success: boolean; message: string; invoice: Invoice }>('/billing/create-invoice', {
      method: 'POST',
      body: JSON.stringify(invoiceData),
    }),

  // Invoices
  getInvoices: (params?: { search?: string; payment_status?: string; date_filter?: string; from_date?: string; to_date?: string }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.payment_status) query.set('payment_status', params.payment_status);
    if (params?.date_filter) query.set('date_filter', params.date_filter);
    if (params?.from_date) query.set('from_date', params.from_date);
    if (params?.to_date) query.set('to_date', params.to_date);
    return request<{ success: boolean; count: number; invoices: Invoice[] }>(`/invoices?${query.toString()}`);
  },

  getInvoice: (idOrNumber: string) =>
    request<{ success: boolean; invoice: Invoice }>(`/invoices/${idOrNumber}`),

  updateInvoicePayment: (idOrNumber: string, data: { amount_received: number; payment_mode: string; notes?: string }) =>
    request<{ success: boolean; message: string; invoice: Invoice }>(`/invoices/${idOrNumber}/payment`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  getPublicInvoice: (token: string) =>
    request<{ success: boolean; invoice: Invoice }>(`/invoices/public/${token}`),

  // Customers & Khata Ledger
  getCustomers: (params?: { search?: string; filter?: string; has_due?: boolean }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.filter) query.set('filter', params.filter);
    if (params?.has_due) query.set('has_due', 'true');
    return request<{
      success: boolean;
      count: number;
      customers: Customer[];
      stats?: {
        total_due: number;
        total_advance: number;
        total_customers: number;
        due_accounts_count: number;
        total_purchases: number;
      };
    }>(`/customers?${query.toString()}`);
  },

  getCustomerLedger: (phoneOrId: string) =>
    request<{
      success: boolean;
      customer: Customer;
      invoices: Invoice[];
      transactions?: KhataTransaction[];
      invoice_count: number;
      transaction_count?: number;
    }>(`/customers/${phoneOrId}`),

  getCustomerStatement: (phoneOrId: string) =>
    request<{
      success: boolean;
      customer: Customer;
      entries: any[];
      settings?: any;
      total_billed: number;
      total_paid: number;
      net_due: number;
    }>(`/customers/${phoneOrId}/statement`),

  createCustomer: (customerData: Partial<Customer>) =>
    request<{ success: boolean; message: string; customer: Customer }>('/customers', {
      method: 'POST',
      body: JSON.stringify(customerData),
    }),

  updateCustomer: (phoneOrId: string, customerData: Partial<Customer>) =>
    request<{ success: boolean; message: string; customer: Customer }>(`/customers/${phoneOrId}`, {
      method: 'PUT',
      body: JSON.stringify(customerData),
    }),

  deleteCustomer: (phoneOrId: string) =>
    request<{ success: boolean; message: string }>(`/customers/${phoneOrId}`, {
      method: 'DELETE',
    }),

  recordKhataTransaction: (
    phoneOrId: string,
    data: {
      type: 'PAYMENT' | 'DEBIT';
      amount: number;
      payment_mode?: string;
      reference?: string;
      notes?: string;
      date?: string;
    }
  ) =>
    request<{
      success: boolean;
      message: string;
      transaction: KhataTransaction;
      customer: Customer;
    }>(`/customers/${phoneOrId}/transactions`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  saveCustomer: (customerData: Partial<Customer>) =>
    request<{ success: boolean; message: string; customer: Customer }>('/customers', {
      method: 'POST',
      body: JSON.stringify(customerData),
    }),

  // Reports
  getDashboardMetrics: () =>
    request<{
      success: boolean;
      metrics: DashboardMetrics;
      recent_invoices: Invoice[];
      category_sales: { category: string; revenue: number; percentage: number }[];
      top_products: { name: string; revenue: number; quantity: number }[];
      sales_trend_7d: { date: string; sales: number; count: number }[];
      payment_mode_split: { mode: string; amount: number; percentage: number }[];
    }>('/reports/dashboard'),

  // Settings
  getSettings: () =>
    request<{ success: boolean; settings: ShopSettings }>('/settings'),

  updateSettings: (settingsData: Partial<ShopSettings>) =>
    request<{ success: boolean; message: string; settings: ShopSettings }>('/settings', {
      method: 'PUT',
      body: JSON.stringify(settingsData),
    }),

  // Sharing
  getWhatsAppShareLink: (invoice_id: string, phone?: string) =>
    request<{ success: boolean; whatsapp_url: string; message: string; public_url: string }>(
      '/sharing/whatsapp-link',
      {
        method: 'POST',
        body: JSON.stringify({ invoice_id, phone, base_url: window.location.origin }),
      }
    ),

  sendSmsDispatch: (invoice_id: string, phone?: string) =>
    request<{ success: boolean; sent_via_api: boolean; status_message: string; sms_text: string; public_url: string }>(
      '/sharing/sms-dispatch',
      {
        method: 'POST',
        body: JSON.stringify({ invoice_id, phone, base_url: window.location.origin }),
      }
    ),
};
