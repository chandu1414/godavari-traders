import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Invoice } from '../types';

export function buildWhatsAppUrl(invoice: Invoice, directPhone?: string): string {
  const targetPhone = directPhone || invoice.customer.whatsapp || invoice.customer.phone || '';
  const cleanPhone = targetPhone.replace(/\D/g, '');
  const phoneParam = cleanPhone ? (cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone) : '';

  const shop = invoice.shop_snapshot || {};
  const msg = encodeURIComponent(
    `*GODAVARI TRADERS - BILL INVOICE*\n` +
    `Siddapu Road, Sadashivpet, Sangareddy dist, Telangana\n` +
    `----------------------------------------\n` +
    `Invoice: *${invoice.invoice_number}*\n` +
    `Customer: *${invoice.customer.name}*\n` +
    `Date: ${new Date(invoice.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}\n` +
    `Grand Total: *Rs. ${invoice.grand_total.toLocaleString('en-IN')}* (${invoice.payment_status})\n` +
    (invoice.balance_due > 0 ? `Balance Due: *Rs. ${invoice.balance_due.toLocaleString('en-IN')}*\n` : '') +
    `----------------------------------------\n` +
    `Official PDF Invoice Link:\n` +
    `${window.location.origin}/invoice/view/${invoice.public_token}\n\n` +
    `Thank you for choosing Godavari Traders!\n` +
    (shop.owner_name ? `Proprietor: ${shop.owner_name}\n` : '') +
    (shop.phone ? `Phone: ${shop.phone}` : '')
  );

  return phoneParam ? `https://wa.me/${phoneParam}?text=${msg}` : `https://wa.me/?text=${msg}`;
}

export async function generateInvoicePdfBlob(elementId: string): Promise<Blob> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('Invoice printable element not found');
  }

  // Render element to high-res canvas
  const canvas = await html2canvas(element, {
    scale: 2, // High resolution (retina crisp)
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: element.scrollWidth,
  });

  const imgData = canvas.toDataURL('image/jpeg', 0.95);
  
  // A4 dimensions in mm: 210 x 297
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

  pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
  return pdf.output('blob');
}

export async function downloadInvoicePdf(invoice: Invoice, elementId: string): Promise<void> {
  const fileName = `Godavari-Traders-Invoice-${invoice.invoice_number}.pdf`;
  const pdfBlob = await generateInvoicePdfBlob(elementId);
  const url = URL.createObjectURL(pdfBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function sendPdfToWhatsApp(
  invoice: Invoice, 
  elementId: string
): Promise<{ mode: 'native_file_share' | 'desktop_download_and_chat'; fileName: string }> {
  const fileName = `Godavari-Traders-Invoice-${invoice.invoice_number}.pdf`;
  
  // 1. Generate the actual PDF document
  const pdfBlob = await generateInvoicePdfBlob(elementId);
  const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });

  // 2. If mobile device supports Web Share API with files:
  if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
    try {
      await navigator.share({
        files: [pdfFile],
        title: `Bill ${invoice.invoice_number} - Godavari Traders`,
        text: `Official Bill ${invoice.invoice_number} from Godavari Traders (Amount: Rs. ${invoice.grand_total.toLocaleString('en-IN')})`,
      });
      return { mode: 'native_file_share', fileName };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return { mode: 'native_file_share', fileName };
      }
      console.warn('Native file share failed, falling back to download + WhatsApp', err);
    }
  }

  // 3. Fallback for Desktop (where browser security blocks websites from attaching files directly via URL):
  // Trigger immediate PDF file download
  const url = URL.createObjectURL(pdfBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  // Open WhatsApp Web
  const waUrl = buildWhatsAppUrl(invoice);
  window.open(waUrl, '_blank');

  return { mode: 'desktop_download_and_chat', fileName };
}
