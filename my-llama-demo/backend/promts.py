import asyncio
import json
import os
from typing import Dict, Literal
from queue import Queue

from pydantic import BaseModel


class AskRequest(BaseModel):
    speech: dict  # the entire speech object from the frontend
    question: str

def radar_chart_prompt(name: str, role: str, text: str, lang: str, user_question: str) -> str:
    return f"""
    This is a speech given by {name}, whose role is {role}:

    {text}
    
    You will act like a negotiation expert.
    Given the above speech, classify its negotiation strategy based on:
    - Cooperation & Relationship-Building (0-100)
    - diplomacy (0-100) 
    - persuasion (0-100)
    - urgency (0-100)
    - strategy (0-100)

    Provide a JSON output like:
    {{
    "Cooperation": XX,
    "Diplomacy": XX,
    "Persuasion": XX,
    "Urgency": XX,
    "Strategy": XX,
    }}
    Just give this output, do not put extra newline characters in it.
    """





def assistant_prompt(name: str, role: str, text: str, lang: str, user_question: str) -> str:
    return (
        f"This is a {lang} speech by {name} ({role}).\n\n"
        f"Speech text:\n{text}\n\n"
        f"User question: {user_question}\n\n"
        f"Answer in English, referencing the speech context if needed."
    )

# def bias_prompt(name: str, role: str, text: str, lang: str, user_question: str) -> str:
#     return f"""
#     This is a speech given by {name}, whose role is {role}:

#     {text}
    
#     You will act like a geopolitical analyst expert.
#     Given the above speech, identify the potential two opposite sides and evaluate the degree of bias in the speech.
#     You answer using an integer from -100 to 100, where -100 is extremely biased against the first side, 0 is neutral, and 100 is extremely biased against the second side.
#     Only provide a list containing the two sides (first and second) as well as the bias integer, do not provide anything else.
#     """


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

        prompt_text: str = radar_chart_prompt(name, role, text, lang, user_question)
    # elif mode == "bias":
    #     if speech_key in cache:
    #         return {"response": cache[speech_key]}  # Return cached response if available

    #     prompt_text: str = bias_prompt(name, role, text, lang, user_question)
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
