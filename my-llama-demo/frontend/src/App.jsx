import React, { useState, useEffect } from "react";
import useSpeeches from "./hooks/useSpeeches.jsx";
import RadarChart from "./components/RadarChart.jsx";
import { server_url } from "./config";
import BiasDonutChart from './components/BiasDonutChart.jsx';
import DebateAnalysis from './DebateAnalysis.jsx';

// 1) A simple Spinner component with embedded styles for the animation
const Spinner = () => {
  return (
    <>
      {/* We embed keyframes via a <style> tag so it won't break anything */}
      <style jsx="true">{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .spinner {
          margin: 20px auto;
          border: 6px solid #f3f3f3;
          border-top: 6px solid #3498db;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
        }
      `}</style>
      <div className="spinner"></div>
    </>
  );
};

const App = () => {
  const speeches = useSpeeches();
  const [selectedSpeech, setSelectedSpeech] = useState(null);
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState("");
  const [showChart, setShowChart] = useState(false);
  const [loading, setLoading] = useState(false);       // already existed
  const [radarData, setRadarData] = useState(null);
  const [biasChart, set_biasChart] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);
  const [showDebate, setShowDebate] = useState(false);


  const handleSelectSpeech = (speechObj, idx) => {  // Add idx parameter
    setSelectedId(idx);  // Use idx instead of speechObj.id
    setSelectedSpeech(speechObj);
    setResponse("");
    fetchRadarData(speechObj);
    // fetchBiasData(speechObj);
  };

  const fetchResponse = async (questionText, instructions = {prompt_id: "assistant_question"}) => {
    if (!selectedSpeech) return;
    setLoading(true);
    try {
      const res = await fetch(`${server_url}/llama_request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          speech: selectedSpeech,
          instructions: {
            prompt: instructions.prompt || undefined,
            prompt_id: instructions.prompt_id || undefined,
            no_cache: true,
          },
          prompt_data: {user_question: questionText}
        }),
      });
      const data = await res.json();
      setResponse(data.response || data.error);
    } catch (err) {
      console.error(err);
      setResponse("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchRadarData = async (speech) => {
    try {
      const res = await fetch(`${server_url}/llama_request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          speech: speech,
          instructions: {
            prompt_id: "radar_chart",
            json_keys: ["Cooperation", "Diplomacy", "Persuasion", "Urgency", "Strategy"]
          },
          prompt_data: {}
        }),
      });
      const data = await res.json();
      const formattedData = {
        axes: [
          { axis: "Cooperation", value: data["Cooperation"] / 100 },
          { axis: "Diplomacy", value: data["Diplomacy"] / 100 },
          { axis: "Persuasion", value: data["Persuasion"] / 100 },
          { axis: "Urgency", value: data["Urgency"] / 100 },
          { axis: "Strategy", value: data["Strategy"] / 100 },
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
      const res = await fetch(`${server_url}/llama_request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          speech: speech,
          instructions: {
            prompt_id: "bias_chart",
          },
          prompt_data: {}
        }),
      });
      let data = await res.text();
    
      console.log("Raw data type:", typeof data);
      console.log("Raw data:", data);

      // Convert to string if not already
      // data = data.toString();
      
      // Clean the string in one go
      data =data.replace("{", "");
      data =data.replace("}", "");
      const cleanData = data.replace(/[\n\[\]\s]+|\n\d+/g, '');
      const cleanString = cleanData.replace(" ", '');
      
      console.log("Cleaned string:", cleanString);
      
      // Split and convert to number
      const datalist = cleanString.split(',');
      let number = datalist[2];
      number = parseFloat(number);
      let firstSide = datalist[0] ? datalist[0] : "Neutral";
      let secondSide = datalist[1] ? datalist[1] : "Neutral";

      console.log("Side 1:", firstSide);
      console.log("Side 2:", secondSide);
      console.log("Parsed numbers:", number);

      const formattedData = {
        side1: "firstSide",
        side2: "secondSide",
        value: 30,
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
        <button style={styles.button2} onClick={() => setShowDebate(!showDebate)}>
          {showDebate ? "Back to Speech" : "Debate Analysis"}
        </button>
        {speeches.map((sp, idx) => (
          <div 
            key={idx} 
            style={{
              ...styles.speechItem,
              ...(hoveredId === idx ? styles.speechItemHovered : {}),
              ...(selectedId === idx ? styles.selectedSpeech : {})  // Changed to compare with idx
            }} 
            onClick={() => handleSelectSpeech(sp, idx)}  // Pass idx to handler
            onMouseEnter={() => setHoveredId(idx)}
            onMouseLeave={() => setHoveredId(null)}
          >
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
            {showDebate ? (
              <DebateAnalysis />
            ) : (
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
                  <button style={styles.button} onClick={() => fetchResponse(question, )}>Ask</button>
                  <button style={styles.button} onClick={() => fetchResponse("Translate the speech to English")}>Translate</button>
                  <button style={styles.button} onClick={() => fetchResponse("List the key points in the text and present the main ideas using bullet points. skip  lines between facts")}>Key points</button>
                </div>

                {/* 3) If loading is true, show the spinner; else show response */}
                <div style={styles.responseBox}>
                  <strong>Response:</strong>
                  {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
                      <Spinner />
                    </div>
                  ) : (
                    <p>{response}</p>
                  )}
                </div>

                <div>
                  <button style={styles.button} onClick={() => setShowChart(!showChart)}>
                    {showChart ? "Hide Chart" : "Show Chart"}
                  </button>

                </div>

                {showChart && radarData && <RadarChart key={selectedSpeech.name} data={[radarData]} />}
                {showChart && biasChart && <BiasDonutChart key={"Start"} data={biasChart} />}
              </>
            )}
          </>
        ) : (
          <p>Select a speech on the left to see details and ask a question.</p>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: { 
    display: "flex", 
    height: "100vh", 
    fontFamily: "'Segoe UI', Roboto, 'Helvetica Neue', sans-serif",
    backgroundColor: "#f5f7fa"
  },
  leftColumn: { 
    width: "350px", 
    borderRight: "1px solid #e1e4e8", 
    padding: "20px",
    overflowY: "auto",
    backgroundColor: "white",
    boxShadow: "2px 0 5px rgba(0,0,0,0.1)"
  },
  speechItem: { 
    padding: "15px",
    margin: "10px 0",
    backgroundColor: "white",
    borderRadius: "8px",
    cursor: "pointer",
    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
    transition: "all 0.3s ease",
    border: "1px solid #e1e4e8",
    position: "relative",
    overflow: "hidden",
  },
  speechItemHovered: {
    transform: "translateY(-4px)",
    boxShadow: "0 12px 24px rgba(0,0,0,0.1)",
    backgroundColor: "#f8f9fa",
  },
  selectedSpeech: {
    backgroundColor: "#f0f7ff",
    borderColor: "#0366d6",
    boxShadow: "0 0 0 1px rgba(38, 123, 221, 0.4)",
  },
  rightColumn: { 
    flex: 1,
    padding: "40px",
    backgroundColor: "#f8f9fa",
    overflowY: "auto"
  },
  selectedSpeechBox: { 
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "25px",
    marginBottom: "15px",
    boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
    border: "1px solid #e1e4e8"
  },
  questionArea: { display: "flex", gap: "10px", marginBottom: "10px" },
  input: { 
    padding: "15px",
    borderRadius: "8px",
    border: "2px solid #e1e4e8",
    fontSize: "16px",
    transition: "all 0.2s ease",
    width: "100%",
    "&:focus": {
      borderColor: "#0366d6",
      boxShadow: "0 0 0 3px rgba(3,102,214,0.1)"
    }
  },
  button: {
    padding: "8px 16px",
    cursor: "pointer",
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "4px",
    margin: "10px 0"
  },
  responseBox: { 
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "15px",
    boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
    border: "1px solid #e1e4e8"
  },
  button2: {
    padding: "16px 130px",
    cursor: "pointer",
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "4px",
    margin: "5px 0",
    fontSize: "20px",
    fontWeight: "bold"
  },
  sectionTitle: {
    fontSize: "24px",
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: "20px"
  },
  buttonGroup: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap"
  }
};

export default App;
