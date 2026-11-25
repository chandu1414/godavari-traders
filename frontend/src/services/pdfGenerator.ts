import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Invoice, ShopSettings } from '../types';

export function mergeShopInfo(
  snapshot?: Partial<ShopSettings>,
  liveSettings?: Partial<ShopSettings> | null
): Partial<ShopSettings> {
  const merged: Partial<ShopSettings> = { ...(snapshot || {}) };
  if (liveSettings) {
    (Object.keys(liveSettings) as (keyof ShopSettings)[]).forEach((key) => {
      const val = liveSettings[key];
      if (val !== undefined && val !== null && val !== '') {
        (merged as any)[key] = val;
      }
    });
  }
  return merged;
}

export function numberToIndianWords(amount: number): string {
  const num = Math.round(Math.abs(amount));
  if (num === 0) return 'Rupees Zero Only';

  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const twoDigits = (n: number): string => {
    if (n < 20) return ones[n];
    return `${tens[Math.floor(n / 10)]}${n % 10 ? ` ${ones[n % 10]}` : ''}`.trim();
  };

  const threeDigits = (n: number): string => {
    if (n < 100) return twoDigits(n);
    const rem = n % 100;
    return `${ones[Math.floor(n / 100)]} Hundred${rem ? ` ${twoDigits(rem)}` : ''}`.trim();
  };

  const parts: string[] = [];
  const crore = Math.floor(num / 10000000);
  const lakh = Math.floor((num % 10000000) / 100000);
  const thousand = Math.floor((num % 100000) / 1000);
  const rest = num % 1000;

  if (crore > 0) parts.push(`${twoDigits(crore)} Crore`);
  if (lakh > 0) parts.push(`${twoDigits(lakh)} Lakh`);
  if (thousand > 0) parts.push(`${twoDigits(thousand)} Thousand`);
  if (rest > 0) parts.push(threeDigits(rest));

  return `Rupees ${parts.join(' ')} Only`;
}

export function buildWhatsAppUrl(
  invoice: Invoice,
  directPhone?: string,
  liveSettings?: Partial<ShopSettings> | null
): string {
  const targetPhone = directPhone || invoice.customer.whatsapp || invoice.customer.phone || '';
  const cleanPhone = targetPhone.replace(/\D/g, '');
  const phoneParam = cleanPhone ? (cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone) : '';

  const shop = mergeShopInfo(invoice.shop_snapshot, liveSettings);
  const shopName = shop.shop_name || 'GODAVARI TRADERS';
  const shopPhone = shop.phone || shop.whatsapp_number || '';
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
    `💰 Grand Total: *₹${invoice.grand_total.toLocaleString('en-IN')}*\n` +
    (invoice.amount_paid > 0 && invoice.balance_due > 0
      ? `💵 Paid Now: *₹${invoice.amount_paid.toLocaleString('en-IN')}* (${invoice.payment_mode})\n📒 Added to Khata (Udhaar): *₹${invoice.balance_due.toLocaleString('en-IN')}*\n💳 Status: *PARTIALLY PAID*\n`
      : invoice.balance_due > 0
      ? `📒 Added to Khata (Udhaar): *₹${invoice.balance_due.toLocaleString('en-IN')}*\n💳 Status: *KHATA / UDHAAR*\n`
      : `✅ Paid in Full: *₹${invoice.grand_total.toLocaleString('en-IN')}* (${invoice.payment_mode})\n💳 Status: *PAID*\n`
    ) +
    `----------------------------------------\n` +
    `🔗 *Official PDF Bill & Digital View:*\n` +
    `${window.location.origin}/invoice/view/${invoice.public_token}\n\n` +
    `Thank you for choosing ${shopName}!\n` +
    (shop.owner_name ? `Proprietor: ${shop.owner_name}\n` : '') +
    (shopPhone ? `📞 Contact: ${shopPhone}` : '')
  );

  return phoneParam ? `https://wa.me/${phoneParam}?text=${msg}` : `https://wa.me/?text=${msg}`;
}

async function waitForImages(container: HTMLElement): Promise<void> {
  const imgs = Array.from(container.querySelectorAll('img'));
  await Promise.all(
    imgs.map((img) => {
      if (img.complete) return Promise.resolve();
      return new Promise<void>((resolve) => {
        const timer = setTimeout(resolve, 2500);
        img.onload = () => {
          clearTimeout(timer);
          resolve();
        };
        img.onerror = () => {
          clearTimeout(timer);
          resolve();
        };
      });
    })
  );
}

export async function generateInvoicePdfBlob(elementId: string): Promise<Blob> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('Invoice printable element not found');
  }

  // Clone element to a clean A4-proportioned container (794px @ 96 DPI = 210mm)
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
  clone.style.padding = '24px 28px';
  clone.style.boxSizing = 'border-box';
  clone.style.margin = '0';

  const scrollables = clone.querySelectorAll('.overflow-y-auto, .overflow-x-auto, [class*="overflow"]');
  scrollables.forEach((sc) => {
    (sc as HTMLElement).style.overflow = 'visible';
    (sc as HTMLElement).style.maxHeight = 'none';
    (sc as HTMLElement).style.width = '100%';
  });

  const tables = clone.querySelectorAll('table');
  tables.forEach((tbl) => {
    (tbl as HTMLElement).style.width = '100%';
    (tbl as HTMLElement).style.minWidth = '100%';
    (tbl as HTMLElement).style.tableLayout = 'auto';
  });

  const printHidden = clone.querySelectorAll('.print\\:hidden');
  printHidden.forEach((el) => {
    (el as HTMLElement).style.display = 'none';
  });

  document.body.appendChild(clone);

  try {
    await waitForImages(clone);

    const canvas = await html2canvas(clone, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      width: 794,
      windowWidth: 794,
      scrollX: 0,
      scrollY: 0,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.98);

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
      pdf.addImage(imgData, 'JPEG', margin, margin, printableWidth, printableHeight);
    } else {
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
  elementId: string,
  liveSettings?: Partial<ShopSettings> | null
): Promise<{ mode: 'native_file_share' | 'desktop_download_and_chat'; fileName: string }> {
  const fileName = `Godavari-Traders-Invoice-${invoice.invoice_number}.pdf`;
  const shopName = liveSettings?.shop_name || invoice.shop_snapshot?.shop_name || 'Godavari Traders';

  const pdfBlob = await generateInvoicePdfBlob(elementId);
  const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });

  if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
    try {
      await navigator.share({
        files: [pdfFile],
        title: `Bill ${invoice.invoice_number} - ${shopName}`,
        text: `Official Bill ${invoice.invoice_number} from ${shopName} (Amount: Rs. ${invoice.grand_total.toLocaleString('en-IN')})`,
      });
      return { mode: 'native_file_share', fileName };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return { mode: 'native_file_share', fileName };
      }
      console.warn('Native file share failed, falling back to download + WhatsApp', err);
    }
  }

  const url = URL.createObjectURL(pdfBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  const waUrl = buildWhatsAppUrl(invoice, undefined, liveSettings);
  window.open(waUrl, '_blank');

  return { mode: 'desktop_download_and_chat', fileName };
}
