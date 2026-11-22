import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Phone, 
  MapPin, 
  FileText, 
  DollarSign, 
  X, 
  Eye, 
  Plus,
  ArrowRight
} from 'lucide-react';
import { Customer, Invoice } from '../types';
import { api } from '../services/api';

interface CustomersViewProps {
  onViewInvoice: (invoice: Invoice) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({ onViewInvoice }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [hasDueOnly, setHasDueOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  // Selected Customer Ledger Modal State
  const [ledgerModalOpen, setLedgerModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerInvoices, setCustomerInvoices] = useState<Invoice[]>([]);
  const [loadingLedger, setLoadingLedger] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, [hasDueOnly]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.getCustomers({ has_due: hasDueOnly });
      if (res.success) {
        setCustomers(res.customers);
      }
    } catch (e) {
      console.error('Failed to load customers', e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenLedger = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setLedgerModalOpen(true);
    try {
      setLoadingLedger(true);
      const res = await api.getCustomerLedger(customer.phone);
      if (res.success) {
        setCustomerInvoices(res.invoices || []);
      }
    } catch (e) {
      console.error('Failed to load ledger', e);
    } finally {
      setLoadingLedger(false);
    }
  };

  const filtered = customers.filter((c) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      (c.name || '').toLowerCase().includes(term) ||
      (c.phone || '').toLowerCase().includes(term) ||
      (c.address || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Customer Directory & Khata Ledger
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Track contractors, individual builders, previous purchase histories, and credit dues.
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-white p-4 rounded-2xl shadow-sm border border-slate-200 text-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search customer by name, mobile number, site location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-900 focus:bg-white text-slate-900 font-medium"
          />
        </div>

        <button
          onClick={() => setHasDueOnly(!hasDueOnly)}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition whitespace-nowrap ${
            hasDueOnly
              ? 'bg-rose-100 text-rose-800 border border-rose-300 font-bold'
              : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>With Outstanding Balance Only</span>
        </button>
      </div>

      {/* Customers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((customer) => {
          const hasDue = (customer.outstanding_due || 0) > 0;
          return (
            <div
              key={customer._id || customer.phone}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base text-slate-900 leading-tight">
                      {customer.name}
                    </h3>
                    <p className="text-xs text-slate-500 font-mono mt-0.5 flex items-center space-x-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{customer.phone}</span>
                    </p>
                  </div>
                  {hasDue ? (
                    <span className="px-2 py-0.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-md text-[10px] font-bold">
                      Pending Due
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-md text-[10px] font-bold">
                      Settled
                    </span>
                  )}
                </div>

                {customer.address && (
                  <p className="text-xs text-slate-500 mt-2 flex items-start space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{customer.address}</span>
                  </p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Volume</span>
                  <span className="font-mono font-bold text-slate-800">
                    ₹{(customer.total_purchases || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Khata Balance</span>
                  <span className={`font-mono font-black ${hasDue ? 'text-rose-600' : 'text-emerald-700'}`}>
                    ₹{(customer.outstanding_due || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </span>
                </div>
              </div>

              <button
                onClick={() => handleOpenLedger(customer)}
                className="mt-3 w-full py-2 bg-slate-50 hover:bg-brand-900 hover:text-white rounded-xl text-xs font-bold text-brand-900 border border-slate-200 transition flex items-center justify-center space-x-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>View Full Khata Statement</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Customer Ledger Statement Modal */}
      {ledgerModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden text-xs">
            <div className="bg-brand-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-black text-base">{selectedCustomer.name} - Ledger</h3>
                <p className="text-xs text-blue-200 font-mono mt-0.5">{selectedCustomer.phone}</p>
              </div>
              <button onClick={() => setLedgerModalOpen(false)} className="text-slate-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Summary Row */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold">Total Invoices</span>
                <p className="font-black text-sm text-slate-900 font-mono mt-0.5">
                  {customerInvoices.length} bills
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold">Total Purchases</span>
                <p className="font-black text-sm text-slate-900 font-mono mt-0.5">
                  ₹{(selectedCustomer.total_purchases || 0).toLocaleString('en-IN')}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-rose-500 uppercase font-bold">Outstanding Balance</span>
                <p className="font-black text-sm text-rose-600 font-mono mt-0.5">
                  ₹{(selectedCustomer.outstanding_due || 0).toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            {/* Invoices List */}
            <div className="p-4 overflow-y-auto flex-1 space-y-2.5">
              <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider mb-2">
                Invoice Purchase History
              </h4>

              {loadingLedger ? (
                <div className="text-center py-8 text-slate-400">Loading ledger records...</div>
              ) : customerInvoices.length === 0 ? (
                <div className="text-center py-8 text-slate-400">No invoices recorded for this customer.</div>
              ) : (
                customerInvoices.map((inv) => (
                  <div
                    key={inv._id || inv.invoice_number}
                    className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between hover:border-brand-300 transition"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-brand-900">{inv.invoice_number}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          inv.payment_status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {inv.payment_status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {new Date(inv.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} • {inv.items?.length || 0} items
                      </p>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <span className="font-mono font-black text-slate-950 block">
                          ₹{inv.grand_total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                        {inv.balance_due > 0 && (
                          <span className="text-[10px] font-mono text-rose-600 font-bold block">
                            Due: ₹{inv.balance_due.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          setLedgerModalOpen(false);
                          onViewInvoice(inv);
                        }}
                        className="px-2.5 py-1 bg-brand-50 hover:bg-brand-900 hover:text-white rounded-lg text-brand-900 font-semibold transition"
                      >
                        View
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setLedgerModalOpen(false)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
