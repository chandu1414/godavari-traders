import secrets
from datetime import datetime
from flask import Blueprint, request, jsonify
from database import get_db
from auth import login_required

billing_bp = Blueprint("billing", __name__)

def calculate_invoice_totals(items, discount_type="fixed", discount_value=0.0, is_gst_invoice=True, delivery_charge=0.0):
    subtotal = 0.0
    processed_items = []

    for it in items:
        qty = float(it.get("quantity", 0))
        rate = float(it.get("rate", 0))
        gst_rate = float(it.get("gst_rate", 18.0))
        item_amount = round(qty * rate, 2)
        subtotal += item_amount

        processed_items.append({
            "product_id": it.get("product_id"),
            "product_name": it.get("product_name", "Material"),
            "brand": it.get("brand", ""),
            "category": it.get("category", "General"),
            "unit": it.get("unit", "Unit"),
            "quantity": qty,
            "rate": rate,
            "amount": item_amount,
            "gst_rate": gst_rate,
            "hsn_code": it.get("hsn_code", "2523")
        })

    subtotal = round(subtotal, 2)

    # Discount calculation
    discount_val = float(discount_value or 0)
    if discount_type == "percent":
        discount_amount = round(subtotal * (discount_val / 100.0), 2)
    else:
        discount_amount = round(min(discount_val, subtotal), 2)

    taxable_amount = max(0.0, round(subtotal - discount_amount, 2))

    total_cgst = 0.0
    total_sgst = 0.0

    if is_gst_invoice and taxable_amount > 0 and subtotal > 0:
        discount_ratio = (subtotal - discount_amount) / subtotal
        for it in processed_items:
            item_taxable = it["amount"] * discount_ratio
            item_gst = item_taxable * (it["gst_rate"] / 100.0)
            item_cgst = round(item_gst / 2.0, 2)
            item_sgst = round(item_gst / 2.0, 2)
            it["cgst_amount"] = item_cgst
            it["sgst_amount"] = item_sgst
            total_cgst += item_cgst
            total_sgst += item_sgst

    total_cgst = round(total_cgst, 2)
    total_sgst = round(total_sgst, 2)
    total_tax = round(total_cgst + total_sgst, 2)

    delivery = max(0.0, float(delivery_charge or 0))
    raw_total = taxable_amount + total_tax + delivery
    grand_total = round(raw_total)
    round_off = round(grand_total - raw_total, 2)

    return {
        "items": processed_items,
        "subtotal": subtotal,
        "discount_type": discount_type,
        "discount_value": discount_val,
        "discount_amount": discount_amount,
        "taxable_amount": taxable_amount,
        "is_gst_invoice": is_gst_invoice,
        "tax_breakup": {
            "taxable_amount": taxable_amount,
            "cgst_amount": total_cgst,
            "sgst_amount": total_sgst,
            "total_tax": total_tax
        },
        "delivery_charge": delivery,
        "round_off": round_off,
        "grand_total": float(grand_total)
    }

@billing_bp.route("/calculate", methods=["POST"])
def calculate_bill():
    data = request.get_json() or {}
    items = data.get("items", [])
    if not items:
        return jsonify({"success": False, "message": "At least one item is required in the cart."}), 400

    calc = calculate_invoice_totals(
        items=items,
        discount_type=data.get("discount_type", "fixed"),
        discount_value=data.get("discount_value", 0.0),
        is_gst_invoice=data.get("is_gst_invoice", True),
        delivery_charge=data.get("delivery_charge", 0.0)
    )
    return jsonify({"success": True, "calculation": calc})

