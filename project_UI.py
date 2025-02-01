import streamlit as st
import matplotlib.pyplot as plt
import numpy as np

# Functions to generated stuff
def generate_graph():
    x = np.linspace(0, 10, 100)
    y = np.sin(x)
    fig, ax = plt.subplots()
    ax.plot(x, y)
    ax.set_title('Sine Wave')
    return fig

# Function to handle input text
def handle_input(user_input):
    if user_input:
        # Add LLama interactions here
        None


# Initialize variables 
if 'chat_history' not in st.session_state:
    st.session_state.chat_history = []


# Layout of the page
st.set_page_config(layout="wide")
st.title("Insert Title Here")
col1, col2 = st.columns([2, 3])


# Chat window
with col1:
    st.header("Chat column")
    for message in st.session_state.chat_history:
        st.write(message)


# Analysis and Graph window
with col2:
    st.header("Graphs and Analysis")
    st.pyplot(generate_graph())

# Input bar at the bottom
user_input = st.text_input("Type your message here...", key="input")
if user_input:
    handle_input(user_input)
