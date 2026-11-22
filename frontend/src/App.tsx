import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { InvoiceModal } from './components/InvoiceModal';

import { LoginView } from './views/LoginView';
import { DashboardView } from './views/DashboardView';
import { POSBillingView } from './views/POSBillingView';
import { ProductsView } from './views/ProductsView';
import { InvoicesView } from './views/InvoicesView';
import { CustomersView } from './views/CustomersView';
import { ReportsView } from './views/ReportsView';
import { SettingsView } from './views/SettingsView';
import { PublicInvoiceView } from './views/PublicInvoiceView';

import { Invoice, ShopSettings } from './types';
import { api } from './services/api';

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [shopName, setShopName] = useState<string>('GODAVARI TRADERS');
  const [shopSettings, setShopSettings] = useState<ShopSettings | null>(null);

  const fetchSettings = () => {
    api.getSettings()
      .then((res) => {
        if (res.success && res.settings) {
          setShopSettings(res.settings);
          if (res.settings.shop_name) {
            setShopName(res.settings.shop_name);
          }
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-brand-900 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-brand-900 uppercase tracking-wider">
            Loading Godavari Traders...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginView />;
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col antialiased text-slate-900 pb-16 md:pb-0">
      {/* Top Navbar */}
      <Navbar
        currentView={currentView}
        onNavigate={setCurrentView}
        shopName={shopName}
      />

      <div className="flex-1 flex">
        {/* Desktop Sidebar */}
        <Sidebar
          currentView={currentView}
          onNavigate={setCurrentView}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-x-hidden">
          {currentView === 'dashboard' && (
            <DashboardView
              onNavigate={setCurrentView}
              onViewInvoice={setSelectedInvoice}
            />
          )}

          {currentView === 'billing' && (
            <POSBillingView
              onInvoiceCreated={(inv) => setSelectedInvoice(inv)}
            />
          )}

          {currentView === 'products' && (
            <ProductsView />
          )}

          {currentView === 'invoices' && (
            <InvoicesView
              onViewInvoice={setSelectedInvoice}
            />
          )}

          {currentView === 'customers' && (
            <CustomersView
              onViewInvoice={setSelectedInvoice}
              shopSettings={shopSettings}
            />
          )}

          {currentView === 'reports' && (
            <ReportsView />
          )}

          {currentView === 'settings' && (
            <SettingsView
              onSaved={fetchSettings}
            />
          )}
        </main>
      </div>

      {/* Mobile Priority-1 Bottom Navigation Bar */}
      <BottomNav
        currentView={currentView}
        onNavigate={setCurrentView}
      />

      {/* Invoice Viewer / Printable Modal */}
      <InvoiceModal
        invoice={selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
      />
    </div>
  );
};

export function App() {
  // Check for public customer invoice viewing link (e.g. /invoice/view/:token)
  const pathname = window.location.pathname;
  if (pathname.startsWith('/invoice/view/')) {
    const token = pathname.replace('/invoice/view/', '').trim();
    return <PublicInvoiceView token={token} />;
  }

  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
