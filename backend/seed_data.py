from datetime import datetime, timedelta
import random
from config import DEFAULT_SHOP_SETTINGS
from database import get_db
from auth import hash_password

def seed_database():
    db = get_db()
    users_col = db.get_collection("users")
    settings_col = db.get_collection("settings")
    products_col = db.get_collection("products")
    customers_col = db.get_collection("customers")
    invoices_col = db.get_collection("invoices")

    # 1. Seed Shop Settings
    if not settings_col.find_one({"_id": "shop_settings_default"}):
        settings_col.insert_one(DEFAULT_SHOP_SETTINGS)
        print("[Seed] Created default shop settings for Godavari Traders.")

    # 2. Seed Admin / Owner and Staff User
    if not users_col.find_one({"username": "admin"}):
        admin_user = {
            "_id": "user_owner_001",
            "username": "admin",
            "email": "owner@godavaritraders.com",
            "full_name": "Godavari Traders Owner",
            "role": "admin",
            "phone": "+91 98480 22334",
            "password": hash_password("Godavari@2026"),
            "is_active": True,
            "created_at": datetime.utcnow().isoformat()
        }
        users_col.insert_one(admin_user)
        print("[Seed] Seeded Owner User: admin / Godavari@2026")

    if not users_col.find_one({"username": "cashier"}):
        staff_user = {
            "_id": "user_staff_002",
            "username": "cashier",
            "email": "billing@godavaritraders.com",
            "full_name": "Shop Billing Desk",
            "role": "cashier",
            "phone": "+91 98480 22335",
            "password": hash_password("Billing@2026"),
            "is_active": True,
            "created_at": datetime.utcnow().isoformat()
        }
        users_col.insert_one(staff_user)
        print("[Seed] Seeded Cashier User: cashier / Billing@2026")

    # 3. Seed Realistic Construction Materials Catalogue
    if products_col.count_documents() == 0:
        sample_products = [
            # Cement
            {
                "name": "UltraTech Super Cement",
                "brand": "UltraTech",
                "category": "Cement",
                "unit": "Bag",
                "selling_price": 380.0,
                "purchase_price": 350.0,
                "stock": 450,
                "min_stock_alert": 50,
                "hsn_code": "2523",
                "gst_rate": 28.0,
                "description": "50kg Premium Grade Portland Pozzolana Cement (PPC) for all RCC concrete structures.",
                "image_url": "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=400&auto=format&fit=crop&q=60",
                "is_active": True
            },
            {
                "name": "Dalmia Bharat Cement",
                "brand": "Dalmia",
                "category": "Cement",
                "unit": "Bag",
                "selling_price": 365.0,
                "purchase_price": 335.0,
                "stock": 320,
                "min_stock_alert": 40,
                "hsn_code": "2523",
                "gst_rate": 28.0,
                "description": "50kg High-early strength Portland composite cement, weather and crack resistant.",
                "image_url": "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&auto=format&fit=crop&q=60",
                "is_active": True
            },
            {
                "name": "ACC Gold Water Shield",
                "brand": "ACC",
                "category": "Cement",
                "unit": "Bag",
                "selling_price": 395.0,
                "purchase_price": 360.0,
                "stock": 280,
                "min_stock_alert": 35,
                "hsn_code": "2523",
                "gst_rate": 28.0,
                "description": "50kg Water repellent premium cement with micro-mesh technology for roof and basement waterproofing.",
                "image_url": "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?w=400&auto=format&fit=crop&q=60",
                "is_active": True
            },

            # Steel / TMT Bars
            {
                "name": "Tata Tiscon 550D TMT Bar 12mm",
                "brand": "Tata Tiscon",
                "category": "Steel / TMT Bars",
                "unit": "Ton",
                "selling_price": 64000.0,
                "purchase_price": 60500.0,
                "stock": 15,
                "min_stock_alert": 3,
                "hsn_code": "7214",
                "gst_rate": 18.0,
                "description": "Super ductile Fe-550D ribbed TMT rebars engineered for high earthquake resistance.",
                "image_url": "https://images.unsplash.com/photo-1535813547-99c456a41d4a?w=400&auto=format&fit=crop&q=60",
                "is_active": True
            },
            {
                "name": "Tata Tiscon 550D TMT Bar 10mm",
                "brand": "Tata Tiscon",
                "category": "Steel / TMT Bars",
                "unit": "Ton",
                "selling_price": 64500.0,
                "purchase_price": 61000.0,
                "stock": 12,
                "min_stock_alert": 2,
                "hsn_code": "7214",
                "gst_rate": 18.0,
                "description": "10mm Fe-550D high tensile steel rebar for beams, columns and slabs.",
                "image_url": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&auto=format&fit=crop&q=60",
                "is_active": True
            },
            {
                "name": "Jindal Panther TMT 16mm",
                "brand": "Jindal Panther",
                "category": "Steel / TMT Bars",
                "unit": "Ton",
                "selling_price": 62000.0,
                "purchase_price": 58500.0,
                "stock": 18,
                "min_stock_alert": 4,
                "hsn_code": "7214",
                "gst_rate": 18.0,
                "description": "16mm heavy construction TMT bar for foundational footings and multi-story pillars.",
                "image_url": "https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?w=400&auto=format&fit=crop&q=60",
                "is_active": True
            },
            {
                "name": "Prime Fe-550 TMT Rebar 8mm",
                "brand": "Godavari Prime",
                "category": "Steel / TMT Bars",
                "unit": "Kg",
                "selling_price": 66.0,
                "purchase_price": 60.0,
                "stock": 2500,
                "min_stock_alert": 300,
                "hsn_code": "7214",
                "gst_rate": 18.0,
                "description": "8mm stirrup and ring fabrication steel, certified tensile strength.",
                "image_url": "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&auto=format&fit=crop&q=60",
                "is_active": True
            },

            # Stone Dust & Aggregates
            {
                "name": "Premium White Stone Dust (Full Truck)",
                "brand": "Godavari Quarries",
                "category": "White Stone Dust",
                "unit": "Truck",
                "selling_price": 7500.0,
                "purchase_price": 6200.0,
                "stock": 8,
                "min_stock_alert": 2,
                "hsn_code": "2517",
                "gst_rate": 5.0,
                "description": "Direct tipper truck load (approx 400 cubic feet / 16 tons) fine crushed white quarry dust for masonry plastering and block manufacturing.",
                "image_url": "https://images.unsplash.com/photo-1578885136359-16c8bd4d3a8e?w=400&auto=format&fit=crop&q=60",
                "is_active": True
            },
            {
                "name": "White Stone Dust (Per Brass)",
                "brand": "Godavari Quarries",
                "category": "White Stone Dust",
                "unit": "Brass",
                "selling_price": 1900.0,
                "purchase_price": 1550.0,
                "stock": 35,
                "min_stock_alert": 5,
                "hsn_code": "2517",
                "gst_rate": 5.0,
                "description": "1 Brass (100 cubic feet) dry screened white stone dust for mortar and concrete mix.",
                "image_url": "https://images.unsplash.com/photo-1578885136359-16c8bd4d3a8e?w=400&auto=format&fit=crop&q=60",
                "is_active": True
            },
            {
                "name": "20mm Blue Granite Jelly / Metal",
                "brand": "Local Quarry",
                "category": "Sand & Aggregates",
                "unit": "Brass",
                "selling_price": 2400.0,
                "purchase_price": 2050.0,
                "stock": 25,
                "min_stock_alert": 5,
                "hsn_code": "2517",
                "gst_rate": 5.0,
                "description": "20mm crushed blue granite stone aggregates for RCC slab casting and pillars.",
                "image_url": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&auto=format&fit=crop&q=60",
                "is_active": True
            },

            # Sand & Bricks
            {
                "name": "Screened River Sand (Truck Load)",
                "brand": "Godavari River Sand",
                "category": "Sand & Aggregates",
                "unit": "Truck",
                "selling_price": 14000.0,
                "purchase_price": 11500.0,
                "stock": 6,
                "min_stock_alert": 1,
                "hsn_code": "2505",
                "gst_rate": 5.0,
                "description": "Government approved Godavari river sand, washed and silt-free for strong plastering and concrete.",
                "image_url": "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=400&auto=format&fit=crop&q=60",
                "is_active": True
            },
            {
                "name": "Red Clay Wire Cut Bricks (1000 Pcs)",
                "brand": "Kiln Direct",
                "category": "Bricks & Blocks",
                "unit": "Bundle",
                "selling_price": 9500.0,
                "purchase_price": 8200.0,
                "stock": 20,
                "min_stock_alert": 3,
                "hsn_code": "6901",
                "gst_rate": 12.0,
                "description": "Uniform oven-baked red chamber bricks with sharp edges, compressive strength > 7.5 N/mm².",
                "image_url": "https://images.unsplash.com/photo-1584463699042-3081e7d0bbcf?w=400&auto=format&fit=crop&q=60",
                "is_active": True
            },
            {
                "name": "Solid Concrete Blocks 8x8x16",
                "brand": "Godavari Precast",
                "category": "Bricks & Blocks",
                "unit": "Piece",
                "selling_price": 42.0,
                "purchase_price": 34.0,
                "stock": 1800,
                "min_stock_alert": 200,
                "hsn_code": "6810",
                "gst_rate": 12.0,
                "description": "Heavy duty machine-compressed solid concrete blocks for load-bearing external walls.",
                "image_url": "https://images.unsplash.com/photo-1541888946425-d0fbb18f15f6?w=400&auto=format&fit=crop&q=60",
                "is_active": True
            },

            # Chemicals & Hardware
            {
                "name": "Dr. Fixit Pidiproof 2LW+ (20 Litres)",
                "brand": "Dr. Fixit",
                "category": "Waterproofing & Chemicals",
                "unit": "Can",
                "selling_price": 2850.0,
                "purchase_price": 2400.0,
                "stock": 40,
                "min_stock_alert": 5,
                "hsn_code": "3824",
                "gst_rate": 18.0,
                "description": "Integral liquid waterproofing compound for plaster, mortar and structural concrete.",
                "image_url": "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&auto=format&fit=crop&q=60",
                "is_active": True
            },
            {
                "name": "Annealed Binding Wire 18G (25kg Bundle)",
                "brand": "Tata Wiron",
                "category": "Hardware & Binding",
                "unit": "Bundle",
                "selling_price": 1950.0,
                "purchase_price": 1700.0,
                "stock": 55,
                "min_stock_alert": 10,
                "hsn_code": "7217",
                "gst_rate": 18.0,
                "description": "Soft annealed MS binding wire for tying steel rebars without breaking.",
                "image_url": "https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?w=400&auto=format&fit=crop&q=60",
                "is_active": True
            }
        ]
        products_col.insert_many(sample_products)
        print(f"[Seed] Added {len(sample_products)} construction materials to product catalogue.")

    # 4. Seed Sample Customers
    if customers_col.count_documents() == 0:
        sample_customers = [
            {
                "name": "M. Satyanarayana (Contractor)",
                "phone": "+91 94401 55667",
                "whatsapp": "919440155667",
                "address": "Plot 42, Shanti Nagar, Sadashivpet",
                "total_purchases": 184500.0,
                "total_invoices": 4,
                "outstanding_due": 24000.0,
                "created_at": (datetime.utcnow() - timedelta(days=20)).isoformat()
            },
            {
                "name": "Sri Rama Constructions",
                "phone": "+91 98492 88990",
                "whatsapp": "919849288990",
                "address": "Site #5, Bypass Road, Sadashivpet",
                "total_purchases": 320000.0,
                "total_invoices": 6,
                "outstanding_due": 0.0,
                "created_at": (datetime.utcnow() - timedelta(days=15)).isoformat()
            },
            {
                "name": "K. Venkata Rao (Home Owner)",
                "phone": "+91 93910 11223",
                "whatsapp": "919391011223",
                "address": "H.No 12-4-8, Tilak Road, Sadashivpet",
                "total_purchases": 74500.0,
                "total_invoices": 2,
                "outstanding_due": 5000.0,
                "created_at": (datetime.utcnow() - timedelta(days=5)).isoformat()
            }
        ]
        customers_col.insert_many(sample_customers)
        print(f"[Seed] Added {len(sample_customers)} sample customers.")

    # 5. Seed Initial Real Recent Invoices
    if invoices_col.count_documents() == 0:
        now = datetime.utcnow()
        sample_invoices = [
            {
                "invoice_number": "GT-2026-1001",
                "public_token": "token-gt-1001-sec782",
                "date": (now - timedelta(hours=3)).isoformat(),
                "customer": {
                    "name": "M. Satyanarayana (Contractor)",
                    "phone": "+91 94401 55667",
                    "whatsapp": "919440155667",
                    "address": "Plot 42, Shanti Nagar, Sadashivpet"
                },
                "items": [
                    {
                        "product_name": "UltraTech Super Cement",
                        "brand": "UltraTech",
                        "category": "Cement",
                        "unit": "Bag",
                        "quantity": 100,
                        "rate": 380.0,
                        "amount": 38000.0,
                        "gst_rate": 28.0,
                        "hsn_code": "2523"
                    },
                    {
                        "product_name": "Premium White Stone Dust (Full Truck)",
                        "brand": "Godavari Quarries",
                        "category": "White Stone Dust",
                        "unit": "Truck",
                        "quantity": 1,
                        "rate": 7500.0,
                        "amount": 7500.0,
                        "gst_rate": 5.0,
                        "hsn_code": "2517"
                    }
                ],
                "subtotal": 45500.0,
                "discount_amount": 500.0,
                "is_gst_invoice": True,
                "tax_breakup": {
                    "taxable_amount": 45000.0,
                    "cgst_amount": 4050.0,
                    "sgst_amount": 4050.0,
                    "total_tax": 8100.0
                },
                "delivery": {
                    "is_delivery": True,
                    "delivery_charge": 1200.0,
                    "delivery_address": "Plot 42, Shanti Nagar, Sadashivpet",
                    "instructions": "Unload at rear lot before 4 PM"
                },
                "round_off": 0.0,
                "grand_total": 54300.0,
                "payment_mode": "UPI",
                "payment_status": "PAID",
                "amount_paid": 54300.0,
                "balance_due": 0.0,
                "created_by": "admin",
                "notes": "Materials delivered via vehicle AP39-Y-4455"
            },
            {
                "invoice_number": "GT-2026-1002",
                "public_token": "token-gt-1002-sec911",
                "date": (now - timedelta(days=1, hours=4)).isoformat(),
                "customer": {
                    "name": "Sri Rama Constructions",
                    "phone": "+91 98492 88990",
                    "whatsapp": "919849288990",
                    "address": "Site #5, Bypass Road, Sadashivpet"
                },
                "items": [
                    {
                        "product_name": "Tata Tiscon 550D TMT Bar 12mm",
                        "brand": "Tata Tiscon",
                        "category": "Steel / TMT Bars",
                        "unit": "Ton",
                        "quantity": 2,
                        "rate": 64000.0,
                        "amount": 128000.0,
                        "gst_rate": 18.0,
                        "hsn_code": "7214"
                    },
                    {
                        "product_name": "Annealed Binding Wire 18G (25kg Bundle)",
                        "brand": "Tata Wiron",
                        "category": "Hardware & Binding",
                        "unit": "Bundle",
                        "quantity": 4,
                        "rate": 1950.0,
                        "amount": 7800.0,
                        "gst_rate": 18.0,
                        "hsn_code": "7217"
                    }
                ],
                "subtotal": 135800.0,
                "discount_amount": 1800.0,
                "is_gst_invoice": True,
                "tax_breakup": {
                    "taxable_amount": 134000.0,
                    "cgst_amount": 12060.0,
                    "sgst_amount": 12060.0,
                    "total_tax": 24120.0
                },
                "delivery": {
                    "is_delivery": True,
                    "delivery_charge": 2500.0,
                    "delivery_address": "Site #5, Bypass Road, Sadashivpet",
                    "instructions": "Crane unloading at site"
                },
                "round_off": 0.0,
                "grand_total": 160620.0,
                "payment_mode": "Bank Transfer",
                "payment_status": "PAID",
                "amount_paid": 160620.0,
                "balance_due": 0.0,
                "created_by": "admin",
                "notes": "NEFT ref: SBIN772810398"
            },
            {
                "invoice_number": "GT-2026-1003",
                "public_token": "token-gt-1003-sec344",
                "date": (now - timedelta(days=2)).isoformat(),
                "customer": {
                    "name": "K. Venkata Rao (Home Owner)",
                    "phone": "+91 93910 11223",
                    "whatsapp": "919391011223",
                    "address": "H.No 12-4-8, Tilak Road, Sadashivpet"
                },
                "items": [
                    {
                        "product_name": "ACC Gold Water Shield",
                        "brand": "ACC",
                        "category": "Cement",
                        "unit": "Bag",
                        "quantity": 50,
                        "rate": 395.0,
                        "amount": 19750.0,
                        "gst_rate": 28.0,
                        "hsn_code": "2523"
                    },
                    {
                        "product_name": "Dr. Fixit Pidiproof 2LW+ (20 Litres)",
                        "brand": "Dr. Fixit",
                        "category": "Waterproofing & Chemicals",
                        "unit": "Can",
                        "quantity": 2,
                        "rate": 2850.0,
                        "amount": 5700.0,
                        "gst_rate": 18.0,
                        "hsn_code": "3824"
                    }
                ],
                "subtotal": 25450.0,
                "discount_amount": 450.0,
                "is_gst_invoice": False,
                "tax_breakup": {
                    "taxable_amount": 25000.0,
                    "cgst_amount": 0.0,
                    "sgst_amount": 0.0,
                    "total_tax": 0.0
                },
                "delivery": {
                    "is_delivery": True,
                    "delivery_charge": 600.0,
                    "delivery_address": "H.No 12-4-8, Tilak Road, Sadashivpet",
                    "instructions": ""
                },
                "round_off": 0.0,
                "grand_total": 25600.0,
                "payment_mode": "Cash",
                "payment_status": "PARTIAL",
                "amount_paid": 20000.0,
                "balance_due": 5600.0,
                "created_by": "cashier",
                "notes": "Balance due on Monday"
            }
        ]
        invoices_col.insert_many(sample_invoices)
        # Update next invoice number in settings
        settings_col.update_one({"_id": "shop_settings_default"}, {"$set": {"next_invoice_number": 1004}})
        print(f"[Seed] Added {len(sample_invoices)} initial verified invoices.")

if __name__ == "__main__":
    seed_database()
