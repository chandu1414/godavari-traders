# Deployment Guide – GODAVARI TRADERS

Deploy this full-stack application online for free (₹0 budget) so you, your friend, and the shop owner can access it from any smartphone or laptop worldwide.

---

## 🚀 2-Minute Deployment on Render.com (Recommended & 100% Free)

Render provides a completely free cloud hosting tier for Python and React web applications.

### Step 1: Push Code to GitHub
1. Open your browser and go to [github.com/new](https://github.com/new).
2. Name the repository: `godavari-traders` and click **Create repository**.
3. In your terminal/PowerShell, run:
```powershell
cd C:\Users\bhara\.gemini\antigravity\scratch\godavari-traders
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/godavari-traders.git
git branch -M main
git push -u origin main
```

---

### Step 2: Deploy on Render.com (Free Web Service)
1. Go to [render.com](https://render.com) and sign in with your GitHub account.
2. Click the **"New +"** button at the top right and select **"Web Service"**.
3. Connect your **`godavari-traders`** repository.
4. Fill in these 3 simple settings (the repository already has `render.yaml` configured):
   - **Name:** `godavari-traders`
   - **Runtime:** `Python 3`
   - **Build Command:**
     ```bash
     cd frontend && npm install && npm run build && cd ../backend && pip install -r requirements.txt
     ```
   - **Start Command:**
     ```bash
     cd backend && python app.py
     ```
   - **Instance Type:** Select **Free** ($0 / month).
5. Click **"Deploy Web Service"**!

---

### Step 3: Access from Anywhere
In 2-3 minutes, Render will provide your permanent public HTTPS URL:
👉 **`https://godavari-traders.onrender.com`**

- You and your friend can open this URL directly in Chrome or Safari on your phones.
- It will open the mobile PWA view, allow you to create bills, generate invoices, send WhatsApp messages, and install the app to your phone's home screen!
