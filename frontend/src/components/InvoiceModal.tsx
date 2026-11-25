import React, { useState, useEffect } from 'react';
import {
  X,
  Printer,
  Share2,
  Download,
  Check,
  Copy,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { Invoice, ShopSettings } from '../types';
import { api } from '../services/api';
import { downloadInvoicePdf, sendPdfToWhatsApp } from '../services/pdfGenerator';
import { InvoiceSheet } from './InvoiceSheet';

interface InvoiceModalProps {
  invoice: Invoice | null;
  shopSettings?: ShopSettings | null;
  onClose: () => void;
  onPaymentUpdated?: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  invoice,
  shopSettings: propShopSettings,
  onClose,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [isProcessingWa, setIsProcessingWa] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [desktopAttachNotice, setDesktopAttachNotice] = useState<string | null>(null);
  const [smsResult, setSmsResult] = useState<string | null>(null);
  const [liveSettings, setLiveSettings] = useState<ShopSettings | null>(propShopSettings || null);

  useEffect(() => {
    if (propShopSettings) {
      setLiveSettings(propShopSettings);
    }
  }, [propShopSettings]);

  useEffect(() => {
    if (!invoice) return;
    api.getSettings()
      .then((res) => {
        if (res.success && res.settings) {
          setLiveSettings(res.settings);
        }
      })
      .catch(() => {});
  }, [invoice]);

  if (!invoice) return null;

  const publicUrl = `${window.location.origin}/invoice/view/${invoice.public_token}`;

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
      let latestSettings = liveSettings;
      try {
        const res = await api.getSettings();
        if (res.success && res.settings) {
          latestSettings = res.settings;
          setLiveSettings(res.settings);
        }
      } catch {
        // Use currently loaded settings if offline
      }

      const result = await sendPdfToWhatsApp(invoice, 'invoice-printable-container', latestSettings);
      if (result.mode === 'desktop_download_and_chat') {
        setDesktopAttachNotice(
          `Official PDF bill "${result.fileName}" has been downloaded to your computer! In WhatsApp Web, click the 📎 Paperclip icon -> Document to send the PDF to ${invoice.customer.name}.`
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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:fixed-none">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[96vh] flex flex-col overflow-hidden print:max-w-none print:shadow-none print:rounded-none">
        {/* Modal Action Bar (Hidden in Print) */}
        <div className="bg-brand-900 text-white px-3 py-3 sm:px-6 sm:py-4 flex items-center justify-between print:hidden">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-sm sm:text-base">Invoice #{invoice.invoice_number}</span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] sm:text-xs font-bold ${
                invoice.payment_status === 'PAID'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : invoice.payment_status === 'PARTIAL'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
              }`}
            >
              {invoice.payment_status}
            </span>
          </div>

          <div className="flex items-center space-x-1.5 sm:space-x-2">
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

            <button
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="px-2.5 sm:px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition shadow"
              title="Download PDF File"
            >
              {downloadingPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">PDF</span>
            </button>

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
                  {desktopAttachNotice}
                </p>
              </div>
            </div>
            <button
              onClick={() => setDesktopAttachNotice(null)}
              className="text-emerald-200 hover:text-white font-bold ml-2 text-base"
            >
              &times;
            </button>
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
            <button onClick={() => setSmsResult(null)} className="text-blue-600 hover:text-blue-900 font-bold">
              &times;
            </button>
          </div>
        )}

        {/* Scrollable Invoice Preview & PDF Source */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-100/70 print:p-0 print:bg-white print:overflow-visible">
          <InvoiceSheet
            invoice={invoice}
            shopSettings={liveSettings}
            containerId="invoice-printable-container"
          />
        </div>
      </div>
    </div>
  );
};
