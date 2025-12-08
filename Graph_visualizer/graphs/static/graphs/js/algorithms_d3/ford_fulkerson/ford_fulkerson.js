window.isDirected = true;
let mode = "ford-fulkerson";

function isDirectedGraph() {
    return true; 
}

function renderAdjMatrix(matrix, nodes) {
    let html = `
        <table style="width:100%; border-collapse: collapse; text-align:center; font-size:15px;">
            <tr>
                <th style="border:1px solid #888; padding:6px; background:#1d2b57; color:white;"></th>
    `;
    nodes.forEach(n => {
        html += `<th style="border:1px solid #888; padding:6px; background:#1d2b57; color:white;">${n}</th>`;
    });
    html += `</tr>`;

    matrix.forEach((row, i) => {
        html += `
            <tr>
                <th style="border:1px solid #888; padding:6px; background:#1d2b57; color:white;">${nodes[i]}</th>
        `;
        row.forEach(val => {
            html += `<td style="border:1px solid #888; padding:6px;">${val}</td>`;
        });
        html += `</tr>`;
    });

    html += `</table>`;
    return html;
}

function renderAdjList(adjList) {
    let html = `
        <table style="width:100%; border-collapse:collapse; font-size:15px; margin-top:5px; text-align:left;">
            <tr>
                <th style="border:1px solid #888; padding:6px; background:#1d2b57; width:30%; color:white;">Đỉnh</th>
                <th style="border:1px solid #888; padding:6px; background:#1d2b57; color:white;">Kề (Đỉnh | Sức chứa)</th>
            </tr>
    `;

    Object.keys(adjList).forEach(node => {
        const neighbors = adjList[node].map(n => `${n.node} (cap:${n.capacity})`).join(", ");
        html += `
            <tr>
                <td style="border:1px solid #888; padding:6px;">${node}</td>
                <td style="border:1px solid #888; padding:6px;">${neighbors || "-"}</td>
            </tr>
        `;
    });

    html += `</table>`;
    return html;
}

function setMode(m) {
    mode = m;
    console.log("Mode =", mode);
}

function runVisualization() {
    const nodesInput = document.getElementById("nodes").value.trim();
    const edgesInput = document.getElementById("edges").value.trim();
    const startNodeInput = document.getElementById("startNode").value.trim();

    if (!nodesInput || !edgesInput) {
        alert("Vui lòng nhập đầy đủ nodes và edges!");
        return;
    }

    const nodes = nodesInput.split(",").map(n => n.trim());
    
    let source = nodes[0];
    let sink = nodes[nodes.length - 1];
    
    if (startNodeInput.includes(",")) {
        const parts = startNodeInput.split(",");
        source = parts[0].trim();
        sink = parts[1].trim();
    } else if (startNodeInput) {
        source = startNodeInput;
    }

    console.log(`Chạy Ford-Fulkerson: Source=${source}, Sink=${sink}`);

    const payload = {
        nodes: nodes,
        edges: edgesInput,
        source: source,
        sink: sink,
        mode: "ford-fulkerson"
    };

    console.log("Sending payload:", payload);

    fetch("/api/graph/ford-fulkerson/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    })
        .then(res => res.json())
        .then(data => {
            console.log("Response:", data);

            if (data.error) {
                document.getElementById("infoContent").innerHTML =
                    `<p style="color:red; font-weight:bold;">${data.error}</p>`;
                return;
            }

            drawGraph(data.nodes, data.edges); 
            updateInfo(data.analysis, data.result);
            animateFordFulkerson(data.nodes, data.edges, data.result);

        })
        .catch(err => {
            console.error("Fetch error:", err);
            alert("Lỗi kết nối API: " + err);
        });
}

function drawGraph(nodes, edges) {
    const svg = d3.select("#graphArea");
    svg.selectAll("*").remove();

    const defs = svg.append("defs");
    defs.append("marker")
        .attr("id", "arrow")
        .attr("viewBox", "0 0 10 10")
        .attr("refX", 28)
        .attr("refY", 5)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M 0 0 L 10 5 L 0 10 z")
        .attr("fill", "#00ff88");

    const svgEl = document.getElementById("graphArea");
    const width = svgEl.clientWidth;
    const height = svgEl.clientHeight;

    const d3Edges = edges.map(e => ({
        source: e.u,
        target: e.v,
        capacity: e.capacity,
        flow: 0,
        id: `${e.u}-${e.v}`
    }));

    const d3Nodes = nodes.map(n => ({ id: n }));

    const simulation = d3.forceSimulation(d3Nodes)
        .force("link", d3.forceLink(d3Edges).id(d => d.id).distance(200))
        .force("charge", d3.forceManyBody().strength(-500))
        .force("center", d3.forceCenter(width / 2, height / 2));

    const linkGroup = svg.append("g").attr("class", "links");
    const link = linkGroup.selectAll("line")
        .data(d3Edges)
        .enter()
        .append("line")
        .attr("id", d => `edge-${d.source.id || d.source}-${d.target.id || d.target}`)
        .attr("stroke", "#555")
        .attr("stroke-width", 2)
        .attr("marker-end", "url(#arrow)");

    const linkLabel = svg.append("g").attr("class", "link-labels")
        .selectAll("text")
        .data(d3Edges)
        .enter()
        .append("text")
        .attr("id", d => `label-${d.source.id || d.source}-${d.target.id || d.target}`)
        .text(d => `0 / ${d.capacity}`)
        .attr("font-size", "14px")
        .attr("fill", "#00ff88")
        .attr("text-anchor", "middle")
        .attr("dy", -5)
        .style("font-weight", "bold")
        .style("text-shadow", "1px 1px 2px #000");

    const nodeGroup = svg.append("g").attr("class", "nodes");
    const node = nodeGroup.selectAll("circle")
        .data(d3Nodes)
        .enter()
        .append("circle")
        .attr("id", d => `node-${d.id}`)
        .attr("r", 22)
        .attr("fill", "#ffcc00")
        .attr("stroke", "#fff")
        .attr("stroke-width", 2)
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

    const label = svg.append("g").attr("class", "node-labels")
        .selectAll("text")
        .data(d3Nodes)
        .enter()
        .append("text")
        .text(d => d.id)
        .attr("dy", 5)
        .attr("text-anchor", "middle")
        .attr("fill", "#1d2b57")
        .attr("font-weight", "bold")
        .attr("font-size", "16px")
        .style("pointer-events", "none");

    simulation.on("tick", () => {
        link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        linkLabel
            .attr("x", d => (d.source.x + d.target.x) / 2)
            .attr("y", d => (d.source.y + d.target.y) / 2);

        node
            .attr("cx", d => d.x)
            .attr("cy", d => d.y);

        label
            .attr("x", d => d.x)
            .attr("y", d => d.y);
    });

    function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }
    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }
    function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }
}

