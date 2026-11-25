import React from 'react';
import { 
  LayoutDashboard, 
  Receipt, 
  Package, 
  FileText, 
  Users, 
  BarChart3, 
  Settings,
  HelpCircle,
  Truck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate }) => {
  const { isAdmin } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'billing', label: 'Create Bill (POS)', icon: Receipt, highlight: true },
    { id: 'products', label: 'Product Catalogue', icon: Package },
    { id: 'invoices', label: 'Invoice History', icon: FileText },
    { id: 'customers', label: 'Customer Ledger (Khata)', icon: Users },
    { id: 'reports', label: 'Sales & Reports', icon: BarChart3 },
    { id: 'settings', label: isAdmin ? 'Shop & Account Settings' : 'Account & Password', icon: Settings },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-4rem)] p-4 shadow-sm">
      <div className="space-y-1.5 flex-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;

          if (item.highlight) {
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm mb-4 ${
                  isActive
                    ? 'bg-amber-400 text-slate-950 font-bold ring-2 ring-amber-300'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-brand-50 text-brand-900 font-bold border-l-4 border-brand-900'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-brand-900' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Construction Material Info Card in Sidebar */}
      <div className="mt-auto pt-4 border-t border-slate-100">
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 text-xs text-slate-600">
          <div className="flex items-center space-x-2 text-brand-900 font-semibold mb-1">
            <Truck className="w-4 h-4 text-amber-500" />
            <span>Godavari Delivery</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-tight">
            Tipper & lorry site delivery available across Sadashivpet, Sangareddy & surrounding regions.
          </p>
        </div>
      </div>
    </aside>
  );
};
