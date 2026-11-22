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

    users_col = get_db().get_collection("users")
    if users_col.find_one({"username": username}):
        return jsonify({"success": False, "message": "Username is already taken."}), 400

    new_user = {
        "username": username,
        "email": data.get("email", f"{username}@godavaritraders.com").strip().lower(),
        "full_name": full_name,
        "role": role,
        "phone": data.get("phone", ""),
        "password": hash_password(password),
        "is_active": True
    }
    user_id = users_col.insert_one(new_user)
    return jsonify({"success": True, "message": f"User {username} created successfully.", "user_id": user_id}), 201
