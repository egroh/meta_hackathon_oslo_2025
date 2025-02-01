import React, { useEffect, useState, useRef } from "react";
import * as d3 from "d3";
let server_url = "http://89.169.96.185:8000"

// Chart functions
function create_radar(svg_id, categories, data) {
  const width = 350;
  const height = 350;

  // Configuration du radar chart
  const config = {
    w: width,
    h: height,
    levels: 5,
    maxValue: 1,
    color: d3.scaleOrdinal(d3.schemeCategory10),
  };

  // Sélection du conteneur SVG
  const svg = d3
    .select(svg_id)
    .attr("width", config.w + 150)
    .attr("height", config.h + 150)
    .append("g")
    .attr("transform", `translate(${config.w / 2 + 75}, ${config.h / 2 + 75})`);

  const totalAxes = categories.length;
  const radius = Math.min(config.w / 2, config.h / 2);
  const angleSlice = (2 * Math.PI) / totalAxes;

  // Échelle radiale
  const radius_scale = d3.scaleLinear().range([0, radius]).domain([0, config.maxValue]);

  // Grille circulaire avec animation
  svg
    .selectAll(".levels")
    .data(d3.range(1, config.levels + 1).reverse())
    .enter()
    .append("circle")
    .attr("class", "gridCircle")
    .attr("r", (d) => (radius / config.levels) * d)
    .style("fill", "#999")
    .style("stroke", "#999")
    .style("fill-opacity", 0.03)
    .style("transform", "scale(0)")
    // .transition()
    // .duration(500)
    // .delay((d, i) => i * 100)
    .style("transform", "scale(1.1)")
    // .transition()
    // .duration(200)
    .style("transform", "");

  // Axes avec animation
  const axis = svg
    .selectAll(".axis")
    .data(categories)
    .enter()
    .append("g")
    .attr("class", "axis");

  axis
    .append("line")
    .attr("x1", 0)
    .attr("y1", 0)
    .attr("x2", (d, i) => radius_scale(config.maxValue * 1.1) * Math.cos(angleSlice * i - Math.PI / 2))
    .attr("y2", (d, i) => radius_scale(config.maxValue * 1.1) * Math.sin(angleSlice * i - Math.PI / 2))
    .style("stroke", "#555")
    .style("stroke-width", "1.5px")
    .style("transform", (d, i) => `rotate(${(i * 180) / totalAxes}deg)`)
    .style("transform-origin", "0 0")
    .style("opacity", "0")
    // .transition()
    // .duration(500)
    // .delay((d, i) => i * 15 + 700)
    .style("opacity", "1")
    .style("transform", "rotate(0deg)");

  axis
    .append("text")
    .attr("class", "legend")
    .attr("x", (d, i) => radius_scale(config.maxValue * 1.25) * Math.cos(angleSlice * i - Math.PI / 2))
    .attr("y", (d, i) => radius_scale(config.maxValue * 1.25) * Math.sin(angleSlice * i - Math.PI / 2))
    .attr("text-anchor", "middle")
    .text((d) => d.replaceAll("_", " "))
    .style("font-size", "11px")
    .style("opacity", "0")
    // .transition()
    // .delay((d, i) => i * 60 + 500)
    .style("opacity", "1");
}

function RadarChart({ data }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!data || data.length === 0) return;
    // Clear the previous chart (if any)
    d3.select(svgRef.current).selectAll("*").remove();
    // Call the function to create the radar chart
    create_radar(svgRef.current, data[0].axes.map(a => a.axis), data[0].axes); // Passing axes data for plotting

    const width = 500;
    const height = 500;
    const margin = 50;
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

    // Clear previous chart before drawing the new one
    svg.selectAll("*").remove();

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
  const [showChart, setShowChart] = useState(false);

  useEffect(() => {
    fetch(server_url + "/messages")
      .then((res) => res.json())
      .then((data) => {
        if (data.speeches) {
          // Adding dummy radar data to each speech object
          const updatedSpeeches = data.speeches.map((speech) => {
            speech.radarData = generateRadarData(speech);
            return speech;
          });
          setSpeeches(updatedSpeeches);
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
      const res = await fetch(server_url+"/ask", {
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

  const translate = async () => {
    if (!selectedSpeech) return;
      setResponse("Loading...");
    try {
      const res = await fetch(server_url+"/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          speech: selectedSpeech,
          question: "translate the speech to English while keeping the same tone",
        }),
      });
      const data = await res.json();
      setResponse(data.response);
    } catch (err) {
      console.error(err);
      setResponse("Error: " + err.message);
    }
  };

  const context = async () => {
    if (!selectedSpeech) return;
      setResponse("Loading...");
    try {
      const res = await fetch(server_url+"/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          speech: selectedSpeech,
          question: "",
        }),
      });
      const data = await res.json();
      setResponse(data.response);
    } catch (err) {
      console.error(err);
      setResponse("Error: " + err.message);
    }
  };

  // Generate dummy radar data for each speech
  const generateRadarData = (speech) => {
    const axes = [
      { axis: "Cooperation", value: 1  },
      { axis: "Diplomacy", value: 0.5  },
      { axis: "Persuasion", value: 0.25  },
      { axis: "Urgency", value: 0.25  },
      { axis: "Strategy", value: 0.25  },
    ];

    return { axes, color: "#FF5733", name: speech.name };
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
              <button style={styles.button} onClick={translate}>
                Translate
              </button>
              <button style={styles.button} onClick={context}>
                Context
              </button>
            </div>
            <div style={styles.responseBox}>
              <strong>Response:</strong>
              <p>{response}</p>
            </div>
            <div> 
            <button 
              style={styles.button} 
              onClick={() => setShowChart(!showChart)}
            >
              {showChart ? 'Hide Chart' : 'Show Chart'}
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
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "4px",
    margin: "10px 0",
  },
  responseBox: {
    backgroundColor: "#eef",
    padding: "10px",
    borderRadius: "4px",
  },
};

export default App;
