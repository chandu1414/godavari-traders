import { Product, Customer, Invoice, ShopSettings, User, DashboardMetrics } from '../types';

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

  // Customers
  getCustomers: (params?: { search?: string; has_due?: boolean }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.has_due) query.set('has_due', 'true');
    return request<{ success: boolean; count: number; customers: Customer[] }>(`/customers?${query.toString()}`);
  },

  getCustomerLedger: (phoneOrId: string) =>
    request<{ success: boolean; customer: Customer; invoices: Invoice[]; invoice_count: number }>(`/customers/${phoneOrId}`),

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
