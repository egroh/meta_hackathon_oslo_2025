### Meta AI Llama Hackathon Oslo 

## LL-Impact

This LLama-powered tool assists legislators and diplomats by generating insights to support negotiation and policy decisions.

Developed by Team LLip—Eddie Groh, Mathieu Antonopoulos, Baptiste Geisenberger,  and Vijay Venkatesh Murugan —this project was entirely created whithin 24h as part of the Meta Llama 2025 Hackathon in Oslo.

Special thanks to Cerebral Valley for hosting the event and to Nebius for sponsoring and providing the computing power to run our model.

## File Structure

```
├── dataset/                      # Directory for storing datasets used in model training and argumentation
│   ├── articles/                 # Collection of articles for NLP processing and analysis
│   ├── verbatims/                # Raw text data, user inputs, or transcripts for argumentation
│
├── my-llama-demo/                # Main project directory
│   ├── backend/                  # Backend logic and API handling for Llama model interactions
│   ├── frontend/                 # UI components and visualization tools for the project
│
├── backend.py                    # Core backend script to handle Llama chat functionality
├── basic_usage_example.ipynb     # Jupyter Notebook demonstrating basic usage of the model
├── llama_index.ipynb             # Notebook showcasing indexing and retrieval functionalities
├── project_UI.py                 # Script for the graphical or command-line user interface
│
├── .gitignore                    # File specifying which files and folders to ignore in Git tracking
├── .DS_Store                     # MacOS system-generated file (safe to delete)
```
