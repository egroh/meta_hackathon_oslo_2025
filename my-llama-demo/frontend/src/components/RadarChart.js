import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

const createRadarChart = (svgRef, data) => {
  if (!data || data.length === 0) return;

  d3.select(svgRef.current).selectAll("*").remove();

  const width = 350, height = 350;
  const radius = Math.min(width, height) / 2 - 20;
  const totalAxes = data[0].axes.length;
  const angleSlice = (2 * Math.PI) / totalAxes;

  const svg = d3.select(svgRef.current)
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", `translate(${width / 2}, ${height / 2})`);

  const radarLine = d3.lineRadial()
    .radius(d => d.value * radius)
    .angle((d, i) => i * angleSlice)
    .curve(d3.curveLinearClosed);

  const blobWrapper = svg.selectAll(".radarWrapper")
    .data(data)
    .enter().append("g")
    .attr("class", "radarWrapper");

  blobWrapper.append("path")
    .attr("class", "radarArea")
    .attr("d", d => radarLine(d.axes))
    .style("fill", d => d.color)
    .style("fill-opacity", 0.2)
    .style("stroke", d => d.color)
    .style("stroke-width", "2px");

};

const RadarChart = ({ data }) => {
  const svgRef = useRef(null);

  useEffect(() => {
    createRadarChart(svgRef, data);
  }, [data]);

  return <svg ref={svgRef}></svg>;
};

export default RadarChart;
