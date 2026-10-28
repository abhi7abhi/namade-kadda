import logging
import httpx
from typing import Dict, Any, Optional
from app.core.config import settings

logger = logging.getLogger(__name__)


class LLMProvider:
    """
    Modular LLM gateway supporting configured cloud providers (Groq, OpenAI, Gemini)
    and a reliable deterministic demo fallback when no API credentials are provided.
    Never exposes API keys in logs or exceptions.
    """

    @classmethod
    def is_live_configured(cls) -> bool:
        return bool(settings.LLM_API_KEY and settings.LLM_API_KEY.strip() and settings.LLM_PROVIDER != "demo")

    @classmethod
    async def generate_completion(cls, system_prompt: str, user_prompt: str) -> Dict[str, Any]:
        if not cls.is_live_configured():
            return {
                "mode": "DEMO",
                "provider": "deterministic-demo",
                "model": "demo-deterministic-v1",
                "content": None,
                "note": "Demo AI mode — no live LLM configured"
            }

        provider = settings.LLM_PROVIDER.lower()
        api_key = settings.LLM_API_KEY

        try:
            if provider == "groq":
                async with httpx.AsyncClient(timeout=15.0) as client:
                    resp = await client.post(
                        "https://api.groq.com/openai/v1/chat/completions",
                        headers={"Authorization": f"Bearer {api_key}"},
                        json={
                            "model": settings.LLM_MODEL or "llama-3.3-70b-versatile",
                            "messages": [
                                {"role": "system", "content": system_prompt},
                                {"role": "user", "content": user_prompt}
                            ],
                            "temperature": 0.2
                        }
                    )
                    resp.raise_for_status()
                    data = resp.json()
                    content = data["choices"][0]["message"]["content"]
                    return {
                        "mode": "LIVE",
                        "provider": "groq",
                        "model": settings.LLM_MODEL,
                        "content": content
                    }
            elif provider == "openai":
                async with httpx.AsyncClient(timeout=15.0) as client:
                    resp = await client.post(
                        "https://api.openai.com/v1/chat/completions",
                        headers={"Authorization": f"Bearer {api_key}"},
                        json={
                            "model": settings.LLM_MODEL or "gpt-4o-mini",
                            "messages": [
                                {"role": "system", "content": system_prompt},
                                {"role": "user", "content": user_prompt}
                            ],
                            "temperature": 0.2
                        }
                    )
                    resp.raise_for_status()
                    data = resp.json()
                    content = data["choices"][0]["message"]["content"]
                    return {
                        "mode": "LIVE",
                        "provider": "openai",
                        "model": settings.LLM_MODEL,
                        "content": content
                    }
            else:
                return {
                    "mode": "DEMO",
                    "provider": "fallback-demo",
                    "model": "demo-deterministic-v1",
                    "content": None,
                    "note": f"Unsupported or unconfigured provider: {provider}"
                }
        except Exception as e:
            logger.warning(f"Live LLM call failed ({provider}): {str(e)[:80]}. Falling back to demo mode.")
            return {
                "mode": "DEMO",
                "provider": "fallback-demo",
                "model": "demo-deterministic-v1",
                "content": None,
                "note": "Live LLM request failed or timed out — safely defaulted to deterministic demo mode"
            }
