import asyncio
import json
import os
from typing import Dict, Literal
from queue import Queue

from pydantic import BaseModel


class AskRequest(BaseModel):
    speech: dict  # the entire speech object from the frontend
    question: str

def radar_chart_prompt(name: str, role: str, text: str, lang: str, speech: str, user_question: str) -> str:
    return f"""
    This is a speech given by {name}, whose role is {role}:

    {speech}

    Given the following speech, classify its negotiation strategy based on:
    - Cooperation & Relationship-Building (0-100)
    - Respectfulness & Diplomacy (0-100)
    - Satisfaction with the solution (0-100)
    - Use of evidence (0-100)
    - Urgency & Time Pressure Detection (0-100)
    - How much of the speaker's interest is portrayed (0-100)

    Provide a JSON output like:
    {
    "Cooperation & Relationship-Building": 85,
      "Respectfulness & Diplomacy": 75,
      "Satisfaction with the solution": 50,
      "Use of evidence": 60,
      "Urgency & Time Pressure Detection": 40,
      "How much of the speaker's interest is portrayed": 10
    }
    """


def assistant_prompt(name: str, role: str, text: str, lang: str, user_question: str) -> str:
    return (
        f"This is a {lang} speech by {name} ({role}).\n\n"
        f"Speech text:\n{text}\n\n"
        f"User question: {user_question}\n\n"
        f"Answer in English, referencing the speech context if needed."
    )


CACHE_FILE = "radar_graph_cache.json"


def load_cache() -> Dict[str, str]:
    if os.path.exists(CACHE_FILE):
        with open(CACHE_FILE, "r") as f:
            return json.load(f)
    return {}


def save_cache(cache: Dict[str, str]):
    with open(CACHE_FILE, "w") as f:
        json.dump(cache, f)


async def speech_prompt(
        req: AskRequest,
        request_queue: Queue,
        response_queue: Queue,
        mode: Literal["assistant", "radar"]
) -> Dict[str, str]:
    if not req.speech or not req.question:
        return {"response": "Missing speech or question."}

    # Extract fields
    name: str = req.speech.get("name", "Unknown")
    role: str = req.speech.get("role", "Unknown")
    text: str = req.speech.get("speech", "")
    lang: str = req.speech.get("language", "Unknown")
    user_question: str = req.question

    # Load cache
    cache = load_cache()
    speech_key = f"{name}_{role}_{text[:50]}"  # Unique identifier based on speech content

    if mode == "radar":
        if speech_key in cache:
            return {"response": cache[speech_key]}  # Return cached response if available

        prompt_text: str = radar_chart_prompt(name, role, text, lang, text, user_question)
    else:
        prompt_text: str = assistant_prompt(name, role, text, lang, user_question)

    # Forward to worker
    request_queue.put(prompt_text)

    # Wait for response
    while response_queue.empty():
        await asyncio.sleep(0.1)

    response: str = response_queue.get()

    # Cache radar responses
    if mode == "radar":
        cache[speech_key] = response
        save_cache(cache)

    return {"response": response}
