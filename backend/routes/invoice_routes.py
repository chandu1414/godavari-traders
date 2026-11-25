from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify
from database import get_db
from auth import login_required

invoice_bp = Blueprint("invoices", __name__)


def _merge_live_shop_snapshot(inv, live_settings):
    if not inv or not live_settings:
        return inv
    snapshot = dict(inv.get("shop_snapshot") or {})
    sync_keys = [
        "shop_name", "owner_name", "tagline", "address_line1", "address_line2",
        "city", "district", "state", "pincode", "state_code", "phone",
        "whatsapp_number", "email", "gstin", "pan_number", "upi_id",
        "bank_name", "bank_account_no", "bank_ifsc", "bank_branch",
        "footer_notes", "terms_conditions"
    ]
    for key in sync_keys:
        val = live_settings.get(key)
        if val not in (None, ""):
            snapshot[key] = val
    inv["shop_snapshot"] = snapshot
    return inv

@invoice_bp.route("", methods=["GET"])
@login_required
def get_invoices():
    search = request.args.get("search", "").strip()
    status = request.args.get("payment_status", "ALL").upper()
    date_filter = request.args.get("date_filter", "all").lower()
    from_date = request.args.get("from_date")
    to_date = request.args.get("to_date")

    invoices_col = get_db().get_collection("invoices")
    all_invoices = invoices_col.find(sort=[("date", -1)])

    filtered = []
    now = datetime.utcnow()

    # Determine date boundaries
    start_time = None
    if date_filter == "today":
        start_time = datetime(now.year, now.month, now.day).isoformat()
    elif date_filter == "yesterday":
        yest = now - timedelta(days=1)
        start_time = datetime(yest.year, yest.month, yest.day).isoformat()
        end_time = datetime(now.year, now.month, now.day).isoformat()
    elif date_filter == "this_week":
        start_time = (now - timedelta(days=7)).isoformat()
    elif date_filter == "this_month":
        start_time = datetime(now.year, now.month, 1).isoformat()
    elif from_date:
        start_time = from_date

    for inv in all_invoices:
        # Status filter
        if status != "ALL" and inv.get("payment_status") != status:
            continue

        # Date filter
        inv_date = inv.get("date", "")
        if start_time and inv_date < start_time:
            continue
        if date_filter == "yesterday" and inv_date >= end_time:
            continue
        if to_date and inv_date > to_date:
            continue

        # Search filter
        if search:
            search_str = f"{inv.get('invoice_number', '')} {inv.get('customer', {}).get('name', '')} {inv.get('customer', {}).get('phone', '')}".lower()
            if search.lower() not in search_str:
                continue

        filtered.append(inv)

    settings_col = get_db().get_collection("settings")
    live_settings = settings_col.find_one({"_id": "shop_settings_default"}) or {}
    for inv in filtered:
        _merge_live_shop_snapshot(inv, live_settings)

    return jsonify({"success": True, "count": len(filtered), "invoices": filtered})

@invoice_bp.route("/<identifier>", methods=["GET"])
@login_required
def get_invoice(identifier):
    invoices_col = get_db().get_collection("invoices")
    inv = invoices_col.find_one({"$or": [{"_id": identifier}, {"invoice_number": identifier}]})
    if not inv:
        return jsonify({"success": False, "message": "Invoice not found."}), 404
    settings_col = get_db().get_collection("settings")
    live_settings = settings_col.find_one({"_id": "shop_settings_default"}) or {}
    _merge_live_shop_snapshot(inv, live_settings)
    return jsonify({"success": True, "invoice": inv})

@invoice_bp.route("/<identifier>/payment", methods=["PATCH"])
@login_required
def update_payment(identifier):
    data = request.get_json() or {}
    amount_received = float(data.get("amount_received", 0))
    payment_mode = data.get("payment_mode", "Cash")
    notes = data.get("notes", "").strip()

    if amount_received <= 0:
        return jsonify({"success": False, "message": "Amount received must be greater than zero."}), 400

    invoices_col = get_db().get_collection("invoices")
    inv = invoices_col.find_one({"$or": [{"_id": identifier}, {"invoice_number": identifier}]})
    if not inv:
        return jsonify({"success": False, "message": "Invoice not found."}), 404

    current_paid = float(inv.get("amount_paid", 0))
    grand_total = float(inv.get("grand_total", 0))
    new_paid = min(grand_total, current_paid + amount_received)
    new_balance = max(0.0, round(grand_total - new_paid, 2))

    new_status = "PAID" if new_balance == 0 else "PARTIAL"

    now_iso = datetime.utcnow().isoformat()
    payment_history = inv.get("payment_history", [])
    payment_history.append({
        "amount": amount_received,
        "payment_mode": payment_mode,
        "notes": notes,
        "received_by": request.current_user.get("username", "admin"),
        "date": now_iso
    })

    invoices_col.update_one(
        {"_id": inv["_id"]},
        {
            "$set": {
                "amount_paid": new_paid,
                "balance_due": new_balance,
                "payment_status": new_status,
                "payment_history": payment_history
            }
        }
    )

    # Adjust customer outstanding balance
    cust_phone = inv.get("customer", {}).get("phone")
    if cust_phone:
        customers_col = get_db().get_collection("customers")
        customers_col.update_one(
            {"phone": cust_phone},
            {"$inc": {"outstanding_due": -amount_received}}
        )

    # Record in audit log
    audit_col = get_db().get_collection("audit_logs")
    audit_col.insert_one({
        "action": "PAYMENT_RECORDED",
        "invoice_number": inv.get("invoice_number"),
        "amount_received": amount_received,
        "new_balance": new_balance,
        "payment_status": new_status,
        "received_by": request.current_user.get("username", "admin"),
        "timestamp": now_iso
    })

    updated_inv = invoices_col.find_one({"_id": inv["_id"]})
    return jsonify({
        "success": True,
        "message": f"Payment of ₹{amount_received:,.2f} recorded successfully.",
        "invoice": updated_inv
    })

@invoice_bp.route("/public/<token>", methods=["GET"])
def view_public_invoice(token):
    """Secure customer-facing invoice viewing endpoint without login requirement."""
    invoices_col = get_db().get_collection("invoices")
    inv = invoices_col.find_one({"public_token": token})
    if not inv:
        return jsonify({"success": False, "message": "Invalid or expired invoice link."}), 404

    settings_col = get_db().get_collection("settings")
    live_settings = settings_col.find_one({"_id": "shop_settings_default"}) or {}
    _merge_live_shop_snapshot(inv, live_settings)

    # Sanitize for public display
    public_view = {
        "invoice_number": inv.get("invoice_number"),
        "date": inv.get("date"),
        "customer": inv.get("customer"),
        "items": inv.get("items"),
        "subtotal": inv.get("subtotal"),
        "discount_amount": inv.get("discount_amount"),
        "is_gst_invoice": inv.get("is_gst_invoice"),
        "tax_breakup": inv.get("tax_breakup"),
        "delivery": inv.get("delivery"),
        "round_off": inv.get("round_off"),
        "grand_total": inv.get("grand_total"),
        "payment_mode": inv.get("payment_mode"),
        "payment_status": inv.get("payment_status"),
        "amount_paid": inv.get("amount_paid"),
        "balance_due": inv.get("balance_due"),
        "shop_snapshot": inv.get("shop_snapshot")
    }

    return jsonify({"success": True, "invoice": public_view})
