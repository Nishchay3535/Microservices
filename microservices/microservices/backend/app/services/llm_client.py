"""OpenAI-compatible chat API helpers (OpenAI, Groq, etc.)."""

from typing import TYPE_CHECKING, Any

AI_NOT_CONFIGURED = (
    "AI is not configured. Set OPENAI_API_KEY in backend/.env "
    "(free option: Groq — see .env.example)."
)
AI_REQUEST_FAILED = (
    "AI service could not respond. Check your API key, model name, and provider limits."
)

if TYPE_CHECKING:
    from app.core.config import Settings

DEFAULT_OPENAI_BASE_URL = "https://api.openai.com/v1"


def ai_is_configured(settings: "Settings") -> bool:
    return bool(settings.OPENAI_API_KEY and settings.OPENAI_API_KEY.strip())


def chat_completions_url(settings: "Settings") -> str:
    base = (settings.OPENAI_BASE_URL or DEFAULT_OPENAI_BASE_URL).rstrip("/")
    return f"{base}/chat/completions"


async def chat_completion(
    settings: "Settings",
    *,
    messages: list[dict[str, str]],
    max_tokens: int = 300,
    temperature: float = 0.75,
) -> str:
    import openai

    client_kwargs: dict[str, Any] = {"api_key": settings.OPENAI_API_KEY}
    if settings.OPENAI_BASE_URL:
        client_kwargs["base_url"] = settings.OPENAI_BASE_URL.rstrip("/")
    client = openai.AsyncOpenAI(**client_kwargs)
    response = await client.chat.completions.create(
        model=settings.AI_MODEL,
        messages=messages,  # type: ignore[arg-type]
        max_tokens=max_tokens,
        temperature=temperature,
    )
    return response.choices[0].message.content or ""
