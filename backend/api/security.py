"""
Security middleware and utilities for the portfolio backend.
Pure Python implementation - no Rust dependencies.
"""

import time
import re
import hashlib
from functools import wraps
from typing import Callable
from flask import request, Response, g

# ── Rate Limiter (In-Memory) ──────────────────────────────────────────────────
class RateLimiter:
    """Simple in-memory rate limiter with sliding window."""
    
    def __init__(self):
        self.requests: dict[str, list[float]] = {}
        self.cleanup_interval = 60  # seconds
        self.last_cleanup = time.time()
    
    def _cleanup(self):
        """Remove old entries to prevent memory bloat."""
        now = time.time()
        if now - self.last_cleanup < self.cleanup_interval:
            return
        
        cutoff = now - 120  # Keep 2 minutes of history
        for ip in list(self.requests.keys()):
            self.requests[ip] = [t for t in self.requests[ip] if t > cutoff]
            if not self.requests[ip]:
                del self.requests[ip]
        self.last_cleanup = now
    
    def is_allowed(self, ip: str, limit: int, window: int = 60) -> tuple[bool, int]:
        """
        Check if request is allowed.
        Returns (allowed, retry_after_seconds).
        """
        self._cleanup()
        now = time.time()
        cutoff = now - window
        
        if ip not in self.requests:
            self.requests[ip] = []
        
        # Filter to requests within window
        self.requests[ip] = [t for t in self.requests[ip] if t > cutoff]
        
        if len(self.requests[ip]) >= limit:
            oldest = min(self.requests[ip])
            retry_after = int(oldest + window - now) + 1
            return False, max(retry_after, 1)
        
        self.requests[ip].append(now)
        return True, 0


# Global rate limiters
global_limiter = RateLimiter()
chat_limiter = RateLimiter()

# Rate limit settings
GLOBAL_RATE_LIMIT = 100  # requests per minute
CHAT_RATE_LIMIT = 10     # requests per minute for /api/chat


def get_client_ip() -> str:
    """Get client IP, respecting X-Forwarded-For from Nginx."""
    if request.headers.get("X-Forwarded-For"):
        return request.headers["X-Forwarded-For"].split(",")[0].strip()
    if request.headers.get("X-Real-IP"):
        return request.headers["X-Real-IP"]
    return request.remote_addr or "unknown"


def rate_limit_middleware():
    """Apply rate limiting before each request."""
    ip = get_client_ip()
    
    # Check global rate limit
    allowed, retry_after = global_limiter.is_allowed(ip, GLOBAL_RATE_LIMIT)
    if not allowed:
        return Response(
            '{"error": "Too many requests. Please slow down."}',
            status=429,
            mimetype="application/json",
            headers={"Retry-After": str(retry_after)}
        )
    
    # Stricter limit for chat endpoint
    if request.path == "/api/chat" and request.method == "POST":
        allowed, retry_after = chat_limiter.is_allowed(ip, CHAT_RATE_LIMIT)
        if not allowed:
            return Response(
                '{"error": "Chat rate limit reached. Please wait a moment."}',
                status=429,
                mimetype="application/json",
                headers={"Retry-After": str(retry_after)}
            )
    
    # Store IP for logging
    g.client_ip = ip
    return None


def add_security_headers(response: Response) -> Response:
    """Add security headers to every response."""
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Content-Security-Policy"] = "default-src 'none'"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    return response


# ── Request Validation ────────────────────────────────────────────────────────
MAX_CONTENT_LENGTH = 16 * 1024  # 16 KB max request size

def validate_request_size():
    """Reject oversized requests."""
    content_length = request.content_length
    if content_length and content_length > MAX_CONTENT_LENGTH:
        return Response(
            '{"error": "Request too large"}',
            status=413,
            mimetype="application/json"
        )
    return None


# ── Input Sanitization ────────────────────────────────────────────────────────
SUSPICIOUS_PATTERNS = [
    r"<script",
    r"javascript:",
    r"on\w+\s*=",  # onclick=, onload=, etc.
    r"data:text/html",
]

def sanitize_message(content: str) -> tuple[str, str | None]:
    """
    Sanitize message content.
    Returns (sanitized_content, error_message).
    """
    if not content or not content.strip():
        return "", "Empty message"
    
    # Strip excessive whitespace
    content = " ".join(content.split())
    
    # Check for suspicious patterns
    content_lower = content.lower()
    for pattern in SUSPICIOUS_PATTERNS:
        if re.search(pattern, content_lower, re.IGNORECASE):
            return "", "Invalid content detected"
    
    return content, None


# ── Abuse Detection ───────────────────────────────────────────────────────────
class AbuseDetector:
    """Detect and block abusive behavior patterns."""
    
    def __init__(self):
        self.message_hashes: dict[str, list[tuple[float, str]]] = {}
        self.cleanup_interval = 300  # 5 minutes
        self.last_cleanup = time.time()
    
    def _hash_message(self, content: str) -> str:
        """Create hash of message for duplicate detection."""
        normalized = content.lower().strip()
        return hashlib.md5(normalized.encode()).hexdigest()[:16]
    
    def _cleanup(self):
        now = time.time()
        if now - self.last_cleanup < self.cleanup_interval:
            return
        
        cutoff = now - 600  # 10 minutes
        for ip in list(self.message_hashes.keys()):
            self.message_hashes[ip] = [
                (t, h) for t, h in self.message_hashes[ip] if t > cutoff
            ]
            if not self.message_hashes[ip]:
                del self.message_hashes[ip]
        self.last_cleanup = now
    
    def check_abuse(self, ip: str, message: str) -> str | None:
        """
        Check for abusive patterns.
        Returns error message if abuse detected, None otherwise.
        """
        self._cleanup()
        now = time.time()
        msg_hash = self._hash_message(message)
        
        if ip not in self.message_hashes:
            self.message_hashes[ip] = []
        
        # Check for repeated identical messages (bot behavior)
        recent_hashes = [h for t, h in self.message_hashes[ip] if now - t < 60]
        if recent_hashes.count(msg_hash) >= 3:
            return "Please don't spam the same message"
        
        self.message_hashes[ip].append((now, msg_hash))
        return None


abuse_detector = AbuseDetector()
