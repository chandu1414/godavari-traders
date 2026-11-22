import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Printer, 
  Download, 
  Phone, 
  MapPin, 
  CheckCircle, 
  AlertCircle,
  FileText,
  CreditCard
} from 'lucide-react';
import { Invoice } from '../types';
import { api } from '../services/api';

interface PublicInvoiceViewProps {
  token: string;
}

export const PublicInvoiceView: React.FC<PublicInvoiceViewProps> = ({ token }) => {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPublicInvoice();
  }, [token]);

  const loadPublicInvoice = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getPublicInvoice(token);
      if (res.success && res.invoice) {
        setInvoice(res.invoice);
      } else {
        setError('Invoice not found or link has expired.');
      }
    } catch (e: any) {
      setError(e.message || 'Unable to load invoice details.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-brand-900 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-600">Retrieving official invoice...</p>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-2xl shadow-md max-w-md w-full text-center space-y-4 border border-slate-200">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900">Invoice Link Unavailable</h2>
          <p className="text-xs text-slate-500">{error || 'This invoice viewing link could not be verified.'}</p>
          <p className="text-xs text-slate-400">Please contact Godavari Traders at +91 98480 22334 for assistance.</p>
        </div>
      </div>
    );
  }

  const shop = invoice.shop_snapshot || {};
  const upiId = shop.upi_id || 'godavaritraders@okaxis';
  const upiPayUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(shop.shop_name || 'Godavari Traders')}&am=${invoice.balance_due > 0 ? invoice.balance_due : invoice.grand_total}&cu=INR&tn=${encodeURIComponent(`Bill ${invoice.invoice_number}`)}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(upiPayUrl)}`;

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-3 sm:px-6 lg:px-8 print:p-0 print:bg-white">
      <div className="max-w-3xl mx-auto space-y-4">
        
        {/* Top Floating Action Bar */}
        <div className="bg-brand-900 text-white p-4 rounded-2xl shadow-md flex items-center justify-between print:hidden">
          <div className="flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-amber-400" />
            <span className="font-extrabold text-sm sm:text-base">Godavari Traders Invoice</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => window.print()}
              className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg text-xs flex items-center space-x-1.5 transition shadow"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
          </div>
        </div>

        {/* Invoice Body Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-5 sm:p-8 text-slate-800 print:shadow-none print:border-none print:p-0">
          
          {/* Header */}
          <div className="border-b-2 border-brand-900 pb-4 mb-4">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black text-brand-950 tracking-tight">
                  {shop.shop_name || 'GODAVARI TRADERS'}
                </h1>
                <p className="text-xs font-semibold text-brand-800 mt-0.5">
                  {shop.tagline || 'Wholesale & Retail Building Materials'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {shop.address_line1}, {shop.city}, {shop.district ? `${shop.district} dist, ` : ''}{shop.state} - {shop.pincode}
                </p>
                <p className="text-xs text-slate-600 mt-0.5">
                  {shop.owner_name && <span className="font-bold text-slate-900 mr-2">Prop: {shop.owner_name}</span>}
                  {shop.phone && <span>Phone: <span className="font-semibold text-slate-900">{shop.phone}</span></span>}
                </p>
              </div>

              <div className="sm:text-right text-xs space-y-1">
                <span className="inline-block px-3 py-1 bg-brand-900 text-white font-extrabold rounded text-[11px] uppercase tracking-wider">
                  {invoice.is_gst_invoice ? 'TAX INVOICE' : 'BILL OF SUPPLY'}
                </span>
                <p><span className="text-slate-400">GSTIN:</span> <span className="font-mono font-bold text-slate-900">{shop.gstin || '37AAAAA0000A1Z5'}</span></p>
                <p><span className="text-slate-400">State:</span> <span className="font-semibold">{shop.state || 'Andhra Pradesh'}</span></p>
              </div>
            </div>
          </div>

          {/* Customer & Invoice Meta */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs mb-4">
            <div>
              <p className="text-[10px] font-bold uppercase text-slate-400">Customer Details</p>
              <p className="font-bold text-slate-950 text-sm mt-0.5">{invoice.customer.name}</p>
              {invoice.customer.phone && <p className="text-slate-600 font-mono mt-0.5">Mobile: {invoice.customer.phone}</p>}
              {invoice.customer.address && <p className="text-slate-600 mt-0.5">Address: {invoice.customer.address}</p>}
            </div>

            <div className="sm:text-right space-y-1">
              <p className="text-[10px] font-bold uppercase text-slate-400">Bill Details</p>
              <p><span className="text-slate-500">Invoice No:</span> <span className="font-mono font-black text-brand-900 text-sm">{invoice.invoice_number}</span></p>
              <p><span className="text-slate-500">Date:</span> <span className="font-semibold">{new Date(invoice.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span></p>
              <p><span className="text-slate-500">Status:</span> <span className={`font-bold ${invoice.payment_status === 'PAID' ? 'text-emerald-700' : 'text-rose-600'}`}>{invoice.payment_status}</span></p>
            </div>
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-left text-xs border border-slate-200">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Material</th>
                  <th className="py-2.5 px-2 text-right">Qty</th>
                  <th className="py-2.5 px-2 text-center">Unit</th>
                  <th className="py-2.5 px-3 text-right">Rate (₹)</th>
                  <th className="py-2.5 px-3 text-right">Total (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoice.items.map((it, idx) => (
                  <tr key={idx}>
                    <td className="py-2 px-3 text-slate-400">{idx + 1}</td>
                    <td className="py-2 px-3 font-semibold text-slate-900">
                      {it.product_name}
                      {it.brand && <span className="text-[10px] text-slate-400 block">{it.brand}</span>}
                    </td>
                    <td className="py-2 px-2 text-right font-bold font-mono">{it.quantity}</td>
                    <td className="py-2 px-2 text-center text-slate-600">{it.unit}</td>
                    <td className="py-2 px-3 text-right font-mono">{it.rate.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-950">
                      {it.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals & UPI Pay */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start mb-6">
            
            {/* UPI QR & Quick Pay */}
            <div className="sm:col-span-6 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
              <div className="flex items-start space-x-3">
                <img src={qrCodeUrl} alt="UPI QR" className="w-24 h-24 object-contain bg-white p-1 rounded-lg border border-slate-200 shrink-0" />
                <div className="space-y-1 text-[11px] text-slate-600">
                  <p className="font-bold text-slate-900 uppercase">Instant Payment via UPI</p>
                  <p>Scan with PhonePe, Google Pay or Paytm.</p>
                  <p><span className="text-slate-400">UPI ID:</span> <span className="font-mono font-bold text-brand-900">{shop.upi_id || 'godavaritraders@okaxis'}</span></p>
                  
                  {invoice.balance_due > 0 && (
                    <a
                      href={upiPayUrl}
                      className="inline-block mt-2 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-xs"
                    >
                      Pay ₹{invoice.balance_due.toLocaleString('en-IN')} Now
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div className="sm:col-span-6 space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Subtotal:</span>
                <span className="font-mono font-semibold text-slate-900">₹{invoice.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              {invoice.discount_amount > 0 && (
                <div className="flex justify-between py-1 text-emerald-700">
                  <span>Discount:</span>
                  <span className="font-mono">-₹{invoice.discount_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              {invoice.is_gst_invoice && invoice.tax_breakup && invoice.tax_breakup.total_tax > 0 && (
                <div className="flex justify-between py-0.5 text-slate-500">
                  <span>GST Amount:</span>
                  <span className="font-mono">₹{invoice.tax_breakup.total_tax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              {invoice.delivery?.delivery_charge > 0 && (
                <div className="flex justify-between py-1">
                  <span>Delivery Charge:</span>
                  <span className="font-mono">₹{invoice.delivery.delivery_charge.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              <div className="flex justify-between py-2 bg-brand-900 text-white px-3 rounded-lg text-sm font-bold shadow-sm">
                <span>Grand Total:</span>
                <span className="font-mono text-amber-300">₹{invoice.grand_total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              {invoice.balance_due > 0 && (
                <div className="flex justify-between py-1 text-rose-700 bg-rose-50 px-2 rounded font-bold">
                  <span>Balance Due:</span>
                  <span className="font-mono">₹{invoice.balance_due.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
            </div>

          </div>

          {/* Footer */}
          <div className="border-t border-slate-200 pt-4 text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-2">
            <p className="italic text-brand-900 font-semibold">
              {shop.footer_notes || 'Thank you for building with Godavari Traders!'}
            </p>
            <p className="text-[11px] text-slate-400">
              Official Digital Invoice generated via Godavari Traders POS
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};
