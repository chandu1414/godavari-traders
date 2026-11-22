import React, { useState } from 'react';
import { Building2, Lock, User, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginView: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = await login(username, password);
    if (!result.success) {
      setError(result.message || 'Invalid username or password');
      setIsSubmitting(false);
    }
  };

  const handleQuickFill = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        {/* Brand Header */}
        <div className="text-center">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-brand-900 text-amber-400 items-center justify-center shadow-lg shadow-brand-900/20 mb-4 border border-brand-800">
            <Building2 className="w-10 h-10" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-brand-950 tracking-tight">
            GODAVARI TRADERS
          </h1>
          <p className="mt-1 text-sm text-slate-600 font-medium">
            Digital Billing & Product Management System
          </p>
          <p className="text-xs text-brand-700 mt-0.5">
            Cement • TMT Steel • White Stone Dust • Sand • Aggregates
          </p>
        </div>

        {/* Card Form */}
        <div className="mt-8 bg-white py-8 px-6 shadow-xl rounded-2xl sm:px-10 border border-slate-200">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Username or Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin or owner@godavaritraders.com"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-900 focus:bg-white text-slate-900 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-900 focus:bg-white text-slate-900 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-brand-900 hover:bg-brand-800 text-white font-bold rounded-xl text-sm shadow-md shadow-brand-900/20 flex items-center justify-center space-x-2 transition active:scale-[0.99] disabled:opacity-70"
            >
              <span>{isSubmitting ? 'Authenticating...' : 'Sign In to Shop POS'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center mb-3">
              Quick Login Demo Access
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('admin', 'Godavari@2026')}
                className="p-2.5 bg-brand-50 hover:bg-brand-100 border border-brand-200 rounded-xl text-left transition flex items-center space-x-2"
              >
                <ShieldCheck className="w-4 h-4 text-brand-900 shrink-0" />
                <div className="truncate">
                  <p className="text-xs font-bold text-brand-950 truncate">Shop Owner</p>
                  <p className="text-[10px] text-slate-500 font-mono truncate">admin</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('cashier', 'Billing@2026')}
                className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition flex items-center space-x-2"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <div className="truncate">
                  <p className="text-xs font-bold text-slate-900 truncate">Billing Staff</p>
                  <p className="text-[10px] text-slate-500 font-mono truncate">cashier</p>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-slate-400 mt-6">
          Authorized shop access only • Godavari Traders, Sadashivpet, Sangareddy
        </p>
      </div>
    </div>
  );
};
