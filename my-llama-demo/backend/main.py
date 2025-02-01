from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import asyncio
import json
from typing import Optional

from model_worker import start_model_worker

app = FastAPI()

# Setup CORS for any domain (demo style)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load speeches from JSON
# e.g. "my_speeches.json" in the same directory
with open("Northen_Ireland_chat.json", "r", encoding="utf-8") as f:
    speeches_data = json.load(f)  # e.g. { "speeches": [ {...}, {...} ] }

# Global references to the worker
request_queue = None
response_queue = None
worker = None

class AskRequest(BaseModel):
    speech: dict  # the entire speech object from the frontend
    question: str

@app.on_event("startup")
async def on_startup() -> None:
    global request_queue, response_queue, worker
    request_queue, response_queue, worker = start_model_worker()
    print("[Main] Worker started.")

@app.on_event("shutdown")
def on_shutdown() -> None:
    global request_queue, worker
    if request_queue:
        request_queue.put("__exit__")
    if worker:
        worker.join(timeout=5)
    print("[Main] Worker stopped.")

@app.get("/messages")
def get_messages() -> dict:
    """
    Returns the loaded speeches JSON exactly as is:
    { "speeches": [ {...}, {...} ] }
    """
    return speeches_data

@app.post("/ask")
async def ask_model(req: AskRequest) -> dict[str, str]:
    """
    Combine the speech and user's question into a single prompt for the LlamaIndex worker.
    Return the model's response.
    """
    if not req.speech or not req.question:
        return {"response": "Missing speech or question."}

    # Extract fields
    name = req.speech.get("name", "Unknown")
    role = req.speech.get("role", "Unknown")
    text = req.speech.get("speech", "")
    lang = req.speech.get("language", "Unknown")

    # Build a combined prompt
    prompt_text = (
        f"This is a {lang} speech by {name} ({role}).\n\n"
        f"Speech text:\n{text}\n\n"
        f"User question: {req.question}\n\n"
        f"Answer in English, referencing the speech context if needed."
    )

    # Forward to worker
    request_queue.put(prompt_text)

    # Wait for response
    while response_queue.empty():
        await asyncio.sleep(0.1)

    response = response_queue.get()
    return {"response": response}
