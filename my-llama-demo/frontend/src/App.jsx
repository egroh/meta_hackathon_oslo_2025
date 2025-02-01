import React, { useEffect, useState } from "react";

function App() {
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState("");

  // 1) Fetch the messages from the backend on mount
  useEffect(() => {
    fetch("http://89.169.96.185:8000/messages")
      .then((res) => res.json())
      .then((data) => {
        setMessages(data.messages || []);
      })
      .catch((err) => console.error("Error fetching messages:", err));
  }, []);

  // 2) When user clicks on a message, store it as selected
  const handleSelectMessage = (msg) => {
    setSelectedMessage(msg);
    setResponse(""); // Clear previous response
  };

  // 3) When user clicks the "Ask" button, POST {message, question} to the backend
  const handleAsk = async () => {
    if (!selectedMessage) return;
    setResponse("Loading...");

    try {
      const res = await fetch("http://89.169.96.185:8000/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: selectedMessage,
          question: question,
        }),
      });
      const data = await res.json();
      setResponse(data.response);
    } catch (err) {
      console.error(err);
      setResponse("Error: " + err.message);
    }
  };

  return (
    <div style={styles.container}>
      {/* Left column: list of messages */}
      <div style={styles.leftColumn}>
        <h2>Messages</h2>
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={styles.messageItem}
            onClick={() => handleSelectMessage(msg)}
          >
            {msg.slice(0, 60)}...
          </div>
        ))}
      </div>

      {/* Right column: show selected message, question input, and response */}
      <div style={styles.rightColumn}>
        <h2>Details / Analysis</h2>
        {selectedMessage ? (
          <>
            <div style={styles.selectedMessageBox}>
              <strong>Selected Message:</strong>
              <p>{selectedMessage}</p>
            </div>
            <div style={styles.questionArea}>
              <input
                style={styles.input}
                placeholder="Ask something about this message..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
              />
              <button style={styles.button} onClick={handleAsk}>
                Ask
              </button>
            </div>
            <div style={styles.responseBox}>
              <strong>Response:</strong>
              <p>{response}</p>
            </div>
          </>
        ) : (
          <p>Select a message from the left to ask a question.</p>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    height: "100vh",
    fontFamily: "sans-serif",
  },
  leftColumn: {
    width: "300px",
    borderRight: "1px solid #ccc",
    padding: "10px",
    overflowY: "auto",
  },
  messageItem: {
    padding: "8px",
    margin: "8px 0",
    backgroundColor: "#f0f0f0",
    borderRadius: "4px",
    cursor: "pointer",
  },
  rightColumn: {
    flex: 1,
    padding: "10px",
    overflowY: "auto",
  },
  selectedMessageBox: {
    backgroundColor: "#f9f9f9",
    border: "1px solid #ccc",
    padding: "10px",
    borderRadius: "4px",
    marginBottom: "10px",
  },
  questionArea: {
    display: "flex",
    gap: "10px",
    marginBottom: "10px",
  },
  input: {
    flex: 1,
    padding: "8px",
  },
  button: {
    padding: "8px 16px",
    cursor: "pointer",
  },
  responseBox: {
    backgroundColor: "#eef",
    padding: "10px",
    borderRadius: "4px",
  },
};

export default App;
