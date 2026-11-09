import os
import sys
from pathlib import Path
from flask import Flask, jsonify, request

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.core.config import settings
from backend.database.session import init_db
from backend.api.routes import api_blueprint

def create_app() -> Flask:
    """Application factory for CLINOVA Backend."""
    app = Flask(__name__)
    app.config["SECRET_KEY"] = settings.SECRET_KEY
    app.config["MAX_CONTENT_LENGTH"] = 100 * 1024 * 1024  # 100 MB max upload limit

    # Initialize relational database and schema
    init_db()

    # Register API blueprints
    app.register_blueprint(api_blueprint)

    # CORS support with explicit allowed headers
    @app.before_request
    def handle_preflight():
        if request.method == "OPTIONS":
            response = app.make_default_options_response()
            origin = request.headers.get("Origin")
            if origin and (origin in settings.CORS_ORIGINS or "*" in settings.CORS_ORIGINS):
                response.headers["Access-Control-Allow-Origin"] = origin
                response.headers["Access-Control-Allow-Credentials"] = "true"
                response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
                response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With"
            return response

    @app.after_request
    def add_cors_headers(response):
        origin = request.headers.get("Origin")
        if origin and (origin in settings.CORS_ORIGINS or "*" in settings.CORS_ORIGINS):
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
            response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With"
        return response

    @app.errorhandler(413)
    def request_entity_too_large(error):
        return jsonify({"status": "error", "error": "Uploaded file exceeds maximum allowable limit of 100MB."}), 413

    @app.errorhandler(404)
    def not_found_error(error):
        return jsonify({"status": "error", "error": "Requested API endpoint not found."}), 404

    @app.errorhandler(500)
    def internal_server_error(error):
        return jsonify({"status": "error", "error": "Internal server error occurred."}), 500

    @app.route("/")
    def index():
        return jsonify({
            "service": "CLINOVA Core API",
            "version": settings.VERSION,
            "status": "online",
            "health_endpoint": "/api/health",
            "info_endpoint": "/api/info"
        })

    return app

app = create_app()

if __name__ == "__main__":
    print(f"[*] Starting {settings.PROJECT_NAME} v{settings.VERSION} on http://{settings.HOST}:{settings.PORT}")
    app.run(host=settings.HOST, port=settings.PORT, debug=settings.DEBUG)

