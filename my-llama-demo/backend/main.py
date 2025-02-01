from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import asyncio

# Suppose we still have a worker approach for LLaMA
# from model_worker import start_model_worker
# request_queue, response_queue, worker = ...

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # allow from anywhere for this demo
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory list of example messages
messages_data = [
    "President (Italian): L'ordine del giorno reca la discussione...",
    "Tytti Tuppurainen (English): Mr President, we have once more gathered..."
]

class AskRequest(BaseModel):
    message: str
    question: str

@app.get("/messages")
def get_messages():
    """Return the list of messages."""
    return {"messages": messages_data}

@app.post("/ask")
async def ask_model(req: AskRequest):
    """
    Combine the selected message + user question into a single prompt
    and send it to the LLaMA worker.
    """
    # For a real LLaMA prompt, you'd do something like:
    # prompt_text = f"Message: {req.message}\nUser question: {req.question}\nAnswer:"
    #
    # request_queue.put(prompt_text)
    # while response_queue.empty():
    #     await asyncio.sleep(0.1)
    # response = response_queue.get()
    # return {"response": response}

    # For a demo, let's just fake it:
    fake_response = f"[Fake LLaMA] About your question '{req.question}' regarding: {req.message[:30]}..."
    return {"response": fake_response}
