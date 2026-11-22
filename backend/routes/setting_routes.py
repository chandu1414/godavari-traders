from flask import Blueprint, request, jsonify
from database import get_db
from auth import login_required, admin_required
from config import DEFAULT_SHOP_SETTINGS

setting_bp = Blueprint("settings", __name__)

@setting_bp.route("", methods=["GET"])
def get_shop_settings():
    settings_col = get_db().get_collection("settings")
    settings = settings_col.find_one({"_id": "shop_settings_default"})
    if not settings:
        settings = DEFAULT_SHOP_SETTINGS.copy()
        settings_col.insert_one(settings)
    return jsonify({"success": True, "settings": settings})

@setting_bp.route("", methods=["PUT"])
@admin_required
def update_shop_settings():
    data = request.get_json() or {}
    settings_col = get_db().get_collection("settings")
    
    update_data = {}
    allowed_keys = [
        "shop_name", "owner_name", "tagline", "address_line1", "address_line2",
        "city", "district", "state", "pincode", "state_code", "phone", "whatsapp_number",
        "email", "gstin", "pan_number", "upi_id", "bank_name",
        "bank_account_no", "bank_ifsc", "bank_branch", "invoice_prefix",
        "enable_gst_by_default", "default_gst_rate", "footer_notes",
        "terms_conditions"
    ]

    for key in allowed_keys:
        if key in data:
            if key in ["enable_gst_by_default"]:
                update_data[key] = bool(data[key])
            elif key in ["default_gst_rate"]:
                update_data[key] = float(data[key])
            else:
                update_data[key] = str(data[key]).strip()

    settings_col.update_one({"_id": "shop_settings_default"}, {"$set": update_data}, upsert=True)
    updated = settings_col.find_one({"_id": "shop_settings_default"})
    return jsonify({"success": True, "message": "Shop settings updated successfully.", "settings": updated})
