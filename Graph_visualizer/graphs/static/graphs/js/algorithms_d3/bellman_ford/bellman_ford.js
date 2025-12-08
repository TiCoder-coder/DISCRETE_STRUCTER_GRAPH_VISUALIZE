window.currentGraphMode = "directed"; 

function updateBellmanInfo(data, isUndirected) {
    if (typeof renderGraphDetails === "function") {
        renderGraphDetails(data.nodes, data.edges);
    }

    const pathArea = document.getElementById("pathResultArea");
    const pathContent = document.getElementById("pathResultContent");
    
    if (pathArea && pathContent) {
        let pathsHtml = "";
        
        if (data.has_negative_cycle) {
            pathArea.style.display = "block";
            pathsHtml = `<div style="padding:10px; border:1px solid red; color:#ff9999; background:rgba(255,0,0,0.1); border-radius:5px;">
                <b>PHÁT HIỆN CHU TRÌNH ÂM!</b><br>Không thể tìm đường đi ngắn nhất.
            </div>`;
        } else if (data.paths && Object.keys(data.paths).length > 0) {
            pathArea.style.display = "block";
            pathsHtml = `<table style="width:100%; border-collapse:collapse; font-size:13px;">
                <tr style="border-bottom:1px solid #555; color:#41ffd1;">
                    <th style="text-align:left; padding:5px;">Đích</th>
                    <th style="text-align:left; padding:5px;">Lộ trình</th>
                    <th style="text-align:center; padding:5px;">Chi phí</th>
                </tr>`;
                
            for (const [target, info] of Object.entries(data.paths)) {
                const pathStr = info.path.join(" <span style='color:#666'>&rarr;</span> ");
                pathsHtml += `<tr style="border-bottom:1px solid #444;">
                    <td style="padding:6px; font-weight:bold; color:#ffcc00;">${target}</td>
                    <td style="padding:6px;">${pathStr}</td>
                    <td style="padding:6px; text-align:center; color:#00ff88; font-weight:bold;">${info.cost}</td>
                </tr>`;
            }
            pathsHtml += `</table>`;
        } else {
            pathArea.style.display = "none";
        }
        
        pathContent.innerHTML = pathsHtml;
    }
}

function drawBellmanFordGraph(nodesData, edgesData, isUndirected) {
    const svg = d3.select("#graphArea");
    svg.selectAll("*").remove(); 
    
    const width = document.getElementById("graphArea").clientWidth || 800;
    const height = document.getElementById("graphArea").clientHeight || 600;

    const defs = svg.append("defs");
    defs.append("marker").attr("id", "arrow").attr("viewBox", "0 0 10 10").attr("refX", 28).attr("refY", 5).attr("markerWidth", 6).attr("markerHeight", 6).attr("orient", "auto").append("path").attr("d", "M 0 0 L 10 5 L 0 10 z").attr("fill", "#00ff88");
    defs.append("marker").attr("id", "arrow-highlight").attr("viewBox", "0 0 10 10").attr("refX", 30).attr("refY", 5).attr("markerWidth", 8).attr("markerHeight", 6).attr("markerUnits", "userSpaceOnUse").attr("orient", "auto").append("path").attr("d", "M 0 0 L 10 5 L 0 10 z").attr("fill", "#ffff00");

    const nodes = nodesData.map(id => ({ id: id }));
    const links = edgesData.map(e => ({ source: e.u, target: e.v, w: e.w, id: `link-${e.u}-${e.v}` }));

    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id).distance(200))
        .force("charge", d3.forceManyBody().strength(-500))
        .force("center", d3.forceCenter(width / 2, height / 2));

    const linkGroup = svg.append("g").attr("class", "links");
    const link = linkGroup.selectAll("line").data(links).enter().append("line")
        .attr("id", d => `link-${d.source.id || d.source}-${d.target.id || d.target}`)
        .attr("stroke", "#666").attr("stroke-width", 2)
        .attr("marker-end", isUndirected ? null : "url(#arrow)");

    const edgeLabel = svg.append("g").selectAll("text").data(links).enter().append("text")
        .text(d => d.w).attr("fill", "#00ff88").attr("font-size", "14px").attr("font-weight", "bold").attr("text-anchor", "middle");

    const nodeGroup = svg.append("g").attr("class", "nodes");
    const node = nodeGroup.selectAll("g").data(nodes).enter().append("g")
        .attr("id", d => `node-${d.id}`)
        .call(d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended));

    node.append("circle").attr("r", 25).attr("fill", "#1d2b57").attr("stroke", "#ffcc00").attr("stroke-width", 3);
    node.append("text").attr("dy", -5).attr("text-anchor", "middle").attr("fill", "white").attr("font-weight", "bold").text(d => d.id);
    node.append("text").attr("class", "dist-label").attr("dy", 15).attr("text-anchor", "middle").attr("fill", "#ffcc00").text("∞");

    simulation.on("tick", () => {
        link.attr("x1", d => d.source.x).attr("y1", d => d.source.y).attr("x2", d => d.target.x).attr("y2", d => d.target.y);
        edgeLabel.attr("x", d => (d.source.x + d.target.x) / 2).attr("y", d => (d.source.y + d.target.y) / 2 - 5);
        node.attr("transform", d => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event, d) { if (!event.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; }
    function dragged(event, d) { d.fx = event.x; d.fy = event.y; }
    function dragended(event, d) { if (!event.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; }
}

function animateBellmanFord(steps, hasNegativeCycle, isUndirected) {
    if (!steps || steps.length === 0) return;
    let i = 0;
    const speed = 1000;
    
    const infoBox = document.getElementById("infoContent");
    if(infoBox) infoBox.innerHTML = "";

    function playStep() {
        if (i >= steps.length) {
            if (hasNegativeCycle) alert("Cảnh báo: Chu trình âm!");
            return;
        }
        const s = steps[i];
        
        const allLines = d3.selectAll("line");
        allLines.attr("stroke", "#666").attr("stroke-width", 2);
        allLines.attr("marker-end", isUndirected ? null : "url(#arrow)");
        d3.selectAll("circle").attr("stroke", "#ffcc00");

        if(infoBox) {
            const div = document.createElement("div");
            div.style.borderBottom = "1px solid #333";
            div.style.padding = "4px 0";
            div.innerHTML = `<span style="color:#888; font-size:11px;">#${i}</span> ${s.message}`;
            infoBox.appendChild(div);
            infoBox.scrollTop = infoBox.scrollHeight;
        }

        if (s.highlight_edge) {
            const u = s.highlight_edge.u;
            const v = s.highlight_edge.v;
            const linkSel = d3.select(`#link-${u}-${v}`);
            linkSel.attr("marker-end", "url(#arrow-highlight)");

            if (s.action === "relax") {
                linkSel.transition().duration(500).attr("stroke", "#00ff00").attr("stroke-width", 6);
            } else if (s.action === "cycle_detected") {
                linkSel.transition().duration(500).attr("stroke", "red").attr("stroke-width", 6);
            } else {
                linkSel.transition().duration(500).attr("stroke", "#ffff00").attr("stroke-width", 5);
            }
        }
        
        if (s.dist) {
            Object.keys(s.dist).forEach(nodeId => {
                const val = s.dist[nodeId];
                d3.select(`#node-${nodeId}`).select(".dist-label").text((val===null||val==="inf")?"∞":val);
            });
        }
        if (s.updated_node) {
            d3.select(`#node-${s.updated_node}`).select("circle").transition().duration(300).attr("fill", "#ff5722").transition().duration(300).attr("fill", "#1d2b57");
        }

        i++;
        setTimeout(playStep, speed);
    }
    playStep();
}