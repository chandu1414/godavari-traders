import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Invoice } from '../types';

export function buildWhatsAppUrl(invoice: Invoice, directPhone?: string): string {
  const targetPhone = directPhone || invoice.customer.whatsapp || invoice.customer.phone || '';
  const cleanPhone = targetPhone.replace(/\D/g, '');
  const phoneParam = cleanPhone ? (cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone) : '';

  const shop = invoice.shop_snapshot || {};
  const shopName = shop.shop_name || 'GODAVARI TRADERS';
  const shopPhone = shop.phone || shop.whatsapp_number || '+91 98480 22334';
  const shopAddress = [shop.address_line1, shop.city, shop.state].filter(Boolean).join(', ') || 'Siddapu Road, Sadashivpet, Telangana';

  const hasTax = invoice.is_gst_invoice && (invoice.tax_breakup?.total_tax || 0) > 0;
  const billType = hasTax ? 'TAX INVOICE' : 'RETAIL INVOICE';

  const msg = encodeURIComponent(
    `🏛️ *${shopName} - ${billType}*\n` +
    `📍 ${shopAddress}\n` +
    `----------------------------------------\n` +
    `📄 Invoice No: *${invoice.invoice_number}*\n` +
    `👤 Customer: *${invoice.customer.name}*\n` +
    `📅 Date: ${new Date(invoice.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}\n` +
    `💰 Grand Total: *₹${invoice.grand_total.toLocaleString('en-IN')}* (${invoice.payment_status})\n` +
    (invoice.balance_due > 0 ? `⚠️ Balance Due: *₹${invoice.balance_due.toLocaleString('en-IN')}*\n` : '') +
    `----------------------------------------\n` +
    `🔗 *Official PDF Bill & Digital View:*\n` +
    `${window.location.origin}/invoice/view/${invoice.public_token}\n\n` +
    `Thank you for choosing ${shopName}!\n` +
    (shop.owner_name ? `Proprietor: ${shop.owner_name}\n` : '') +
    `📞 Contact: ${shopPhone}`
  );

  return phoneParam ? `https://wa.me/${phoneParam}?text=${msg}` : `https://wa.me/?text=${msg}`;
}

export async function generateInvoicePdfBlob(elementId: string): Promise<Blob> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('Invoice printable element not found');
  }

  // 1. Clone element to a clean, fixed-width container designed specifically for standard A4
  // 794px at 96 DPI matches 210mm A4 width perfectly with zero column wrapping or cutoff
  const clone = element.cloneNode(true) as HTMLElement;

  clone.style.width = '794px';
  clone.style.minWidth = '794px';
  clone.style.maxWidth = '794px';
  clone.style.height = 'auto';
  clone.style.maxHeight = 'none';
  clone.style.overflow = 'visible';
  clone.style.position = 'fixed';
  clone.style.left = '-9999px';
  clone.style.top = '0';
  clone.style.zIndex = '-99999';
  clone.style.backgroundColor = '#ffffff';
  clone.style.padding = '32px 36px';
  clone.style.boxSizing = 'border-box';
  clone.style.margin = '0';

  // Make sure all scrollable wrappers inside the clone are fully expanded
  const scrollables = clone.querySelectorAll('.overflow-y-auto, .overflow-x-auto, [class*="overflow"]');
  scrollables.forEach((sc) => {
    (sc as HTMLElement).style.overflow = 'visible';
    (sc as HTMLElement).style.maxHeight = 'none';
    (sc as HTMLElement).style.width = '100%';
  });

  // Make sure all tables inside the clone expand across the full 794px width
  const tables = clone.querySelectorAll('table');
  tables.forEach((tbl) => {
    (tbl as HTMLElement).style.width = '100%';
    (tbl as HTMLElement).style.minWidth = '100%';
    (tbl as HTMLElement).style.tableLayout = 'auto';
  });

  // Hide any elements with print:hidden
  const printHidden = clone.querySelectorAll('.print\\:hidden');
  printHidden.forEach((el) => {
    (el as HTMLElement).style.display = 'none';
  });

  document.body.appendChild(clone);

  try {
    // 2. Render high-resolution canvas with 2x retina crisp quality
    const canvas = await html2canvas(clone, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      width: 794,
      windowWidth: 794,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    // 3. Create standard A4 PDF document (210mm x 297mm)
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pageWidth = pdf.internal.pageSize.getWidth(); // 210mm
    const pageHeight = pdf.internal.pageSize.getHeight(); // 297mm
    const margin = 8; // 8mm margin
    const printableWidth = pageWidth - margin * 2; // 194mm
    const printableHeight = (canvas.height * printableWidth) / canvas.width;

    if (printableHeight <= pageHeight - margin * 2) {
      // Single page layout
      pdf.addImage(imgData, 'JPEG', margin, margin, printableWidth, printableHeight);
    } else {
      // Multi-page slicing if the invoice has many materials
      let heightLeft = printableHeight;
      let position = margin;
      const pageUsableHeight = pageHeight - margin * 2;

      pdf.addImage(imgData, 'JPEG', margin, position, printableWidth, printableHeight);
      heightLeft -= pageUsableHeight;

      while (heightLeft > 0) {
        position = margin - (printableHeight - heightLeft);
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', margin, position, printableWidth, printableHeight);
        heightLeft -= pageUsableHeight;
      }
    }

    return pdf.output('blob');
  } finally {
    if (document.body.contains(clone)) {
      document.body.removeChild(clone);
    }
  }
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

  // 3. Desktop Fallback: Trigger direct file download and open WhatsApp Web
  const url = URL.createObjectURL(pdfBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  const waUrl = buildWhatsAppUrl(invoice);
  window.open(waUrl, '_blank');

  return { mode: 'desktop_download_and_chat', fileName };
}
