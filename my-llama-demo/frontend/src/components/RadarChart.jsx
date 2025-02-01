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

export default RadarChart;
