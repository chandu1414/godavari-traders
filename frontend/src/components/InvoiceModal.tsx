import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  Share2, 
  Download, 
  Check, 
  Copy, 
  Send, 
  Building2, 
  Loader2,
  FileCheck,
  Paperclip,
  CheckCircle2
} from 'lucide-react';
import { Invoice } from '../types';
import { api } from '../services/api';
import { buildWhatsAppUrl, downloadInvoicePdf, sendPdfToWhatsApp } from '../services/pdfGenerator';

interface InvoiceModalProps {
  invoice: Invoice | null;
  onClose: () => void;
  onPaymentUpdated?: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ invoice, onClose, onPaymentUpdated }) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [isProcessingWa, setIsProcessingWa] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [sharingSms, setSharingSms] = useState(false);
  const [desktopAttachNotice, setDesktopAttachNotice] = useState<string | null>(null);
  const [smsResult, setSmsResult] = useState<string | null>(null);

  if (!invoice) return null;

  const publicUrl = `${window.location.origin}/invoice/view/${invoice.public_token}`;
  const shop = invoice.shop_snapshot || {};
  const hasTax = invoice.is_gst_invoice && (invoice.tax_breakup?.total_tax || 0) > 0;
  const waUrl = buildWhatsAppUrl(invoice);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    try {
      setDownloadingPdf(true);
      await downloadInvoicePdf(invoice, 'invoice-printable-container');
    } catch (e: any) {
      alert('Error generating PDF: ' + e.message);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleWhatsAppSendPdf = async () => {
    try {
      setIsProcessingWa(true);
      setDesktopAttachNotice(null);
      const result = await sendPdfToWhatsApp(invoice, 'invoice-printable-container');
      
      if (result.mode === 'desktop_download_and_chat') {
        setDesktopAttachNotice(
          `Official PDF bill "${result.fileName}" has been downloaded to your computer! In WhatsApp Web, simply click the 📎 Paperclip icon -> Document to send the PDF to ${invoice.customer.name}.`
        );
      }
    } catch (e: any) {
      alert('Error sharing PDF: ' + e.message);
    } finally {
      setIsProcessingWa(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleSmsShare = async () => {
    try {
      setSharingSms(true);
      const res = await api.sendSmsDispatch(invoice._id || invoice.invoice_number);
      if (res.success) {
        setSmsResult(res.status_message || 'SMS details prepared');
        handleCopyLink();
      }
    } catch (e: any) {
      alert('Error triggering SMS dispatch: ' + e.message);
    } finally {
      setSharingSms(false);
    }
  };

  // UPI payment URI
  const upiId = shop.upi_id || 'godavaritraders@okaxis';
  const upiPayUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(shop.shop_name || 'Godavari Traders')}&am=${invoice.balance_due > 0 ? invoice.balance_due : invoice.grand_total}&cu=INR&tn=${encodeURIComponent(`Bill ${invoice.invoice_number}`)}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(upiPayUrl)}`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:fixed-none">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[96vh] flex flex-col overflow-hidden print:max-w-none print:shadow-none print:rounded-none">
        
        {/* Modal Action Bar (Hidden in Print) */}
        <div className="bg-brand-900 text-white px-3 py-3 sm:px-6 sm:py-4 flex items-center justify-between print:hidden">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-sm sm:text-base">Invoice #{invoice.invoice_number}</span>
            <span className={`px-2 py-0.5 rounded text-[10px] sm:text-xs font-bold ${
              invoice.payment_status === 'PAID'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : invoice.payment_status === 'PARTIAL'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
            }`}>
              {invoice.payment_status}
            </span>
          </div>

          <div className="flex items-center space-x-1.5 sm:space-x-2">
            {/* Primary Button: Send PDF to WhatsApp */}
            <button
              onClick={handleWhatsAppSendPdf}
              disabled={isProcessingWa}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 transition shadow"
              title="Send PDF to WhatsApp"
            >
              {isProcessingWa ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Share2 className="w-3.5 h-3.5" />
              )}
              <span>{isProcessingWa ? 'Generating PDF...' : 'Send PDF via WhatsApp'}</span>
            </button>

            {/* Download PDF button */}
            <button
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="px-2.5 sm:px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition shadow"
              title="Download PDF File"
            >
              {downloadingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">PDF</span>
            </button>

            {/* Print */}
            <button
              onClick={handlePrint}
              className="px-2.5 sm:px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition shadow"
              title="Print Invoice"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-brand-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Desktop Helper Banner when PDF is downloaded for WhatsApp */}
        {desktopAttachNotice && (
          <div className="bg-emerald-600 text-white px-4 py-3 flex items-start justify-between text-xs font-medium shadow-inner print:hidden">
            <div className="flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-200 mt-0.5 shrink-0" />
              <div>
                <p className="font-bold">PDF Bill Downloaded & WhatsApp Web Opened!</p>
                <p className="text-emerald-100 mt-0.5 text-[11px] leading-tight">
                  In your WhatsApp Web chat, click the <span className="font-bold underline">📎 Paperclip icon</span> $\rightarrow$ <span className="font-bold underline">Document</span> and select the downloaded invoice to send the actual PDF file!
                </p>
              </div>
            </div>
            <button onClick={() => setDesktopAttachNotice(null)} className="text-emerald-200 hover:text-white font-bold ml-2 text-base">&times;</button>
          </div>
        )}

        {/* Copyable Public Link Banner */}
        <div className="bg-brand-50 border-b border-brand-100 px-4 py-2 sm:px-6 flex items-center justify-between text-xs text-brand-900 print:hidden">
          <div className="flex items-center space-x-2 truncate">
            <span className="font-semibold text-slate-600">Online Customer Link:</span>
            <span className="truncate text-brand-700 underline font-mono select-all">{publicUrl}</span>
          </div>
          <button
            onClick={handleCopyLink}
            className="ml-2 px-2.5 py-1 bg-white hover:bg-brand-100 border border-brand-200 rounded text-brand-900 font-semibold flex items-center space-x-1 shrink-0 transition"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
          </button>
        </div>

        {smsResult && (
          <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 text-xs text-blue-800 flex items-center justify-between print:hidden">
            <span>{smsResult}</span>
            <button onClick={() => setSmsResult(null)} className="text-blue-600 hover:text-blue-900 font-bold">&times;</button>
          </div>
        )}

        {/* PRINTABLE TAX INVOICE CONTENT */}
        <div 
          id="invoice-printable-container" 
          className="p-4 sm:p-8 overflow-y-auto flex-1 text-slate-800 print:p-0 print:overflow-visible invoice-print-area bg-white"
        >
          {/* Header */}
          <div className="border-b-2 border-brand-900 pb-4 mb-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex items-start space-x-3">
                <div className="w-12 h-12 rounded-xl bg-brand-900 text-white flex items-center justify-center shrink-0">
                  <Building2 className="w-7 h-7 text-amber-400" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-brand-950 tracking-tight">
                    {shop.shop_name || 'GODAVARI TRADERS'}
                  </h1>
                  <p className="text-xs font-semibold text-brand-800 tracking-wide">
                    {shop.tagline || 'Wholesale & Retail Building Materials - Cement, Steel, Stone Dust & Sand'}
                  </p>
                  <p className="text-xs text-slate-600 mt-1">
                    {shop.address_line1}, {shop.city}, {shop.district ? `${shop.district} dist, ` : ''}{shop.state} - {shop.pincode}
                  </p>
                  <p className="text-xs text-slate-600">
                    {shop.owner_name && <span className="font-bold text-slate-900 mr-2">Prop: {shop.owner_name}</span>}
                    {shop.phone && <span>Phone: <span className="font-semibold text-slate-900">{shop.phone}</span></span>}
                    {shop.whatsapp_number && <span className="ml-2">| WhatsApp: <span className="font-semibold text-slate-900">{shop.whatsapp_number}</span></span>}
                  </p>
                </div>
              </div>

              {/* Invoice Type Badge */}
              <div className="text-left sm:text-right text-xs space-y-1">
                <div className="inline-block px-3 py-1 bg-brand-900 text-white font-extrabold rounded text-xs tracking-wider uppercase mb-1">
                  {hasTax ? 'TAX INVOICE' : 'RETAIL INVOICE'}
                </div>
                {hasTax && (
                  <>
                    <p><span className="text-slate-500">GSTIN:</span> <span className="font-mono font-bold text-slate-900">{shop.gstin || '36AAAAA0000A1Z5'}</span></p>
                    <p><span className="text-slate-500">State / Code:</span> <span className="font-semibold text-slate-900">{shop.state || 'Telangana'} (Code: {shop.state_code || '36'})</span></p>
                  </>
                )}
                {shop.pan_number && (
                  <p><span className="text-slate-500">PAN:</span> <span className="font-mono font-semibold text-slate-900">{shop.pan_number}</span></p>
                )}
              </div>
            </div>
          </div>

          {/* Invoice Meta and Customer Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs mb-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Billed To (Customer)</p>
              <p className="font-bold text-slate-950 text-sm">{invoice.customer.name || 'Walk-in Customer'}</p>
              {invoice.customer.phone && (
                <p className="text-slate-600 mt-0.5">Contact: <span className="font-semibold text-slate-900">{invoice.customer.phone}</span></p>
              )}
              {invoice.customer.address && (
                <p className="text-slate-600 mt-0.5">Site / Address: {invoice.customer.address}</p>
              )}
              {invoice.delivery?.is_delivery && (
                <p className="text-amber-800 font-medium mt-1 bg-amber-50 p-1 rounded border border-amber-200">
                  🚚 Delivery Site: {invoice.delivery.delivery_address || invoice.customer.address}
                  {invoice.delivery.instructions && ` (${invoice.delivery.instructions})`}
                </p>
              )}
            </div>

            <div className="sm:text-right space-y-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Invoice Details</p>
              <p><span className="text-slate-500">Invoice No:</span> <span className="font-mono font-extrabold text-brand-900 text-sm">{invoice.invoice_number}</span></p>
              <p><span className="text-slate-500">Invoice Date:</span> <span className="font-semibold text-slate-900">{new Date(invoice.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span></p>
              <p><span className="text-slate-500">Payment Mode:</span> <span className="font-semibold text-slate-900">{invoice.payment_mode}</span></p>
              <p><span className="text-slate-500">Payment Status:</span> <span className={`font-bold ${invoice.payment_status === 'PAID' ? 'text-emerald-700' : 'text-amber-700'}`}>{invoice.payment_status}</span></p>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-left text-xs border border-slate-200">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 w-8">#</th>
                  <th className="py-2.5 px-3">Item Description</th>
                  {hasTax && <th className="py-2.5 px-2 text-center">HSN</th>}
                  <th className="py-2.5 px-2 text-right">Qty</th>
                  <th className="py-2.5 px-2 text-center">Unit</th>
                  <th className="py-2.5 px-3 text-right">Rate (₹)</th>
                  {hasTax && (
                    <>
                      <th className="py-2.5 px-2 text-center">GST%</th>
                      <th className="py-2.5 px-2 text-right">Tax (₹)</th>
                    </>
                  )}
                  <th className="py-2.5 px-3 text-right">Total (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoice.items.map((item, idx) => {
                  const taxAmount = (item.cgst_amount || 0) + (item.sgst_amount || 0);
                  return (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2 px-3 text-slate-400">{idx + 1}</td>
                      <td className="py-2 px-3 font-medium text-slate-900">
                        {item.product_name}
                        {item.brand && <span className="text-[10px] text-slate-500 block">{item.brand}</span>}
                      </td>
                      {hasTax && (
                        <td className="py-2 px-2 text-center font-mono text-slate-500">{item.hsn_code || '2523'}</td>
                      )}
                      <td className="py-2 px-2 text-right font-bold text-slate-900">{item.quantity}</td>
                      <td className="py-2 px-2 text-center text-slate-600">{item.unit}</td>
                      <td className="py-2 px-3 text-right font-mono">{item.rate.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      {hasTax && (
                        <>
                          <td className="py-2 px-2 text-center font-mono">{item.gst_rate}%</td>
                          <td className="py-2 px-2 text-right font-mono text-slate-600">{taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        </>
                      )}
                      <td className="py-2 px-3 text-right font-bold font-mono text-slate-950">
                        {item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Totals & Bank / UPI Details */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start mb-6">
            
            {/* Left Column: Bank Details & UPI QR Code */}
            <div className="sm:col-span-6 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
              <div className="flex items-start space-x-3">
                <div className="p-1.5 bg-white border border-slate-200 rounded-lg shadow-sm shrink-0">
                  <img src={qrCodeUrl} alt="UPI Payment QR" className="w-24 h-24 object-contain" />
                  <p className="text-[9px] text-center font-bold text-slate-500 mt-1 uppercase">Scan to Pay UPI</p>
                </div>
                <div className="space-y-1 text-[11px] text-slate-600 flex-1">
                  <p className="font-bold text-slate-900 uppercase">Bank Payment Details</p>
                  <p><span className="text-slate-400">Bank:</span> <span className="font-semibold text-slate-800">{shop.bank_name || 'State Bank of India'}</span></p>
                  <p><span className="text-slate-400">A/C No:</span> <span className="font-mono font-bold text-slate-900">{shop.bank_account_no || '38291029381'}</span></p>
                  <p><span className="text-slate-400">IFSC:</span> <span className="font-mono font-semibold text-slate-900">{shop.bank_ifsc || 'SBIN0001234'}</span></p>
                  <p><span className="text-slate-400">UPI ID:</span> <span className="font-mono font-bold text-brand-900">{shop.upi_id || 'godavaritraders@okaxis'}</span></p>
                </div>
              </div>
            </div>

            {/* Right Column: Calculations (Clean without CGST / SGST if zero) */}
            <div className="sm:col-span-6 space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Subtotal (Materials):</span>
                <span className="font-mono font-semibold text-slate-900">₹{invoice.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>

              {invoice.discount_amount > 0 && (
                <div className="flex justify-between py-1 text-emerald-700 border-b border-slate-100">
                  <span>Discount:</span>
                  <span className="font-mono font-semibold">-₹{invoice.discount_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              )}

              {/* ONLY show CGST and SGST if owner has enabled GST with non-zero tax */}
              {hasTax && invoice.tax_breakup && (
                <>
                  <div className="flex justify-between py-0.5 text-slate-500">
                    <span>CGST (Central GST):</span>
                    <span className="font-mono font-semibold text-slate-800">₹{invoice.tax_breakup.cgst_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between py-0.5 text-slate-500">
                    <span>SGST (State GST):</span>
                    <span className="font-mono font-semibold text-slate-800">₹{invoice.tax_breakup.sgst_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                </>
              )}

              {invoice.delivery?.delivery_charge > 0 && (
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>Delivery & Site Transportation:</span>
                  <span className="font-mono font-semibold text-slate-900">₹{invoice.delivery.delivery_charge.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              )}

              {invoice.round_off !== 0 && (
                <div className="flex justify-between py-0.5 text-slate-400 text-[11px]">
                  <span>Round Off:</span>
                  <span className="font-mono">₹{invoice.round_off > 0 ? `+${invoice.round_off}` : invoice.round_off}</span>
                </div>
              )}

              <div className="flex justify-between py-2.5 bg-brand-900 text-white px-3 rounded-lg text-sm font-bold shadow-sm">
                <span>Grand Total:</span>
                <span className="font-mono text-base text-amber-300">₹{invoice.grand_total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>

              <div className="flex justify-between py-1 text-[11px]">
                <span>Amount Paid:</span>
                <span className="font-mono font-semibold text-emerald-700">₹{invoice.amount_paid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>

              {invoice.balance_due > 0 && (
                <div className="flex justify-between py-1 text-xs font-bold text-rose-600 bg-rose-50 px-2 rounded">
                  <span>Balance Due:</span>
                  <span className="font-mono">₹{invoice.balance_due.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
            </div>
          </div>

          {/* Footer Terms & Signature */}
          <div className="border-t border-slate-200 pt-4 text-xs text-slate-500 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="font-bold text-slate-700 uppercase text-[10px] mb-1">Terms & Conditions:</p>
              <div className="text-[10px] leading-relaxed whitespace-pre-line text-slate-500">
                {shop.terms_conditions || '1. Goods once sold will not be accepted back.\n2. Delivery subject to site clearance.\n3. Disputes subject to Sangareddy jurisdiction only.'}
              </div>
              <p className="mt-2 text-brand-900 font-semibold italic text-[11px]">
                {shop.footer_notes || 'Thank you for building with Godavari Traders!'}
              </p>
            </div>

            <div className="sm:text-right flex flex-col justify-end items-start sm:items-end mt-4 sm:mt-0">
              <p className="text-[11px] font-bold text-slate-900 mb-0.5">For {shop.shop_name || 'GODAVARI TRADERS'}</p>
              <p className="text-[10px] text-brand-900 font-bold mb-7">{shop.owner_name || 'Prathik Yadav'} (Proprietor)</p>
              <div className="border-t border-slate-400 w-48 text-center pt-1 text-[10px] text-slate-600">
                Authorized Signatory
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
