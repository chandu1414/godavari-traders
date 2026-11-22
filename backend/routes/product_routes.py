from flask import Blueprint, request, jsonify
from database import get_db
from auth import login_required, admin_required
from config import DEFAULT_CATEGORIES, DEFAULT_UNITS

product_bp = Blueprint("products", __name__)

@product_bp.route("", methods=["GET"])
def get_products():
    category = request.args.get("category")
    search = request.args.get("search", "").strip()
    active_only = request.args.get("active_only", "true").lower() == "true"
    low_stock = request.args.get("low_stock", "false").lower() == "true"

    query = {}
    if active_only:
        query["is_active"] = True
    if category and category.lower() != "all":
        query["category"] = category

    products_col = get_db().get_collection("products")
    products = products_col.find(query, sort=[("name", 1)])

    if search:
        search_lower = search.lower()
        products = [
            p for p in products
            if search_lower in (p.get("name", "") + " " + p.get("brand", "") + " " + p.get("category", "")).lower()
        ]

    if low_stock:
        products = [
            p for p in products
            if p.get("stock", 0) <= p.get("min_stock_alert", 10)
        ]

    return jsonify({"success": True, "count": len(products), "products": products})

@product_bp.route("/categories", methods=["GET"])
def get_categories():
    products_col = get_db().get_collection("products")
    existing_categories = set(DEFAULT_CATEGORIES)
    for p in products_col.find():
        cat = p.get("category")
        if cat:
            existing_categories.add(cat)
    return jsonify({"success": True, "categories": sorted(list(existing_categories))})

@product_bp.route("/units", methods=["GET"])
def get_units():
    return jsonify({"success": True, "units": DEFAULT_UNITS})

@product_bp.route("/<product_id>", methods=["GET"])
def get_product(product_id):
    products_col = get_db().get_collection("products")
    product = products_col.find_one({"_id": product_id})
    if not product:
        return jsonify({"success": False, "message": "Product not found."}), 404
    return jsonify({"success": True, "product": product})

@product_bp.route("", methods=["POST"])
@login_required
def create_product():
    data = request.get_json() or {}
    name = data.get("name", "").strip()
    category = data.get("category", "").strip()
    unit = data.get("unit", "Bag").strip()
    selling_price = float(data.get("selling_price", 0))

    if not name or selling_price <= 0:
        return jsonify({"success": False, "message": "Product name and valid selling price are required."}), 400

    new_product = {
        "name": name,
        "brand": data.get("brand", "Standard").strip(),
        "category": category or "Other Construction Materials",
        "unit": unit,
        "selling_price": selling_price,
        "purchase_price": float(data.get("purchase_price", 0)),
        "stock": float(data.get("stock", 0)),
        "min_stock_alert": float(data.get("min_stock_alert", 10)),
        "hsn_code": data.get("hsn_code", "2523").strip(),
        "gst_rate": float(data.get("gst_rate", 18.0)),
        "description": data.get("description", "").strip(),
        "image_url": data.get("image_url", "").strip(),
        "is_active": True
    }

    products_col = get_db().get_collection("products")
    prod_id = products_col.insert_one(new_product)
    new_product["_id"] = prod_id

    return jsonify({"success": True, "message": "Product created successfully.", "product": new_product}), 201

@product_bp.route("/<product_id>", methods=["PUT"])
@login_required
def update_product(product_id):
    data = request.get_json() or {}
    products_col = get_db().get_collection("products")
    product = products_col.find_one({"_id": product_id})
    if not product:
        return jsonify({"success": False, "message": "Product not found."}), 404

    update_fields = {}
    allowed_fields = [
        "name", "brand", "category", "unit", "selling_price",
        "purchase_price", "stock", "min_stock_alert", "hsn_code",
        "gst_rate", "description", "image_url", "is_active"
    ]
    for field in allowed_fields:
        if field in data:
            if field in ["selling_price", "purchase_price", "stock", "min_stock_alert", "gst_rate"]:
                update_fields[field] = float(data[field])
            elif field == "is_active":
                update_fields[field] = bool(data[field])
            else:
                update_fields[field] = str(data[field]).strip()

    products_col.update_one({"_id": product_id}, {"$set": update_fields})
    updated = products_col.find_one({"_id": product_id})
    return jsonify({"success": True, "message": "Product updated successfully.", "product": updated})

@product_bp.route("/<product_id>/stock", methods=["PATCH"])
@login_required
def adjust_stock(product_id):
    data = request.get_json() or {}
    qty_change = float(data.get("quantity_change", 0))
    reason = data.get("reason", "Manual adjustment")

    if qty_change == 0:
        return jsonify({"success": False, "message": "Quantity change cannot be zero."}), 400

    products_col = get_db().get_collection("products")
    product = products_col.find_one({"_id": product_id})
    if not product:
        return jsonify({"success": False, "message": "Product not found."}), 404

    current_stock = float(product.get("stock", 0))
    new_stock = max(0.0, current_stock + qty_change)

    products_col.update_one({"_id": product_id}, {"$set": {"stock": new_stock}})

    # Record in audit log
    audit_col = get_db().get_collection("audit_logs")
    audit_col.insert_one({
        "action": "STOCK_ADJUSTMENT",
        "product_id": product_id,
        "product_name": product.get("name"),
        "previous_stock": current_stock,
        "quantity_change": qty_change,
        "new_stock": new_stock,
        "reason": reason,
        "user": request.current_user.get("username")
    })

    return jsonify({
        "success": True,
        "message": f"Stock adjusted from {current_stock} to {new_stock} {product.get('unit')}.",
        "new_stock": new_stock
    })

@product_bp.route("/<product_id>", methods=["DELETE"])
@login_required
def delete_product(product_id):
    products_col = get_db().get_collection("products")
    # Soft delete by deactivating
    success = products_col.update_one({"_id": product_id}, {"$set": {"is_active": False}})
    if not success:
        return jsonify({"success": False, "message": "Product not found."}), 404
    return jsonify({"success": True, "message": "Product deactivated successfully."})
