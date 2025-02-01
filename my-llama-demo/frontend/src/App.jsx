import React, { useEffect, useState, useRef } from "react";
import * as d3 from "d3";

function RadarChart({ data }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!data || data.length === 0) return;

    const width = 300;
    const height = 300;
    const margin = 20;
    const radius = Math.min(width, height) / 2 - margin;

    const totalAxes = data[0].axes.length;
    const angleSlice = (2 * Math.PI) / totalAxes;

    const radarLine = d3
      .lineRadial()
      .radius((d) => d.value * radius)
      .angle((d, i) => i * angleSlice)
      .curve(d3.curveLinearClosed);

    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2})`);

    const blobWrapper = svg
      .selectAll(".radarWrapper")
      .data(data)
      .enter()
      .append("g")
      .attr("class", "radarWrapper");

    blobWrapper
      .append("path")
      .attr("class", "radarArea")
      .attr("d", (d) => radarLine(d.axes))
      .attr("player-id", (d) => d.player_id)
      .style("fill", (d) => d.color)
      .style("fill-opacity", 0.2)
      .style("stroke", (d) => d.color)
      .style("stroke-width", "2px")
      .on("mouseover", function (event, d) {
        const area = d3.select(this);
        area.style("fill-opacity", 0.8);
        area.style("stroke", d3.rgb(d.color).darker());
        area.style("stroke-width", "2px");

        const parent = d3.select(this.parentNode);
        parent.raise();
      })
      .on("mouseout", function () {
        d3.select(this).style("fill-opacity", 0.2);
      })
      .append("title")
      .text((d) => d.name);
  }, [data]);

  return <svg ref={svgRef}></svg>;
}

function App() {
  const [speeches, setSpeeches] = useState([]);
  const [selectedSpeech, setSelectedSpeech] = useState(null);
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState("");

  useEffect(() => {
    fetch("http://89.169.96.185:8000/messages")
      .then((res) => res.json())
      .then((data) => {
        if (data.speeches) {
          setSpeeches(data.speeches);
        }
      })
      .catch((err) => console.error("Error fetching speeches:", err));
  }, []);

  const handleSelectSpeech = (speechObj) => {
    setSelectedSpeech(speechObj);
    setResponse("");
  };

  const handleAsk = async () => {
    if (!selectedSpeech) return;
    setResponse("Loading...");

    try {
      const res = await fetch("http://89.169.96.185:8000/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          speech: selectedSpeech,
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
      <div style={styles.leftColumn}>
        <h2>Speeches</h2>
        {speeches.map((sp, idx) => (
          <div
            key={idx}
            style={styles.speechItem}
            onClick={() => handleSelectSpeech(sp)}
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
            <div style={styles.selectedSpeechBox}>
              <strong>{selectedSpeech.name} ({selectedSpeech.language}) - {selectedSpeech.role}</strong>
              <p>{selectedSpeech.speech}</p>
            </div>
            <RadarChart data={selectedSpeech.radarData} />
            <div style={styles.questionArea}>
              <input
                style={styles.input}
                placeholder="Ask something about this speech..."
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
          <p>Select a speech on the left to see details and ask a question.</p>
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
  speechItem: {
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
  selectedSpeechBox: {
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
