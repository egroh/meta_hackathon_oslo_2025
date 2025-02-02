import React, { useState, useEffect } from "react";
import useSpeeches from "./hooks/useSpeeches.jsx";
import RadarChart from "./components/RadarChart.jsx";
import { server_url } from "./config";
import BiasDonutChart from './components/BiasDonutChart.jsx';


const App = () => {
  const speeches = useSpeeches();
  const [selectedSpeech, setSelectedSpeech] = useState(null);
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState("");
  const [showChart, setShowChart] = useState(false);
  const [radarData, setRadarData] = useState(null);
  const [biasChart, set_biasChart] = useState(null);

  const handleSelectSpeech = (speechObj) => {
    setSelectedSpeech(speechObj);
    setResponse("");
    // fetchRadarData(speechObj);
    fetchBiasData(speechObj);
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

  const fetchRadarData = async (speech) => {
    try {
      const res = await fetch(`${server_url}/radar_chart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ speech: speech, question: "" }),
      });
      let data = await res.text();
    
      console.log("Raw data type:", typeof data);
      console.log("Raw data:", data);

      // Convert to string if not already
      data = data.toString();
      
      // Clean the string in one go
      data = data.replace("[", '');
      data = data.replace("]", '');
      data = data.replace("\n", '');
      const cleanString = data.replace(" ", '');
      
      console.log("Cleaned string:", cleanString);
      
      // Split and convert to number
      const datalist = cleanString.split(',').map(num => parseFloat(num) || 0);
      console.log("Parsed numbers:", datalist);
      const formattedData = {
        axes: [
          { axis: "Cooperation", value: datalist[0] / 100 },
          { axis: "Diplomacy", value: datalist[1] / 100 },
          { axis: "Persuasion", value: datalist[2] / 100 },
          { axis: "Urgency", value: datalist[3] / 100 },
          { axis: "Strategy", value: datalist[4] / 100 },
        ],
        color: "#FF5733",
        name: speech.name
      };
      
      setRadarData(formattedData);
    } catch (err) {
      console.error("Error fetching radar data:", err);
    }
  };

  const fetchBiasData = async (speech) => {
    try {
      const res = await fetch(`${server_url}/bias_chart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ speech: speech, question: "" }),
      });
      let data = await res.text();
    
      console.log("Raw data type:", typeof data);
      console.log("Raw data:", data);

      // Convert to string if not already
      data = data.toString();
      
      // Clean the string in one go
      data = data.replace("[", '');
      data = data.replace("]", '');
      data = data.replace("\n", '');
      const cleanString = data.replace(" ", '');
      
      console.log("Cleaned string:", cleanString);
      
      // Split and convert to number
      const datalist = cleanString.split(',');
      number = datalist[2].map(num => parseFloat(num) || 0)
      firstSide = datalist[0].toString()
      secondSide = datalist[1].toString()

      console.log("Side 1:", firstSide);
      console.log("Side 2:", secondSide);
      console.log("Parsed numbers:", number);

      const formattedData = {
        axes: [
          { axis: firstSide, value: number[0] / 100 },
          { axis: secondSide, value: number[1] / 100 },
        ],
        color: "#FF5733",
        name: speech.name
      };
      
      set_biasChart(formattedData);
    } catch (err) {
      console.error("Error fetching radar data:", err);
    }
  };
  
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      fetchResponse(question);
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
                onKeyDown={handleKeyPress}
              />
              <button style={styles.button} onClick={() => fetchResponse(question)}>Ask</button>
              <button style={styles.button} onClick={() => fetchResponse("Translate the speech to English")}>Translate</button>
              <button style={styles.button} onClick={() => fetchResponse("List the key points in the text and present the main ides using bullet points. skip  lines between facts")}>Key points</button>
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
            {showChart && radarData && <RadarChart  key={selectedSpeech.name} data={[radarData]} />}
            {showChart && biasChart && <BiasDonutChart key={selectedSpeech.name} data={biasChart} />}
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
