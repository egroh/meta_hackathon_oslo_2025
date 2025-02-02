import asyncio
import json
import os
from typing import Dict, Literal
from queue import Queue
import json
import re


from pydantic import BaseModel


class LlamaRequest(BaseModel):
    speech: dict  # the entire speech object from the frontend
    instructions: dict
    prompt_data: dict

# def bias_prompt(name: str, role: str, text: str, lang: str, user_question: str) -> str:
#     return f"""
#     This is a speech given by {name}, whose role is {role}:

#     {text}
    
#     You will act like a geopolitical analyst expert.
#     Given the above speech, identify the potential two opposite sides and evaluate the degree of bias in the speech.
#     You answer using an integer from -100 to 100, where -100 is extremely biased against the first side, 0 is neutral, and 100 is extremely biased against the second side.
#     Only provide a list containing the two sides (first and second) as well as the bias integer, do not provide anything else.
#     """


CACHE_FILE = "cache.json"
PROMPTS_FILE = "prompts.json"

def load_cache() -> Dict[str, str]:
    if os.path.exists(CACHE_FILE):
        with open(CACHE_FILE, "r") as f:
            return json.load(f)
    return {}

def save_cache(cache: Dict[str, str]):
    with open(CACHE_FILE, "w") as f:
        json.dump(cache, f)

def load_prompts() -> Dict[str, str]:
    if os.path.exists(PROMPTS_FILE):
        with open(PROMPTS_FILE, "r") as f:
            return json.load(f)
    return {}


async def speech_prompt(
        req: LlamaRequest,
        request_queue: Queue,
        response_queue: Queue,
) -> Dict[str, str]:

    # Extract fields
    name: str = req.speech.get("name", "Unknown")
    role: str = req.speech.get("role", "Unknown")
    text: str = req.speech.get("speech", "")
    lang: str = req.speech.get("language", "Unknown")

    prompt_key = req.instructions.get("prompt_id", req.instructions.get("prompt", "default"))
    speech_key = f"{name}_{role}_{text[:50]}_{prompt_key}"

    # Load cache
    if "no_cache" not in req.instructions:
        cache = load_cache()
        if speech_key in cache:
            response = cache[speech_key]
            if "json_keys" in req.instructions:
                return sanitize_json_output(response, req.instructions["json_keys"])
            else:
                return {"response": response}

    if "prompt" in req.instructions:
        prompt = req.instructions["prompt"]
    elif "prompt_id" in req.instructions:
        prompts = load_prompts()
        prompt_id = req.instructions["prompt_id"]

        if prompt_id not in prompts:
            return {"error": f"Prompt not found for {prompt_id}"}
        prompt = prompts[prompt_id]
    else:
        return {"error": "No prompt, or template specified"}

    try:
        prompt_text = prompt.format(name=name, role=role, text=text, lang=lang, **req.prompt_data)
    except KeyError as e:
        return {"error": f"Missing variable: {e}"}

    # Forward to worker
    request_queue.put(prompt_text)

    # Wait for response
    while response_queue.empty():
        await asyncio.sleep(0.1)

    response: str = response_queue.get()

    # Cache radar responses
    if "no_cache" not in req.instructions:
        cache[speech_key] = response
        save_cache(cache)

    if "json_keys" in req.instructions:
        return sanitize_json_output(response, req.instructions["json_keys"])

    return {"response": response}

def sanitize_json_output(model_output: str, required_keys: list) -> dict:
    """
    Detects and sanitizes JSON in a model's output.

    - Removes extra text before/after JSON.
    - Ensures required keys exist with empty values if missing.

    :param model_output: The raw text output from the model.
    :param required_keys: List of keys that must be in the final JSON.
    :return: A sanitized JSON dictionary.
    """

    # Extract potential JSON using regex
    json_pattern = re.search(r'\{.*\}', model_output, re.DOTALL)
    if not json_pattern:
        print(f"No JSON in model output, wanted {required_keys}: {model_output}")
        parsed_json = {}
    else:
        json_text = json_pattern.group()

        try:
            # Parse JSON
            parsed_json = json.loads(json_text)
        except json.JSONDecodeError:
            print(f"Invalid JSON in model output, wanted {required_keys}: {model_output}")
            parsed_json = {}

    # Ensure required keys exist
    for key in required_keys:
        if key not in parsed_json:
            parsed_json[key] = ""

    return parsed_json
