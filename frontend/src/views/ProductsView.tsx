import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  AlertTriangle, 
  X, 
  Check, 
  Layers, 
  Filter,
  DollarSign
} from 'lucide-react';
import { Product } from '../types';
import { api } from '../services/api';

export const ProductsView: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [units, setUnits] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [loading, setLoading] = useState(true);

  // Modal State for Add / Edit Product
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    brand: '',
    category: 'Cement',
    unit: 'Bag',
    selling_price: 0,
    purchase_price: 0,
    stock: 0,
    min_stock_alert: 10,
    hsn_code: '2523',
    gst_rate: 18,
    description: '',
    is_active: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Quick Stock Adjustment Modal State
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [selectedForStock, setSelectedForStock] = useState<Product | null>(null);
  const [stockQtyChange, setStockQtyChange] = useState<number>(0);
  const [stockReason, setStockReason] = useState('New batch received');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [prodRes, catRes, unitRes] = await Promise.all([
        api.getProducts({ active_only: false }),
        api.getCategories(),
        api.getUnits()
      ]);
      if (prodRes.success) setProducts(prodRes.products);
      if (catRes.success) setCategories(['All', ...catRes.categories]);
      if (unitRes.success) setUnits(unitRes.units);
    } catch (e) {
      console.error('Failed to load products', e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      brand: '',
      category: categories.length > 1 ? categories[1] : 'Cement',
      unit: units.length > 0 ? units[0] : 'Bag',
      selling_price: 0,
      purchase_price: 0,
      stock: 0,
      min_stock_alert: 10,
      hsn_code: '2523',
      gst_rate: 18,
      description: '',
      is_active: true
    });
    setErrorMsg(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({ ...product });
    setErrorMsg(null);
    setModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim() || Number(formData.selling_price) <= 0) {
      setErrorMsg('Product name and a positive selling price are required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      if (editingProduct) {
        const res = await api.updateProduct(editingProduct._id, formData);
        if (res.success) {
          setModalOpen(false);
          loadData();
        }
      } else {
        const res = await api.createProduct(formData);
        if (res.success) {
          setModalOpen(false);
          loadData();
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdjustStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedForStock || stockQtyChange === 0) return;

    try {
      setIsSubmitting(true);
      const res = await api.adjustStock(selectedForStock._id, stockQtyChange, stockReason);
      if (res.success) {
        setStockModalOpen(false);
        loadData();
      }
    } catch (err: any) {
      alert('Error updating stock: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (product: Product) => {
    try {
      await api.updateProduct(product._id, { is_active: !product.is_active });
      loadData();
    } catch (e: any) {
      alert('Failed to update product status');
    }
  };

  const filtered = products.filter((p) => {
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch = search === '' ||
      (p.name + ' ' + p.brand + ' ' + p.category).toLowerCase().includes(search.toLowerCase());
    const matchesLowStock = !filterLowStock || p.stock <= (p.min_stock_alert || 10);
    return matchesCat && matchesSearch && matchesLowStock;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Product Catalogue Management
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Configure construction materials, stock inventory, and dynamic selling prices.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-brand-900 hover:bg-brand-800 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center space-x-2 shadow-sm transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add New Product</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search material by name, brand, category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-brand-900 focus:bg-white text-slate-900"
          />
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-brand-900"
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <button
            onClick={() => setFilterLowStock(!filterLowStock)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition whitespace-nowrap ${
              filterLowStock
                ? 'bg-rose-100 text-rose-800 border border-rose-300 font-bold'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Low Stock Only</span>
          </button>
        </div>
      </div>

      {/* Product List Table / Cards */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Material / Product</th>
                <th className="py-3 px-4">Brand</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-center">Unit</th>
                <th className="py-3 px-4 text-right">Selling Price</th>
                <th className="py-3 px-4 text-center">Stock</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((product) => {
                const isLow = product.stock <= (product.min_stock_alert || 10);
                return (
                  <tr key={product._id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      <div>{product.name}</div>
                      {product.hsn_code && (
                        <span className="text-[10px] text-slate-400 font-mono">HSN: {product.hsn_code} • GST: {product.gst_rate}%</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-semibold uppercase text-[11px]">
                      {product.brand}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {product.category}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-600 font-medium">
                      {product.unit}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-950 text-sm">
                      ₹{product.selling_price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => {
                          setSelectedForStock(product);
                          setStockQtyChange(0);
                          setStockModalOpen(true);
                        }}
                        className={`px-2 py-0.5 rounded text-xs font-bold transition hover:ring-2 hover:ring-brand-500 ${
                          isLow ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                        }`}
                        title="Click to adjust stock"
                      >
                        {product.stock} {product.unit}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleToggleActive(product)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          product.is_active
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {product.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      <button
                        onClick={() => handleOpenEdit(product)}
                        className="p-1.5 bg-slate-100 hover:bg-brand-900 hover:text-white rounded-lg text-slate-700 transition"
                        title="Edit Product"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full overflow-hidden">
            <div className="bg-brand-900 text-white px-5 py-4 flex items-center justify-between">
              <h3 className="font-extrabold text-base">
                {editingProduct ? 'Edit Construction Material' : 'Add New Material to Catalogue'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-5 space-y-4 text-xs">
              {errorMsg && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 uppercase mb-1">Product / Material Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. UltraTech Super Cement or TMT Bar 12mm"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-brand-900 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Brand / Company *</label>
                  <input
                    type="text"
                    placeholder="e.g. UltraTech, Tata Tiscon, Jindal"
                    value={formData.brand || ''}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Category *</label>
                  <select
                    value={formData.category || 'Cement'}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                  >
                    {categories.filter(c => c !== 'All').map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Measurement Unit *</label>
                  <select
                    value={formData.unit || 'Bag'}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                  >
                    {units.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Selling Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.selling_price || ''}
                    onChange={(e) => setFormData({ ...formData, selling_price: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Purchase Price (₹, optional)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.purchase_price || ''}
                    onChange={(e) => setFormData({ ...formData, purchase_price: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Available Stock Qty</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.stock || ''}
                    onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Min Stock Alert Level</label>
                  <input
                    type="number"
                    value={formData.min_stock_alert || ''}
                    onChange={(e) => setFormData({ ...formData, min_stock_alert: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">GST Rate (%)</label>
                  <select
                    value={formData.gst_rate ?? 18}
                    onChange={(e) => setFormData({ ...formData, gst_rate: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                  >
                    <option value={0}>0% (Exempt)</option>
                    <option value={5}>5% (Sand, Stone Dust)</option>
                    <option value={12}>12% (Bricks, Blocks)</option>
                    <option value={18}>18% (Steel, Binding, Chemicals)</option>
                    <option value={28}>28% (Cement)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 uppercase mb-1">Description / Specifications</label>
                  <textarea
                    rows={2}
                    placeholder="Specification notes (e.g. 50kg PPC, Fe-550 ductile, etc.)"
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-600 font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-brand-900 hover:bg-brand-800 text-white rounded-xl font-bold shadow-sm"
                >
                  {isSubmitting ? 'Saving...' : 'Save Material'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Stock Adjustment Modal */}
      {stockModalOpen && selectedForStock && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5 space-y-4 text-xs">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">Adjust Inventory Stock</h3>
                <p className="text-slate-500 mt-0.5">{selectedForStock.name}</p>
              </div>
              <button onClick={() => setStockModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
              <span className="text-[11px] text-slate-400 uppercase font-bold">Current In-Stock</span>
              <p className="text-xl font-black text-slate-900 font-mono mt-0.5">
                {selectedForStock.stock} {selectedForStock.unit}
              </p>
            </div>

            <form onSubmit={handleAdjustStockSubmit} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Quantity Change (+ to Add, - to Deduct)
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  placeholder="+50 or -5"
                  value={stockQtyChange || ''}
                  onChange={(e) => setStockQtyChange(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-sm font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Reason / Note</label>
                <input
                  type="text"
                  required
                  value={stockReason}
                  onChange={(e) => setStockReason(e.target.value)}
                  placeholder="e.g. Received new truck shipment"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStockModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || stockQtyChange === 0}
                  className="px-4 py-1.5 bg-brand-900 hover:bg-brand-800 text-white rounded-lg font-bold"
                >
                  {isSubmitting ? 'Updating...' : 'Update Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
