import time
import multiprocessing


def model_worker_main(request_queue, response_queue):
    # Simulate a slow model load:
    print("Loading the LLaMA model (simulated)...")
    time.sleep(5)  # Fake loading time
    print("Model loaded. Ready for prompts.")

    while True:
        prompt = request_queue.get()  # Blocking wait
        if prompt == "__exit__":
            break

        # Simulate “inference”:
        # Real code: model inference with your LLaMA library
        time.sleep(1)  # Fake inference
        response = f"[Fake LLaMA Response] I see you said: {prompt}"

        # Send the response back:
        response_queue.put(response)


def start_model_worker():
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
