![LL-Impact Logo](./images/ll-impact_logo.png)

A LLaMA-powered assistant for legislators and diplomats, designed to generate insights that support negotiation and policy-making.

Built in just 24 hours by Team LLip—Eddie Groh, Mathieu Antonopoulos, Baptiste Geisenberger, and Vijay Venkatesh Murugan—as part of the **Meta AI LLaMA Hackathon 2025 in Oslo**.

---

## 🔍 What It Does

LL-Impact leverages the capabilities of Meta’s LLaMA model to:

- Analyze legislative texts, verbatims, and articles  
- Extract key arguments and narratives  
- Support informed decisions in complex negotiations  

---

## 📁 Project Structure

```
├── dataset/                      # Data used for training and argumentation  
│   ├── articles/                 # Curated articles for NLP analysis  
│   └── verbatims/               # Transcripts and user-generated inputs  
│  
├── my-llama-demo/                # Main project directory  
│   ├── backend/                  # API logic and model communication  
│   └── frontend/                 # UI components and visualization tools  
│  
├── backend.py                    # Core backend handler for LLaMA interactions  
├── basic_usage_example.ipynb     # Sample notebook showcasing basic usage  
├── llama_index.ipynb             # Indexing and retrieval demonstrations  
├── project_UI.py                 # Graphical/CLI interface script  
│  
└── .gitignore                    # Git exclusions  
```

---

_Special thanks to Cerebral Valley for hosting, and to Nebius for providing the compute power that made this possible._
