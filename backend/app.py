import os
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS

from database import get_db
from seed_data import seed_database

# Import blueprints
from routes.auth_routes import auth_bp
from routes.product_routes import product_bp
from routes.billing_routes import billing_bp
from routes.invoice_routes import invoice_bp
from routes.customer_routes import customer_bp
from routes.report_routes import report_bp
from routes.setting_routes import setting_bp
from routes.sharing_routes import sharing_bp

def create_app():
    dist_folder = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend", "dist")
    
    app = Flask(
        __name__,
        static_folder=dist_folder if os.path.exists(dist_folder) else None,
        static_url_path=""
    )
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(product_bp, url_prefix="/api/products")
    app.register_blueprint(billing_bp, url_prefix="/api/billing")
    app.register_blueprint(invoice_bp, url_prefix="/api/invoices")
    app.register_blueprint(customer_bp, url_prefix="/api/customers")
    app.register_blueprint(report_bp, url_prefix="/api/reports")
    app.register_blueprint(setting_bp, url_prefix="/api/settings")
    app.register_blueprint(sharing_bp, url_prefix="/api/sharing")

    @app.after_request
    def add_no_cache_headers(response):
        if request.path.startswith("/api/"):
            response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
            response.headers["Pragma"] = "no-cache"
            response.headers["Expires"] = "0"
        return response

    @app.route("/api/health", methods=["GET"])
    def health_check():
        db = get_db()
        return jsonify({
            "status": "healthy",
            "service": "Godavari Traders API",
            "is_mongo": db.is_mongo,
            "storage": "mongodb" if db.is_mongo else "json_local",
            "mongo_error": db.mongo_error,
            "version": "1.0.0"
        })

    # Single Page Application (SPA) frontend serving fallback
    if os.path.exists(dist_folder):
        @app.route("/", defaults={"path": ""})
        @app.route("/<path:path>")
        def serve_frontend(path):
            if path != "" and os.path.exists(os.path.join(dist_folder, path)):
                return send_from_directory(dist_folder, path)
            return send_from_directory(dist_folder, "index.html")

    # Ensure database is seeded
    try:
        seed_database()
    except Exception as e:
        print(f"Warning during seed check: {e}")

    return app

app = create_app()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"Starting Godavari Traders full-stack application on http://localhost:{port}...")
    app.run(host="0.0.0.0", port=port, debug=False)
