import os
from typing import Generator

import requests
from dotenv import load_dotenv
from flask import Blueprint, request, Response

from api.personality import build_system_prompt, load_chat_samples

load_dotenv()

chat_bp = Blueprint("chat", __name__)

# ── Groq API config ───────────────────────────────────────────────────────────
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
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
    """Validate chat request and return (messages, error)."""
    if not data or "messages" not in data:
        return [], "Missing 'messages' field"
    
    messages = data["messages"]
    if not isinstance(messages, list):
        return [], "'messages' must be a list"
    
    validated = []
    for i, msg in enumerate(messages):
        if not isinstance(msg, dict):
            return [], f"Message {i} must be an object"
        role = msg.get("role")
        content = msg.get("content")
        if role not in ("user", "assistant"):
            return [], f"Message {i}: role must be 'user' or 'assistant'"
        if not isinstance(content, str):
            return [], f"Message {i}: content must be a string"
        validated.append({"role": role, "content": content})
    
    return validated, None


# ── Streaming chat endpoint ────────────────────────────────────────────────────
@chat_bp.route("/chat", methods=["POST"])
def chat():
    data = request.get_json(silent=True) or {}
    messages, error = _validate_chat_request(data)
    
    if error:
        return {"error": error}, 400
    
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
        
        with requests.post(GROQ_API_URL, json=payload, headers=headers, stream=True) as resp:
            resp.raise_for_status()
            for line in resp.iter_lines(decode_unicode=True):
                if not line or not line.startswith("data: "):
                    continue
                data_str = line[6:]  # strip "data: " prefix
                if data_str == "[DONE]":
                    break
                try:
                    import json
                    chunk = json.loads(data_str)
                    delta = chunk.get("choices", [{}])[0].get("delta", {}).get("content")
                    if delta:
                        yield delta
                except (ValueError, KeyError, IndexError):
                    continue

    return Response(token_stream(), mimetype="text/plain")
