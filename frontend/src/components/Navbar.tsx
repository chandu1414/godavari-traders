import React from 'react';
import { Building2, LogOut, User as UserIcon, Bell, ShieldCheck, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  shopName?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate, shopName = 'GODAVARI TRADERS' }) => {
  const { user, logout, isAdmin } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-brand-900 text-white shadow-md border-b border-brand-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand Name */}
          <div 
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => onNavigate('dashboard')}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-amber-400 p-0.5 shadow-sm">
              <div className="w-full h-full bg-brand-950 rounded-[10px] flex items-center justify-center">
                <Building2 className="w-6 h-6 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg sm:text-xl tracking-wider text-white">
                  {shopName}
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] uppercase font-bold tracking-widest bg-amber-400/20 text-amber-300 rounded border border-amber-400/30">
                  POS
                </span>
              </div>
              <p className="text-[11px] text-blue-200 hidden sm:block tracking-wide">
                Building Materials • Cement • Steel • Stone Dust • Sand
              </p>
            </div>
          </div>

          {/* Quick Create Bill & User Controls */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button
              onClick={() => onNavigate('billing')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 flex items-center space-x-1.5 shadow-sm ${
                currentView === 'billing'
                  ? 'bg-amber-400 text-slate-950 font-bold'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              <span>+ New Bill</span>
            </button>

            {/* User Profile Pill */}
            {user && (
              <div className="flex items-center space-x-2 pl-2 border-l border-brand-800">
                <div className="hidden md:flex flex-col text-right">
                  <span className="text-xs font-semibold text-white flex items-center justify-end space-x-1">
                    <span>{user.full_name}</span>
                    {isAdmin && <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />}
                  </span>
                  <span className="text-[10px] text-blue-300 uppercase tracking-wider">
                    {user.role}
                  </span>
                </div>
                <div className="w-8 h-8 rounded-full bg-brand-800 border border-brand-700 flex items-center justify-center text-amber-400 font-bold text-xs">
                  {user.username.slice(0, 2).toUpperCase()}
                </div>
                <button
                  onClick={() => onNavigate('settings')}
                  title="Shop Settings & Owner Profile"
                  className="p-1.5 rounded-lg text-blue-200 hover:text-white hover:bg-brand-800 transition"
                >
                  <Settings className="w-4 h-4" />
                </button>
                <button
                  onClick={logout}
                  title="Logout"
                  className="p-1.5 rounded-lg text-blue-200 hover:text-white hover:bg-brand-800 transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
