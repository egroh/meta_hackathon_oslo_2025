import React, { useState } from "react";
import useSpeeches from "./hooks/useSpeeches";
import RadarChart from "./components/RadarChart";
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
              <button style={styles.button} onClick={() => fetchResponse("Provide context for this speech")}>Context</button>
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
            {showChart && <RadarChart key={selectedSpeech.name} data={[selectedSpeech.radarData]} />}
          </>
        ) : (
          <p>Select a speech on the left to see details and ask a question.</p>
        )}
      </div>
    </div>
  );
};

export default App;
