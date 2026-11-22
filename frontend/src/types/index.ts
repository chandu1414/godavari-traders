export interface Product {
  _id: string;
  name: string;
  brand: string;
  category: string;
  unit: string;
  selling_price: number;
  purchase_price?: number;
  stock: number;
  min_stock_alert: number;
  hsn_code?: string;
  gst_rate: number;
  description?: string;
  image_url?: string;
  is_active: boolean;
}

export interface CartItem {
  product_id?: string;
  product_name: string;
  brand?: string;
  category?: string;
  unit: string;
  quantity: number;
  rate: number;
  amount: number;
  gst_rate: number;
  hsn_code?: string;
  cgst_amount?: number;
  sgst_amount?: number;
}

export interface TaxBreakup {
  taxable_amount: number;
  cgst_amount: number;
  sgst_amount: number;
  total_tax: number;
}

export interface DeliveryDetails {
  is_delivery: boolean;
  delivery_charge: number;
  delivery_address: string;
  instructions?: string;
}

export interface Customer {
  _id?: string;
  name: string;
  phone: string;
  whatsapp?: string;
  address?: string;
  total_purchases?: number;
  total_invoices?: number;
  outstanding_due?: number;
}

export interface ShopSettings {
  _id: string;
  shop_name: string;
  owner_name?: string;
  tagline?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  district?: string;
  state?: string;
  pincode?: string;
  state_code?: string;
  phone?: string;
  whatsapp_number?: string;
  email?: string;
  gstin?: string;
  pan_number?: string;
  upi_id?: string;
  bank_name?: string;
  bank_account_no?: string;
  bank_ifsc?: string;
  bank_branch?: string;
  invoice_prefix?: string;
  next_invoice_number?: number;
  enable_gst_by_default?: boolean;
  default_gst_rate?: number;
  footer_notes?: string;
  terms_conditions?: string;
}

export interface Invoice {
  _id: string;
  invoice_number: string;
  public_token: string;
  date: string;
  customer: Customer;
  items: CartItem[];
  subtotal: number;
  discount_type?: string;
  discount_value?: number;
  discount_amount: number;
  is_gst_invoice: boolean;
  tax_breakup: TaxBreakup;
  delivery: DeliveryDetails;
  round_off: number;
  grand_total: number;
  payment_mode: string;
  payment_status: 'PAID' | 'PARTIAL' | 'PENDING';
  amount_paid: number;
  balance_due: number;
  created_by?: string;
  notes?: string;
  shop_snapshot?: Partial<ShopSettings>;
}

export interface User {
  id: string;
  username: string;
  email?: string;
  full_name: string;
  role: 'admin' | 'cashier';
  phone?: string;
}

export interface DashboardMetrics {
  today_sales: number;
  today_bills_count: number;
  yesterday_sales: number;
  month_sales: number;
  total_sales: number;
  total_receivables: number;
  total_invoices_count: number;
  total_products_count: number;
  low_stock_count: number;
  low_stock_items: { name: string; stock: number; unit: string; min: number }[];
}
