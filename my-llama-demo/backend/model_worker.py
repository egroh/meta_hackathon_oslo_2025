import json
import multiprocessing
import os
from typing import Tuple, Dict

# LlamaIndex imports for 0.12.x
from llama_index.core import Settings, SimpleDirectoryReader, VectorStoreIndex
from llama_index.core.llms import LLM
from llama_index.core.llms.utils import resolve_llm
from llama_index.embeddings.openai import OpenAIEmbedding
from llama_index.llms.huggingface import HuggingFaceLLM
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from openai import OpenAI

TESTING = False
NEBIUS = False

# Transformers/HF imports
from transformers import (
    AutoTokenizer,
    AutoModelForCausalLM,
    BitsAndBytesConfig
)

def model_worker_main(
    request_queue: multiprocessing.Queue,
    response_queue: multiprocessing.Queue
) -> None:
    """
    Worker process that:
      1) Sets LlamaIndex global `Settings` with your HuggingFace LLM + embedding (no OpenAI).
      2) Loads a 4-bit quantized HF model.
      3) Builds a VectorStoreIndex from local documents.
      4) Waits for prompts in request_queue, queries the index, returns responses.
    """
    print("[Worker] Initializing the model (migrating from ServiceContext to Settings)...")

    # --------------------------------------------------
    # 1) HF Model Setup (4-bit)
    # --------------------------------------------------
    #model_name = "mistralai/Mistral-7B-Instruct-v0.1"
    model_name = "meta-llama/Llama-3.3-70B-Instruct"
    hf_token = "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"  # remove if not needed

    bnb_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_compute_dtype="bfloat16",
        bnb_4bit_use_double_quant=True
    )
    if not TESTING:
        if NEBIUS:
            # Initialize OpenAI client (Nebius AI Interface)
            client = OpenAI(
                base_url="https://api.studio.nebius.ai/v1/",
                api_key="eyJhbGciOiJIUzI1NiIsImtpZCI6IlV6SXJWd1h0dnprLVRvdzlLZWstc0M1akptWXBvX1VaVkxUZlpnMDRlOFUiLCJ0eXAiOiJKV1QifQ.eyJzdWIiOiJnaXRodWJ8NzQxMzc1MTIiLCJzY29wZSI6Im9wZW5pZCBvZmZsaW5lX2FjY2VzcyIsImlzcyI6ImFwaV9rZXlfaXNzdWVyIiwiYXVkIjpbImh0dHBzOi8vbmViaXVzLWluZmVyZW5jZS5ldS5hdXRoMC5jb20vYXBpL3YyLyJdLCJleHAiOjE4OTYxMzkwNDYsInV1aWQiOiI1YjA5YjE0Zi05NGU1LTRjZTgtOWZlMC1mNmFmMGEwNjQxNjciLCJuYW1lIjoiaGFja2F0aG9uIiwiZXhwaXJlc19hdCI6IjIwMzAtMDItMDFUMDE6MTc6MjYrMDAwMCJ9.jRcx9yEPNCbePYpNNXLfLjii2AbSJbC6hDqEZkDW24c",
            )
            resolved_llm = resolve_llm(OpenAI(
                api_key=client.api_key,
                base_url=client.base_url
            ))
            assert isinstance(resolved_llm, LLM), "Settings.llm must be an instance of LLM"
            Settings.llm = resolved_llm

            Settings.embed_model = OpenAIEmbedding(
                api_key=client.api_key,
                base_url=client.base_url
            )
        else:
            tokenizer = AutoTokenizer.from_pretrained(model_name, token=hf_token)
            model = AutoModelForCausalLM.from_pretrained(
                model_name,
                quantization_config=bnb_config,
                device_map="auto",
                low_cpu_mem_usage=True,
                token=hf_token
            )

            # --------------------------------------------------
            # 2) Set the Global `Settings` for LlamaIndex
            # --------------------------------------------------
            # This ensures LlamaIndex uses *only* HuggingFace objects, not OpenAI.
            Settings.llm = HuggingFaceLLM(
                model_name=model_name,
                model=model,
                tokenizer=tokenizer,
                device_map="auto",
                model_kwargs={"torch_dtype": "bfloat16"}  # or "float16"
            )

            Settings.embed_model = HuggingFaceEmbedding(
                model_name="BAAI/bge-base-en-v1.5"
            )

        # You can set other global settings if needed:
        # Settings.node_parser = ...
        # Settings.num_output = 512
        # Settings.context_window = 3900
        # etc.

        # --------------------------------------------------
        # 3) Build the Index
        # --------------------------------------------------
        # Because we've set `Settings.llm` and `Settings.embed_model` globally,
        # we can call `VectorStoreIndex.from_documents()` directly, and it will
        # use the HuggingFace LLM + embedding under the hood

        documents = SimpleDirectoryReader("data").load_data()
        index = VectorStoreIndex.from_documents(documents)
        query_engine = index.as_query_engine()

    print("[Worker] Model & index ready. Waiting for prompts...")

    # --------------------------------------------------
    # 4) Main Loop - read prompts, return answers
    # --------------------------------------------------
    while True:
        prompt = request_queue.get()
        if prompt == "__exit__":
            print("[Worker] Shutting down.")
            break

        if TESTING:
            response = "This is a test llama response, have fun or disable TESTING mode"
        else:
            if NEBIUS:
                completion = client.chat.completions.create(
                    model="meta-llama/Llama-3.3-70B-Instruct",
                    messages=[
                        {"role": "system",
                         "content": "You are an experienced diplomatic negotiator, specializing in high-stakes international discussions. Your goal is to present compelling, well-reasoned arguments while maintaining professionalism and strategic foresight."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.6,
                    max_tokens=2048,
                    stop=None
                )
                response = completion['choices'][0]['message']['content']
            else:
                response = query_engine.query(prompt)

        response_text = str(response)  # convert to plain string
        response_queue.put(response_text)


def start_model_worker() -> Tuple[multiprocessing.Queue, multiprocessing.Queue, multiprocessing.Process]:
    """
    Spawns the worker process and returns (request_queue, response_queue, worker).
    """
    manager = multiprocessing.Manager()
    request_queue = manager.Queue()
    response_queue = manager.Queue()

    worker = multiprocessing.Process(
        target=model_worker_main,
        args=(request_queue, response_queue),
        daemon=True
    )
    worker.start()
    return request_queue, response_queue, worker
