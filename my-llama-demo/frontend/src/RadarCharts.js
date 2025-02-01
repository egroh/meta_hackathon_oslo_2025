import React, { useEffect, useState, useRef } from "react";
import * as d3 from "d3";

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
