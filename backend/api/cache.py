"""
Response cache for common questions.
Saves Groq API calls for frequently asked questions.
"""

import re
import time
from typing import Any, Optional

# ── Cached Responses ──────────────────────────────────────────────────────────
# Keywords/patterns mapped to cached responses
# These bypass the Groq API entirely

CACHED_RESPONSES: list[tuple[list[str], str]] = [
    # Contact information
    (
        ["email", "contact", "reach you", "get in touch", "mail", "reach out"],
        "you can reach me at anrg.dev@gmail.com — always happy to connect!"
    ),
    
    # Current work
    (
        ["working on", "currently doing", "current project", "what are you doing", "up to lately", "these days"],
        "rn i'm building a homeserver using my old Samsung M32 — basically recycling an old phone into something useful. pretty fun challenge tbh"
    ),
    
    # Tech stack
    (
        ["tech stack", "technologies", "what do you use", "stack", "tools", "languages you know", "programming languages"],
        "my main stack is Next.js + TypeScript for frontend, Python with FastAPI/Flask for backend. also work with vector DBs, Three.js for 3D stuff, and RAG pipelines"
    ),
    
    # About
    (
        ["who are you", "about yourself", "tell me about you", "introduce yourself", "about you"],
        "i'm Anurag Mishra — a sophomore figuring out life and solving IRL problems using tech. i like building things that actually work"
    ),
    
    # Education
    (
        ["study", "college", "university", "education", "school", "degree", "where do you study"],
        "i'm doing my B.E. from Thadomal Shahani Engineering College, Bandra. currently in second year"
    ),
    
    # Availability / Opportunities
    (
        ["available", "hire", "freelance", "opportunities", "open to work", "looking for work", "job"],
        "yes definitely open to contribute to interesting work! feel free to reach out at anrg.dev@gmail.com"
    ),
    
    # Greetings
    (
        ["hello", "hi", "hey", "sup", "what's up", "howdy"],
        "hey! what's up? ask me anything about my work, projects, or just say hi"
    ),
    
    # Thanks
    (
        ["thank", "thanks", "thx", "ty", "appreciate"],
        "no problem! happy to help. anything else you wanna know?"
    ),
    
    # Website / Portfolio
    (
        ["website", "portfolio", "this site", "built this"],
        "yeah i built this portfolio myself — Next.js frontend with a Flask backend running on my phone as a homeserver. the terminal you're using talks to an LLM that mimics my style"
    ),
    
    # Location
    (
        ["where are you", "location", "based", "from where", "live"],
        "based in Mumbai, India"
    ),
]

# ── Generic TTL Cache (In-Memory) ───────────────────────────────────────────
_TTL_CACHE: dict[str, tuple[float, Any]] = {}


def get_ttl_cache(key: str, ttl_seconds: int) -> Any | None:
    """
    Get cached value if present and not expired.
    Returns None if key is missing or stale.
    """
    cached = _TTL_CACHE.get(key)
    if not cached:
        return None

    created_at, value = cached
    if time.time() - created_at > ttl_seconds:
        _TTL_CACHE.pop(key, None)
        return None

    return value


def set_ttl_cache(key: str, value: Any) -> None:
    """Store value in in-memory TTL cache."""
    _TTL_CACHE[key] = (time.time(), value)


def get_cached_response(message: str) -> Optional[str]:
    """
    Check if message matches any cached response patterns.
    Returns cached response if found, None otherwise.
    """
    message_lower = message.lower().strip()
    
    # Skip very short messages (might be incomplete)
    if len(message_lower) < 3:
        return None
    
    for keywords, response in CACHED_RESPONSES:
        for keyword in keywords:
            if keyword in message_lower:
                return response
    
    return None


def should_use_cache(messages: list[dict]) -> tuple[bool, Optional[str]]:
    """
    Determine if we should use cache for this conversation.
    Only cache single-message conversations (first question).
    
    Returns (should_cache, cached_response).
    """
    # Only cache if it's a single user message (first question)
    if len(messages) != 1:
        return False, None
    
    if messages[0].get("role") != "user":
        return False, None
    
    user_message = messages[0].get("content", "")
    cached = get_cached_response(user_message)
    
    return cached is not None, cached
