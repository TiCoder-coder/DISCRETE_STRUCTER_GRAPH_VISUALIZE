
console.log("D3.js BFS visualization loaded");

const width = 800, height = 500;
const svg = d3.select("#graph");

fetch("/api/graph/bfs/")
  .then(res => res.json())
  .then(data => {
    const { nodes, links, steps } = data;

    const link = svg.selectAll("line")
      .data(links)
      .enter()
      .append("line")
      .attr("stroke", "#999")
      .attr("stroke-width", 2);

    const node = svg.selectAll("circle")
      .data(nodes)
      .enter()
      .append("circle")
      .attr("r", 15)
      .attr("fill", "#1d4ed8");

    const label = svg.selectAll("text")
      .data(nodes)
      .enter()
      .append("text")
      .text(d => d.id)
      .attr("font-size", "14px")
      .attr("fill", "white")
      .attr("text-anchor", "middle")
      .attr("alignment-baseline", "middle");

    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id(d => d.id).distance(150))
      .force("charge", d3.forceManyBody().strength(-400))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .on("tick", ticked);

    function ticked() {
      link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

      node
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);

      label
        .attr("x", d => d.x)
        .attr("y", d => d.y);
    }

    // Animation từng bước BFS
    let stepIndex = 0;
    function animateSteps() {
      if (stepIndex >= steps.length) return;
      const visited = steps[stepIndex].visited;
      node.transition().duration(500)
        .attr("fill", d => visited.includes(d.id) ? "#22c55e" : "#1d4ed8");
      stepIndex++;
      setTimeout(animateSteps, 1000);
    }

    animateSteps();
 });