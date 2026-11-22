import uuid
from datetime import datetime
from flask import Blueprint, request, jsonify
from database import get_db
from auth import login_required

customer_bp = Blueprint("customers", __name__)

@customer_bp.route("", methods=["GET"])
@login_required
def get_customers():
    search = request.args.get("search", "").strip()
    filter_type = request.args.get("filter", "all").strip().lower() # all, due, settled, advance
    has_due = request.args.get("has_due", "false").lower() == "true"

    customers_col = get_db().get_collection("customers")
    customers = customers_col.find(sort=[("outstanding_due", -1), ("total_purchases", -1)])

    if search:
        search_lower = search.lower()
        customers = [
            c for c in customers
            if search_lower in (
                (c.get("name") or "") + " " + 
                (c.get("phone") or "") + " " + 
                (c.get("whatsapp") or "") + " " + 
                (c.get("address") or "") + " " + 
                (c.get("notes") or "")
            ).lower()
        ]

    # Filter logic
    if has_due or filter_type == "due":
        customers = [c for c in customers if (c.get("outstanding_due") or 0) > 0]
    elif filter_type == "settled":
        customers = [c for c in customers if (c.get("outstanding_due") or 0) == 0]
    elif filter_type == "advance":
        customers = [c for c in customers if (c.get("outstanding_due") or 0) < 0]

    # Calculate overall stats
    all_custs = customers_col.find()
    total_due = sum(c.get("outstanding_due", 0) for c in all_custs if c.get("outstanding_due", 0) > 0)
    total_advance = sum(abs(c.get("outstanding_due", 0)) for c in all_custs if c.get("outstanding_due", 0) < 0)
    due_accounts_count = sum(1 for c in all_custs if (c.get("outstanding_due") or 0) > 0)
    total_purchases_sum = sum(c.get("total_purchases", 0) for c in all_custs)

    return jsonify({
        "success": True, 
        "count": len(customers), 
        "customers": customers,
        "stats": {
            "total_due": total_due,
            "total_advance": total_advance,
            "total_customers": len(all_custs),
            "due_accounts_count": due_accounts_count,
            "total_purchases": total_purchases_sum
        }
    })

@customer_bp.route("/<identifier>", methods=["GET"])
@login_required
def get_customer_ledger(identifier):
    customers_col = get_db().get_collection("customers")
    customer = customers_col.find_one({"$or": [{"_id": identifier}, {"phone": identifier}]})
    if not customer:
        return jsonify({"success": False, "message": "Customer record not found."}), 404

    invoices_col = get_db().get_collection("invoices")
    phone = customer.get("phone")
    customer_invoices = []
    if phone:
        customer_invoices = invoices_col.find({"customer.phone": phone}, sort=[("date", -1)])

    # Also fetch transactions
    tx_col = get_db().get_collection("customer_transactions")
    transactions = []
    if phone:
        transactions = tx_col.find({"$or": [{"customer_phone": phone}, {"customer_id": customer.get("_id")}]}, sort=[("date", -1)])

    return jsonify({
        "success": True,
        "customer": customer,
        "invoices": customer_invoices,
        "transactions": transactions,
        "invoice_count": len(customer_invoices),
        "transaction_count": len(transactions)
    })

