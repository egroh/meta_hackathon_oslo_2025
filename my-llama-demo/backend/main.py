from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import json
from typing import Optional, Any, Coroutine, Dict, Union
from promts import speech_prompt
from promts import LlamaRequest
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

@app.post("/llama_request")
async def ask_model(req: LlamaRequest) -> dict[str, Union[str, int]]:
    """
    Combine the speech and user's question into a single prompt for the LlamaIndex worker.
    Return the model's response.
    """
    return await speech_prompt(req, request_queue, response_queue)


# @app.post("/bias_chart")
# async def ask_model_radar(req: AskRequest) -> dict[str, str]:
#     """
#     Combine the speech and user's question into a single prompt for the LlamaIndex worker.
#     Return the model's response.
#     """
#     return await speech_prompt(req, request_queue, response_queue, "bias")