function updateInfo(analysis, result) {
    const box = document.getElementById("infoContent");

    box.innerHTML = `
        <p><b>Thuật toán:</b> Ford-Fulkerson (Max Flow)</p>
        <p><b>Luồng cực đại (Max Flow):</b> <span style="font-size:20px; color:lightgreen; font-weight:bold;">${result.max_flow}</span></p>

        <hr>
        <p><b>Thông tin đồ thị:</b></p>
        <p>- Số đỉnh: ${analysis.num_nodes}</p>
        <p>- Số cạnh: ${analysis.num_edges}</p>

        <p><b>Ma trận kề (Trọng số/Capacity):</b></p>
        ${renderAdjMatrix(analysis.adj_matrix, analysis.nodes)}

        <hr>
        <div style="max-height: 200px; overflow-y: auto; background: #222; padding: 10px;">
            <p><b>Log các bước thực hiện:</b></p>
            ${result.steps.map(s => 
                `<div style="margin-bottom:5px; border-bottom:1px solid #444; padding-bottom:2px;">
                    <span style="color:#ffcc00">[Bước ${s.step}]</span> ${s.message}
                 </div>`
            ).join('')}
        </div>
    `;
}

function animateFordFulkerson(nodes, edges, result) {
    const steps = result.steps;
    if (!steps || steps.length === 0) return;

    let currentFlowState = {}; 
    edges.forEach(e => {
        currentFlowState[`${e.u}-${e.v}`] = 0;
    });

    let i = 0;
    const delayTime = 1500;

    function nextStep() {
        if (i >= steps.length) {
            d3.selectAll("circle").attr("fill", "#ffcc00");
            d3.selectAll("line")
                .attr("stroke", "#555")
                .attr("stroke-width", 2);
            return;
        }

        const s = steps[i];

        d3.selectAll("circle").attr("fill", "#ffcc00");
        d3.selectAll("line").attr("stroke", "#555").attr("stroke-width", 2);

        if (s.action === "augment") {
            const path = s.path;
            const flowAdded = s.flow_added;

            path.forEach(nodeId => {
                d3.select(`#node-${nodeId}`).attr("fill", "#00ff88");
            });

            for (let k = 0; k < path.length - 1; k++) {
                let u = path[k];
                let v = path[k+1];
                let edgeId = `edge-${u}-${v}`;
                let labelId = `label-${u}-${v}`;
                
                d3.select("#" + edgeId)
                    .transition().duration(500)
                    .attr("stroke", "#ff3d00")
                    .attr("stroke-width", 6);

                let key = `${u}-${v}`;

                if (currentFlowState.hasOwnProperty(key)) {
                    currentFlowState[key] += flowAdded;
                    let cap = d3.select("#" + labelId).text().split("/")[1].trim();
                    
                    d3.select("#" + labelId)
                        .text(`${currentFlowState[key]} / ${cap}`)
                        .attr("fill", "#ff3d00")
                        .attr("font-size", "18px");
                } else {
                    let revKey = `${v}-${u}`;
                    if (currentFlowState.hasOwnProperty(revKey)) {
                         currentFlowState[revKey] -= flowAdded;
                         let labelRevId = `label-${v}-${u}`;
                         let cap = d3.select("#" + labelRevId).text().split("/")[1].trim();
                         d3.select("#" + labelRevId)
                            .text(`${currentFlowState[revKey]} / ${cap}`);
                    }
                }
            }
        }

        i++;
        setTimeout(nextStep, delayTime);
    }

    nextStep();
}