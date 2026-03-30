import os
from typing import Generator

from dotenv import load_dotenv
from flask import Blueprint, request, Response
from groq import Groq

from api.personality import build_system_prompt, load_chat_samples

load_dotenv()

chat_bp = Blueprint("chat", __name__)

# ── Init Groq client + personality prompt at startup ──────────────────────────
_client: Groq | None = None
_system_prompt: str = ""


def _get_client() -> Groq:
    global _client
    if _client is None:
        api_key = os.getenv("GROQ_API_KEY", "")
        if not api_key:
            raise RuntimeError("GROQ_API_KEY is not set in environment / .env")
        _client = Groq(api_key=api_key)
    return _client


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
    
    client = _get_client()
    system_prompt = _get_system_prompt()
    model = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")

    groq_messages = [{"role": "system", "content": system_prompt}] + messages

    def token_stream() -> Generator[str, None, None]:
        stream = client.chat.completions.create(
            model=model,
            messages=groq_messages,
            stream=True,
            max_tokens=512,
            temperature=0.75,
        )
        for chunk in stream:
            delta = chunk.choices[0].delta.content
            if delta:
                yield delta

    return Response(token_stream(), mimetype="text/plain")
