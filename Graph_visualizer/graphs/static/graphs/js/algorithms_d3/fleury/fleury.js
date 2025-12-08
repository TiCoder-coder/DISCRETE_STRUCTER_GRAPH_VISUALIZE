function isDirectedGraph() {
    return window.graphType === "directed";
}

let mode = "auto";
window.isDirected = false;

function renderAdjMatrix(matrix, nodes) {
    let html = `
        <table style="
            width:100%;
            border-collapse: collapse;
            text-align:center;
            font-size:15px;
        ">
            <tr>
                <th style="border:1px solid #888; padding:6px; background:#1d2b57;"></th>
    `;

    nodes.forEach(n => {
        html += `<th style="border:1px solid #888; padding:6px; background:#1d2b57;">${n}</th>`;
    });
    html += `</tr>`;

    matrix.forEach((row, i) => {
        html += `
            <tr>
                <th style="border:1px solid #888; padding:6px; background:#1d2b57;">${nodes[i]}</th>
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
        <table style="
            width:100%;
            border-collapse:collapse;
            font-size:15px;
            margin-top:5px;
            text-align:left;
        ">
            <tr>
                <th style="border:1px solid #888; padding:6px; background:#1d2b57; width:30%;">Đỉnh</th>
                <th style="border:1px solid #888; padding:6px; background:#1d2b57;">Đỉnh kề</th>
            </tr>
    `;

    Object.keys(adjList).forEach(node => {
        const neighbors = adjList[node].join(", ");
        html += `
            <tr>
                <td style="border:1px solid #888; padding:6px;">${node}</td>
                <td style="border:1px solid #888; padding:6px;">${neighbors}</td>
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
    const startNode = document.getElementById("startNode").value.trim();

    if (!nodesInput || !edgesInput) {
        alert("Vui lòng nhập đầy đủ nodes và edges!");
        return;
    }

    const nodes = nodesInput.split(",").map(n => n.trim());

    const edges = edgesInput;

    const payload = {
        nodes: nodes,
        edges: edges,
        startNode: startNode || null,
        mode: mode
    };

    console.log("Sending payload:", payload);

    fetch("/api/graph/fleury/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    })
        .then(res => res.json())
        .then(data => {
            console.log("Response:", data);

            if (data.error) {
                document.getElementById("infoContent").innerHTML =
                    `<p style="color:red">${data.error}</p>`;
                return;
            }


            drawGraph(data.nodes, data.edges, data.result);
            animateFleury(data.result);
            updateInfoPanel(data.analysis);

        })
        .catch(err => {
            console.error("Fetch error:", err);
        });
}

function drawGraph(nodes, edges, resultPath) {

    window.isDirected = (window.getGraphType && window.getGraphType() === "directed");

    console.log(">>> Graph Type:", window.getGraphType());
    console.log(">>> isDirected =", window.isDirected);

    const svg = d3.select("#graphArea");
    svg.selectAll("*").remove();

    if (window.isDirected) {
        const defs = svg.append("defs");
        defs.append("marker")
            .attr("id", "arrow")
            .attr("viewBox", "0 0 10 10")
            .attr("refX", 10)
            .attr("refY", 5)
            .attr("markerWidth", 7)
            .attr("markerHeight", 7)
            .attr("orient", "auto")
            .append("path")
            .attr("d", "M 0 0 L 10 5 L 0 10 z")
            .attr("fill", "#ff0");
    }

    const svgEl = document.getElementById("graphArea");
    const width = svgEl.clientWidth;
    const height = svgEl.clientHeight;

    edges = edges.map(e => {
        if (typeof e === "string" && e.includes("-")) {
            const [s, t] = e.split("-");
            return { source: s.trim(), target: t.trim() };
        }
        return e;
    });

    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(edges).id(d => d.id).distance(180))
        .force("charge", d3.forceManyBody().strength(-450))
        .force("center", d3.forceCenter(width / 2, height / 2));

    const link = svg.append("g")
        .selectAll("line")
        .data(edges)
        .enter()
        .append("line")
        .attr("stroke", "#00ff88")
        .attr("stroke-width", 4);

    if (window.isDirected) {
        link.attr("marker-end", "url(#arrow)");
    }

    const node = svg.append("g")
        .selectAll("circle")
        .data(nodes)
        .enter()
        .append("circle")
        .attr("r", 22)
        .attr("fill", "#ffcc00");

    const label = svg.append("g")
        .selectAll("text")
        .data(nodes)
        .enter()
        .append("text")
        .text(d => d.id)
        .attr("dy", 5)
        .attr("text-anchor", "middle")
        .attr("fill", "white")
        .attr("font-size", "20px");

    const NODE_R = 22;
    const ARROW_OFFSET = NODE_R - 2;
        
    simulation.on("tick", () => {
        link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => {
                if (!window.isDirected) return d.target.x;
                const dx = d.target.x - d.source.x;
                const dy = d.target.y - d.source.y;
                const len = Math.sqrt(dx * dx + dy * dy) || 1;
                const off = Math.min(ARROW_OFFSET, len - 1);
                return d.target.x - dx / len * off;
            })
            .attr("y2", d => {
                if (!window.isDirected) return d.target.y;
                const dx = d.target.x - d.source.x;
                const dy = d.target.y - d.source.y;
                const len = Math.sqrt(dx * dx + dy * dy) || 1;
                const off = Math.min(ARROW_OFFSET, len - 1);
                return d.target.y - dy / len * off;
            });

        node
            .attr("cx", d => d.x)
            .attr("cy", d => d.y);

        label
            .attr("x", d => d.x)
            .attr("y", d => d.y);
    });


}


function updateInfoPanel(data) {
    const box = document.getElementById("graphInfoBox");
    if (!box) return;

    const mode            = data.mode;
    const isDirected      = data.directed;
    const hasEulerPath    = data.has_euler_path;
    const hasEulerCircuit = data.has_euler_circuit;

    const degrees  = data.degrees || {};
    const adjList  = data.adj_list || {};
    const matrix   = data.adj_matrix || [];
    let   nodeList = data.nodes || Object.keys(degrees);

    nodeList = [...new Set(nodeList)].sort();

    const degreeRows = nodeList.map(v => `
        <tr>
            <td>${v}</td>
            <td style="text-align:center;">${degrees[v] ?? 0}</td>
        </tr>
    `).join("");

    const adjRows = nodeList.map(v => `
        <tr>
            <td>${v}</td>
            <td>${(adjList[v] || []).join(", ") || "–"}</td>
        </tr>
    `).join("");

    const headerRow = `
        <tr>
            <th></th>
            ${nodeList.map(v => `<th>${v}</th>`).join("")}
        </tr>
    `;

    const matrixRows = nodeList.map((v, i) => `
        <tr>
            <th>${v}</th>
            ${
                nodeList.map((_, j) => {
                    const row = matrix[i] || [];
                    return `<td style="text-align:center;">${row[j] ?? 0}</td>`;
                }).join("")
            }
        </tr>
    `).join("");

    const pathColor    = hasEulerPath    ? "#00ff88" : "#ff6666";
    const circuitColor = hasEulerCircuit ? "#00ff88" : "#ff6666";

    const summaryHtml = `
        <div style="margin-bottom:10px;">
            <div><b>Mode:</b> ${mode}</div>
            <div><b>Loại đồ thị:</b> ${isDirected ? "Đồ thị có hướng" : "Đồ thị vô hướng"}</div>
            <div>
                <b>Kết luận Euler:</b>
                ${
                    hasEulerCircuit ? "Chu trình Euler"
                  : hasEulerPath    ? "Đường đi Euler"
                  : "Không có đường đi / chu trình Euler"
                }
            </div>
            <div style="margin-top:4px;">
                <b>Có đường đi Euler?</b>
                <span style="color:${pathColor}; font-weight:600;">
                    ${hasEulerPath ? "Có" : "Không"}
                </span>
                &nbsp; | &nbsp;
                <b>Có chu trình Euler?</b>
                <span style="color:${circuitColor}; font-weight:600;">
                    ${hasEulerCircuit ? "Có" : "Không"}
                </span>
            </div>
            <div style="margin-top:4px;">
                <b>Số đỉnh:</b> ${nodeList.length}
                &nbsp; | &nbsp;
                <b>Số cạnh:</b> ${data.num_edges ?? "-"}
            </div>
        </div>
    `;

    box.innerHTML = `
        ${summaryHtml}

        <div class="graph-info-title">1. Bậc các đỉnh</div>
        <table class="graph-info-table">
            <tr><th>Đỉnh</th><th>Bậc</th></tr>
            ${degreeRows}
        </table>

        <div class="graph-info-title">2. Danh sách kề</div>
        <table class="graph-info-table">
            <tr><th>Đỉnh</th><th>Các đỉnh kề</th></tr>
            ${adjRows}
        </table>

        <div class="graph-info-title">3. Ma trận kề</div>
        <div style="overflow-x:auto;">
            <table class="graph-info-table">
                ${headerRow}
                ${matrixRows}
            </table>
        </div>
    `;
}


function renderGraph(data) {
    const svg = d3.select("#graphArea");
    if (window.isDirected) {
        svg.append("defs").append("marker")
            .attr("id", "arrow")
            .attr("viewBox", "0 0 10 10")
            .attr("refX", 12)
            .attr("refY", 5)
            .attr("markerWidth", 12)
            .attr("markerHeight", 12)
            .attr("orient", "auto-start-reverse")
            .append("path")
            .attr("d", "M 0 0 L 10 5 L 0 10 z")
            .attr("fill", "#ffe100");

    }

    svg.selectAll("*").remove();

    const width = 1600;
    const height = 1000;

    const simulation = d3.forceSimulation(data.nodes)
        .force("link", d3.forceLink(data.edges).id(d => d.id).distance(180))
        .force("charge", d3.forceManyBody().strength(-450))
        .force("center", d3.forceCenter(width / 2, height / 2));

    const link = svg.append("g")
        .selectAll("line")
        .data(edges)
        .enter().append("line")
        .attr("stroke", "#00ff88")
        .attr("stroke-width", 4);
    if (window.isDirected) {
        link.attr("marker-end", "url(#arrow)");
    }


    const node = svg.append("g")
        .selectAll("circle")
        .data(data.nodes)
        .enter().append("circle")
        .attr("r", 16)
        .attr("fill", "#ffca28");

    const label = svg.append("g")
        .selectAll("text")
        .data(data.nodes)
        .enter().append("text")
        .text(d => d.id)
        .attr("font-size", 18)
        .attr("fill", "white");

    simulation.on("tick", () => {
        link.attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => {
                const dx = d.target.x - d.source.x;
                const dy = d.target.y - d.source.y;
                const len = Math.sqrt(dx*dx + dy*dy);
                const offset = 28;
                return d.target.x - dx/len * offset;
            })
            .attr("y2", d => {
                const dx = d.target.x - d.source.x;
                const dy = d.target.y - d.source.y;
                const len = Math.sqrt(dx*dx + dy*dy);
                const offset = 28;
                return d.target.y - dy/len * offset;
            });


        node.attr("cx", d => d.x)
            .attr("cy", d => d.y);

        label.attr("x", d => d.x + 20)
            .attr("y", d => d.y + 5);
    });

    document.getElementById("infoContent").innerHTML = `
        <pre>${JSON.stringify(data.analysis, null, 2)}</pre>
    `;
}

function animateFleury(result) {

    const steps = result.steps;
    if (!steps || steps.length === 0) return;

    const svg   = d3.select("#graphArea");
    const nodes = svg.selectAll("circle");
    const edges = svg.selectAll("line");

    const pathSpan   = document.getElementById("fleuryPathText");
    const stepsList  = document.getElementById("fleuryStepsList");

    if (stepsList) stepsList.innerHTML = "";

    const visited = [];
    const STEP_DELAY = 900;
    let i = 0;

    function highlight() {
        const s = steps[i];
        if (!s) return;

        if (s.current) {
            if (visited.length === 0 || visited[visited.length - 1] !== s.current) {
                visited.push(s.current);
            }
            if (pathSpan) {
                pathSpan.innerHTML =
                    `<b>Đường đi hiện tại:</b> ` + visited.join(" → ");
            }
        }

        if (stepsList) {
            const li = document.createElement("li");
            const edgeText = s.edge
                ? `${s.edge[0]} – ${s.edge[1]}`
                : "(bắt đầu)";
            li.innerHTML =
                `Bước ${s.step}: đi cạnh <b>${edgeText}</b> đến đỉnh <b>${s.current}</b>`;
            li.classList.add("fleury-step-item");
            stepsList.appendChild(li);

            stepsList.querySelectorAll(".fleury-step-item")
                .forEach(el => el.classList.remove("active-step"));

            li.classList.add("active-step");
            li.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }

        nodes.attr("fill", d =>
            d.id === s.current ? "#f5d210ff" : "#dd7411ff"
        );

        edges.each(function (e) {
            const link = d3.select(this);

            const src = typeof e.source === "object" ? e.source.id : e.source;
            const tgt = typeof e.target === "object" ? e.target.id : e.target;

            const isCurrent =
                (src === (s.edge?.[0]) && tgt === (s.edge?.[1])) ||
                (src === (s.edge?.[1]) && tgt === (s.edge?.[0]));

            link
                .attr("stroke", isCurrent ? "#ff3d00" : "#666")
                .attr("stroke-width", isCurrent ? 7 : 2)
                .style("filter", isCurrent ? "drop-shadow(0 0 12px #ff3d00)" : "none");
        });

        i++;
        if (i < steps.length) {
            setTimeout(highlight, STEP_DELAY);
        } else {
            edges.transition()
                .duration(600)
                .attr("stroke", "#ffcc00")
                .attr("stroke-width", 4)
                .style("filter", "none");

            nodes.transition()
                .duration(600)
                .attr("fill", "#ffcc00");
        }
    }

    highlight();
}
