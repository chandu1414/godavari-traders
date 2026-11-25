import React from 'react';
import { Building2 } from 'lucide-react';
import { Invoice, ShopSettings } from '../types';
import { mergeShopInfo, numberToIndianWords } from '../services/pdfGenerator';

interface InvoiceSheetProps {
  invoice: Invoice;
  shopSettings?: Partial<ShopSettings> | null;
  containerId: string;
  showPayNowButton?: boolean;
}

export const InvoiceSheet: React.FC<InvoiceSheetProps> = ({
  invoice,
  shopSettings,
  containerId,
  showPayNowButton = false,
}) => {
  const shop = mergeShopInfo(invoice.shop_snapshot, shopSettings);
  const hasTax = Boolean(invoice.is_gst_invoice && (invoice.tax_breakup?.total_tax || 0) > 0);
  const upiId = shop.upi_id || 'godavaritraders@okaxis';
  const payAmount = invoice.balance_due > 0 ? invoice.balance_due : invoice.grand_total;
  const upiPayUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(shop.shop_name || 'Godavari Traders')}&am=${payAmount}&cu=INR&tn=${encodeURIComponent(`Bill ${invoice.invoice_number}`)}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(upiPayUrl)}`;

  const totalQty = invoice.items.reduce((sum, it) => sum + Number(it.quantity || 0), 0);
  const fullAddress = [
    shop.address_line1,
    shop.address_line2,
    shop.city,
    shop.district ? `${shop.district} Dist.` : '',
    shop.state,
    shop.pincode ? `- ${shop.pincode}` : '',
  ]
    .filter(Boolean)
    .join(', ')
    .replace(', -', ' -');

  return (
    <div
      id={containerId}
      className="bg-white text-slate-800 print:p-0 invoice-print-area"
    >
      <div className="border border-slate-300 rounded-lg overflow-hidden bg-white">
        {/* Top Executive Navy Accent Bar */}
        <div className="h-2 bg-brand-900 w-full" />

        {/* 1. Company Header */}
        <div className="px-5 py-4 border-b border-slate-300 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="w-12 h-12 rounded-lg bg-brand-900 text-amber-400 flex items-center justify-center shrink-0 border border-brand-800">
              <Building2 className="w-7 h-7" />
            </div>
            <div className="space-y-0.5">
              <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight uppercase leading-none">
                {shop.shop_name || 'GODAVARI TRADERS'}
              </h1>
              {shop.tagline && (
                <p className="text-[11px] font-semibold text-brand-800 tracking-wide">
                  {shop.tagline}
                </p>
              )}
              {fullAddress && (
                <p className="text-[11px] text-slate-600 pt-0.5">{fullAddress}</p>
              )}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-700 pt-0.5">
                {shop.owner_name && (
                  <span>
                    <span className="text-slate-500">Prop:</span>{' '}
                    <span className="font-bold text-slate-900">{shop.owner_name}</span>
                  </span>
                )}
                {shop.phone && (
                  <span>
                    <span className="text-slate-500">Ph:</span>{' '}
                    <span className="font-mono font-bold text-slate-900">{shop.phone}</span>
                  </span>
                )}
                {shop.whatsapp_number && shop.whatsapp_number !== shop.phone && (
                  <span>
                    <span className="text-slate-500">WA:</span>{' '}
                    <span className="font-mono font-semibold text-slate-900">{shop.whatsapp_number}</span>
                  </span>
                )}
                {shop.email && (
                  <span>
                    <span className="text-slate-500">Email:</span>{' '}
                    <span className="font-medium text-slate-800">{shop.email}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right Badge & Tax Registration */}
          <div className="sm:text-right shrink-0 space-y-1">
            <div className="inline-block px-3.5 py-1 bg-brand-900 text-white font-extrabold rounded text-[11px] tracking-widest uppercase">
              {hasTax ? 'TAX INVOICE' : 'RETAIL INVOICE'}
            </div>
            {hasTax && shop.gstin && (
              <p className="text-[11px] text-slate-700">
                <span className="text-slate-500">GSTIN:</span>{' '}
                <span className="font-mono font-bold text-slate-950">{shop.gstin}</span>
              </p>
            )}
            {hasTax && (
              <p className="text-[11px] text-slate-700">
                <span className="text-slate-500">State:</span>{' '}
                <span className="font-semibold text-slate-900">
                  {shop.state || 'Telangana'} ({shop.state_code || '36'})
                </span>
              </p>
            )}
            {shop.pan_number && (
              <p className="text-[11px] text-slate-700">
                <span className="text-slate-500">PAN:</span>{' '}
                <span className="font-mono font-semibold text-slate-900">{shop.pan_number}</span>
              </p>
            )}
          </div>
        </div>

        {/* 2. Customer & Invoice Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-300 border-b border-slate-300 bg-slate-50/70 text-xs">
          <div className="p-4 space-y-1">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-brand-900">
              Billed To (Customer)
            </p>
            <p className="font-extrabold text-slate-950 text-sm">
              {invoice.customer.name || 'Walk-in Customer'}
            </p>
            {invoice.customer.phone && (
              <p className="text-[11px] text-slate-700">
                Mobile:{' '}
                <span className="font-mono font-bold text-slate-900">{invoice.customer.phone}</span>
              </p>
            )}
            {invoice.customer.address && (
              <p className="text-[11px] text-slate-600">Address: {invoice.customer.address}</p>
            )}
            {invoice.delivery?.is_delivery && (
              <div className="mt-1.5 px-2.5 py-1.5 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-950">
                <span className="font-bold">Site Delivery:</span>{' '}
                {invoice.delivery.delivery_address || invoice.customer.address || 'Customer Site'}
                {invoice.delivery.instructions ? ` (${invoice.delivery.instructions})` : ''}
              </div>
            )}
          </div>

          <div className="p-4 space-y-1 sm:text-right">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-brand-900">
              Invoice Details
            </p>
            <p className="text-xs">
              <span className="text-slate-500">Invoice No:</span>{' '}
              <span className="font-mono font-black text-brand-900 text-sm">
                {invoice.invoice_number}
              </span>
            </p>
            <p className="text-[11px]">
              <span className="text-slate-500">Date & Time:</span>{' '}
              <span className="font-semibold text-slate-900">
                {new Date(invoice.date).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </p>
            <p className="text-[11px]">
              <span className="text-slate-500">Payment Mode:</span>{' '}
              <span className="font-semibold text-slate-900">{invoice.payment_mode}</span>
            </p>
            <p className="text-[11px]">
              <span className="text-slate-500">Status:</span>{' '}
              <span
                className={`inline-block px-2 py-0.5 rounded font-extrabold text-[10px] uppercase ${
                  invoice.payment_status === 'PAID'
                    ? 'bg-emerald-100 text-emerald-800'
                    : invoice.payment_status === 'PARTIAL'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {invoice.payment_status}
              </span>
            </p>
          </div>
        </div>

        {/* 3. Itemized Materials Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-brand-900 text-white text-[10px] uppercase tracking-wider font-bold">
                <th className="py-2.5 px-3 w-9 text-center border-r border-brand-800">#</th>
                <th className="py-2.5 px-3 border-r border-brand-800">Material / Description</th>
                {hasTax && <th className="py-2.5 px-2 text-center border-r border-brand-800">HSN</th>}
                <th className="py-2.5 px-2.5 text-right border-r border-brand-800">Qty</th>
                <th className="py-2.5 px-2 text-center border-r border-brand-800">Unit</th>
                <th className="py-2.5 px-3 text-right border-r border-brand-800">Rate (₹)</th>
                {hasTax && (
                  <>
                    <th className="py-2.5 px-2 text-center border-r border-brand-800">GST</th>
                    <th className="py-2.5 px-2.5 text-right border-r border-brand-800">Tax (₹)</th>
                  </>
                )}
                <th className="py-2.5 px-3 text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {invoice.items.map((item, idx) => {
                const taxAmount = (item.cgst_amount || 0) + (item.sgst_amount || 0);
                return (
                  <tr key={idx} className={idx % 2 === 1 ? 'bg-slate-50/80' : 'bg-white'}>
                    <td className="py-2.5 px-3 text-center text-slate-500 font-mono border-r border-slate-200">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-200">
                      <span className="font-bold text-slate-900 block">{item.product_name}</span>
                      {item.brand && (
                        <span className="text-[10px] text-slate-500">{item.brand}</span>
                      )}
                    </td>
                    {hasTax && (
                      <td className="py-2.5 px-2 text-center font-mono text-slate-600 border-r border-slate-200">
                        {item.hsn_code || '2523'}
                      </td>
                    )}
                    <td className="py-2.5 px-2.5 text-right font-mono font-bold text-slate-900 border-r border-slate-200">
                      {item.quantity}
                    </td>
                    <td className="py-2.5 px-2 text-center text-slate-600 border-r border-slate-200">
                      {item.unit}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-800 border-r border-slate-200">
                      {item.rate.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    {hasTax && (
                      <>
                        <td className="py-2.5 px-2 text-center font-mono text-slate-600 border-r border-slate-200">
                          {item.gst_rate}%
                        </td>
                        <td className="py-2.5 px-2.5 text-right font-mono text-slate-700 border-r border-slate-200">
                          {taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </>
                    )}
                    <td className="py-2.5 px-3 text-right font-mono font-extrabold text-slate-950">
                      {item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100 border-t border-slate-300 text-[11px] font-bold text-slate-700">
                <td colSpan={hasTax ? 3 : 2} className="py-2 px-3 border-r border-slate-200">
                  Total Items: {invoice.items.length}
                </td>
                <td className="py-2 px-2.5 text-right font-mono border-r border-slate-200">
                  {totalQty}
                </td>
                <td colSpan={hasTax ? 4 : 2} className="py-2 px-3 text-right border-r border-slate-200">
                  Materials Subtotal
                </td>
                <td className="py-2 px-3 text-right font-mono text-slate-950">
                  ₹{invoice.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* 4. Amount in Words */}
        <div className="px-4 py-2 bg-slate-50 border-y border-slate-300 text-[11px] flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="text-slate-500 font-semibold uppercase text-[10px] mr-1.5">
              Amount in Words:
            </span>
            <span className="font-bold text-slate-900">
              {numberToIndianWords(invoice.grand_total)}
            </span>
          </div>
          {invoice.notes && (
            <div className="text-slate-600">
              <span className="font-semibold text-slate-500">Note:</span> {invoice.notes}
            </div>
          )}
        </div>

        {/* 5. Bank / UPI QR & Totals Breakdown */}
        <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-12 gap-4 items-start">
          {/* Left: Bank & UPI */}
          <div className="sm:col-span-6 bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs">
            <div className="flex items-start space-x-3">
              <div className="p-1.5 bg-white border border-slate-200 rounded-md shrink-0 text-center">
                <img
                  src={qrCodeUrl}
                  crossOrigin="anonymous"
                  alt="UPI Payment QR"
                  className="w-24 h-24 object-contain"
                />
                <p className="text-[9px] font-extrabold text-brand-900 mt-1 uppercase tracking-wide">
                  Scan & Pay UPI
                </p>
              </div>
              <div className="space-y-1 text-[11px] text-slate-700 flex-1">
                <p className="font-extrabold text-brand-900 uppercase tracking-wide text-[10px]">
                  Bank & UPI Payment Details
                </p>
                <p>
                  <span className="text-slate-500">Bank:</span>{' '}
                  <span className="font-semibold text-slate-900">{shop.bank_name || 'State Bank of India'}</span>
                </p>
                <p>
                  <span className="text-slate-500">A/C No:</span>{' '}
                  <span className="font-mono font-bold text-slate-950">{shop.bank_account_no || '38291029381'}</span>
                </p>
                <p>
                  <span className="text-slate-500">IFSC:</span>{' '}
                  <span className="font-mono font-semibold text-slate-900">{shop.bank_ifsc || 'SBIN0001234'}</span>
                </p>
                {shop.bank_branch && (
                  <p>
                    <span className="text-slate-500">Branch:</span>{' '}
                    <span className="font-medium text-slate-800">{shop.bank_branch}</span>
                  </p>
                )}
                <p>
                  <span className="text-slate-500">UPI ID:</span>{' '}
                  <span className="font-mono font-bold text-brand-900">{upiId}</span>
                </p>
                {showPayNowButton && invoice.balance_due > 0 && (
                  <a
                    href={upiPayUrl}
                    className="inline-block mt-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-[11px] print:hidden"
                  >
                    Pay ₹{invoice.balance_due.toLocaleString('en-IN')} via UPI App
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Right: Totals Box */}
          <div className="sm:col-span-6 border border-slate-200 rounded-lg overflow-hidden text-xs">
            <div className="divide-y divide-slate-200">
              <div className="flex justify-between px-3.5 py-2 bg-white">
                <span className="text-slate-600">Subtotal (Materials):</span>
                <span className="font-mono font-semibold text-slate-900">
                  ₹{invoice.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>

              {invoice.discount_amount > 0 && (
                <div className="flex justify-between px-3.5 py-2 bg-white text-emerald-700">
                  <span>Discount:</span>
                  <span className="font-mono font-semibold">
                    -₹{invoice.discount_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}

              {hasTax && invoice.tax_breakup && (
                <>
                  <div className="flex justify-between px-3.5 py-1.5 bg-slate-50/70 text-[11px] text-slate-600">
                    <span>Taxable Value:</span>
                    <span className="font-mono font-semibold text-slate-800">
                      ₹{invoice.tax_breakup.taxable_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between px-3.5 py-1.5 bg-slate-50/70 text-[11px] text-slate-600">
                    <span>CGST (Central GST):</span>
                    <span className="font-mono font-semibold text-slate-800">
                      ₹{invoice.tax_breakup.cgst_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between px-3.5 py-1.5 bg-slate-50/70 text-[11px] text-slate-600">
                    <span>SGST (State GST):</span>
                    <span className="font-mono font-semibold text-slate-800">
                      ₹{invoice.tax_breakup.sgst_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </>
              )}

              {invoice.delivery?.delivery_charge > 0 && (
                <div className="flex justify-between px-3.5 py-2 bg-white">
                  <span className="text-slate-600">Delivery & Transportation:</span>
                  <span className="font-mono font-semibold text-slate-900">
                    ₹{invoice.delivery.delivery_charge.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}

              {invoice.round_off !== 0 && (
                <div className="flex justify-between px-3.5 py-1.5 bg-white text-[11px] text-slate-500">
                  <span>Round Off:</span>
                  <span className="font-mono">
                    ₹{invoice.round_off > 0 ? `+${invoice.round_off}` : invoice.round_off}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center px-3.5 py-2.5 bg-brand-900 text-white font-extrabold">
                <span className="text-sm uppercase tracking-wide">Grand Total</span>
                <span className="font-mono text-base text-amber-300">
                  ₹{invoice.grand_total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex justify-between px-3.5 py-2 bg-slate-50 text-[11px]">
                <span className="text-slate-600 font-medium">Amount Paid ({invoice.payment_mode}):</span>
                <span className="font-mono font-bold text-emerald-700">
                  ₹{invoice.amount_paid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>

              {invoice.balance_due > 0 ? (
                <div className="flex justify-between px-3.5 py-2 bg-rose-50 text-xs font-extrabold text-rose-700">
                  <span>Balance Due (Khata):</span>
                  <span className="font-mono">
                    ₹{invoice.balance_due.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ) : (
                <div className="flex justify-between px-3.5 py-1.5 bg-emerald-50 text-[11px] font-bold text-emerald-700">
                  <span>Balance Due:</span>
                  <span className="font-mono">₹0.00 (Paid in Full)</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 6. Terms & Authorized Signatory */}
        <div className="border-t border-slate-300 px-4 sm:px-5 py-4 bg-slate-50/60 grid grid-cols-1 sm:grid-cols-12 gap-4 text-xs">
          <div className="sm:col-span-7">
            <p className="font-extrabold text-slate-800 uppercase text-[10px] tracking-wider mb-1">
              Terms & Conditions
            </p>
            <div className="text-[10px] leading-relaxed whitespace-pre-line text-slate-600">
              {shop.terms_conditions ||
                '1. Goods once sold will not be accepted or exchanged without prior inspection.\n2. Delivery subject to site clearance.\n3. Disputes subject to Sangareddy jurisdiction only.'}
            </div>
            <p className="mt-2 text-brand-900 font-bold italic text-[11px]">
              {shop.footer_notes || 'Thank you for building with Godavari Traders!'}
            </p>
          </div>

          <div className="sm:col-span-5 sm:text-right flex flex-col justify-between items-start sm:items-end pt-2 sm:pt-0">
            <div className="sm:text-right">
              <p className="text-[11px] font-extrabold text-slate-900">
                For {shop.shop_name || 'GODAVARI TRADERS'}
              </p>
              {shop.owner_name && (
                <p className="text-[10px] text-brand-900 font-bold">
                  {shop.owner_name} (Proprietor)
                </p>
              )}
            </div>
            <div className="mt-10 border-t border-slate-400 w-44 text-center pt-1 text-[10px] font-semibold text-slate-600">
              Authorized Signatory
            </div>
          </div>
        </div>

        {/* Bottom Micro-Footer */}
        <div className="border-t border-slate-200 px-4 py-1.5 bg-slate-100 text-center text-[10px] text-slate-500">
          This is a computer-generated invoice • Subject to {shop.district || shop.city || 'Sangareddy'} Jurisdiction
        </div>
      </div>
    </div>
  );
};
