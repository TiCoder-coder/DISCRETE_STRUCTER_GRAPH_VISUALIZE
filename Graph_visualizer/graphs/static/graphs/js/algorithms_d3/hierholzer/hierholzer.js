let mode = "auto";

function renderAdjMatrix(matrix, nodes) {

    let html = `<table class="matrix-table">`;

    html += `<tr><th class="top-left"></th>`;
    nodes.forEach(n => {
        html += `<th class="matrix-header">${n}</th>`;
    });
    html += `</tr>`;

    matrix.forEach((row, i) => {
        html += `<tr>`;

        html += `<th class="matrix-row-header">${nodes[i]}</th>`;

        row.forEach(val => {
            html += `<td>${val}</td>`;
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
}

function runHierholzerFinal() {
    const nodes = document.getElementById("nodes").value.split(",");
    const startNode = document.getElementById("startNode").value.trim();

    fetch("/api/graph/hierholzer/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            nodes: nodes,
            edges: document.getElementById("edges").value.split(","),
            startNode: startNode || null,
            mode: selectedMode
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.error) {
            alert(data.error);
            return;
        }

        drawGraph(data.nodes, data.edges, data.result);
        animateHierholzer(data.result);

        updateInfo({
            mode: selectedMode,
            ...data.analysis,
            hierholzer_path: data.result.path,
            hierholzer_steps: data.result.steps,
            is_eulerian_path: checkEulerPath(data.analysis),
            is_eulerian_circuit: checkEulerCircuit(data.analysis)
        });

    })
    .catch(err => console.error(err));
}


function drawGraph(nodes, edges, resultPath) {
    const svg = d3.select("#graphArea");
    svg.selectAll("*").remove();

    const svgElement = document.getElementById("graphArea");
    const width = svgElement.clientWidth;
    const height = svgElement.clientHeight;

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
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("x", d3.forceX(width / 2).strength(0.08))
        .force("y", d3.forceY(height / 2).strength(0.08));


    const link = svg.append("g")
        .selectAll("line")
        .data(edges)
        .enter().append("line")
        .attr("stroke", "#00ff88")
        .attr("stroke-width", 4)


    const node = svg.append("g")
        .selectAll("circle")
        .data(nodes)
        .enter().append("circle")
        .attr("r", 22)
        .attr("class", "node")
        .attr("fill", "#ffcc00");

    const label = svg.append("g")
        .selectAll("text")
        .data(nodes)
        .enter().append("text")
        .text(d => d.id)
        .attr("fill", "#ffffff")
        .attr("font-size", "20px")
        .attr("dy", 5)
        .attr("text-anchor", "middle");

    simulation.on("tick", () => {
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
    });
}



function updateInfo(info) {
    const box = document.getElementById("infoContent");
    if (!box) return;

    const degree  = info.degree || {};
    let   nodes   = Object.keys(degree);
    nodes = [...new Set(nodes)].sort();

    const numNodes = info.num_nodes ?? nodes.length;
    const numEdges = info.num_edges ?? 0;

    const adjList  = info.adj_list  || {};
    const matrix   = info.adj_matrix || [];

    const hasPath    = !!info.is_eulerian_path;
    const hasCircuit = !!info.is_eulerian_circuit;

    const oddNodes = nodes.filter(v => (degree[v] ?? 0) % 2 === 1);
    const oddCount = oddNodes.length;

    let reason = "";
    if (!hasPath && !hasCircuit) {
        reason = `Đồ thị KHÔNG Euler vì số đỉnh bậc lẻ = ${oddCount} (phải là 0 hoặc 2).`;
    } else if (hasCircuit && hasPath && oddCount === 0) {
        reason = "Tất cả các đỉnh đều có bậc chẵn ⇒ tồn tại chu trình Euler ⇒ cũng có đường đi Euler (chu trình đóng).";
    } else if (hasPath && !hasCircuit && oddCount === 2) {
        reason = `Có đúng 2 đỉnh bậc lẻ (${oddNodes.join(", ")}) ⇒ chỉ tồn tại đường đi Euler, không có chu trình Euler.`;
    }

    const degreeRows = nodes.map(v => `
        <tr>
            <td>${v}</td>
            <td style="text-align:center;">${degree[v] ?? 0}</td>
        </tr>
    `).join("");

    const adjRows = nodes.map(v => {
        const neighbors = (adjList[v] || []).join(", ") || "∅";
        return `
            <tr>
                <td>${v}</td>
                <td>${neighbors}</td>
            </tr>
        `;
    }).join("");

    const headerRow = `
        <tr>
            <th class="top-left"></th>
            ${nodes.map(v => `<th class="matrix-header">${v}</th>`).join("")}
        </tr>
    `;

    const matrixRows = nodes.map((v, i) => {
        const row = matrix[i] || [];
        return `
            <tr>
                <th class="matrix-row-header">${v}</th>
                ${
                    nodes.map((_, j) => `
                        <td style="text-align:center;">
                            ${row[j] ?? 0}
                        </td>
                    `).join("")
                }
            </tr>
        `;
    }).join("");

    const steps = info.hierholzer_steps || [];
    const cyclesHtml = steps.length
        ? steps.map((s, idx) => {
            const label = s.label || `R${idx + 1}`;
            const pivot = s.pivot ? ` (xoay tại đỉnh ${s.pivot})` : "";
            const cycleArr = s.new_cycle || s.tour || [];
            const cycleStr = cycleArr.join(" → ");
            return `
                <div class="cycle-line">
                    <span class="cycle-label">${label}</span>
                    = ${cycleStr}${pivot}
                </div>
            `;
        }).join("")
        : "<i>Không có chu trình mở rộng nào.</i>";

    const finalPathArr  = info.hierholzer_path || [];
    const finalPathText = finalPathArr.length
        ? finalPathArr.join(" → ")
        : "Không tìm được chu trình Euler cho đồ thị này.";

    box.innerHTML = `
        <div class="euler-summary">
            <div><b>Mode:</b> ${(info.mode || "AUTO").toString().toUpperCase()}</div>
            <div><b>Loại đồ thị:</b> Đồ thị vô hướng</div>

            <div class="euler-result-line">
                <span class="euler-chip ${hasPath ? "chip-yes" : "chip-no"}">
                    Đường đi Euler: <b>${hasPath ? "Có" : "Không"}</b>
                </span>
                <span class="euler-chip ${hasCircuit ? "chip-yes" : "chip-no"}">
                    Chu trình Euler: <b>${hasCircuit ? "Có" : "Không"}</b>
                </span>
            </div>

            ${reason ? `<div class="euler-reason">${reason}</div>` : ""}

            <div class="euler-stats">
                <b>Số đỉnh:</b> ${numNodes}
                &nbsp;|&nbsp;
                <b>Số cạnh:</b> ${numEdges}
            </div>
        </div>

        <div class="graph-info-section">
            <div class="graph-info-title">Các chu trình mở rộng R<sub>i</sub>, Q<sub>i</sub></div>
            <div class="cycles-box">
                ${cyclesHtml}
            </div>
        </div>

        <div class="graph-info-section">
            <div class="graph-info-title">Chu trình Hierholzer cuối cùng</div>
            <p class="final-cycle">${finalPathText}</p>
        </div>

        <hr style="margin:14px 0; border-color:rgba(255,255,255,0.25);" />

        <div class="graph-info-section">
            <div class="graph-info-title">1. Bậc từng đỉnh</div>
            <table class="graph-info-table">
                <tr><th>Đỉnh</th><th>Bậc</th></tr>
                ${degreeRows}
            </table>
        </div>

        <div class="graph-info-section">
            <div class="graph-info-title">2. Danh sách kề</div>
            <table class="graph-info-table">
                <tr><th>Đỉnh</th><th>Các đỉnh kề</th></tr>
                ${adjRows}
            </table>
        </div>

        <div class="graph-info-section">
            <div class="graph-info-title">3. Ma trận kề</div>
            <div style="overflow-x:auto;">
                <table class="graph-info-table">
                    ${headerRow}
                    ${matrixRows}
                </table>
            </div>
        </div>
    `;
}




function formatHierholzerSteps(steps) {
    if (!steps || steps.length === 0) {
        return "Không có dữ liệu chu trình mở rộng.";
    }

    const lines = [];

    steps.forEach((s, idx) => {
        const R_label = `R${idx + 1}`;
        const R_str = (s.tour || []).join(", ");

        lines.push(`${R_label} = ${R_str}`);

        if (idx > 0) {
            const Q_label = `Q${idx}`;
            const Q_str = (s.new_cycle || []).join(", ");
            lines.push(`${Q_label} (từ đỉnh ${s.pivot}) = ${Q_str}`);
        }

        lines.push("");
    });

    return lines.join("\n");
}


function animateHierholzer(result) {
    if (!result || !result.steps || result.steps.length === 0) return;

    const steps = result.steps;
    const svg   = d3.select("#graphArea");
    const nodes = svg.selectAll("circle");
    const links = svg.selectAll("line");

    const STEP_DELAY = 1000;

    const edgeKey = (u, v) => `${u}--${v}`;

    let stepIndex = 0;

    function showStep() {
        const s = steps[stepIndex];
        if (!s) return;

        const tourEdges = new Set();
        const tourNodes = new Set();

        (s.tour || []).forEach((v, i, arr) => {
            tourNodes.add(v);
            if (i < arr.length - 1) {
                const a = arr[i];
                const b = arr[i + 1];
                tourEdges.add(edgeKey(a, b));
                tourEdges.add(edgeKey(b, a));
            }
        });

        const newEdges = new Set();
        const cycleNodes = new Set();

        (s.new_cycle || []).forEach((v, i, arr) => {
            cycleNodes.add(v);
            if (i < arr.length - 1) {
                const a = arr[i];
                const b = arr[i + 1];
                newEdges.add(edgeKey(a, b));
                newEdges.add(edgeKey(b, a));
            }
        });

        nodes.attr("fill", d => {
            if (d.id === s.pivot) return "#ff9100";
            if (cycleNodes.has(d.id)) return "#ffd54f";
            if (tourNodes.has(d.id))  return "#ffcc00";
            return "#555555";
        });

        links
            .attr("stroke", e => {
                const src = (typeof e.source === "object") ? e.source.id : e.source;
                const tgt = (typeof e.target === "object") ? e.target.id : e.target;
                const k = edgeKey(src, tgt);

                if (newEdges.has(k)) return "#ff5722";
                if (tourEdges.has(k)) return "#ffeb3b";
                return "#00ff88";
            })
            .attr("stroke-width", e => {
                const src = (typeof e.source === "object") ? e.source.id : e.source;
                const tgt = (typeof e.target === "object") ? e.target.id : e.target;
                const k = edgeKey(src, tgt);

                if (newEdges.has(k)) return 7;
                if (tourEdges.has(k)) return 5;
                return 2;
            })
            .style("filter", e => {
                const src = (typeof e.source === "object") ? e.source.id : e.source;
                const tgt = (typeof e.target === "object") ? e.target.id : e.target;
                const k = edgeKey(src, tgt);

                if (newEdges.has(k)) return "drop-shadow(0 0 10px #ff5722)";
                if (tourEdges.has(k)) return "drop-shadow(0 0 8px #ffeb3b)";
                return "none";
            });

        stepIndex++;
        if (stepIndex < steps.length) {
            setTimeout(showStep, STEP_DELAY);
        } else {
            nodes.transition()
                .duration(600)
                .attr("fill", "#ffcc00");

            links.transition()
                .duration(600)
                .attr("stroke", "#ffeb3b")
                .attr("stroke-width", 5)
                .style("filter", "drop-shadow(0 0 8px #ffeb3b)");
        }
    }

    showStep();
}
