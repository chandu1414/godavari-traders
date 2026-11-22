import React, { useEffect, useState } from 'react';
import { 
  DollarSign, 
  Receipt, 
  Package, 
  Users, 
  ArrowUpRight, 
  TrendingUp, 
  AlertTriangle, 
  PlusCircle, 
  Eye, 
  Calendar,
  Share2,
  CheckCircle,
  Truck
} from 'lucide-react';
import { DashboardMetrics, Invoice } from '../types';
import { api } from '../services/api';

interface DashboardViewProps {
  onNavigate: (view: string) => void;
  onViewInvoice: (invoice: Invoice) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate, onViewInvoice }) => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [categorySales, setCategorySales] = useState<{ category: string; revenue: number; percentage: number }[]>([]);
  const [salesTrend, setSalesTrend] = useState<{ date: string; sales: number; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.getDashboardMetrics();
      if (res.success) {
        setMetrics(res.metrics);
        setRecentInvoices(res.recent_invoices || []);
        setCategorySales(res.category_sales || []);
        setSalesTrend(res.sales_trend_7d || []);
      }
    } catch (e) {
      console.error('Error fetching dashboard metrics', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-4 border-brand-900 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Loading Godavari Traders Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      
      {/* Welcome & Quick Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Shop Overview
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time sales, billing records, and inventory metrics for Godavari Traders.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => onNavigate('billing')}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-sm transition active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Create Bill</span>
          </button>

          <button
            onClick={() => onNavigate('products')}
            className="px-3.5 py-2.5 bg-brand-50 hover:bg-brand-100 text-brand-900 font-bold rounded-xl text-xs sm:text-sm border border-brand-200 transition"
          >
            <span>Catalogue</span>
          </button>

          <button
            onClick={() => onNavigate('settings')}
            className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs sm:text-sm transition flex items-center space-x-1"
            title="Edit Owner & Shop Address"
          >
            <span>⚙️ Edit Shop Info</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        
        {/* Today's Sales */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Today's Sales</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
              ₹{(metrics?.today_sales || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              {metrics?.today_bills_count || 0} bills generated today
            </p>
          </div>
        </div>

        {/* Total Invoices */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Bills</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-brand-900 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
              {metrics?.total_invoices_count || 0}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              ₹{(metrics?.total_sales || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })} all-time volume
            </p>
          </div>
        </div>

        {/* Total Products */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Catalogue Items</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
              {metrics?.total_products_count || 0}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Cement, Steel, Stone Dust, Sand
            </p>
          </div>
        </div>

        {/* Customer Dues / Receivables */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Khata Dues</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-xl sm:text-2xl font-black text-rose-600 font-mono">
              ₹{(metrics?.total_receivables || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Pending customer balances
            </p>
          </div>
        </div>

      </div>

      {/* Low Stock Warning Banner if any */}
      {metrics?.low_stock_count && metrics.low_stock_count > 0 ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-950">
                Low Stock Alert ({metrics.low_stock_count} item{metrics.low_stock_count > 1 ? 's' : ''})
              </p>
              <p className="text-[11px] text-amber-800">
                {metrics.low_stock_items?.map(i => `${i.name}: ${i.stock} ${i.unit}`).join(' • ')}
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('products')}
            className="px-3 py-1.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded-lg text-xs shrink-0 transition"
          >
            Reorder
          </button>
        </div>
      ) : null}

      {/* Grid: 7-Day Sales Trend & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 7-Day Trend */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                7-Day Sales Performance
              </h3>
              <p className="text-xs text-slate-500">Daily billing revenue overview</p>
            </div>
            <span className="text-xs font-bold text-brand-900 bg-brand-50 px-2.5 py-1 rounded-lg">
              Last 7 Days
            </span>
          </div>

          <div className="grid grid-cols-7 gap-1.5 sm:gap-2 pt-6 pb-2 items-end min-h-[160px]">
            {salesTrend.map((t, idx) => {
              const maxSale = Math.max(...salesTrend.map(s => s.sales), 1000);
              const heightPercent = Math.max(12, Math.round((t.sales / maxSale) * 100));
              return (
                <div key={idx} className="flex flex-col items-center group">
                  <span className="text-[10px] font-bold text-slate-700 opacity-0 group-hover:opacity-100 transition mb-1 font-mono">
                    ₹{(t.sales / 1000).toFixed(1)}k
                  </span>
                  <div className="w-full bg-slate-100 rounded-t-lg flex items-end justify-center h-28 p-1">
                    <div 
                      style={{ height: `${heightPercent}%` }} 
                      className="w-full bg-brand-900 hover:bg-amber-400 rounded-t-md transition-all duration-300"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 mt-2 font-medium truncate w-full text-center">
                    {t.date}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="font-extrabold text-sm sm:text-base text-slate-900 mb-1">
            Sales by Category
          </h3>
          <p className="text-xs text-slate-500 mb-4">Material demand distribution</p>

          <div className="space-y-3">
            {categorySales.slice(0, 5).map((cat, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-800 font-semibold truncate">{cat.category}</span>
                  <span className="text-slate-500 font-mono">₹{cat.revenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-brand-900 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, cat.percentage)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Recent Invoices Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-100">
          <div>
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
              Recent Bills Generated
            </h3>
            <p className="text-xs text-slate-500">Latest invoices for construction materials</p>
          </div>
          <button
            onClick={() => onNavigate('invoices')}
            className="text-xs font-bold text-brand-900 hover:text-brand-700 flex items-center space-x-1"
          >
            <span>View All</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Bill No</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4 text-right">Amount (₹)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentInvoices.map((inv) => (
                <tr key={inv._id || inv.invoice_number} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-mono font-bold text-brand-900">
                    {inv.invoice_number}
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    {new Date(inv.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-900">
                    <div>{inv.customer.name}</div>
                    {inv.customer.phone && <div className="text-[10px] text-slate-400 font-mono">{inv.customer.phone}</div>}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                    ₹{inv.grand_total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-4 text-center">
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
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => onViewInvoice(inv)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-brand-900 hover:text-white rounded-lg text-slate-700 font-semibold transition flex items-center space-x-1 ml-auto"
                    >
                      <Eye className="w-3 h-3" />
                      <span>View</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
