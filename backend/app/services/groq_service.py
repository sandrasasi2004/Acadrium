import logging
from typing import Optional
from app.database.config import settings

logger = logging.getLogger("acadrium.groq_service")

# Default Groq LLM Model constant
GROQ_MODEL = settings.GROQ_MODEL or "qwen/qwen3.8-27b"

def is_groq_available() -> bool:
    """Check if the Groq API key is configured."""
    api_key = (settings.GROQ_API_KEY or "").strip()
    return bool(api_key)

def generate_groq_answer(
    system_prompt: str,
    user_prompt: str,
    model: str = GROQ_MODEL,
    timeout: float = 15.0
) -> Optional[str]:
    """
    Sends context and user question to the Groq API (Qwen model).
    
    Returns clean string response, or None if Groq is unconfigured or encounters an error.
    Does NOT crash backend under any failure scenario.
    """
    if not is_groq_available():
        logger.warning("GROQ_API_KEY is not set. Groq LLM generation skipped; falling back to clean_academic_prose().")
        return None

    try:
        from groq import Groq
        
        api_key = settings.GROQ_API_KEY.strip()
        client = Groq(api_key=api_key)

        logger.info(f"Calling Groq API using model '{model}'...")
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            timeout=timeout,
            temperature=0.2
        )

        if response and response.choices and len(response.choices) > 0:
            content = response.choices[0].message.content
            if content:
                return content.strip()
                
        logger.warning("Groq API returned an empty response.")
        return None

    except Exception as e:
        logger.warning(f"Groq API call failed: {e}. Falling back to clean_academic_prose().")
        return None