@customer_bp.route("", methods=["POST"])
@login_required
def create_customer():
    data = request.get_json() or {}
    name = data.get("name", "").strip()
    phone = data.get("phone", "").strip()

    if not name or not phone:
        return jsonify({"success": False, "message": "Customer name and phone number are required."}), 400

    customers_col = get_db().get_collection("customers")
    existing = customers_col.find_one({"phone": phone})

    if existing:
        return jsonify({"success": False, "message": f"A customer with phone {phone} already exists."}), 409

    opening_balance = float(data.get("opening_balance") or 0.0)
    credit_limit = float(data.get("credit_limit") or 0.0)
    now = datetime.utcnow().isoformat()

    new_cust = {
        "name": name,
        "phone": phone,
        "whatsapp": (data.get("whatsapp") or phone).strip(),
        "address": data.get("address", "").strip(),
        "credit_limit": credit_limit,
        "opening_balance": opening_balance,
        "notes": data.get("notes", "").strip(),
        "total_purchases": 0.0,
        "total_invoices": 0,
        "outstanding_due": opening_balance,
        "created_at": now,
        "updated_at": now
    }
    cust_id = customers_col.insert_one(new_cust)
    new_cust["_id"] = cust_id

    # If opening balance was non-zero, record initial transaction
    if opening_balance != 0:
        tx_col = get_db().get_collection("customer_transactions")
        tx_col.insert_one({
            "customer_id": cust_id,
            "customer_phone": phone,
            "customer_name": name,
            "type": "OPENING_BALANCE",
            "amount": abs(opening_balance),
            "is_credit": opening_balance < 0, # negative means advance
            "payment_mode": "Opening Balance",
            "reference": "Initial Account Setup",
            "notes": "Opening balance recorded on account creation",
            "date": now,
            "balance_after": opening_balance
        })

    return jsonify({"success": True, "message": "Khata account opened successfully.", "customer": new_cust}), 201

@customer_bp.route("/<identifier>", methods=["PUT"])
@login_required
def update_customer(identifier):
    data = request.get_json() or {}
    customers_col = get_db().get_collection("customers")
    customer = customers_col.find_one({"$or": [{"_id": identifier}, {"phone": identifier}]})
    if not customer:
        return jsonify({"success": False, "message": "Customer not found."}), 404

    update_fields = {}
    if "name" in data and data["name"].strip():
        update_fields["name"] = data["name"].strip()
    if "phone" in data and data["phone"].strip():
        update_fields["phone"] = data["phone"].strip()
    if "whatsapp" in data:
        update_fields["whatsapp"] = data["whatsapp"].strip()
    if "address" in data:
        update_fields["address"] = data["address"].strip()
    if "credit_limit" in data:
        update_fields["credit_limit"] = float(data["credit_limit"] or 0.0)
    if "notes" in data:
        update_fields["notes"] = data["notes"].strip()
    update_fields["updated_at"] = datetime.utcnow().isoformat()

    customers_col.update_one({"_id": customer["_id"]}, {"$set": update_fields})
    updated = customers_col.find_one({"_id": customer["_id"]})
    return jsonify({"success": True, "message": "Customer Khata details updated.", "customer": updated})

@customer_bp.route("/<identifier>", methods=["DELETE"])
@login_required
def delete_customer(identifier):
    customers_col = get_db().get_collection("customers")
    customer = customers_col.find_one({"$or": [{"_id": identifier}, {"phone": identifier}]})
    if not customer:
        return jsonify({"success": False, "message": "Customer not found."}), 404

    customers_col.delete_one({"_id": customer["_id"]})
    return jsonify({"success": True, "message": f"Khata account for '{customer.get('name')}' removed successfully."})

@customer_bp.route("/<identifier>/transactions", methods=["POST"])
@login_required
def add_khata_transaction(identifier):
    data = request.get_json() or {}
    tx_type = data.get("type", "PAYMENT").upper() # PAYMENT (Jama / payment from customer) or DEBIT (Udhaar / material debit)
    amount = float(data.get("amount") or 0.0)

    if amount <= 0:
        return jsonify({"success": False, "message": "Amount must be greater than zero."}), 400

    customers_col = get_db().get_collection("customers")
    customer = customers_col.find_one({"$or": [{"_id": identifier}, {"phone": identifier}]})
    if not customer:
        return jsonify({"success": False, "message": "Customer not found."}), 404

    current_due = float(customer.get("outstanding_due") or 0.0)
    payment_mode = data.get("payment_mode", "Cash")
    reference = data.get("reference", "").strip()
    notes = data.get("notes", "").strip()
    tx_date = data.get("date") or datetime.utcnow().isoformat()

    if tx_type == "PAYMENT":
        # Customer paid money -> reduces due
        new_due = current_due - amount
        action_desc = f"Received ₹{amount:,.0f} payment via {payment_mode}"
    else:
        # Additional credit / debit charge -> increases due
        new_due = current_due + amount
        action_desc = f"Added ₹{amount:,.0f} Udhaar / debit"

    # Update customer balance
    customers_col.update_one(
        {"_id": customer["_id"]},
        {"$set": {"outstanding_due": round(new_due, 2), "updated_at": datetime.utcnow().isoformat()}}
    )

    # Insert into transaction ledger
    tx_col = get_db().get_collection("customer_transactions")
    new_tx = {
        "customer_id": customer["_id"],
        "customer_phone": customer.get("phone"),
        "customer_name": customer.get("name"),
        "type": tx_type,
        "amount": amount,
        "payment_mode": payment_mode,
        "reference": reference,
        "notes": notes or action_desc,
        "date": tx_date,
        "balance_after": round(new_due, 2),
        "created_at": datetime.utcnow().isoformat()
    }
    tx_id = tx_col.insert_one(new_tx)
    new_tx["_id"] = tx_id

    updated_cust = customers_col.find_one({"_id": customer["_id"]})
    return jsonify({
        "success": True,
        "message": f"Khata transaction recorded: {action_desc}",
        "transaction": new_tx,
        "customer": updated_cust
    }), 201

