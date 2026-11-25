from flask import Blueprint, request, jsonify
from database import get_db
from auth import (
    hash_password,
    verify_password,
    create_access_token,
    login_required,
    admin_required
)

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    username = data.get("username", "").strip()
    password = data.get("password", "")

    if not username or not password:
        return jsonify({"success": False, "message": "Username and password are required."}), 400

    users_col = get_db().get_collection("users")
    # Match by either username or email
    user = users_col.find_one({"$or": [{"username": username}, {"email": username.lower()}]})

    if not user or not verify_password(password, user.get("password", "")):
        return jsonify({"success": False, "message": "Invalid username or password."}), 401

    if not user.get("is_active", True):
        return jsonify({"success": False, "message": "Account has been deactivated. Please contact the administrator."}), 403

    token = create_access_token({"sub": user["_id"], "role": user.get("role", "cashier")})

    user_info = {
        "id": user["_id"],
        "username": user.get("username"),
        "email": user.get("email"),
        "full_name": user.get("full_name"),
        "role": user.get("role", "cashier"),
        "phone": user.get("phone")
    }

    return jsonify({
        "success": True,
        "token": token,
        "user": user_info,
        "message": f"Welcome back, {user_info['full_name']}!"
    })

@auth_bp.route("/me", methods=["GET"])
@login_required
def get_current_user_profile():
    return jsonify({
        "success": True,
        "user": request.current_user
    })

@auth_bp.route("/change-password", methods=["POST"])
@login_required
def change_password():
    data = request.get_json() or {}
    current_password = data.get("current_password", "")
    new_password = data.get("new_password", "")

    if len(new_password) < 6:
        return jsonify({"success": False, "message": "New password must be at least 6 characters long."}), 400

    users_col = get_db().get_collection("users")
    user = users_col.find_one({"_id": request.current_user["_id"]})
    if not user or not verify_password(current_password, user.get("password", "")):
        return jsonify({"success": False, "message": "Current password is incorrect."}), 400

    users_col.update_one({"_id": user["_id"]}, {"$set": {"password": hash_password(new_password)}})
    return jsonify({"success": True, "message": "Password updated successfully."})

@auth_bp.route("/users", methods=["GET"])
@admin_required
def list_users():
    users_col = get_db().get_collection("users")
    all_users = users_col.find()
    sanitized = []
    for u in all_users:
        sanitized.append({
            "id": u["_id"],
            "username": u.get("username"),
            "email": u.get("email"),
            "full_name": u.get("full_name"),
            "role": u.get("role"),
            "phone": u.get("phone"),
            "is_active": u.get("is_active", True),
            "created_at": u.get("created_at")
        })
    return jsonify({"success": True, "users": sanitized})

@auth_bp.route("/users", methods=["POST"])
@admin_required
def create_staff_user():
    data = request.get_json() or {}
    username = data.get("username", "").strip()
    password = data.get("password", "")
    full_name = data.get("full_name", "").strip()
    role = data.get("role", "cashier")

    if not username or not password or not full_name:
        return jsonify({"success": False, "message": "Username, password and full name are required."}), 400

    if len(password) < 6:
        return jsonify({"success": False, "message": "Password must be at least 6 characters long."}), 400

    users_col = get_db().get_collection("users")
    if users_col.find_one({"username": username}):
        return jsonify({"success": False, "message": "Username is already taken."}), 400

    new_user = {
        "username": username,
        "email": data.get("email", f"{username}@godavaritraders.com").strip().lower(),
        "full_name": full_name,
        "role": role if role in ("admin", "cashier") else "cashier",
        "phone": data.get("phone", "").strip(),
        "password": hash_password(password),
        "is_active": True
    }
    user_id = users_col.insert_one(new_user)
    return jsonify({"success": True, "message": f"User {username} created successfully.", "user_id": user_id}), 201


@auth_bp.route("/users/<user_id>", methods=["PUT"])
@admin_required
def update_user_account(user_id):
    data = request.get_json() or {}
    users_col = get_db().get_collection("users")
    target = users_col.find_one({"_id": user_id})
    if not target:
        return jsonify({"success": False, "message": "User account not found."}), 404

    update_fields = {}
    if "username" in data:
        new_username = str(data["username"]).strip()
        if not new_username:
            return jsonify({"success": False, "message": "Username cannot be empty."}), 400
        existing = users_col.find_one({"username": new_username})
        if existing and existing.get("_id") != target.get("_id"):
            return jsonify({"success": False, "message": "Username is already taken."}), 409
        update_fields["username"] = new_username

    if "full_name" in data and str(data["full_name"]).strip():
        update_fields["full_name"] = str(data["full_name"]).strip()
    if "email" in data:
        update_fields["email"] = str(data["email"]).strip().lower()
    if "phone" in data:
        update_fields["phone"] = str(data["phone"]).strip()

    is_self = target.get("_id") == request.current_user.get("_id")
    if "role" in data and data["role"] in ("admin", "cashier"):
        if is_self and data["role"] != "admin":
            return jsonify({"success": False, "message": "You cannot remove your own admin role."}), 400
        update_fields["role"] = data["role"]

    if "is_active" in data:
        if is_self and not bool(data["is_active"]):
            return jsonify({"success": False, "message": "You cannot deactivate your own active account."}), 400
        update_fields["is_active"] = bool(data["is_active"])

    new_password = data.get("new_password", "")
    if new_password:
        if len(new_password) < 6:
            return jsonify({"success": False, "message": "New password must be at least 6 characters long."}), 400
        update_fields["password"] = hash_password(new_password)

    if not update_fields:
        return jsonify({"success": False, "message": "No valid fields provided to update."}), 400

    users_col.update_one({"_id": target["_id"]}, {"$set": update_fields})
    updated = users_col.find_one({"_id": target["_id"]})
    sanitized = {
        "id": updated["_id"],
        "username": updated.get("username"),
        "email": updated.get("email"),
        "full_name": updated.get("full_name"),
        "role": updated.get("role"),
        "phone": updated.get("phone"),
        "is_active": updated.get("is_active", True),
        "created_at": updated.get("created_at"),
    }
    return jsonify({"success": True, "message": f"Account '{sanitized['username']}' updated successfully.", "user": sanitized})
