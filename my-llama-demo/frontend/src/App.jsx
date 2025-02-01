import React, { useState } from "react";
import useSpeeches from "./hooks/useSpeeches.jsx";
import RadarChart from "./components/RadarChart.jsx";
import { server_url } from "./config";

const App = () => {
  const speeches = useSpeeches();
  const [selectedSpeech, setSelectedSpeech] = useState(null);
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState("");
  const [showChart, setShowChart] = useState(false);

  const handleSelectSpeech = (speechObj) => {
    setSelectedSpeech(speechObj);
    setResponse("");
  };

  const fetchResponse = async (questionText) => {
    if (!selectedSpeech) return;
    setResponse("Loading...");
    try {
      const res = await fetch(`${server_url}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ speech: selectedSpeech, question: questionText }),
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
      <div style={styles.leftColumn}>
        <h2>Speeches</h2>
        {speeches.map((sp, idx) => (
          <div key={idx} style={styles.speechItem} onClick={() => handleSelectSpeech(sp)}>
            <strong>{sp.name} ({sp.language})</strong> - {sp.role}
            <br />
            <em>{sp.speech.slice(0, 60)}...</em>
          </div>
        ))}
      </div>

      <div style={styles.rightColumn}>
        <h2>Speech Details / Analysis</h2>
        {selectedSpeech ? (
          <>
            <div style={styles.selectedSpeechBox}>
              <strong>{selectedSpeech.name} ({selectedSpeech.language}) - {selectedSpeech.role}</strong>
              <p>{selectedSpeech.speech}</p>
            </div>
            <div style={styles.questionArea}>
              <input
                style={styles.input}
                placeholder="Ask something about this speech..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
              />
              <button style={styles.button} onClick={() => fetchResponse(question)}>Ask</button>
              <button style={styles.button} onClick={() => fetchResponse("Translate the speech to English")}>Translate</button>
            </div>
            <div style={styles.responseBox}>
              <strong>Response:</strong>
              <p>{response}</p>
            </div>
            <div>
              <button style={styles.button} onClick={() => setShowChart(!showChart)}>
                {showChart ? "Hide Chart" : "Show Chart"}
              </button>
            </div>
            {showChart && <RadarChart  key={selectedSpeech.name} data={[selectedSpeech.radarData]} />}
          </>
        ) : (
          <p>Select a speech on the left to see details and ask a question.</p>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: { display: "flex", height: "100vh", fontFamily: "sans-serif" },
  leftColumn: { width: "300px", borderRight: "1px solid #ccc", padding: "10px", overflowY: "auto" },
  speechItem: { padding: "8px", margin: "8px 0", backgroundColor: "#f0f0f0", borderRadius: "4px", cursor: "pointer" },
  rightColumn: { flex: 1, padding: "10px", overflowY: "auto" },
  selectedSpeechBox: { backgroundColor: "#f9f9f9", border: "1px solid #ccc", padding: "10px", borderRadius: "4px", marginBottom: "10px" },
  questionArea: { display: "flex", gap: "10px", marginBottom: "10px" },
  input: { flex: 1, padding: "8px" },
  button: { padding: "8px 16px", cursor: "pointer", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: "4px", margin: "10px 0" },
  responseBox: { backgroundColor: "#eef", padding: "10px", borderRadius: "4px" },
};

export default App;
