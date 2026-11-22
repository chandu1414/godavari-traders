import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Phone, 
  MapPin, 
  FileText, 
  Plus, 
  X, 
  ArrowRight, 
  CheckCircle, 
  AlertCircle, 
  Edit2, 
  Trash2, 
  DollarSign, 
  CreditCard, 
  MessageSquare, 
  Calendar, 
  Receipt, 
  Printer, 
  ExternalLink,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  Wallet
} from 'lucide-react';
import { Customer, Invoice, KhataTransaction, KhataStatementEntry } from '../types';
import { api } from '../services/api';

interface CustomersViewProps {
  onViewInvoice: (invoice: Invoice) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({ onViewInvoice }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState({
    total_due: 0,
    total_advance: 0,
    total_customers: 0,
    due_accounts_count: 0,
    total_purchases: 0,
  });
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'due' | 'settled' | 'advance'>('all');
  const [loading, setLoading] = useState(true);

  // Modals state
  const [addCustomerModalOpen, setAddCustomerModalOpen] = useState(false);
  const [editCustomerModalOpen, setEditCustomerModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [debitModalOpen, setDebitModalOpen] = useState(false);
  const [statementModalOpen, setStatementModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Active Selected Customer & Data
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [statementEntries, setStatementEntries] = useState<KhataStatementEntry[]>([]);
  const [loadingStatement, setLoadingStatement] = useState(false);

  // Form States
  const [customerForm, setCustomerForm] = useState({
    name: '',
    phone: '',
    whatsapp: '',
    address: '',
    credit_limit: '',
    opening_balance: '',
    is_advance: false,
    notes: '',
  });

  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    payment_mode: 'Cash',
    reference: '',
    notes: '',
    date: new Date().toISOString().split('T')[0],
  });

  const [debitForm, setDebitForm] = useState({
    amount: '',
    reference: '',
    notes: '',
    date: new Date().toISOString().split('T')[0],
  });

  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, [filterType]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.getCustomers({ 
        filter: filterType === 'all' ? undefined : filterType 
      });
      if (res.success) {
        setCustomers(res.customers || []);
        if (res.stats) {
          setStats(res.stats);
        }
      }
    } catch (e) {
      console.error('Failed to load customers', e);
    } finally {
      setLoading(false);
    }
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setCustomerForm({
      name: '',
      phone: '',
      whatsapp: '',
      address: '',
      credit_limit: '',
      opening_balance: '',
      is_advance: false,
      notes: '',
    });
    setFormError('');
    setAddCustomerModalOpen(true);
  };

  // Submit Add Customer
  const handleSaveNewCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerForm.name.trim() || !customerForm.phone.trim()) {
      setFormError('Customer name and phone number are required.');
      return;
    }
    try {
      setSaving(true);
      setFormError('');
      let openingBal = parseFloat(customerForm.opening_balance || '0');
      if (customerForm.is_advance) {
        openingBal = -Math.abs(openingBal);
      }
      const res = await api.createCustomer({
        name: customerForm.name.trim(),
        phone: customerForm.phone.trim(),
        whatsapp: customerForm.whatsapp.trim() || customerForm.phone.trim(),
        address: customerForm.address.trim(),
        credit_limit: parseFloat(customerForm.credit_limit || '0'),
        opening_balance: openingBal,
        notes: customerForm.notes.trim(),
      });
      if (res.success) {
        setAddCustomerModalOpen(false);
        loadCustomers();
      } else {
        setFormError(res.message || 'Failed to save customer');
      }
    } catch (err: any) {
      setFormError(err.message || 'Error creating customer account');
    } finally {
      setSaving(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (c: Customer) => {
    setSelectedCustomer(c);
    setCustomerForm({
      name: c.name,
      phone: c.phone,
      whatsapp: c.whatsapp || c.phone,
      address: c.address || '',
      credit_limit: c.credit_limit ? c.credit_limit.toString() : '',
      opening_balance: '',
      is_advance: false,
      notes: c.notes || '',
    });
    setFormError('');
    setEditCustomerModalOpen(true);
  };

  // Submit Edit Customer
  const handleSaveEditCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    try {
      setSaving(true);
      setFormError('');
      const res = await api.updateCustomer(selectedCustomer._id || selectedCustomer.phone, {
        name: customerForm.name.trim(),
        phone: customerForm.phone.trim(),
        whatsapp: customerForm.whatsapp.trim() || customerForm.phone.trim(),
        address: customerForm.address.trim(),
        credit_limit: parseFloat(customerForm.credit_limit || '0'),
        notes: customerForm.notes.trim(),
      });
      if (res.success) {
        setEditCustomerModalOpen(false);
        loadCustomers();
      } else {
        setFormError(res.message || 'Failed to update customer');
      }
    } catch (err: any) {
      setFormError(err.message || 'Error updating customer');
    } finally {
      setSaving(false);
    }
  };

  // Open Delete Modal
  const handleOpenDelete = (c: Customer) => {
    setSelectedCustomer(c);
    setDeleteModalOpen(true);
  };

  // Confirm Delete Customer
  const handleConfirmDelete = async () => {
    if (!selectedCustomer) return;
    try {
      setSaving(true);
      const res = await api.deleteCustomer(selectedCustomer._id || selectedCustomer.phone);
      if (res.success) {
        setDeleteModalOpen(false);
        loadCustomers();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // Open Payment (Jama) Modal
  const handleOpenPayment = (c: Customer) => {
    setSelectedCustomer(c);
    setPaymentForm({
      amount: '',
      payment_mode: 'Cash',
      reference: '',
      notes: '',
      date: new Date().toISOString().split('T')[0],
    });
    setFormError('');
    setPaymentModalOpen(true);
  };

  // Submit Payment (Jama)
  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    const amount = parseFloat(paymentForm.amount);
    if (!amount || amount <= 0) {
      setFormError('Please enter a valid payment amount.');
      return;
    }
    try {
      setSaving(true);
      setFormError('');
      const res = await api.recordKhataTransaction(selectedCustomer._id || selectedCustomer.phone, {
        type: 'PAYMENT',
        amount,
        payment_mode: paymentForm.payment_mode,
        reference: paymentForm.reference.trim(),
        notes: paymentForm.notes.trim(),
        date: new Date(paymentForm.date).toISOString(),
      });
      if (res.success) {
        setPaymentModalOpen(false);
        loadCustomers();
        if (statementModalOpen) {
          handleOpenStatement(res.customer);
        }
      }
    } catch (err: any) {
      setFormError(err.message || 'Failed to record payment');
    } finally {
      setSaving(false);
    }
  };

  // Open Debit (Udhaar) Modal
  const handleOpenDebit = (c: Customer) => {
    setSelectedCustomer(c);
    setDebitForm({
      amount: '',
      reference: '',
      notes: '',
      date: new Date().toISOString().split('T')[0],
    });
    setFormError('');
    setDebitModalOpen(true);
  };

  // Submit Debit (Udhaar)
  const handleSubmitDebit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    const amount = parseFloat(debitForm.amount);
    if (!amount || amount <= 0) {
      setFormError('Please enter a valid amount.');
      return;
    }
    try {
      setSaving(true);
      setFormError('');
      const res = await api.recordKhataTransaction(selectedCustomer._id || selectedCustomer.phone, {
        type: 'DEBIT',
        amount,
        payment_mode: 'Credit / Udhaar',
        reference: debitForm.reference.trim(),
        notes: debitForm.notes.trim(),
        date: new Date(debitForm.date).toISOString(),
      });
      if (res.success) {
        setDebitModalOpen(false);
        loadCustomers();
        if (statementModalOpen) {
          handleOpenStatement(res.customer);
        }
      }
    } catch (err: any) {
      setFormError(err.message || 'Failed to record credit');
    } finally {
      setSaving(false);
    }
  };

  // Open Statement / Passbook Modal
  const handleOpenStatement = async (c: Customer) => {
    setSelectedCustomer(c);
    setStatementModalOpen(true);
    try {
      setLoadingStatement(true);
      const res = await api.getCustomerStatement(c._id || c.phone);
      if (res.success) {
        setStatementEntries(res.entries || []);
      }
    } catch (e) {
      console.error('Failed to load statement', e);
    } finally {
      setLoadingStatement(false);
    }
  };

  // Send WhatsApp Reminder
  const handleSendWhatsAppReminder = (c: Customer) => {
    const due = c.outstanding_due || 0;
    const cleanPhone = (c.whatsapp || c.phone || '').replace(/[^0-9]/g, '');
    const targetPhone = cleanPhone.startsWith('91') && cleanPhone.length > 10 ? cleanPhone : `91${cleanPhone.replace(/^0+/, '')}`;

    const text = 
      `🙏 *Namaste ${c.name} garu,*\n\n` +
      `This is a gentle payment reminder from *GODAVARI TRADERS*, Sadashivpet.\n\n` +
      `📌 *Current Khata Balance Due:* ₹${due.toLocaleString('en-IN')}\n\n` +
      `You can clear your payment via UPI to:\n` +
      `👉 *UPI ID:* godavaritraders@okaxis\n` +
      `Or visit our shop at Siddapu Road, Sadashivpet.\n\n` +
      `For bills or queries: +91 98480 22334\n` +
      `_Thank you for your business!_`;

    window.open(`https://wa.me/${targetPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const filtered = customers.filter((c) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      (c.name || '').toLowerCase().includes(term) ||
      (c.phone || '').toLowerCase().includes(term) ||
      (c.address || '').toLowerCase().includes(term) ||
      (c.notes || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto pb-24 lg:pb-10">
      
      {/* Top Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Khata Ledger & Contractor Accounts
            </h2>
            <span className="px-2.5 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 rounded-full text-xs font-bold">
              {stats.total_customers} Accounts
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage customer credit (Udhaar), record payments (Jama), view passbooks, and send WhatsApp reminders.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-5 py-2.5 bg-brand-900 hover:bg-brand-950 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition flex items-center justify-center space-x-2 shrink-0"
        >
          <Plus className="w-4 h-4 text-amber-400" />
          <span>+ Add New Khata Account</span>
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Outstanding Due */}
        <div className="bg-gradient-to-br from-rose-50 to-white p-4 rounded-2xl border border-rose-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">
              Total Market Udhaar
            </span>
            <AlertCircle className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-rose-600 font-mono mt-1">
            ₹{stats.total_due.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
          <p className="text-[10px] text-rose-600 font-medium mt-0.5">
            Pending collection from {stats.due_accounts_count} accounts
          </p>
        </div>

        {/* Total Accounts with Due */}
        <div className="bg-gradient-to-br from-amber-50 to-white p-4 rounded-2xl border border-amber-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
              Accounts in Credit
            </span>
            <Users className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-amber-900 font-mono mt-1">
            {stats.due_accounts_count}
          </p>
          <p className="text-[10px] text-amber-700 font-medium mt-0.5">
            Active contractors & builders with balance
          </p>
        </div>

        {/* Total Advance */}
        <div className="bg-gradient-to-br from-emerald-50 to-white p-4 rounded-2xl border border-emerald-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
              Customer Advance
            </span>
            <Wallet className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-emerald-700 font-mono mt-1">
            ₹{stats.total_advance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
          <p className="text-[10px] text-emerald-600 font-medium mt-0.5">
            Advance deposited by clients
          </p>
        </div>

        {/* Total Volume */}
        <div className="bg-gradient-to-br from-blue-50 to-white p-4 rounded-2xl border border-blue-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-brand-900 uppercase tracking-wider">
              Cumulative Turnover
            </span>
            <Receipt className="w-4 h-4 text-brand-900" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-brand-900 font-mono mt-1">
            ₹{stats.total_purchases.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
          <p className="text-[10px] text-blue-700 font-medium mt-0.5">
            All materials billed to date
          </p>
        </div>
      </div>

      {/* Filter Tabs and Search */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by customer name, mobile, site location, village..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-900 focus:bg-white text-slate-900 font-medium"
          />
        </div>

        {/* Filter Chips */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-2 rounded-xl font-bold whitespace-nowrap transition ${
              filterType === 'all'
                ? 'bg-brand-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Accounts ({customers.length})
          </button>

          <button
            onClick={() => setFilterType('due')}
            className={`px-3 py-2 rounded-xl font-bold whitespace-nowrap transition flex items-center space-x-1 ${
              filterType === 'due'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            <AlertCircle className="w-3 h-3" />
            <span>Udhaar Baaki ({stats.due_accounts_count})</span>
          </button>

          <button
            onClick={() => setFilterType('settled')}
            className={`px-3 py-2 rounded-xl font-bold whitespace-nowrap transition ${
              filterType === 'settled'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            Settled (Nil)
          </button>

          <button
            onClick={() => setFilterType('advance')}
            className={`px-3 py-2 rounded-xl font-bold whitespace-nowrap transition ${
              filterType === 'advance'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
            }`}
          >
            Advance
          </button>
        </div>
      </div>

      {/* Customer Cards Grid */}
      {loading ? (
        <div className="text-center py-16 text-slate-400 bg-white rounded-2xl border border-slate-200">
          <Users className="w-8 h-8 mx-auto text-slate-300 animate-pulse mb-2" />
          <p className="font-semibold text-sm">Loading Khata accounts...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-500 bg-white rounded-2xl border border-slate-200">
          <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
          <p className="font-bold text-base text-slate-700">No matching Khata records found</p>
          <p className="text-xs text-slate-400 mt-1">Try another search term or click "+ Add New Khata Account"</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((customer) => {
            const due = customer.outstanding_due || 0;
            const hasDue = due > 0;
            const isAdvance = due < 0;

            return (
              <div
                key={customer._id || customer.phone}
                className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  {/* Card Header: Name + Badge + Edit/Delete */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-extrabold text-base text-slate-900 leading-snug">
                        {customer.name}
                      </h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <a
                          href={`tel:${customer.phone}`}
                          className="text-xs text-slate-600 hover:text-brand-900 font-mono flex items-center space-x-1"
                        >
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{customer.phone}</span>
                        </a>
                        {customer.whatsapp && (
                          <a
                            href={`https://wa.me/${customer.whatsapp.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                            title="Chat on WhatsApp"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleOpenEdit(customer)}
                        className="p-1.5 text-slate-400 hover:text-brand-900 hover:bg-slate-100 rounded-lg transition"
                        title="Edit Customer Details"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenDelete(customer)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Delete Customer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Address */}
                  {customer.address && (
                    <p className="text-xs text-slate-500 mt-2 flex items-start space-x-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{customer.address}</span>
                    </p>
                  )}

                  {/* Notes / Reference */}
                  {customer.notes && (
                    <p className="text-[11px] text-slate-400 italic mt-1 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                      "{customer.notes}"
                    </p>
                  )}
                </div>

                {/* Financial Summary Box */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="flex items-end justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Billed</span>
                      <span className="font-mono font-bold text-slate-700 text-xs">
                        ₹{(customer.total_purchases || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Khata Balance</span>
                      {hasDue ? (
                        <span className="font-mono font-black text-rose-600 text-base">
                          ₹{due.toLocaleString('en-IN', { maximumFractionDigits: 0 })} <span className="text-[10px] uppercase font-bold">Due</span>
                        </span>
                      ) : isAdvance ? (
                        <span className="font-mono font-black text-blue-600 text-base">
                          ₹{Math.abs(due).toLocaleString('en-IN', { maximumFractionDigits: 0 })} <span className="text-[10px] uppercase font-bold">Advance</span>
                        </span>
                      ) : (
                        <span className="font-mono font-black text-emerald-700 text-base">
                          ₹0 <span className="text-[10px] uppercase font-bold">Settled</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="grid grid-cols-2 gap-2 mt-3 pt-2">
                    <button
                      onClick={() => handleOpenPayment(customer)}
                      className="py-1.5 px-2 bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-800 rounded-xl text-xs font-bold border border-emerald-200 transition flex items-center justify-center space-x-1"
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>₹ Jama (Pay)</span>
                    </button>

                    <button
                      onClick={() => handleOpenDebit(customer)}
                      className="py-1.5 px-2 bg-amber-50 hover:bg-amber-600 hover:text-white text-amber-800 rounded-xl text-xs font-bold border border-amber-200 transition flex items-center justify-center space-x-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Udhaar</span>
                    </button>
                  </div>

                  {/* Full Statement & WhatsApp Row */}
                  <div className="flex items-center space-x-2 mt-2">
                    <button
                      onClick={() => handleOpenStatement(customer)}
                      className="flex-1 py-1.5 bg-slate-50 hover:bg-brand-900 hover:text-white text-brand-900 rounded-xl text-xs font-bold border border-slate-200 transition flex items-center justify-center space-x-1.5"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Passbook</span>
                    </button>

                    {hasDue && (
                      <button
                        onClick={() => handleSendWhatsAppReminder(customer)}
                        className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1"
                        title="Send WhatsApp Reminder"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Remind</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: ADD NEW KHATA CUSTOMER                                           */}
      {/* ========================================================================= */}
      {addCustomerModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden text-xs">
            <div className="bg-brand-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-amber-400" />
                <h3 className="font-black text-base">Open New Khata Account</h3>
              </div>
              <button onClick={() => setAddCustomerModalOpen(false)} className="text-slate-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewCustomer} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-medium">
                  {formError}
                </div>
              )}

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Customer / Contractor Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Reddy (Builder), Sai Constructions"
                  value={customerForm.name}
                  onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-brand-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9848012345"
                    value={customerForm.phone}
                    onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-brand-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">WhatsApp Number</label>
                  <input
                    type="tel"
                    placeholder="Same as mobile if empty"
                    value={customerForm.whatsapp}
                    onChange={(e) => setCustomerForm({ ...customerForm, whatsapp: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-brand-900"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Site / Delivery Address</label>
                <input
                  type="text"
                  placeholder="e.g. Plot #14, Siddapu Road, Sadashivpet"
                  value={customerForm.address}
                  onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-brand-900"
                />
              </div>

              {/* Opening Balance */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800">Initial Balance (Optional)</label>
                  <div className="flex items-center space-x-2 text-[11px]">
                    <label className="flex items-center space-x-1 cursor-pointer">
                      <input
                        type="radio"
                        checked={!customerForm.is_advance}
                        onChange={() => setCustomerForm({ ...customerForm, is_advance: false })}
                      />
                      <span className="font-semibold text-rose-700">Old Due (Udhaar)</span>
                    </label>
                    <label className="flex items-center space-x-1 cursor-pointer">
                      <input
                        type="radio"
                        checked={customerForm.is_advance}
                        onChange={() => setCustomerForm({ ...customerForm, is_advance: true })}
                      />
                      <span className="font-semibold text-blue-700">Advance Paid</span>
                    </label>
                  </div>
                </div>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="₹ 0.00"
                  value={customerForm.opening_balance}
                  onChange={(e) => setCustomerForm({ ...customerForm, opening_balance: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono font-bold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Credit Limit (₹)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 100000"
                    value={customerForm.credit_limit}
                    onChange={(e) => setCustomerForm({ ...customerForm, credit_limit: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Reference / Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. Known by Suresh mason"
                    value={customerForm.notes}
                    onChange={(e) => setCustomerForm({ ...customerForm, notes: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setAddCustomerModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-brand-900 hover:bg-brand-950 text-white font-bold rounded-xl shadow transition"
                >
                  {saving ? 'Creating...' : 'Open Khata Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: EDIT CUSTOMER DETAILS                                            */}
      {/* ========================================================================= */}
      {editCustomerModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden text-xs">
            <div className="bg-brand-900 text-white p-4 flex items-center justify-between">
              <h3 className="font-black text-base">Edit Customer Khata Details</h3>
              <button onClick={() => setEditCustomerModalOpen(false)} className="text-slate-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditCustomer} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-medium">
                  {formError}
                </div>
              )}

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Customer Name *</label>
                <input
                  type="text"
                  required
                  value={customerForm.name}
                  onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    value={customerForm.phone}
                    onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">WhatsApp Number</label>
                  <input
                    type="tel"
                    value={customerForm.whatsapp}
                    onChange={(e) => setCustomerForm({ ...customerForm, whatsapp: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Site / Delivery Address</label>
                <input
                  type="text"
                  value={customerForm.address}
                  onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Credit Limit (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={customerForm.credit_limit}
                    onChange={(e) => setCustomerForm({ ...customerForm, credit_limit: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Reference / Notes</label>
                  <input
                    type="text"
                    value={customerForm.notes}
                    onChange={(e) => setCustomerForm({ ...customerForm, notes: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditCustomerModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-brand-900 hover:bg-brand-950 text-white font-bold rounded-xl shadow transition"
                >
                  {saving ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: RECORD PAYMENT (JAMA)                                            */}
      {/* ========================================================================= */}
      {paymentModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden text-xs">
            <div className="bg-emerald-700 text-white p-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-emerald-200" />
                <h3 className="font-black text-base">Record Payment (Jama)</h3>
              </div>
              <button onClick={() => setPaymentModalOpen(false)} className="text-emerald-200 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitPayment} className="p-5 space-y-4">
              {/* Customer Info Box */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-extrabold text-sm text-slate-900 block">{selectedCustomer.name}</span>
                  <span className="text-slate-500 font-mono text-[11px]">{selectedCustomer.phone}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Current Due</span>
                  <span className="font-black font-mono text-rose-600 text-sm">
                    ₹{(selectedCustomer.outstanding_due || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-medium">
                  {formError}
                </div>
              )}

              <div className="space-y-1">
                <label className="font-bold text-slate-800">Amount Received (₹) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  step="any"
                  placeholder="Enter amount paid"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  className="w-full px-3 py-2.5 bg-emerald-50/50 border border-emerald-300 rounded-xl font-mono text-base font-black text-emerald-900 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Payment Mode</label>
                  <select
                    value={paymentForm.payment_mode}
                    onChange={(e) => setPaymentForm({ ...paymentForm, payment_mode: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI (GPay / PhonePe)</option>
                    <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Date</label>
                  <input
                    type="date"
                    value={paymentForm.date}
                    onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Reference / Transaction ID / Cheque No</label>
                <input
                  type="text"
                  placeholder="e.g. UPI Ref / Cheque #5021"
                  value={paymentForm.reference}
                  onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Notes / Remarks</label>
                <input
                  type="text"
                  placeholder="e.g. Received at shop, Cement balance"
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              {/* Balance Preview */}
              {paymentForm.amount && parseFloat(paymentForm.amount) > 0 && (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between font-mono">
                  <span className="text-emerald-800 font-semibold text-xs">New Balance After Payment:</span>
                  <span className="font-black text-emerald-900 text-sm">
                    ₹{((selectedCustomer.outstanding_due || 0) - parseFloat(paymentForm.amount)).toLocaleString('en-IN')}
                  </span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setPaymentModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow transition"
                >
                  {saving ? 'Recording...' : 'Record Payment (Jama)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: RECORD MANUAL DEBIT (UDHAAR)                                     */}
      {/* ========================================================================= */}
      {debitModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden text-xs">
            <div className="bg-amber-700 text-white p-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Plus className="w-5 h-5 text-amber-200" />
                <h3 className="font-black text-base">Add Manual Udhaar (Debit)</h3>
              </div>
              <button onClick={() => setDebitModalOpen(false)} className="text-amber-200 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitDebit} className="p-5 space-y-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-extrabold text-sm text-slate-900 block">{selectedCustomer.name}</span>
                  <span className="text-slate-500 font-mono text-[11px]">{selectedCustomer.phone}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Current Due</span>
                  <span className="font-black font-mono text-rose-600 text-sm">
                    ₹{(selectedCustomer.outstanding_due || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-medium">
                  {formError}
                </div>
              )}

              <div className="space-y-1">
                <label className="font-bold text-slate-800">Udhaar Amount (₹) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  step="any"
                  placeholder="Enter credit / debit amount"
                  value={debitForm.amount}
                  onChange={(e) => setDebitForm({ ...debitForm, amount: e.target.value })}
                  className="w-full px-3 py-2.5 bg-amber-50/50 border border-amber-300 rounded-xl font-mono text-base font-black text-amber-900 focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Reason / Description *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 15 bags cement taken without bill, Tractor unloading"
                  value={debitForm.notes}
                  onChange={(e) => setDebitForm({ ...debitForm, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Slip / Reference No</label>
                  <input
                    type="text"
                    placeholder="e.g. Slip #42"
                    value={debitForm.reference}
                    onChange={(e) => setDebitForm({ ...debitForm, reference: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Date</label>
                  <input
                    type="date"
                    value={debitForm.date}
                    onChange={(e) => setDebitForm({ ...debitForm, date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setDebitModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-amber-700 hover:bg-amber-800 text-white font-bold rounded-xl shadow transition"
                >
                  {saving ? 'Adding...' : 'Add Udhaar (Debit)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: FULL KHATA STATEMENT / PASSBOOK                                   */}
      {/* ========================================================================= */}
      {statementModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-5">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden text-xs">
            
            {/* Header */}
            <div className="bg-brand-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
              <div>
                <div className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-amber-400" />
                  <h3 className="font-black text-base sm:text-lg">{selectedCustomer.name} - Khata Passbook</h3>
                </div>
                <p className="text-xs text-blue-200 font-mono mt-0.5">
                  Mobile: {selectedCustomer.phone} {selectedCustomer.address ? `• Site: ${selectedCustomer.address}` : ''}
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleSendWhatsAppReminder(selectedCustomer)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center space-x-1"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">WhatsApp Reminder</span>
                </button>
                <button onClick={() => setStatementModalOpen(false)} className="text-slate-300 hover:text-white p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Summary Bar */}
            <div className="bg-slate-50 p-4 border-b border-slate-200 grid grid-cols-3 gap-3 text-center">
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Billed / Debited</span>
                <span className="font-mono font-black text-slate-900 text-sm sm:text-base mt-0.5 block">
                  ₹{(selectedCustomer.total_purchases || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-[10px] text-emerald-600 uppercase font-bold block">Total Paid (Jama)</span>
                <span className="font-mono font-black text-emerald-700 text-sm sm:text-base mt-0.5 block">
                  ₹{Math.max(0, (selectedCustomer.total_purchases || 0) - (selectedCustomer.outstanding_due || 0)).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-[10px] text-rose-500 uppercase font-bold block">Net Balance Due</span>
                <span className="font-mono font-black text-rose-600 text-sm sm:text-base mt-0.5 block">
                  ₹{(selectedCustomer.outstanding_due || 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Quick Action Buttons inside Statement */}
            <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
              <span className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">
                Transaction History & Invoices
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleOpenPayment(selectedCustomer)}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center space-x-1"
                >
                  <DollarSign className="w-3 h-3" />
                  <span>+ Record Payment</span>
                </button>
                <button
                  onClick={() => handleOpenDebit(selectedCustomer)}
                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold flex items-center space-x-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ Add Udhaar</span>
                </button>
              </div>
            </div>

            {/* Chronological Unified Timeline */}
            <div className="p-4 overflow-y-auto flex-1 space-y-2.5">
              {loadingStatement ? (
                <div className="text-center py-10 text-slate-400">Loading Khata entries...</div>
              ) : statementEntries.length === 0 ? (
                <div className="text-center py-10 text-slate-400">No transactions recorded for this account.</div>
              ) : (
                statementEntries.map((entry, idx) => {
                  const isCredit = (entry.credit_amount || 0) > 0;
                  const dateStr = entry.date ? new Date(entry.date).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  }) : '';

                  return (
                    <div
                      key={entry.id || idx}
                      className={`p-3 rounded-xl border transition flex items-center justify-between ${
                        isCredit
                          ? 'bg-emerald-50/40 border-emerald-200 hover:border-emerald-300'
                          : 'bg-white border-slate-200 hover:border-brand-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          {isCredit ? (
                            <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[9px] font-bold">
                              JAMA (RECEIVED)
                            </span>
                          ) : entry.entry_type === 'INVOICE' ? (
                            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-900 rounded text-[9px] font-bold font-mono">
                              BILL #{entry.invoice_number}
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 bg-amber-100 text-amber-900 rounded text-[9px] font-bold">
                              UDHAAR (DEBIT)
                            </span>
                          )}
                          <span className="text-[11px] text-slate-400 font-mono">{dateStr}</span>
                        </div>

                        <p className="text-xs font-semibold text-slate-800 mt-1">
                          {entry.description}
                        </p>

                        {entry.items_summary && (
                          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                            {entry.items_summary}
                          </p>
                        )}

                        {entry.reference && (
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                            Ref: {entry.reference}
                          </p>
                        )}
                      </div>

                      <div className="text-right shrink-0 ml-3">
                        {isCredit ? (
                          <span className="font-mono font-black text-emerald-600 text-sm block">
                            +₹{entry.credit_amount.toLocaleString('en-IN')}
                          </span>
                        ) : (
                          <span className="font-mono font-black text-rose-600 text-sm block">
                            -₹{entry.debit_amount.toLocaleString('en-IN')}
                          </span>
                        )}

                        {entry.entry_type === 'INVOICE' && (
                          <button
                            onClick={() => {
                              setStatementModalOpen(false);
                              api.getInvoices({ search: entry.invoice_number }).then((r) => {
                                if (r.success && r.invoices[0]) onViewInvoice(r.invoices[0]);
                              });
                            }}
                            className="mt-1 px-2 py-0.5 bg-brand-50 hover:bg-brand-900 hover:text-white text-brand-900 rounded text-[10px] font-bold transition inline-block"
                          >
                            View Bill
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
              <span className="text-slate-500 text-[11px]">
                Shop UPI: <span className="font-mono font-bold text-slate-800">godavaritraders@okaxis</span>
              </span>
              <button
                onClick={() => setStatementModalOpen(false)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: DELETE CONFIRMATION                                              */}
      {/* ========================================================================= */}
      {deleteModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5 text-center text-xs space-y-4">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base">Delete Khata Account?</h3>
              <p className="text-slate-500 mt-1">
                Are you sure you want to remove <span className="font-bold text-slate-800">{selectedCustomer.name}</span>?
                {selectedCustomer.outstanding_due && selectedCustomer.outstanding_due > 0 ? (
                  <span className="block mt-1 text-rose-600 font-bold">
                    Warning: This account has an outstanding balance of ₹{selectedCustomer.outstanding_due.toLocaleString('en-IN')}.
                  </span>
                ) : null}
              </p>
            </div>
            <div className="flex items-center justify-center space-x-2 pt-2">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={saving}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow transition"
              >
                {saving ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
