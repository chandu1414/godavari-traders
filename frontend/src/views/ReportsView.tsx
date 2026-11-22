import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  DollarSign, 
  Package, 
  PieChart, 
  ArrowUpRight,
  CreditCard
} from 'lucide-react';
import { DashboardMetrics } from '../types';
import { api } from '../services/api';

export const ReportsView: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [categorySales, setCategorySales] = useState<{ category: string; revenue: number; percentage: number }[]>([]);
  const [topProducts, setTopProducts] = useState<{ name: string; revenue: number; quantity: number }[]>([]);
  const [salesTrend, setSalesTrend] = useState<{ date: string; sales: number; count: number }[]>([]);
  const [paymentSplit, setPaymentSplit] = useState<{ mode: string; amount: number; percentage: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const res = await api.getDashboardMetrics();
      if (res.success) {
        setMetrics(res.metrics);
        setCategorySales(res.category_sales || []);
        setTopProducts(res.top_products || []);
        setSalesTrend(res.sales_trend_7d || []);
        setPaymentSplit(res.payment_mode_split || []);
      }
    } catch (e) {
      console.error('Failed to load reports', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Sales Analytics & Business Reports
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Comprehensive performance summaries, fast-moving construction inventory, and payment channels.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold uppercase text-slate-400">Today's Revenue</span>
          <p className="text-xl sm:text-2xl font-black text-slate-900 font-mono mt-1">
            ₹{(metrics?.today_sales || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
          <span className="text-[11px] text-slate-500 font-medium mt-1 block">
            {metrics?.today_bills_count || 0} invoices today
          </span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold uppercase text-slate-400">Yesterday's Revenue</span>
          <p className="text-xl sm:text-2xl font-black text-slate-900 font-mono mt-1">
            ₹{(metrics?.yesterday_sales || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
          <span className="text-[11px] text-slate-500 font-medium mt-1 block">Previous day closing</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold uppercase text-slate-400">This Month's Sales</span>
          <p className="text-xl sm:text-2xl font-black text-emerald-600 font-mono mt-1">
            ₹{(metrics?.month_sales || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
          <span className="text-[11px] text-slate-500 font-medium mt-1 block">Monthly billing turnover</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold uppercase text-slate-400">Total Billed Volume</span>
          <p className="text-xl sm:text-2xl font-black text-brand-900 font-mono mt-1">
            ₹{(metrics?.total_sales || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
          <span className="text-[11px] text-slate-500 font-medium mt-1 block">
            Across {metrics?.total_invoices_count || 0} total bills
          </span>
        </div>

      </div>

      {/* Grid: Fast-Moving Products & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Fast-Moving Products */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center space-x-2 mb-4">
            <Package className="w-5 h-5 text-brand-900" />
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
              Top Selling Construction Materials
            </h3>
          </div>

          <div className="space-y-3">
            {topProducts.map((p, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-3">
                  <span className="w-6 h-6 rounded-full bg-brand-900 text-white font-bold flex items-center justify-center text-[11px]">
                    {idx + 1}
                  </span>
                  <div>
                    <p className="font-bold text-slate-900">{p.name}</p>
                    <span className="text-[10px] text-slate-500">Volume: {p.quantity} units sold</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-mono font-black text-slate-950 text-sm">
                    ₹{p.revenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category Contribution */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center space-x-2 mb-4">
            <PieChart className="w-5 h-5 text-brand-900" />
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
              Revenue Split by Category
            </h3>
          </div>

          <div className="space-y-3.5">
            {categorySales.map((c, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-800">{c.category}</span>
                  <span className="text-slate-600 font-mono">
                    ₹{c.revenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })} ({c.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-brand-900 h-2.5 rounded-full"
                    style={{ width: `${Math.min(100, c.percentage)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Payment Modes Breakdown */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center space-x-2 mb-4">
          <CreditCard className="w-5 h-5 text-emerald-600" />
          <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
            Payment Mode Distribution
          </h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {paymentSplit.map((p, idx) => (
            <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400">{p.mode}</span>
              <p className="text-base font-black text-slate-900 font-mono mt-1">
                ₹{p.amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
              <span className="text-[10px] text-emerald-700 font-semibold">{p.percentage}% of sales</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
