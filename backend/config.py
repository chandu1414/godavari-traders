import os

SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "godavari_traders_super_secret_jwt_key_2026_secure")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24 * 7  # 7 days session

DEFAULT_CATEGORIES = [
    "Cement",
    "Steel / TMT Bars",
    "White Stone Dust",
    "Sand & Aggregates",
    "Bricks & Blocks",
    "Waterproofing & Chemicals",
    "Hardware & Binding",
    "Other Construction Materials"
]

DEFAULT_UNITS = [
    "Bag",
    "Kg",
    "Ton",
    "Truck",
    "Brass",
    "Piece",
    "Bundle",
    "Can",
    "Meter"
]

DEFAULT_SHOP_SETTINGS = {
    "_id": "shop_settings_default",
    "shop_name": "GODAVARI TRADERS",
    "owner_name": "Prathik Yadav",
    "tagline": "Wholesale & Retail Building Materials - Cement, Steel, Stone Dust & Sand",
    "address_line1": "Siddapu Road",
    "address_line2": "Sadashivpet",
    "city": "Sadashivpet",
    "district": "Sangareddy",
    "state": "Telangana",
    "pincode": "502291",
    "state_code": "36",
    "phone": "+91 98480 22334",
    "whatsapp_number": "919848022334",
    "email": "contact@godavaritraders.com",
    "gstin": "36AAAAA0000A1Z5",
    "pan_number": "AAAAA0000A",
    "upi_id": "godavaritraders@okaxis",
    "bank_name": "State Bank of India",
    "bank_account_no": "38291029381",
    "bank_ifsc": "SBIN0001234",
    "bank_branch": "Main Branch, Sadashivpet",
    "invoice_prefix": "GT-2026-",
    "next_invoice_number": 1001,
    "enable_gst_by_default": False,
    "default_gst_rate": 0.0,
    "footer_notes": "Thank you for building with Godavari Traders!",
    "terms_conditions": "1. Goods once sold will not be accepted or exchanged without prior inspection.\n2. Delivery of materials is subject to road and site unloading clearance.\n3. Interest @ 18% per annum will be charged on unpaid invoices after 15 days.\n4. Disputes subject to Sangareddy jurisdiction only."
}
