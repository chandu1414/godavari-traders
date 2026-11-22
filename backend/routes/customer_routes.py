from flask import Blueprint, request, jsonify
from database import get_db
from auth import login_required

customer_bp = Blueprint("customers", __name__)

@customer_bp.route("", methods=["GET"])
@login_required
def get_customers():
    search = request.args.get("search", "").strip()
    has_due = request.args.get("has_due", "false").lower() == "true"

    customers_col = get_db().get_collection("customers")
    customers = customers_col.find(sort=[("total_purchases", -1)])

    if search:
        search_lower = search.lower()
        customers = [
            c for c in customers
            if search_lower in (c.get("name", "") + " " + c.get("phone", "") + " " + c.get("address", "")).lower()
        ]

    if has_due:
        customers = [c for c in customers if c.get("outstanding_due", 0) > 0]

    return jsonify({"success": True, "count": len(customers), "customers": customers})

@customer_bp.route("/<identifier>", methods=["GET"])
@login_required
def get_customer_ledger(identifier):
    customers_col = get_db().get_collection("customers")
    customer = customers_col.find_one({"$or": [{"_id": identifier}, {"phone": identifier}]})
    if not customer:
        return jsonify({"success": False, "message": "Customer record not found."}), 404

    # Fetch customer invoice history
    invoices_col = get_db().get_collection("invoices")
    phone = customer.get("phone")
    customer_invoices = []
    if phone:
        customer_invoices = invoices_col.find({"customer.phone": phone}, sort=[("date", -1)])

    return jsonify({
        "success": True,
        "customer": customer,
        "invoices": customer_invoices,
        "invoice_count": len(customer_invoices)
    })

@customer_bp.route("", methods=["POST"])
@login_required
def create_or_update_customer():
    data = request.get_json() or {}
    name = data.get("name", "").strip()
    phone = data.get("phone", "").strip()

    if not name or not phone:
        return jsonify({"success": False, "message": "Customer name and phone number are required."}), 400

    customers_col = get_db().get_collection("customers")
    existing = customers_col.find_one({"phone": phone})

    if existing:
        customers_col.update_one(
            {"phone": phone},
            {
                "$set": {
                    "name": name,
                    "whatsapp": data.get("whatsapp", existing.get("whatsapp", phone)).strip(),
                    "address": data.get("address", existing.get("address", "")).strip()
                }
            }
        )
        updated = customers_col.find_one({"phone": phone})
        return jsonify({"success": True, "message": "Customer updated successfully.", "customer": updated})
    else:
        new_cust = {
            "name": name,
            "phone": phone,
            "whatsapp": data.get("whatsapp", phone).strip(),
            "address": data.get("address", "").strip(),
            "total_purchases": 0.0,
            "total_invoices": 0,
            "outstanding_due": 0.0
        }
        cust_id = customers_col.insert_one(new_cust)
        new_cust["_id"] = cust_id
        return jsonify({"success": True, "message": "Customer created successfully.", "customer": new_cust}), 201