@customer_bp.route("/<identifier>/statement", methods=["GET"])
@login_required
def get_full_statement(identifier):
    customers_col = get_db().get_collection("customers")
    customer = customers_col.find_one({"$or": [{"_id": identifier}, {"phone": identifier}]})
    if not customer:
        return jsonify({"success": False, "message": "Customer not found."}), 404

    phone = customer.get("phone")
    cust_id = customer.get("_id")

    # Fetch all invoices
    invoices_col = get_db().get_collection("invoices")
    invoices = invoices_col.find({"customer.phone": phone}, sort=[("date", -1)])

    # Fetch all transactions
    tx_col = get_db().get_collection("customer_transactions")
    transactions = tx_col.find({"$or": [{"customer_phone": phone}, {"customer_id": cust_id}]}, sort=[("date", -1)])

    # Merge into a unified chronological statement
    unified_entries = []
    
    # Invoices (Debits)
    for inv in invoices:
        unified_entries.append({
            "id": inv.get("_id"),
            "entry_type": "INVOICE",
            "invoice_number": inv.get("invoice_number"),
            "date": inv.get("date"),
            "description": f"Bill #{inv.get('invoice_number')} ({len(inv.get('items', []))} items)",
            "debit_amount": inv.get("grand_total", 0.0), # Material billed to customer
            "credit_amount": 0.0,
            "payment_status": inv.get("payment_status"),
            "payment_mode": inv.get("payment_mode", "Credit"),
            "balance_due": inv.get("balance_due", 0.0),
            "public_token": inv.get("public_token"),
            "items_summary": ", ".join([f"{it.get('name', '')} ({it.get('quantity', '')} {it.get('unit', '')})" for it in inv.get("items", [])[:3]])
        })

    # Transactions (Payments & Manual Debits)
    for tx in transactions:
        is_payment = tx.get("type") in ["PAYMENT", "CREDIT"] or (tx.get("type") == "OPENING_BALANCE" and tx.get("is_credit"))
        unified_entries.append({
            "id": tx.get("_id"),
            "entry_type": "TRANSACTION",
            "type": tx.get("type"),
            "date": tx.get("date"),
            "description": tx.get("notes") or (f"Payment via {tx.get('payment_mode')}" if is_payment else "Manual Udhaar Entry"),
            "debit_amount": 0.0 if is_payment else tx.get("amount", 0.0),
            "credit_amount": tx.get("amount", 0.0) if is_payment else 0.0,
            "payment_mode": tx.get("payment_mode"),
            "reference": tx.get("reference"),
            "balance_after": tx.get("balance_after")
        })

    # Sort descending by date
    unified_entries.sort(key=lambda x: str(x.get("date", "")), reverse=True)

    # Shop settings for header
    settings_col = get_db().get_collection("settings")
    settings = settings_col.find_one({"_id": "shop_settings_default"}) or {}

    return jsonify({
        "success": True,
        "customer": customer,
        "entries": unified_entries,
        "settings": settings,
        "total_billed": sum(e["debit_amount"] for e in unified_entries),
        "total_paid": sum(e["credit_amount"] for e in unified_entries),
        "net_due": customer.get("outstanding_due", 0.0)
    })
