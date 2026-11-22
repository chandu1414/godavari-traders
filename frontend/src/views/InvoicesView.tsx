import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  Eye, 
  Printer, 
  Share2, 
  DollarSign, 
  CheckCircle, 
  Clock, 
  X,
  CreditCard,
  Building2,
  Calendar,
  Filter
} from 'lucide-react';
import { Invoice } from '../types';
import { api } from '../services/api';

interface InvoicesViewProps {
  onViewInvoice: (invoice: Invoice) => void;
}

export const InvoicesView: React.FC<InvoicesViewProps> = ({ onViewInvoice }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [search, setSearch] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // Record Payment Modal State
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [receivedAmount, setReceivedAmount] = useState<number>(0);
  const [receivedMode, setReceivedMode] = useState<string>('Cash');
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  useEffect(() => {
    loadInvoices();
  }, [paymentStatus, dateFilter]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const res = await api.getInvoices({
        payment_status: paymentStatus !== 'ALL' ? paymentStatus : undefined,
        date_filter: dateFilter !== 'all' ? dateFilter : undefined,
      });
      if (res.success) {
        setInvoices(res.invoices);
      }
    } catch (e) {
      console.error('Failed to load invoices', e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPaymentModal = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setReceivedAmount(invoice.balance_due || 0);
    setReceivedMode('UPI');
    setPaymentNotes('');
    setPaymentModalOpen(true);
  };

  const handleRecordPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice || receivedAmount <= 0) return;

    try {
      setIsSubmittingPayment(true);
      const res = await api.updateInvoicePayment(selectedInvoice.invoice_number, {
        amount_received: Number(receivedAmount),
        payment_mode: receivedMode,
        notes: paymentNotes
      });

      if (res.success) {
        setPaymentModalOpen(false);
        loadInvoices();
      }
    } catch (err: any) {
      alert('Error updating payment: ' + err.message);
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    const invNum = inv.invoice_number.toLowerCase();
    const custName = (inv.customer.name || '').toLowerCase();
    const custPhone = (inv.customer.phone || '').toLowerCase();
    return invNum.includes(term) || custName.includes(term) || custPhone.includes(term);
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Invoice Ledger & History
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Audit-safe records of all digital bills generated for Godavari Traders.
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-white p-4 rounded-2xl shadow-sm border border-slate-200 text-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Bill #, Customer Name, Mobile..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-900 focus:bg-white text-slate-900 font-medium"
          />
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0">
          {/* Status Filter */}
          <select
            value={paymentStatus}
            onChange={(e) => setPaymentStatus(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700"
          >
            <option value="ALL">All Payment Statuses</option>
            <option value="PAID">Paid Only</option>
            <option value="PARTIAL">Partial Dues</option>
            <option value="PENDING">Pending (Credit)</option>
          </select>

          {/* Date Filter */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700"
          >
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="this_week">This Week</option>
            <option value="this_month">This Month</option>
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Customer Details</th>
                <th className="py-3 px-4 text-center">Items</th>
                <th className="py-3 px-4 text-right">Grand Total</th>
                <th className="py-3 px-4 text-right">Balance Due</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Loading invoices...
                  </td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No matching invoices found.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv._id || inv.invoice_number} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-mono font-black text-brand-900 text-sm">
                      {inv.invoice_number}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-medium whitespace-nowrap">
                      {new Date(inv.date).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                      <span className="block text-[10px] text-slate-400">
                        {new Date(inv.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-900">
                      <div className="font-bold text-slate-900">{inv.customer.name}</div>
                      {inv.customer.phone && (
                        <div className="text-[10px] text-slate-500 font-mono">{inv.customer.phone}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center text-slate-600 font-semibold">
                      {inv.items?.length || 0} materials
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-black text-slate-950 text-sm">
                      ₹{inv.grand_total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold">
                      {inv.balance_due > 0 ? (
                        <span className="text-rose-600">₹{inv.balance_due.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      ) : (
                        <span className="text-slate-400">₹0.00</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        inv.payment_status === 'PAID'
                          ? 'bg-emerald-100 text-emerald-800'
                          : inv.payment_status === 'PARTIAL'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {inv.payment_status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => onViewInvoice(inv)}
                        className="px-2.5 py-1 bg-brand-50 hover:bg-brand-900 hover:text-white rounded-lg text-brand-900 font-semibold transition inline-flex items-center space-x-1"
                        title="View / Print Invoice"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>

                      {inv.balance_due > 0 && (
                        <button
                          onClick={() => handleOpenPaymentModal(inv)}
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-600 hover:text-white rounded-lg text-emerald-700 font-semibold transition inline-flex items-center space-x-1 border border-emerald-200"
                          title="Record Payment"
                        >
                          <DollarSign className="w-3.5 h-3.5" />
                          <span>Pay</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      {paymentModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5 space-y-4 text-xs">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">Record Bill Payment</h3>
                <p className="text-slate-500 font-mono mt-0.5">{selectedInvoice.invoice_number} • {selectedInvoice.customer.name}</p>
              </div>
              <button onClick={() => setPaymentModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-rose-50 p-3 rounded-xl border border-rose-200 flex justify-between items-center">
              <span className="text-[11px] text-rose-800 font-bold uppercase">Pending Balance Due</span>
              <span className="text-lg font-black text-rose-700 font-mono">
                ₹{selectedInvoice.balance_due.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <form onSubmit={handleRecordPaymentSubmit} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Amount Received (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  max={selectedInvoice.balance_due}
                  required
                  value={receivedAmount || ''}
                  onChange={(e) => setReceivedAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-sm font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Payment Method</label>
                <select
                  value={receivedMode}
                  onChange={(e) => setReceivedMode(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
                  <option value="Bank Transfer">Bank Transfer / NEFT</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Notes / Transaction Ref</label>
                <input
                  type="text"
                  placeholder="e.g. Received at shop counter"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setPaymentModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPayment || receivedAmount <= 0}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold shadow-sm"
                >
                  {isSubmittingPayment ? 'Recording...' : 'Confirm Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
