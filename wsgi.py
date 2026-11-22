import sys
import os

# Add backend directory to python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))

from app import create_app

app = create_app()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"Starting Godavari Traders WSGI server on port {port}...")
    app.run(host="0.0.0.0", port=port, debug=False)
