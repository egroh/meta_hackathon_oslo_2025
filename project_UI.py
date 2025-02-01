import streamlit as st
import zerorpc
import matplotlib.pyplot as plt
import numpy as np
from streamlit.components.v1 import html
import json

# Initialize the ZeroRPC client once (cache it to avoid reconnecting every request)
@st.cache_resource
def get_client():
    client = zerorpc.Client(timeout=300, heartbeat=60)  # or bigger
    client.connect("tcp://89.169.96.185:4242")
    return client


def query_llama_sync(user_input):
    """Synchronous function to handle the query to the backend."""
    if not user_input:
        return ""
    client = get_client()
    return client.query_llama(user_input)

# Set up page configuration
st.set_page_config(layout="wide")


def about_page():
    st.title("About")
    st.write("""
    ### Project Description
    """)

def contact_page():
    st.title("Contact")
    st.write("""
    ### Insert our information here
    """)

page = st.sidebar.radio("Navigate", ["Home", "About", "Contact"])

# Functions to generated stuff
def generate_graph():
    x = np.linspace(0, 10, 100)
    y = np.sin(x)
    fig, ax = plt.subplots()
    ax.plot(x, y)
    ax.set_title('Sine Wave')
    return fig

# Connect to the backend via ZeroRPC
client = zerorpc.Client()
client.connect("tcp://127.0.0.1:4242")

# Initialize variables
if 'chat_history' not in st.session_state:
    st.session_state.chat_history = []

# Message box HTML components
chat_messages = "".join(st.session_state.chat_history)
chat_html = f"""
<div style="
    height: 620px; 
    overflow-y: auto; 
    padding: 10px; 
    border: 1px solid #ccc; 
    background-color: #f9f9f9;
    word-wrap: break-word; 
    white-space: normal;
">
    {chat_messages}
</div>
"""
chat_data = {
    "speeches": [
        {
        "name": "Presidente",
        "role": "President",
        "speech": "L'ordine del giorno reca la discussione sulle dichiarazioni del Consiglio e della Commissione sul recesso del Regno Unito dall'UE (2019/2817(RSP)).",
        "language": "Italian"
        },
        {
        "name": "Tytti Tuppurainen",
        "role": "President-in-Office of the Council",
        "speech": "Mr President, we have once more gathered to discuss the UK’s withdrawal from the European Union. It is an unfortunate situation and many citizens and businesses continue to suffer from the uncertainty caused by Brexit.\n\nIn July, the UK got a new government and a new prime minister. Unfortunately, it is increasingly clear that this has not helped to clarify the situation or the UK’s negotiation position. When it comes to the most difficult questions such as the Irish border, the UK has not tabled any new concrete proposals yet. Furthermore, opinions in the parliament in London remain divided. Only the firm rejection of a no-deal Brexit has been able to attract the majority. Still, the UK Government is insisting on its red lines. As the deadline of 31 October is fast approaching, we are faced with more, rather than less, uncertainty.\n\nThis rather bleak situation should, however, not distract us from our priority, which remains an orderly withdrawal to put an end to the uncertainty caused by Brexit. I hope that we can still achieve an orderly Brexit. This is why we have asked the UK to put forward concrete details and operational ideas regarding what appears to be the main stumbling block, namely how to ensure the absence of a hard border on the island of Ireland, while respecting the Good Friday Agreement and protecting the integrity of the single market.\n\nThe latest developments in Westminster and the call for a further extension make it very difficult to predict how things will unfold. We have to acknowledge that currently, a no-deal on 31 October is a quite likely outcome, not least because the UK Government...\n\n(Cheers from certain quarters)\n\nkeeps on repeating they are ready to leave without a deal. Therefore, preparedness efforts have to be stepped up and measures finalised quickly at EU and national level in close cooperation among Member States and with the Commission, building on the last package of measures tabled by the Commission and on those already adopted. These new legislative activities at this early stage of the new institutional cycle will add to an already heavy agenda.\n\nWe are confident that by working together we can deliver. I’m encouraged in this respect by the speed at which our two institutions were able to reach agreement on the previous Brexit-related proposals. The Presidency, with your cooperation, is determined to facilitate the adoption of the last batch of contingency measures in good time.\n\nWhile the point of departure for the future relationship will largely depend on whether the UK decides to leave with or without a deal, we will in any scenario need to address our fundamental priorities with the UK: safeguarding citizens’ rights, honouring the UK’s financial obligations resulting from its membership of the EU, and providing an insurance to preserve the integrity of the single market, the level playing field and the stability on the island of Ireland.\n\nIn the meantime, this uncertainty and the tensions it generates are further testing our unity and resolve. It is therefore all the more necessary, on the one hand, to resist the temptation of bilateral deals at sectoral or national level and, on the other hand, to reflect our common purpose in the swift adoption of the necessary contingency measures.\n\nLet me conclude by noting the large degree of convergence that exists between your draft resolution and the priorities of the Council. This is a clear illustration of the commonality of purpose of our two institutions as regards Brexit. So thank you very much for your attention and I look forward to this discussion.",
        "language": "English"
        },
    ]
}

