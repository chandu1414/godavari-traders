import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Save, 
  CheckCircle2, 
  User, 
  Phone, 
  MapPin, 
  CreditCard,
  FileText,
  ShieldCheck,
  Smartphone
} from 'lucide-react';
import { ShopSettings } from '../types';
import { api } from '../services/api';

interface SettingsViewProps {
  onSaved?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onSaved }) => {
  const [settings, setSettings] = useState<Partial<ShopSettings>>({
    shop_name: 'GODAVARI TRADERS',
    owner_name: 'Prathik Yadav',
    tagline: 'Wholesale & Retail Building Materials - Cement, Steel, Stone Dust & Sand',
    address_line1: 'Siddapu Road',
    address_line2: 'Sadashivpet',
    city: 'Sadashivpet',
    district: 'Sangareddy',
    state: 'Telangana',
    pincode: '502291',
    state_code: '36',
    phone: '',
    whatsapp_number: '',
    email: 'contact@godavaritraders.com',
    gstin: '',
    pan_number: '',
    upi_id: 'godavaritraders@okaxis',
    bank_name: 'State Bank of India',
    bank_account_no: '38291029381',
    bank_ifsc: 'SBIN0001234',
    invoice_prefix: 'GT-2026-',
    terms_conditions: '1. Goods once sold will not be accepted or exchanged without prior inspection.\n2. Delivery of materials is subject to road and site unloading clearance.\n3. Disputes subject to Sangareddy jurisdiction only.',
    footer_notes: 'Thank you for building with Godavari Traders!'
  });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await api.getSettings();
      if (res.success && res.settings) {
        setSettings((prev) => ({ ...prev, ...res.settings }));
      }
    } catch (e: any) {
      setErrorMsg('Failed to load shop settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      setErrorMsg(null);
      setSaveSuccess(false);

      const res = await api.updateSettings(settings);
      if (res.success) {
        setSaveSuccess(true);
        if (onSaved) onSaved();
        setTimeout(() => setSaveSuccess(false), 3500);
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Error updating settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400 text-xs">
        <div className="w-8 h-8 border-4 border-brand-900 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        Loading shop settings...
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto pb-12">
      
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 uppercase tracking-wider">
              Profile & Configuration
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
            Shop Information & Settings
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage owner details, contact phone numbers, shop address in Sadashivpet, and bill templates.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="px-5 py-2.5 bg-brand-900 hover:bg-brand-800 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md flex items-center justify-center space-x-2 transition shrink-0"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Saving...' : 'Save All Changes'}</span>
        </button>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center space-x-2 shadow-sm animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Shop address and owner details saved successfully! All future bills will use these updated details.</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-medium">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        
        {/* SECTION 1: OWNER & CONTACT DETAILS (Special Dedicated Section) */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border-2 border-brand-900/10 space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">
                1. Shop Owner & Contact Information
              </h3>
              <p className="text-[11px] text-slate-400">Owner identity and contact numbers for customer billing</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {/* Owner Name */}
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1 flex items-center space-x-1">
                <span>Owner / Proprietor Name *</span>
              </label>
              <input
                type="text"
                required
                value={settings.owner_name || ''}
                onChange={(e) => setSettings({ ...settings, owner_name: e.target.value })}
                placeholder="e.g. Prathik Yadav"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 text-sm focus:ring-2 focus:ring-brand-900 focus:bg-white"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Printed on bills as Authorized Signatory (e.g. Prathik Yadav)
              </span>
            </div>

            {/* Owner Mobile Number */}
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1 flex items-center space-x-1 text-brand-900">
                <Smartphone className="w-3.5 h-3.5 text-brand-900" />
                <span>Owner Mobile Number (Calling)</span>
              </label>
              <input
                type="tel"
                value={settings.phone || ''}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                placeholder="Enter owner mobile number here"
                className="w-full px-3.5 py-2.5 bg-amber-50/50 border border-amber-300 rounded-xl font-mono font-bold text-slate-900 text-sm focus:ring-2 focus:ring-brand-900 focus:bg-white"
              />
              <span className="text-[10px] text-amber-800 font-medium mt-1 block">
                You can enter or update your mobile number here anytime.
              </span>
            </div>

            {/* WhatsApp Business Number */}
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                WhatsApp Number (For Sending Invoices)
              </label>
              <input
                type="tel"
                value={settings.whatsapp_number || ''}
                onChange={(e) => setSettings({ ...settings, whatsapp_number: e.target.value })}
                placeholder="e.g. 9848022334 (with or without 91)"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-sm focus:ring-2 focus:ring-brand-900 focus:bg-white"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Used to generate direct WhatsApp bill sharing links.
              </span>
            </div>

            {/* Email Address */}
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Shop Email (Optional)
              </label>
              <input
                type="email"
                value={settings.email || ''}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                placeholder="e.g. contact@godavaritraders.com"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: SHOP LOCATION & ADDRESS (Siddapu Road, Sadashivpet) */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-brand-900 flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">
                2. Shop Name & Sadashivpet Address
              </h3>
              <p className="text-[11px] text-slate-400">Physical shop premises details printed on all customer bills</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 uppercase mb-1">Shop / Business Name *</label>
              <input
                type="text"
                required
                value={settings.shop_name || 'GODAVARI TRADERS'}
                onChange={(e) => setSettings({ ...settings, shop_name: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-black text-slate-950 text-base"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 uppercase mb-1">Tagline / Business Description</label>
              <input
                type="text"
                value={settings.tagline || ''}
                onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                placeholder="Wholesale & Retail Building Materials - Cement, Steel, Stone Dust & Sand"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Street / Road Address *</label>
              <input
                type="text"
                required
                value={settings.address_line1 || 'Siddapu Road'}
                onChange={(e) => setSettings({ ...settings, address_line1: e.target.value })}
                placeholder="Siddapu Road"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Town / City *</label>
              <input
                type="text"
                required
                value={settings.city || 'Sadashivpet'}
                onChange={(e) => setSettings({ ...settings, city: e.target.value })}
                placeholder="Sadashivpet"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">District *</label>
              <input
                type="text"
                required
                value={settings.district || 'Sangareddy'}
                onChange={(e) => setSettings({ ...settings, district: e.target.value })}
                placeholder="Sangareddy dist"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">State & PIN Code *</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  placeholder="State"
                  value={settings.state || 'Telangana'}
                  onChange={(e) => setSettings({ ...settings, state: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                />
                <input
                  type="text"
                  required
                  placeholder="PIN Code"
                  value={settings.pincode || '502291'}
                  onChange={(e) => setSettings({ ...settings, pincode: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: PAYMENT ACCOUNTS & UPI QR */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-900 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">
                3. Customer UPI QR & Bank Account
              </h3>
              <p className="text-[11px] text-slate-400">Customers can scan the QR code printed on bills to pay directly via PhonePe / GPay</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">UPI ID (For Dynamic Bill QR Code)</label>
              <input
                type="text"
                value={settings.upi_id || ''}
                onChange={(e) => setSettings({ ...settings, upi_id: e.target.value })}
                placeholder="e.g. godavari.traders@upi or mobile@okaxis"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-brand-900"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Bank Name</label>
              <input
                type="text"
                value={settings.bank_name || ''}
                onChange={(e) => setSettings({ ...settings, bank_name: e.target.value })}
                placeholder="e.g. State Bank of India, Sadashivpet Branch"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Bank Account Number</label>
              <input
                type="text"
                value={settings.bank_account_no || ''}
                onChange={(e) => setSettings({ ...settings, bank_account_no: e.target.value })}
                placeholder="Account Number"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Bank IFSC Code</label>
              <input
                type="text"
                value={settings.bank_ifsc || ''}
                onChange={(e) => setSettings({ ...settings, bank_ifsc: e.target.value })}
                placeholder="e.g. SBIN0020123"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono uppercase"
              />
            </div>
          </div>
        </div>

        {/* SECTION 4: INVOICE TERMS & FOOTER */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">
                4. Invoice Prefix & Terms
              </h3>
              <p className="text-[11px] text-slate-400">Custom invoice numbering and shop terms printed at the bottom</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Invoice Number Prefix</label>
              <input
                type="text"
                value={settings.invoice_prefix || 'GT-2026-'}
                onChange={(e) => setSettings({ ...settings, invoice_prefix: e.target.value })}
                className="w-48 px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-sm"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Terms & Conditions (Printed on Bills)</label>
              <textarea
                rows={3}
                value={settings.terms_conditions || ''}
                onChange={(e) => setSettings({ ...settings, terms_conditions: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs leading-relaxed"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Thank You Note</label>
              <input
                type="text"
                value={settings.footer_notes || ''}
                onChange={(e) => setSettings({ ...settings, footer_notes: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl"
              />
            </div>
          </div>
        </div>

        {/* Bottom Save Action Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="w-full sm:w-auto px-8 py-3.5 bg-brand-900 hover:bg-brand-800 text-white font-extrabold rounded-xl text-sm shadow-md flex items-center justify-center space-x-2 transition active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving All Information...' : 'Save All Shop Information'}</span>
          </button>
        </div>

      </form>

    </div>
  );
};
