import React, { useState, useEffect } from 'react';
import { 
  Save, 
  CheckCircle2, 
  User as UserIcon, 
  MapPin, 
  CreditCard,
  FileText,
  ShieldCheck,
  Smartphone,
  KeyRound,
  Users,
  Plus,
  Edit2,
  X
} from 'lucide-react';
import { ShopSettings, User } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface SettingsViewProps {
  onSaved?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onSaved }) => {
  const { user: currentUser, isAdmin } = useAuth();
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

  // Change Own Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Staff / User Management State (Admin only)
  const [usersList, setUsersList] = useState<User[]>([]);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState({
    username: '',
    full_name: '',
    phone: '',
    email: '',
    role: 'cashier' as 'admin' | 'cashier',
    is_active: true,
    password: '',
  });
  const [savingUser, setSavingUser] = useState(false);
  const [userModalError, setUserModalError] = useState<string | null>(null);
  const [userActionSuccess, setUserActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (isAdmin) {
      loadSettings();
      loadUsers();
    } else {
      setLoading(false);
    }
  }, [isAdmin]);

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

  const loadUsers = async () => {
    try {
      const res = await api.getUsers();
      if (res.success && res.users) {
        setUsersList(res.users);
      }
    } catch (e) {
      console.error('Failed to load users list', e);
    }
  };

  const handleChangeOwnPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    try {
      setChangingPassword(true);
      const res = await api.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      if (res.success) {
        setPasswordSuccess(res.message || 'Password updated successfully.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to update password.');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleOpenAddUser = () => {
    setEditingUser(null);
    setUserForm({
      username: '',
      full_name: '',
      phone: '',
      email: '',
      role: 'cashier',
      is_active: true,
      password: '',
    });
    setUserModalError(null);
    setUserModalOpen(true);
  };

  const handleOpenEditUser = (u: User) => {
    setEditingUser(u);
    setUserForm({
      username: u.username,
      full_name: u.full_name,
      phone: u.phone || '',
      email: u.email || '',
      role: u.role,
      is_active: u.is_active !== false,
      password: '',
    });
    setUserModalError(null);
    setUserModalOpen(true);
  };

  const handleSaveUserModal = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserModalError(null);
    setUserActionSuccess(null);

    if (!userForm.username.trim() || !userForm.full_name.trim()) {
      setUserModalError('Username and full name are required.');
      return;
    }
    if (!editingUser && userForm.password.length < 6) {
      setUserModalError('Password must be at least 6 characters for a new account.');
      return;
    }
    if (editingUser && userForm.password && userForm.password.length < 6) {
      setUserModalError('New password must be at least 6 characters long.');
      return;
    }

    try {
      setSavingUser(true);
      if (editingUser) {
        const res = await api.updateUser(editingUser.id, {
          username: userForm.username.trim(),
          full_name: userForm.full_name.trim(),
          phone: userForm.phone.trim(),
          email: userForm.email.trim(),
          role: userForm.role,
          is_active: userForm.is_active,
          ...(userForm.password ? { new_password: userForm.password } : {}),
        });
        if (res.success) {
          setUserModalOpen(false);
          setUserActionSuccess(res.message);
          loadUsers();
        }
      } else {
        const res = await api.createUser({
          username: userForm.username.trim(),
          full_name: userForm.full_name.trim(),
          phone: userForm.phone.trim(),
          email: userForm.email.trim() || undefined,
          role: userForm.role,
          password: userForm.password,
        });
        if (res.success) {
          setUserModalOpen(false);
          setUserActionSuccess(res.message);
          loadUsers();
        }
      }
    } catch (err: any) {
      setUserModalError(err.message || 'Failed to save account');
    } finally {
      setSavingUser(false);
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
        if (res.settings) {
          setSettings((prev) => ({ ...prev, ...res.settings }));
        }
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
      
      {isAdmin && (
        <>
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
                  <UserIcon className="w-4 h-4" />
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
        </>
      )}

      {/* SECTION 5: ACCOUNT SECURITY & PASSWORD CHANGE (All Logged-in Users) */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4 text-xs">
        <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
            <KeyRound className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-slate-900">
              {isAdmin ? '5. Change My Login Password' : 'Account Security & Change Password'}
            </h3>
            <p className="text-[11px] text-slate-400">
              Logged in as <span className="font-bold text-slate-700">{currentUser?.username}</span> ({currentUser?.role})
            </p>
          </div>
        </div>

        {passwordSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl font-bold flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{passwordSuccess}</span>
          </div>
        )}
        {passwordError && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-medium">
            {passwordError}
          </div>
        )}

        <form onSubmit={handleChangeOwnPassword} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Current Password *</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">New Password * (min 6 chars)</label>
            <input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Confirm New Password *</label>
            <input
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm"
            />
          </div>
          <div className="sm:col-span-3 flex justify-end">
            <button
              type="submit"
              disabled={changingPassword}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow transition disabled:opacity-60"
            >
              {changingPassword ? 'Updating Password...' : 'Update My Password'}
            </button>
          </div>
        </form>
      </div>

      {/* SECTION 6: MANAGE USER & STAFF LOGINS (Admin Only) */}
      {isAdmin && (
        <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-brand-100 text-brand-900 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">
                  6. Manage User Accounts & Staff Logins
                </h3>
                <p className="text-[11px] text-slate-400">
                  Change usernames, reset cashier or admin passwords, or add new staff logins
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleOpenAddUser}
              className="px-3.5 py-2 bg-brand-900 hover:bg-brand-800 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-sm transition shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Staff Login</span>
            </button>
          </div>

          {userActionSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl font-bold flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{userActionSuccess}</span>
            </div>
          )}

          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
            {usersList.map((u) => (
              <div key={u.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white hover:bg-slate-50/70">
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-extrabold text-slate-900 text-sm">{u.full_name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      u.role === 'admin'
                        ? 'bg-amber-100 text-amber-900'
                        : 'bg-blue-50 text-brand-900'
                    }`}>
                      {u.role}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      u.is_active !== false
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {u.is_active !== false ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Username: <span className="font-bold text-slate-800">{u.username}</span>
                    {u.phone ? ` • ${u.phone}` : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenEditUser(u)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-brand-900 hover:text-white text-slate-800 font-bold rounded-lg text-xs flex items-center space-x-1.5 transition self-start sm:self-center"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit / Reset Password</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ADD / EDIT USER MODAL */}
      {userModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden text-xs">
            <div className="px-5 py-4 bg-brand-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-sm">
                  {editingUser ? `Edit Account: ${editingUser.username}` : 'Add New Staff Login'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setUserModalOpen(false)}
                className="text-blue-200 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUserModal} className="p-5 space-y-3.5">
              {userModalError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-medium">
                  {userModalError}
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={userForm.full_name}
                  onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value })}
                  placeholder="e.g. Shop Billing Staff"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Username *</label>
                  <input
                    type="text"
                    required
                    value={userForm.username}
                    onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                    placeholder="e.g. cashier1"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Role *</label>
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value as 'admin' | 'cashier' })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold"
                  >
                    <option value="cashier">Cashier (Billing Desk)</option>
                    <option value="admin">Admin (Owner)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={userForm.phone}
                  onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                  placeholder="+91 ..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  {editingUser ? 'New Password (leave blank to keep current)' : 'Password * (min 6 chars)'}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  minLength={editingUser ? undefined : 6}
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  placeholder={editingUser ? 'Enter new password to reset' : 'Minimum 6 characters'}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                />
              </div>

              {editingUser && (
                <label className="flex items-center space-x-2 pt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={userForm.is_active}
                    onChange={(e) => setUserForm({ ...userForm, is_active: e.target.checked })}
                    className="rounded border-slate-300 text-brand-900"
                  />
                  <span className="font-bold text-slate-700">Account Active (can log in)</span>
                </label>
              )}

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setUserModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingUser}
                  className="px-5 py-2 bg-brand-900 hover:bg-brand-800 text-white font-bold rounded-xl shadow disabled:opacity-60"
                >
                  {savingUser ? 'Saving...' : editingUser ? 'Save Account Changes' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