chat_data_json = json.dumps(chat_data)

# HTML template for chat demonstration
html_code = f"""
<!DOCTYPE html>
<html lang='en'>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src='https://d3js.org/d3.v6.min.js'></script>
    <style>
        .chat-container {{
            height: 680px;
            overflow-y: auto;
            border: 1px solid #ccc;
            border-radius: 5px;
            padding: 20px;
            box-sizing: border-box;
            background-color: white;
        }}
        .chat-text {{
            white-space: pre-wrap;
            word-wrap: break-word;
            color: black;
        }}
        .chat-bubble {{
            padding: 15px;
            margin: 10px 0;
            border-radius: 10px;
            background: #f0f0f0;
            width: fit-content;
            max-width: 100%;
        }}
        .chat-header {{
            font-weight: bold;
            margin-bottom: 5px;
            color: #333;
        }}
    </style>
</head>
<body>
    <div class="chat-container" id="chat-container">
        <div id="chat-content"></div>
    </div>
    <script>
        const chatData = {chat_data_json};
        const container = document.getElementById('chat-content');

        function createChatBubbles() {{
            chatData.speeches.forEach(message => {{
                const bubble = document.createElement('div');
                bubble.className = 'chat-bubble';

                const header = document.createElement('div');
                header.className = 'chat-header';
                header.textContent = `${{message.name}} (${{message.language}})`;

                const text = document.createElement('div');
                text.className = 'chat-text';
                text.textContent = message.speech;

                bubble.appendChild(header);
                bubble.appendChild(text);
                container.appendChild(bubble);
            }});
        }}

        document.addEventListener('DOMContentLoaded', () => {{
            createChatBubbles();
            const container = document.querySelector('.chat-container');
            container.scrollTop = container.scrollHeight;
        }});
    </script>
</body>
</html>
"""

# If you want to store chat history across the app
if 'chat_history' not in st.session_state:
    st.session_state.chat_history = []
if 'loading' not in st.session_state:
    st.session_state.loading = False

def generate_graph():
    """Generate and return a simple sine-wave plot figure."""
    x = np.linspace(0, 10, 100)
    y = np.sin(x)
    fig, ax = plt.subplots()
    ax.plot(x, y, label='Sine Wave')
    ax.set_xlabel('X')
    ax.set_ylabel('sin(X)')
    ax.set_title('Sine Wave')
    ax.legend()
    return fig

def home_page():
    st.title("Dashboard")
    col1, col2 = st.columns([2, 3])

    with col1:
        st.header("Chat Window")
        html(html_code, height=700, scrolling=True)

        # Input and Submit
        user_input = st.text_input("Type your message here...")
        if user_input:
            st.session_state.loading = True
            with st.spinner("Processing your message..."):
                response = query_llama_sync(user_input)
                st.session_state.chat_history.append(f"**User:** {user_input}\n**AI:** {response}\n")
            st.session_state.loading = False

        # Display chat history (optional) below the input
        if st.session_state.chat_history:
            st.subheader("Chat History")
            for chat in st.session_state.chat_history:
                st.markdown(chat)

    with col2:
        st.header("Graphs and Analysis")
        st.pyplot(generate_graph())

def about_page():
    st.title("About")
    st.markdown("""
    ### Project Description
    Provide an overview of your project's goals, features, and technologies.
    """)

def contact_page():
    st.title("Contact")
    st.markdown("""
    ### Team & Contact
    - Email: team@example.com
    - GitHub: [Repo Link](https://github.com/...)
    """)

def main():
    page = st.sidebar.radio("Navigate", ["Home", "About", "Contact"])
    if page == "Home":
        home_page()
    elif page == "About":
        about_page()
    elif page == "Contact":
        contact_page()

if __name__ == "__main__":
    main()
