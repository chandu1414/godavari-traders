import React, { useState, useEffect } from 'react';
import { 
  Search, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  Truck, 
  Tag, 
  FileCheck, 
  CheckCircle, 
  Building2,
  Package,
  Layers,
  ArrowRight,
  User,
  Phone,
  MapPin,
  Percent,
  Check,
  AlertCircle
} from 'lucide-react';
import { Product, CartItem, Invoice, Customer } from '../types';
import { api } from '../services/api';

interface POSBillingViewProps {
  onInvoiceCreated: (invoice: Invoice) => void;
}

export const POSBillingView: React.FC<POSBillingViewProps> = ({ onInvoiceCreated }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerWhatsapp, setCustomerWhatsapp] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');

  // Delivery state
  const [isDelivery, setIsDelivery] = useState(false);
  const [deliveryCharge, setDeliveryCharge] = useState<number>(0);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');

  // Discount & GST (Defaults to Non-GST / 0 tax per owner preference)
  const [discountType, setDiscountType] = useState<'fixed' | 'percent'>('fixed');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [isGstInvoice, setIsGstInvoice] = useState(false);

  // Payment
  const [paymentMode, setPaymentMode] = useState<string>('Cash');
  const [paymentStatus, setPaymentStatus] = useState<'PAID' | 'PARTIAL' | 'PENDING'>('PAID');
  const [amountPaid, setAmountPaid] = useState<number>(0);

  // Notes
  const [invoiceNotes, setInvoiceNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Mobile cart drawer toggle
  const [showMobileCart, setShowMobileCart] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const [prodRes, catRes] = await Promise.all([
        api.getProducts({ active_only: true }),
        api.getCategories()
      ]);
      if (prodRes.success) setProducts(prodRes.products);
      if (catRes.success) setCategories(['All', ...catRes.categories]);
    } catch (e) {
      console.error('Failed to load products for POS', e);
    } finally {
      setLoading(false);
    }
  };

  // Add to cart
  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product_id === product._id);
      if (existing) {
        return prev.map((item) =>
          item.product_id === product._id
            ? { ...item, quantity: item.quantity + 1, amount: (item.quantity + 1) * item.rate }
            : item
        );
      } else {
        const newItem: CartItem = {
          product_id: product._id,
          product_name: product.name,
          brand: product.brand,
          category: product.category,
          unit: product.unit,
          quantity: 1,
          rate: product.selling_price,
          amount: product.selling_price,
          gst_rate: product.gst_rate || 18,
          hsn_code: product.hsn_code || '2523'
        };
        return [...prev, newItem];
      }
    });
  };

  // Update item quantity
  const updateQuantity = (productId: string | undefined, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product_id === productId) {
            const newQty = Math.max(1, item.quantity + delta);
            return { ...item, quantity: newQty, amount: newQty * item.rate };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  // Set explicit quantity
  const setQuantity = (productId: string | undefined, qty: number) => {
    const validQty = Math.max(1, qty);
    setCart((prev) =>
      prev.map((item) =>
        item.product_id === productId
          ? { ...item, quantity: validQty, amount: validQty * item.rate }
          : item
      )
    );
  };

  // Remove item
  const removeFromCart = (productId: string | undefined) => {
    setCart((prev) => prev.filter((item) => item.product_id !== productId));
  };

  // Auto Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.amount, 0);
  const discountAmount = discountType === 'percent'
    ? roundToTwo(subtotal * (discountValue / 100))
    : roundToTwo(Math.min(discountValue, subtotal));
  
  const taxableAmount = Math.max(0, subtotal - discountAmount);

  // GST Calculation
  let totalTax = 0;
  if (isGstInvoice && subtotal > 0) {
    const discountRatio = taxableAmount / subtotal;
    cart.forEach((item) => {
      const itemTaxable = item.amount * discountRatio;
      const itemGst = itemTaxable * (item.gst_rate / 100);
      totalTax += itemGst;
    });
  }
  totalTax = roundToTwo(totalTax);

  const delivery = isDelivery ? (Number(deliveryCharge) || 0) : 0;
  const rawTotal = taxableAmount + totalTax + delivery;
  const grandTotal = Math.round(rawTotal);
  const roundOff = roundToTwo(grandTotal - rawTotal);

  function roundToTwo(num: number): number {
    return Math.round((num + Number.EPSILON) * 100) / 100;
  }

  // Update amount paid when grandTotal or paymentStatus changes
  useEffect(() => {
    if (paymentStatus === 'PAID') {
      setAmountPaid(grandTotal);
    } else if (paymentStatus === 'PENDING') {
      setAmountPaid(0);
    }
  }, [grandTotal, paymentStatus]);

  // Handle invoice generation
  const handleGenerateInvoice = async () => {
    if (cart.length === 0) {
      setErrorMsg('Please add at least one material to the cart.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      const payload = {
        customer: {
          name: customerName.trim() || 'Walk-in Customer',
          phone: customerPhone.trim(),
          whatsapp: customerWhatsapp.trim() || customerPhone.trim(),
          address: customerAddress.trim()
        },
        items: cart,
        discount_type: discountType,
        discount_value: discountValue,
        is_gst_invoice: isGstInvoice,
        is_delivery: isDelivery,
        delivery_charge: delivery,
        delivery_address: deliveryAddress.trim() || customerAddress.trim(),
        delivery_instructions: deliveryInstructions.trim(),
        payment_mode: paymentMode,
        payment_status: paymentStatus,
        amount_paid: paymentStatus === 'PAID' ? grandTotal : Number(amountPaid),
        notes: invoiceNotes.trim()
      };

      const res = await api.createInvoice(payload);
      if (res.success && res.invoice) {
        // Reset cart
        setCart([]);
        setCustomerName('');
        setCustomerPhone('');
        setCustomerWhatsapp('');
        setCustomerAddress('');
        setIsDelivery(false);
        setDeliveryCharge(0);
        setDiscountValue(0);
        setShowMobileCart(false);
        onInvoiceCreated(res.invoice);
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to generate invoice. Please check entries.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      (p.name + ' ' + p.brand + ' ' + p.category).toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)] bg-slate-100 overflow-hidden">
      
      {/* LEFT: VISUAL PRODUCT CATALOGUE */}
      <div className="flex-1 flex flex-col h-full overflow-hidden p-3 sm:p-5">
        
        {/* Search & Category Tabs */}
        <div className="space-y-3 bg-white p-3 sm:p-4 rounded-2xl shadow-sm border border-slate-200 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search cement, steel rebar, stone dust, river sand, bricks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-900 focus:bg-white text-slate-900 transition"
            />
          </div>

          {/* Category Chips Horizontal Scroll */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-brand-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto mt-3 pr-1">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-6 h-6 border-2 border-brand-900 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 mt-2">
              <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No matching construction materials</p>
              <p className="text-xs text-slate-400 mt-1">Try another search keyword or category tab.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3.5">
              {filteredProducts.map((product) => {
                const inCartItem = cart.find((it) => it.product_id === product._id);
                return (
                  <div
                    key={product._id}
                    onClick={() => addToCart(product)}
                    className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-3.5 shadow-sm hover:shadow-md hover:border-brand-300 cursor-pointer transition-all flex flex-col justify-between group active:scale-[0.98]"
                  >
                    <div>
                      {/* Brand & Stock Tag */}
                      <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                        <span className="font-bold uppercase tracking-wider text-brand-900">{product.brand}</span>
                        <span className={`px-1.5 py-0.5 rounded font-bold ${
                          product.stock > 10 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                        }`}>
                          {product.stock} {product.unit} left
                        </span>
                      </div>

                      {/* Product Name */}
                      <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 group-hover:text-brand-900 line-clamp-2 leading-snug">
                        {product.name}
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">{product.category}</p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Rate / {product.unit}</span>
                        <span className="text-sm sm:text-base font-black text-slate-950 font-mono">
                          ₹{product.selling_price.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </span>
                      </div>

                      {inCartItem ? (
                        <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                          {inCartItem.quantity}
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-lg bg-brand-50 group-hover:bg-brand-900 text-brand-900 group-hover:text-white flex items-center justify-center transition shadow-sm">
                          <Plus className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Mobile View Cart Bar */}
        <div className="lg:hidden mt-2 shrink-0">
          <button
            onClick={() => setShowMobileCart(true)}
            className="w-full py-3 px-4 bg-brand-900 text-white rounded-xl font-bold text-sm shadow-md flex items-center justify-between"
          >
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 text-xs flex items-center justify-center font-extrabold">
                {cart.length}
              </div>
              <span>View Cart & Bill</span>
            </div>
            <span className="font-mono text-amber-300">₹{grandTotal.toLocaleString('en-IN')}</span>
          </button>
        </div>

      </div>

      {/* RIGHT: POS CART & BILLING PANEL (Slide-over on mobile, persistent on desktop) */}
      <div className={`
        fixed lg:static inset-0 z-50 lg:z-auto bg-slate-900/60 lg:bg-transparent backdrop-blur-sm lg:backdrop-blur-none
        flex justify-end transition-opacity duration-200
        ${showMobileCart ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none lg:opacity-100 lg:pointer-events-auto'}
      `}>
        <div className={`
          w-full sm:max-w-md lg:w-96 bg-white h-full flex flex-col shadow-2xl lg:shadow-none border-l border-slate-200
          transition-transform duration-200
          ${showMobileCart ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
        `}>
          
          {/* Cart Header */}
          <div className="p-3.5 sm:p-4 bg-brand-900 text-white flex items-center justify-between shrink-0 shadow-sm">
            <div className="flex items-center space-x-2">
              <ShoppingCart className="w-5 h-5 text-amber-400" />
              <h3 className="font-extrabold text-sm sm:text-base">Current Bill Cart</h3>
              <span className="px-2 py-0.5 bg-brand-800 text-amber-300 rounded-full text-xs font-bold font-mono">
                {cart.length} items
              </span>
            </div>
            <button
              onClick={() => setShowMobileCart(false)}
              className="lg:hidden px-3 py-1 bg-white/10 hover:bg-white/20 text-white font-bold rounded-lg text-xs transition"
            >
              Close &times;
            </button>
          </div>

          {/* Unified Scrollable Body: Cart items + Customer details + Breakdown */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            
            {/* Cart Items List */}
            <div className="space-y-2">
              <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Materials Billed ({cart.length})
              </h4>
              {cart.length === 0 ? (
                <div className="text-center py-10 px-4 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <ShoppingCart className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-1" />
                  <p className="text-xs font-medium">Cart is empty</p>
                  <p className="text-[11px] text-slate-400 mt-1">Select materials from catalogue to add.</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div 
                    key={item.product_id}
                    className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs flex flex-col space-y-1.5"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-bold text-slate-900 leading-tight">{item.product_name}</p>
                        <span className="text-[10px] text-slate-500 font-mono">
                          Rate: ₹{item.rate} / {item.unit}
                        </span>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.product_id)}
                        className="text-slate-400 hover:text-rose-600 transition p-1"
                        title="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Quantity Stepper & Item Total */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                      <div className="flex items-center space-x-1.5 bg-white border border-slate-300 rounded-lg p-0.5">
                        <button
                          onClick={() => updateQuantity(item.product_id, -1)}
                          className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded font-bold"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => setQuantity(item.product_id, Number(e.target.value))}
                          className="w-10 text-center font-bold text-xs bg-transparent focus:outline-none"
                        />
                        <button
                          onClick={() => updateQuantity(item.product_id, 1)}
                          className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded font-bold"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="text-right">
                        <span className="font-mono font-black text-slate-950 text-xs">
                          ₹{item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Customer Inputs */}
            <div className="pt-2 border-t border-slate-200 space-y-2 text-xs">
              <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Customer & Site Delivery
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Customer Name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-1 focus:ring-brand-900 focus:bg-white"
                />
                <input
                  type="tel"
                  placeholder="Mobile Number"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:ring-1 focus:ring-brand-900 focus:bg-white"
                />
              </div>

              {/* Delivery Toggle */}
              <div className="flex items-center justify-between p-2 bg-amber-50/40 rounded-xl border border-amber-200/60">
                <label className="flex items-center space-x-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isDelivery}
                    onChange={(e) => setIsDelivery(e.target.checked)}
                    className="rounded text-brand-900 focus:ring-brand-900"
                  />
                  <span className="text-[11px] font-bold text-slate-700 flex items-center space-x-1">
                    <Truck className="w-3.5 h-3.5 text-amber-600" />
                    <span>Site Delivery</span>
                  </span>
                </label>

                {isDelivery && (
                  <div className="flex items-center space-x-1">
                    <span className="text-[10px] text-slate-500">₹</span>
                    <input
                      type="number"
                      placeholder="Delivery Fee"
                      value={deliveryCharge || ''}
                      onChange={(e) => setDeliveryCharge(Number(e.target.value))}
                      className="w-20 px-2 py-0.5 bg-white border border-slate-200 rounded text-xs font-mono"
                    />
                  </div>
                )}
              </div>

              {isDelivery && (
                <input
                  type="text"
                  placeholder="Site Unloading Address / Instructions"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-amber-50/50 border border-amber-200 rounded-xl text-[11px]"
                />
              )}

              {/* GST & Discount Toggles */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center space-x-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isGstInvoice}
                    onChange={(e) => setIsGstInvoice(e.target.checked)}
                    className="rounded text-brand-900 focus:ring-brand-900"
                  />
                  <span className="text-[11px] font-semibold text-slate-700">GST Invoice</span>
                </label>

                <div className="flex items-center space-x-1">
                  <span className="text-[10px] text-slate-500">Disc:</span>
                  <input
                    type="number"
                    placeholder="0"
                    value={discountValue || ''}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    className="w-14 px-1.5 py-0.5 bg-slate-50 border border-slate-200 rounded text-xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setDiscountType(discountType === 'fixed' ? 'percent' : 'fixed')}
                    className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-[10px] font-bold"
                  >
                    {discountType === 'fixed' ? '₹' : '%'}
                  </button>
                </div>
              </div>

              {/* Payment Mode Pills */}
              <div className="pt-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Payment Mode
                </span>
                <div className="flex items-center space-x-1">
                  {['Cash', 'UPI', 'Bank', 'Khata/Credit'].map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => {
                        setPaymentMode(mode);
                        if (mode === 'Khata/Credit') {
                          setPaymentStatus('PENDING');
                        } else {
                          setPaymentStatus('PAID');
                        }
                      }}
                      className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition ${
                        paymentMode === mode
                          ? 'bg-brand-900 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Price Calculations Breakdown */}
            <div className="pt-2 border-t border-slate-200 space-y-1 text-[11px] text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-mono">₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Discount:</span>
                  <span className="font-mono">-₹{discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              {isGstInvoice && totalTax > 0 && (
                <div className="flex justify-between text-slate-500">
                  <span>GST (CGST+SGST):</span>
                  <span className="font-mono">₹{totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              {delivery > 0 && (
                <div className="flex justify-between">
                  <span>Delivery Charge:</span>
                  <span className="font-mono">₹{delivery.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
            </div>

          </div>

          {/* PINNED STICKY BOTTOM ACTION BAR (Always visible above navigation) */}
          <div className="border-t border-slate-200 bg-white p-3.5 sm:p-4 space-y-2 shrink-0 shadow-2xl pb-6 lg:pb-3">
            <div className="flex justify-between items-center font-extrabold text-sm text-slate-900">
              <span className="text-xs uppercase tracking-wider text-slate-500">Total Payable:</span>
              <span className="font-mono text-lg font-black text-emerald-700">
                ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>

            {errorMsg && (
              <div className="p-2 bg-rose-50 border border-rose-200 text-rose-700 text-[11px] rounded font-medium">
                {errorMsg}
              </div>
            )}

            {/* Big Green Generate & Share Bill Button */}
            <button
              onClick={handleGenerateInvoice}
              disabled={isSubmitting || cart.length === 0}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-xl shadow-lg flex items-center justify-center space-x-2 transition active:scale-[0.98] disabled:opacity-50"
            >
              <CheckCircle className="w-5 h-5 text-emerald-200" />
              <span>{isSubmitting ? 'Generating Invoice...' : 'Generate & Share Bill (WhatsApp)'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>

    </div>
  );
};