@billing_bp.route("/create-invoice", methods=["POST"])
@login_required
def create_invoice():
    data = request.get_json() or {}
    items = data.get("items", [])
    customer = data.get("customer", {})

    if not items:
        return jsonify({"success": False, "message": "Cart is empty. Please add items to create a bill."}), 400

    cust_name = customer.get("name", "").strip() or "Walk-in Customer"
    cust_phone = customer.get("phone", "").strip()
    cust_whatsapp = customer.get("whatsapp", "").strip() or cust_phone
    cust_address = customer.get("address", "").strip()

    # Recalculate server-side to prevent tampering
    calc = calculate_invoice_totals(
        items=items,
        discount_type=data.get("discount_type", "fixed"),
        discount_value=data.get("discount_value", 0.0),
        is_gst_invoice=data.get("is_gst_invoice", True),
        delivery_charge=data.get("delivery_charge", 0.0)
    )

    db = get_db()
    settings_col = db.get_collection("settings")
    shop_settings = settings_col.find_one({"_id": "shop_settings_default"}) or {}

    prefix = shop_settings.get("invoice_prefix", "GT-2026-")
    next_num = int(shop_settings.get("next_invoice_number", 1001))

    invoice_number = f"{prefix}{next_num}"
    # Atomically increment next_invoice_number
    settings_col.update_one({"_id": "shop_settings_default"}, {"$inc": {"next_invoice_number": 1}})

    # Generate cryptographically secure public viewing token
    public_token = f"gt-token-{next_num}-{secrets.token_urlsafe(12)}"

    grand_total = calc["grand_total"]
    payment_mode = data.get("payment_mode", "Cash")  # Cash, UPI, Bank Transfer, Cheque, Credit
    raw_amount_paid = data.get("amount_paid")
    
    # Calculate amount paid and balance due with precision
    if raw_amount_paid is not None:
        amount_paid = max(0.0, min(float(raw_amount_paid), grand_total))
    else:
        amount_paid = grand_total if data.get("payment_status") == "PAID" else 0.0

    balance_due = max(0.0, round(grand_total - amount_paid, 2))

    if balance_due == 0:
        payment_status = "PAID"
    elif amount_paid > 0:
        payment_status = "PARTIAL"
    else:
        payment_status = "PENDING"

    now_iso = datetime.utcnow().isoformat()

    invoice_doc = {
        "invoice_number": invoice_number,
        "public_token": public_token,
        "date": now_iso,
        "customer": {
            "name": cust_name,
            "phone": cust_phone,
            "whatsapp": cust_whatsapp,
            "address": cust_address
        },
        "items": calc["items"],
        "subtotal": calc["subtotal"],
        "discount_type": calc["discount_type"],
        "discount_value": calc["discount_value"],
        "discount_amount": calc["discount_amount"],
        "is_gst_invoice": calc["is_gst_invoice"],
        "tax_breakup": calc["tax_breakup"],
        "delivery": {
            "is_delivery": bool(data.get("is_delivery", False)),
            "delivery_charge": calc["delivery_charge"],
            "delivery_address": data.get("delivery_address", cust_address),
            "instructions": data.get("delivery_instructions", "")
        },
        "round_off": calc["round_off"],
        "grand_total": grand_total,
        "payment_mode": payment_mode,
        "payment_status": payment_status,
        "amount_paid": amount_paid,
        "balance_due": balance_due,
        "created_by": request.current_user.get("username", "admin"),
        "notes": data.get("notes", ""),
        "shop_snapshot": {
            "shop_name": shop_settings.get("shop_name", "GODAVARI TRADERS"),
            "owner_name": shop_settings.get("owner_name", "Prathik Yadav"),
            "tagline": shop_settings.get("tagline"),
            "address_line1": shop_settings.get("address_line1"),
            "address_line2": shop_settings.get("address_line2"),
            "city": shop_settings.get("city"),
            "district": shop_settings.get("district"),
            "state": shop_settings.get("state"),
            "pincode": shop_settings.get("pincode"),
            "state_code": shop_settings.get("state_code"),
            "phone": shop_settings.get("phone"),
            "whatsapp_number": shop_settings.get("whatsapp_number"),
            "email": shop_settings.get("email"),
            "gstin": shop_settings.get("gstin"),
            "pan_number": shop_settings.get("pan_number"),
            "upi_id": shop_settings.get("upi_id"),
            "bank_name": shop_settings.get("bank_name"),
            "bank_account_no": shop_settings.get("bank_account_no"),
            "bank_ifsc": shop_settings.get("bank_ifsc"),
            "bank_branch": shop_settings.get("bank_branch"),
            "footer_notes": shop_settings.get("footer_notes"),
            "terms_conditions": shop_settings.get("terms_conditions")
        }
    }

    invoices_col = db.get_collection("invoices")
    inv_id = invoices_col.insert_one(invoice_doc)
    invoice_doc["_id"] = inv_id

    # Update product stocks
    products_col = db.get_collection("products")
    for it in calc["items"]:
        prod_id = it.get("product_id")
        if prod_id:
            products_col.update_one({"_id": prod_id}, {"$inc": {"stock": -it["quantity"]}})

    # Update or create customer record & record payment transaction
    if cust_phone:
        customers_col = db.get_collection("customers")
        existing_cust = customers_col.find_one({"phone": cust_phone})
        if existing_cust:
            cust_id = existing_cust.get("_id")
            prev_due = float(existing_cust.get("outstanding_due") or 0.0)
            new_due = round(prev_due + balance_due, 2)
            customers_col.update_one(
                {"phone": cust_phone},
                {
                    "$inc": {
                        "total_purchases": grand_total,
                        "total_invoices": 1,
                        "outstanding_due": balance_due
                    },
                    "$set": {
                        "name": cust_name,
                        "whatsapp": cust_whatsapp or existing_cust.get("whatsapp", cust_phone),
                        "address": cust_address or existing_cust.get("address", "")
                    }
                }
            )
        else:
            new_due = balance_due
            cust_id = customers_col.insert_one({
                "name": cust_name,
                "phone": cust_phone,
                "whatsapp": cust_whatsapp,
                "address": cust_address,
                "total_purchases": grand_total,
                "total_invoices": 1,
                "outstanding_due": balance_due,
                "created_at": now_iso,
                "updated_at": now_iso
            })

        # If any payment was made at checkout (e.g. ₹40,000 on a ₹60,000 bill),
        # record the payment transaction in customer ledger
        if amount_paid > 0:
            tx_col = db.get_collection("customer_transactions")
            tx_col.insert_one({
                "customer_id": cust_id,
                "customer_phone": cust_phone,
                "customer_name": cust_name,
                "type": "PAYMENT",
                "amount": amount_paid,
                "payment_mode": payment_mode,
                "reference": invoice_number,
                "notes": f"Down payment for Bill #{invoice_number} ({payment_mode})",
                "date": now_iso,
                "balance_after": new_due,
                "created_at": now_iso
            })

    # Log audit entry
    audit_col = db.get_collection("audit_logs")
    audit_col.insert_one({
        "action": "CREATE_INVOICE",
        "invoice_number": invoice_number,
        "grand_total": grand_total,
        "customer": cust_name,
        "user": request.current_user.get("username", "admin"),
        "timestamp": now_iso
    })

    return jsonify({
        "success": True,
        "message": f"Invoice {invoice_number} generated successfully!",
        "invoice": invoice_doc
    }), 201
