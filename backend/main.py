import os
from flask import Flask, Response
from flask_cors import CORS
from dotenv import load_dotenv

from api.chat import chat_bp
from api.security import (
    rate_limit_middleware,
    add_security_headers,
    validate_request_size,
)

load_dotenv()

app = Flask(__name__)

# ── Configuration ─────────────────────────────────────────────────────────────
DEBUG = os.getenv("DEBUG", "false").lower() == "true"
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS", 
    "https://anrg.dev,https://www.anrg.dev,http://localhost:3000"
).split(",")

app.config["MAX_CONTENT_LENGTH"] = 16 * 1024  # 16 KB

# ── CORS ──────────────────────────────────────────────────────────────────────
CORS(
    app,
    origins=[o.strip() for o in ALLOWED_ORIGINS],
    supports_credentials=True,
    methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)

# ── Security Middleware ───────────────────────────────────────────────────────
@app.before_request
def before_request():
    """Run security checks before each request."""
    # Validate request size
    size_error = validate_request_size()
    if size_error:
        return size_error
    
    # Rate limiting
    rate_error = rate_limit_middleware()
    if rate_error:
        return rate_error


@app.after_request
def after_request(response: Response) -> Response:
    """Add security headers to all responses."""
    return add_security_headers(response)


# ── Error Handlers ────────────────────────────────────────────────────────────
@app.errorhandler(429)
def rate_limit_error(e):
    return {"error": "Too many requests. Please slow down."}, 429


@app.errorhandler(413)
def request_too_large(e):
    return {"error": "Request too large"}, 413


@app.errorhandler(500)
def internal_error(e):
    # Don't expose internal errors in production
    if DEBUG:
        return {"error": str(e)}, 500
    return {"error": "Something went wrong. Please try again."}, 500


@app.errorhandler(Exception)
def handle_exception(e):
    if DEBUG:
        raise e
    return {"error": "Something went wrong. Please try again."}, 500


# ── Routes ────────────────────────────────────────────────────────────────────
app.register_blueprint(chat_bp, url_prefix="/api")


@app.route("/health")
def health():
    return {"status": "ok"}


# ── Main ──────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080, debug=DEBUG)
