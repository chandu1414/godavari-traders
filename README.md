# GODAVARI TRADERS – Digital Billing & Shop Management System

A production-ready, mobile-first Progressive Web Application (PWA) and digital billing system purpose-built for **GODAVARI TRADERS** (Building & Construction Materials – Cement brands, TMT Steel rebars, White Stone Dust, River Sand, Bricks, and Aggregates).

---

## 🚀 How to Open the Application

### Option 1: One-Click Instant Launch
Double-click `start.bat` in the project root folder:
```text
C:\Users\bhara\.gemini\antigravity\scratch\godavari-traders\start.bat
```
Then open your web browser (Chrome, Edge, Safari, Firefox) and navigate to:
👉 **[http://localhost:5000](http://localhost:5000)**

---

### Option 2: Command Line Launch

**Terminal 1 (Backend & Unified Fullstack Server):**
```powershell
cd C:\Users\bhara\.gemini\antigravity\scratch\godavari-traders\backend
python app.py
```
Open **[http://localhost:5000](http://localhost:5000)** in any browser.

**Terminal 2 (Optional - Vite Frontend Dev Server with Hot Reload):**
```powershell
cd C:\Users\bhara\.gemini\antigravity\scratch\godavari-traders\frontend
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)**.

---

## 🔑 Login Credentials

The system comes pre-configured with two user roles:

| Role | Username | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Shop Owner (Admin)** | `admin` | `Godavari@2026` | Full access (Billing, Products, Invoices, Khata, Reports, Settings, User Management) |
| **Billing Desk (Cashier)** | `cashier` | `Billing@2026` | POS Billing, Product search, Customer Khata, Invoicing |

*(One-click demo buttons are available on the login screen for instant access).*

---

## 📱 Mobile PWA Installation (Smartphones & Tablets)

1. Open **`http://<YOUR_COMPUTER_IP>:5000`** in Chrome on Android or Safari on iPhone (connected to the same Wi-Fi).
2. **Android**: Tap the 3 dots menu in Chrome -> tap **"Add to Home screen"** or **"Install App"**.
3. **iPhone (iOS)**: Tap the Share button in Safari -> tap **"Add to Home Screen"**.
4. The Godavari Traders app icon will now appear on your phone home screen and open in standalone full-screen app mode!

---

## 🏛️ Key Capabilities Built for Godavari Traders

1. **POS Digital Billing**:
   - Visual material catalogue with category chips (Cement, TMT Steel, Stone Dust, Sand, Bricks).
   - Instant calculation (Item Total = Qty × Rate).
   - GST (CGST 9% + SGST 9% or 14% + 14%) and Non-GST bill switch.
   - Site delivery address & lorry transport fee calculator.
   - Discount support (percentage or flat ₹).
   - Auto-rounding and grand total calculation.

2. **Official Tax Invoice Generation**:
   - Unique serial numbering (`GT-2026-1001`, `GT-2026-1002`, ...).
   - Godavari Traders header, shop address, phone, GSTIN, PAN, and bank details.
   - Dynamic **UPI Payment QR Code** (PhonePe / Google Pay / Paytm ready).
   - Printable in standard A4 and 3-inch (80mm) POS Thermal Slip format.

3. **WhatsApp & SMS Sharing**:
   - **WhatsApp**: 1-click direct link to customer WhatsApp with formatted invoice breakdown and secure viewing URL.
   - **SMS**: Tokenized public URL (`/invoice/view/:token`) protecting invoice records from predictable URL discovery.

4. **Product Inventory**:
   - Add/edit materials, manage rates per Bag, Ton, Truck, Brass, Piece, Bundle, or Kg.
   - Low stock alerts and quick stock adjustments.

5. **Customer Khata (Credit Ledger)**:
   - Tracks regular building contractors and customer purchase history.
   - Records partial payments and keeps running balances due.

6. **Analytics & Reports**:
   - Today's sales, weekly trends, category breakdown, fast-moving items, and payment mode split (Cash vs UPI vs Credit).
