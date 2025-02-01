import { useEffect, useState } from "react";
import { server_url } from "../config";

const useSpeeches = () => {
  const [speeches, setSpeeches] = useState([]);

  useEffect(() => {
    fetch(`${server_url}/messages`)
      .then(res => res.json())
      .then(data => {
        if (data.speeches) {
          setSpeeches(data.speeches.map(speech => ({
            ...speech,
            radarData: generateRadarData(speech)
          })));
        }
      })
      .catch(err => console.error("Error fetching speeches:", err));
  }, []);

  return speeches;
};

const generateRadarData = (speech) => ({
  axes: [
    { axis: "Cooperation", value: 1 },
    { axis: "Diplomacy", value: 0.5 },
    { axis: "Persuasion", value: 0.25 },
    { axis: "Urgency", value: 0.25 },
    { axis: "Strategy", value: 0.25 }
  ],
  color: "#FF5733",
  name: speech.name
});

export default useSpeeches;
