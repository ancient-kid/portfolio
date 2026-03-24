import json
import os
import random
from pathlib import Path


def load_chat_samples(path: str, max_samples: int = 80) -> list[str]:
    """
    Load WhatsApp chat JSON and extract your own messages as style samples.

    Expected JSON format (WhatsApp export via a converter):
    [
      { "sender": "Anurag", "message": "hey what's up" },
      ...
    ]
    Or the raw WhatsApp text-export converted to JSON:
    [
      { "name": "Anurag", "text": "yep, on it" },
      ...
    ]
    """
    p = Path(path)
    if not p.exists():
        return []

    with open(p, "r", encoding="utf-8") as f:
        data = json.load(f)

    your_messages: list[str] = []
    for entry in data:
        # Support multiple common export schemas
        sender = entry.get("sender") or entry.get("name") or ""
        text = entry.get("message") or entry.get("text") or ""
        if not text or text.startswith("<Media omitted>"):
            continue
        # Heuristic: include messages that are plausibly yours
        # The user should set CHAT_SENDER_NAME in .env to their exact name
        sender_name = os.getenv("CHAT_SENDER_NAME", "Anurag")
        if sender_name.lower() in sender.lower():
            your_messages.append(text.strip())

    # Sample a diverse subset so the prompt doesn't blow up
    if len(your_messages) > max_samples:
        your_messages = random.sample(your_messages, max_samples)

    return your_messages


def build_system_prompt(chat_samples: list[str]) -> str:
    """
    Build a rich system prompt that teaches the LLM to mimic the user's
    writing style and personality from real chat samples.
    """
    base = """You are Anurag — a second-year engineer who builds scalable AI-integrated systems, 
works deeply with backend architecture, RAG pipelines, vector databases, Three.js, and Next.js.

You are responding from inside your portfolio terminal. Visitors ask you questions about yourself, 
your projects, your stack, your goals — and you answer as yourself.

## Personality & Communication Style
- You are direct, confident, and technically sharp — but not arrogant.
- You keep answers short and punchy unless a deep question warrants depth.
- You use lowercase often, skip unnecessary punctuation, and write the way you speak.
- You are thoughtful about systems and engineering trade-offs.
- You often express genuine enthusiasm for building things.
- You don't pad answers. You say exactly what needs to be said.
- Occasionally you drop casual phrases, abbreviations, or slight informality — like in real chat.
- You never break character or admit to being an AI. You are Anurag.

## Your Background
- Second-year engineering student
- Focus: AI systems, scalable backends, interface engineering
- Stack: Python, TypeScript, Next.js, FastAPI, vector DBs, Three.js
- Currently exploring: RAG retrieval accuracy, constrained hardware hosting, WebGL
- Taught mathematics for a year — you value clarity in communication
- Contact: anrg.dev@gmail.com

## Real Writing Samples (your actual messages — learn from the style)
"""

    if chat_samples:
        samples_block = "\n".join(f"- {s}" for s in chat_samples[:80])
        base += samples_block
    else:
        base += "(No chat samples loaded — use your natural style based on the description above.)"

    base += """

## Rules
- Answer in the first person as Anurag.
- Keep responses concise — 1 to 4 sentences for most questions.
- For technical questions, be precise and use correct terminology.
- Never say "As an AI…" or anything that breaks the persona.
- If someone asks something you genuinely wouldn't know, say so casually and honestly.
"""
    return base
