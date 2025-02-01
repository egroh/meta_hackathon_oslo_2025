import zerorpc
import numpy as np
import matplotlib.pyplot as plt
import io
import base64
from llama_index.core import VectorStoreIndex, SimpleDirectoryReader, Settings
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.llms.huggingface import HuggingFaceLLM
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig

# Setup embedding model
Settings.embed_model = HuggingFaceEmbedding(model_name="BAAI/bge-base-en-v1.5")

# Model and Tokenizer (Using 4-bit Quantization)
model_name = "meta-llama/Llama-3.3-70B-Instruct"
hf_token = "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"

bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_compute_dtype="bfloat16",
    bnb_4bit_use_double_quant=True
)

tokenizer = AutoTokenizer.from_pretrained(model_name, token=hf_token)
model = AutoModelForCausalLM.from_pretrained(
    model_name,
    quantization_config=bnb_config,
    device_map="auto",
    low_cpu_mem_usage=True,
    token=hf_token
)

# Set up LLM in LlamaIndex
Settings.llm = HuggingFaceLLM(
    model_name=model_name,
    model=model,
    tokenizer=tokenizer,
    device_map="auto",
    model_kwargs={"torch_dtype": "bfloat16"}
)

# Load documents from the "data" directory
documents = SimpleDirectoryReader("data").load_data()

# Create the index
index = VectorStoreIndex.from_documents(documents)

# Persist the index for future use
index.storage_context.persist(persist_dir="./storage")

# Create a query engine
query_engine = index.as_query_engine()

print("Llama model initialized and ready for queries.")

class Backend:
    def query_llama(self, user_input):
        """Handles Llama model queries."""
        if user_input:
            response = query_engine.query(user_input)
            return str(response)

    def generate_graph(self):
        """Generates a sine wave graph and returns it as a base64-encoded image."""
        x = np.linspace(0, 10, 100)
        y = np.sin(x)
        fig, ax = plt.subplots()
        ax.plot(x, y)
        ax.set_title('Sine Wave')

        # Convert plot to image
        buf = io.BytesIO()
        fig.savefig(buf, format='png')
        buf.seek(0)
        encoded_img = base64.b64encode(buf.getvalue()).decode("utf-8")
        return encoded_img

# Start ZeroRPC server
server = zerorpc.Server(Backend())
server.bind("tcp://0.0.0.0:4242")
print("Backend server is running...")
server.run()
