import os
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from dotenv import load_dotenv
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from groq import Groq
from pydantic import BaseModel

from api.personality import build_system_prompt, load_chat_samples

load_dotenv()

router = APIRouter()

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


# ── Request / Response schemas ─────────────────────────────────────────────────
class Message(BaseModel):
    role: str  # "user" | "assistant"
    content: str


class ChatRequest(BaseModel):
    messages: list[Message]  # full conversation history from the frontend


# ── Streaming chat endpoint ────────────────────────────────────────────────────
@router.post("/chat")
async def chat(req: ChatRequest) -> StreamingResponse:
    client = _get_client()
    system_prompt = _get_system_prompt()

    model = os.getenv("GROQ_MODEL", "llama3-70b-8192")

    groq_messages = [{"role": "system", "content": system_prompt}] + [
        {"role": m.role, "content": m.content} for m in req.messages
    ]

    async def token_stream() -> AsyncGenerator[str, None]:
        stream = client.chat.completions.create(
            model=model,
            messages=groq_messages,  # type: ignore[arg-type]
            stream=True,
            max_tokens=512,
            temperature=0.75,
        )
        for chunk in stream:
            delta = chunk.choices[0].delta.content
            if delta:
                yield delta

    return StreamingResponse(token_stream(), media_type="text/plain")
