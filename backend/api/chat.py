import os
import json
from typing import Generator

import requests
from dotenv import load_dotenv
from flask import Blueprint, request, Response

from api.personality import build_system_prompt, load_chat_samples
from api.security import sanitize_message, abuse_detector, get_client_ip
from api.cache import should_use_cache

load_dotenv()

chat_bp = Blueprint("chat", __name__)

# ── Configuration ─────────────────────────────────────────────────────────────
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_TIMEOUT = 30  # seconds

# Message limits
MAX_MESSAGES = 20
MAX_MESSAGE_LENGTH = 2000
MAX_TOTAL_LENGTH = 15000

_system_prompt: str = ""


def _get_api_key() -> str:
    api_key = os.getenv("GROQ_API_KEY", "")
    if not api_key:
        raise RuntimeError("GROQ_API_KEY is not set in environment / .env")
    return api_key


def _get_system_prompt() -> str:
    global _system_prompt
    if not _system_prompt:
        chat_path = os.getenv("CHAT_DATA_PATH", "data/whatsapp_chats.json")
        samples = load_chat_samples(chat_path)
        _system_prompt = build_system_prompt(samples)
    return _system_prompt


def _validate_chat_request(data: dict) -> tuple[list[dict], str | None]:
    """Validate and sanitize chat request."""
    if not data or "messages" not in data:
        return [], "Missing 'messages' field"
    
    messages = data["messages"]
    if not isinstance(messages, list):
        return [], "'messages' must be a list"
    
    # Limit number of messages
    if len(messages) > MAX_MESSAGES:
        return [], f"Too many messages (max {MAX_MESSAGES})"
    
    validated = []
    total_length = 0
    
    for i, msg in enumerate(messages):
        if not isinstance(msg, dict):
            return [], f"Message {i} must be an object"
        
        role = msg.get("role")
        content = msg.get("content")
        
        if role not in ("user", "assistant"):
            return [], f"Message {i}: role must be 'user' or 'assistant'"
        
        if not isinstance(content, str):
            return [], f"Message {i}: content must be a string"
        
        # Sanitize content
        content, error = sanitize_message(content)
        if error:
            return [], f"Message {i}: {error}"
        
        # Check length limits
        if len(content) > MAX_MESSAGE_LENGTH:
            return [], f"Message {i}: too long (max {MAX_MESSAGE_LENGTH} chars)"
        
        total_length += len(content)
        if total_length > MAX_TOTAL_LENGTH:
            return [], f"Conversation too long (max {MAX_TOTAL_LENGTH} chars total)"
        
        validated.append({"role": role, "content": content})
    
    if not validated:
        return [], "No valid messages"
    
    return validated, None


# ── Streaming chat endpoint ────────────────────────────────────────────────────
@chat_bp.route("/chat", methods=["POST"])
def chat():
    data = request.get_json(silent=True) or {}
    messages, error = _validate_chat_request(data)
    
    if error:
        # Return error as plain text stream so frontend displays it
        return Response(error, status=400, mimetype="text/plain")
    
    # Check for abuse patterns
    ip = get_client_ip()
    if messages:
        last_user_msg = next(
            (m["content"] for m in reversed(messages) if m["role"] == "user"),
            ""
        )
        abuse_error = abuse_detector.check_abuse(ip, last_user_msg)
        if abuse_error:
            return Response(abuse_error, status=429, mimetype="text/plain")
    
    # Check cache first (saves Groq API calls)
    use_cache, cached_response = should_use_cache(messages)
    if use_cache and cached_response:
        # Return cached response as a stream (single chunk)
        def cached_stream():
            yield cached_response
        return Response(cached_stream(), mimetype="text/plain")
    
    # Call Groq API
    api_key = _get_api_key()
    system_prompt = _get_system_prompt()
    model = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")

    groq_messages = [{"role": "system", "content": system_prompt}] + messages

    def token_stream() -> Generator[str, None, None]:
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": model,
            "messages": groq_messages,
            "stream": True,
            "max_tokens": 512,
            "temperature": 0.75,
        }
        
        try:
            with requests.post(
                GROQ_API_URL,
                json=payload,
                headers=headers,
                stream=True,
                timeout=GROQ_TIMEOUT
            ) as resp:
                # Handle Groq rate limiting
                if resp.status_code == 429:
                    yield "i'm getting a lot of questions rn, try again in a bit!"
                    return
                
                # Handle other errors
                if resp.status_code != 200:
                    yield "hmm something went wrong on my end, try again?"
                    return
                
                for line in resp.iter_lines(decode_unicode=True):
                    if not line or not line.startswith("data: "):
                        continue
                    data_str = line[6:]
                    if data_str == "[DONE]":
                        break
                    try:
                        chunk = json.loads(data_str)
                        delta = chunk.get("choices", [{}])[0].get("delta", {}).get("content")
                        if delta:
                            yield delta
                    except (ValueError, KeyError, IndexError):
                        continue
                        
        except requests.Timeout:
            yield "that took too long, try asking something simpler?"
        except requests.RequestException:
            yield "couldn't reach my brain rn, try again in a sec"

    return Response(token_stream(), mimetype="text/plain")
