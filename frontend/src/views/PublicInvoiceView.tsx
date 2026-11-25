import React, { useState, useEffect } from 'react';
import { Building2, Printer, Download, AlertCircle, Loader2 } from 'lucide-react';
import { Invoice, ShopSettings } from '../types';
import { api } from '../services/api';
import { downloadInvoicePdf } from '../services/pdfGenerator';
import { InvoiceSheet } from '../components/InvoiceSheet';

interface PublicInvoiceViewProps {
  token: string;
}

export const PublicInvoiceView: React.FC<PublicInvoiceViewProps> = ({ token }) => {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [shopSettings, setShopSettings] = useState<ShopSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPublicInvoice();
  }, [token]);

  const loadPublicInvoice = async () => {
    try {
      setLoading(true);
      setError(null);
      const [invRes, settingsRes] = await Promise.allSettled([
        api.getPublicInvoice(token),
        api.getSettings(),
      ]);

      if (settingsRes.status === 'fulfilled' && settingsRes.value.success) {
        setShopSettings(settingsRes.value.settings);
      }

      if (invRes.status === 'fulfilled' && invRes.value.success && invRes.value.invoice) {
        setInvoice(invRes.value.invoice);
      } else {
        setError('Invoice not found or link has expired.');
      }
    } catch (e: any) {
      setError(e.message || 'Unable to load invoice details.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!invoice) return;
    try {
      setDownloadingPdf(true);
      await downloadInvoicePdf(invoice, 'public-invoice-printable');
    } catch (e: any) {
      alert('Error generating PDF: ' + e.message);
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-brand-900 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-600">Retrieving official invoice...</p>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    const fallbackPhone = shopSettings?.phone || shopSettings?.whatsapp_number;
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-2xl shadow-md max-w-md w-full text-center space-y-4 border border-slate-200">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900">Invoice Link Unavailable</h2>
          <p className="text-xs text-slate-500">{error || 'This invoice viewing link could not be verified.'}</p>
          {fallbackPhone && (
            <p className="text-xs text-slate-400">
              Please contact {shopSettings?.shop_name || 'Godavari Traders'} at {fallbackPhone} for assistance.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-3 sm:px-6 lg:px-8 print:p-0 print:bg-white">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Top Floating Action Bar */}
        <div className="bg-brand-900 text-white p-4 rounded-2xl shadow-md flex items-center justify-between print:hidden">
          <div className="flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-amber-400" />
            <span className="font-extrabold text-sm sm:text-base">
              {shopSettings?.shop_name || invoice.shop_snapshot?.shop_name || 'Godavari Traders'} Invoice
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs flex items-center space-x-1.5 transition shadow"
            >
              {downloadingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              <span>Download PDF</span>
            </button>

            <button
              onClick={() => window.print()}
              className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg text-xs flex items-center space-x-1.5 transition shadow"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
          </div>
        </div>

        {/* Official Professional Invoice Sheet */}
        <div className="bg-white rounded-2xl shadow-xl p-3 sm:p-5 print:shadow-none print:p-0">
          <InvoiceSheet
            invoice={invoice}
            shopSettings={shopSettings}
            containerId="public-invoice-printable"
            showPayNowButton
          />
        </div>
      </div>
    </div>
  );
};
