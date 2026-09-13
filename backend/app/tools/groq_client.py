import json
import logging

from groq import Groq

from app.config import settings

logger = logging.getLogger("aivoa.groq")
logging.basicConfig(level=logging.INFO)

_client: Groq | None = None


def get_client() -> Groq:
    global _client
    if _client is None:
        _client = Groq(api_key=settings.GROQ_API_KEY)
    return _client


def call_json(system_prompt: str, user_prompt: str, model: str, temperature: float = 0.2) -> dict:
    """Call Groq chat completions in JSON mode and parse the result.

    The configured GROQ_EXTRACTION_MODEL / GROQ_REASONING_MODEL both support
    Groq's `response_format={"type": "json_object"}` structured output mode, which
    keeps the LangGraph nodes from having to hand-parse free text.
    """
    client = get_client()
    completion = client.chat.completions.create(
        model=model,
        temperature=temperature,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
    )
    raw = completion.choices[0].message.content
    logger.info("GROQ RAW RESPONSE [model=%s]:\n%s", model, raw)
    try:
        parsed = json.loads(raw)
        logger.info("GROQ PARSED JSON: %s", parsed)
        return parsed
    except json.JSONDecodeError:
        # Groq occasionally wraps JSON in prose/fences despite json_object mode;
        # fall back to extracting the outermost {...} block.
        start, end = raw.find("{"), raw.rfind("}")
        if start != -1 and end != -1:
            return json.loads(raw[start : end + 1])
        raise
