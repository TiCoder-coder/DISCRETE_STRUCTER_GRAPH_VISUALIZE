window.graphType = "directed"; 

document.getElementById("btn-undirected").onclick = function () {
    window.graphType = "undirected";
    this.classList.add("active");
    document.getElementById("btn-directed").classList.remove("active");
};

document.getElementById("btn-directed").onclick = function () {
    window.graphType = "directed";
    this.classList.add("active");
    document.getElementById("btn-undirected").classList.remove("active");
};

function showVisual() {
    document.getElementById("visualPanel").style.display = "block";
    document.getElementById("introPanel").style.display = "none";
    document.getElementById("visualBtn").classList.add("active");
    document.getElementById("introBtn").classList.remove("active");
}

function showIntro() {
    document.getElementById("visualPanel").style.display = "none";
    document.getElementById("introPanel").style.display = "block";
    document.getElementById("visualBtn").classList.remove("active");
    document.getElementById("introBtn").classList.add("active");
    loadPdfText();
}

function loadPdfText() {
    fetch("/api/dfs/pdf/")
        .then(res => res.json())
        .then(data => {
            document.getElementById("pdfTextBox").innerHTML =
                data.html ? data.html : `<pre>${data.text || "Không có nội dung mô tả."}</pre>`;
        })
        .catch(() => {
            document.getElementById("pdfTextBox").textContent = "Lỗi tải tài liệu giới thiệu!";
        });
}

function runDFS() {
    handleAction('DFS');
}

function handleAction(action) {
    const nodes = document.getElementById("nodes").value
        .split(",").map(s => s.trim()).filter(Boolean);
    const edges = document.getElementById("edges").value
        .split(",").map(s => s.trim()).filter(Boolean);
    const startNode = document.getElementById("startNode").value.trim();

    if (action !== 'BIPARTITE') {
        if (!startNode) {
            alert("Vui lòng nhập đỉnh bắt đầu!");
            return;
        }
        if (!nodes.includes(startNode)) {
            alert("Đỉnh bắt đầu không nằm trong danh sách đỉnh!");
            return;
        }
    }

    fetch("/api/graph/dfs/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            action: action,
            nodes: nodes,
            edges: edges,
            startNode: startNode,
            endNode: null,
            mode: window.graphType
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.error) {
            alert(data.error);
            return;
        }

        console.log("DFS / BIPARTITE response = ", data);

        drawGraph(data.nodes, data.edges);

        if (action === "DFS") {
            animateDFS(data.result);
        } else if (action === 'BIPARTITE') {
            colorBipartite(data.result);
        }

        const result = data.result || {};
        const isBi = (typeof result.is_bipartite !== "undefined") ? result.is_bipartite : null;
        const biSets = result.sets || result.partition || result.color_sets || null;
        const biMsg  = result.message || "";

        updateInfo({
            mode: window.graphType,
            ...data.analysis,

            action: action,
            result: result,
            
            dfs_path:  result.path  || [],
            dfs_steps: result.steps || [],

            is_bipartite:      isBi,
            bipartite_sets:    biSets,
            bipartite_message: biMsg,

            raw_nodes: data.nodes,
            raw_edges: data.edges
        });
    })
    .catch(err => {
        console.error(err);
        alert("Lỗi kết nối tới Server!");
    });
}


function drawGraph(nodes, edges) {
    d3.select("#graphArea").selectAll("*").remove();

    const svgElement = document.getElementById("graphArea");
    const width = svgElement.clientWidth;
    const height = svgElement.clientHeight;

    const svg = d3.select("#graphArea")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .style("cursor", "move");

    const container = svg.append("g");

    const zoom = d3.zoom()
        .scaleExtent([0.1, 5])
        .on("zoom", (event) => {
            container.attr("transform", event.transform);
        });

    svg.call(zoom).on("dblclick.zoom", null);

    const d3Nodes = nodes.map(n => ({ id: n.id }));
    const d3Edges = edges.map(e => ({ 
        source: e.source, 
        target: e.target, 
        id: `${e.source}-${e.target}` 
    }));

    const nodeRadius = 22; 
    
    const simulation = d3.forceSimulation(d3Nodes)
        .force("link", d3.forceLink(d3Edges).id(d => d.id).distance(250)) 
        .force("charge", d3.forceManyBody().strength(-800))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collide", d3.forceCollide(50));

    container.append("defs").selectAll("marker")
        .data(["arrow"])
        .enter().append("marker")
        .attr("id", "arrow")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 10).attr("refY", 0)
        .attr("markerWidth", 6).attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path").attr("d", "M0,-5L10,0L0,5").attr("fill", "#00ff88");

    const link = container.append("g")
        .selectAll("line").data(d3Edges).enter().append("line")
        .attr("class", "edge")
        .attr("id", d => `edge-${d.source.id || d.source}-${d.target.id || d.target}`)
        .attr("stroke", "#eaee0d").attr("stroke-width", 2)
        .attr("marker-end", window.graphType === "directed" ? "url(#arrow)" : null);

    const node = container.append("g")
        .selectAll("circle").data(d3Nodes).enter().append("circle")
        .attr("class", "node")
        .attr("id", d => `node-${d.id}`) 
        .attr("r", nodeRadius - 2)
        .attr("fill", "#555").attr("stroke", "#fff").attr("stroke-width", 2)
        .call(d3.drag()
            .on("start", (event, d) => {
                if (!event.active) simulation.alphaTarget(0.3).restart();
                d.fx = d.x; d.fy = d.y;
            })
            .on("drag", (event, d) => { d.fx = event.x; d.fy = event.y; })
            .on("end", (event, d) => {
                if (!event.active) simulation.alphaTarget(0);
                d.fx = null; d.fy = null;
            }));

    const label = container.append("g")
        .selectAll("text").data(d3Nodes).enter().append("text")
        .text(d => d.id).attr("fill", "#ffffff").attr("font-size", "16px")
        .attr("dy", 5).attr("text-anchor", "middle")
        .style("pointer-events", "none").style("font-weight", "bold");

    simulation.on("tick", () => {
        link.attr("x1", d => d.source.x).attr("y1", d => d.source.y)
            .attr("x2", d => {
                const dx = d.target.x - d.source.x;
                const dy = d.target.y - d.source.y;
                const dr = Math.sqrt(dx * dx + dy * dy);
                if (dr > 0) return d.target.x - (dx * (nodeRadius + 3)) / dr;
                return d.target.x;
            })
            .attr("y2", d => {
                const dx = d.target.x - d.source.x;
                const dy = d.target.y - d.source.y;
                const dr = Math.sqrt(dx * dx + dy * dy);
                if (dr > 0) return d.target.y - (dy * (nodeRadius + 3)) / dr;
                return d.target.y;
            });
        node.attr("cx", d => d.x).attr("cy", d => d.y);
        label.attr("x", d => d.x).attr("y", d => d.y);
    });
}

function animateDFS(result) {
    if (!result || !result.steps) return;
    
    const steps = result.steps;
    const nodes = d3.selectAll(".node");
    let stepIndex = 0;
    const DELAY = 1000;

    function showStep() {
        if (stepIndex >= steps.length) return;
        
        const s = steps[stepIndex];
        
        nodes.transition().duration(500)
            .attr("fill", d => {
                if (d.id === s.current_node) return "#ff9100";
                if (s.visited.includes(d.id)) return "#00e28a";
                return "#555";
            })
            .attr("r", d => (d.id === s.current_node) ? 28 : 20)
            .style("filter", d => (d.id === s.current_node) ? "drop-shadow(0 0 10px #ff9100)" : "none");

        stepIndex++;
        setTimeout(showStep, DELAY);
    }

    showStep();
}

function colorBipartite(result) {
    if (!result) return;

    d3.selectAll(".node")
        .transition().duration(300)
        .attr("fill", "#555")
        .attr("stroke", "#fff")
        .attr("stroke-width", 2)
        .attr("r", 20);

    d3.selectAll(".edge")
        .transition().duration(300)
        .attr("stroke", "#eaee0d")
        .attr("stroke-width", 2)
        .style("opacity", 1);

    if (result.is_bipartite) {
        const sets = result.sets || result.partition || [[], []];
        const set1 = sets[0] || [];
        const set2 = sets[1] || [];

        set1.forEach(id => {
            d3.select(`#node-${id}`)
                .transition().duration(600).delay(100)
                .attr("fill", "#00ff88")
                .attr("stroke", "#00ff88")
                .attr("r", 22);
        });

        set2.forEach(id => {
            d3.select(`#node-${id}`)
                .transition().duration(600).delay(100)
                .attr("fill", "#0099ff")
                .attr("stroke", "#0099ff")
                .attr("r", 22);
        });
    } 
    
    else {
        const conflict = result.conflict_edge;
        if (conflict) {
            const u = (typeof conflict.source !== 'undefined') ? conflict.source : conflict[0];
            const v = (typeof conflict.target !== 'undefined') ? conflict.target : conflict[1];

            d3.selectAll(".node").transition().style("opacity", 0.3);
            d3.selectAll(".edge").transition().style("opacity", 0.1);

            [u, v].forEach(id => {
                d3.select(`#node-${id}`)
                    .transition().duration(500)
                    .style("opacity", 1)
                    .attr("fill", "#ff0000")
                    .attr("stroke", "#ffffff")
                    .attr("stroke-width", 3)
                    .attr("r", 28);
            });

            let edge = d3.select(`#edge-${u}-${v}`);
            if (edge.empty()) edge = d3.select(`#edge-${v}-${u}`);
            
            if (!edge.empty()) {
                edge.transition().duration(500)
                    .style("opacity", 1)
                    .attr("stroke", "#ff0000")
                    .attr("stroke-width", 6);
            }
        }
    }
}

function updateInfo(info) {
    const box = document.getElementById("infoContent");
    
    if (info.action === 'DFS' && info.result) {
        info.dfs_path = info.result.path;
        info.dfs_steps = info.result.steps;
    }

    const nodeIds = (info.raw_nodes || []).map(n => n.id);
    const edges = info.raw_edges || [];
    const isDirected = (info.mode === "directed");
    const nodesStr = nodeIds.join(", ");

    let isBi = info.is_bipartite;
    let biSets = info.bipartite_sets;
    let conflictEdge = null;

    if (info.action === 'BIPARTITE' && info.result) {
        isBi = info.result.is_bipartite;
        biSets = info.result.sets;
        conflictEdge = info.result.conflict_edge;
    }

    const hasBiInfo = (typeof isBi === "boolean");
    const biColor = hasBiInfo ? (isBi ? "#00ff99" : "#ff4704") : "#cccccc";
    const biText = !hasBiInfo ? "Chưa kiểm tra" : (isBi ? "Đồ thị HAI PHÍA (bipartite)" : "KHÔNG phải đồ thị hai phía");

    let biSetsHtml = "";
    if (isBi && Array.isArray(biSets) && biSets.length === 2) {
        biSetsHtml = `
            <p style="margin-top:4px;">
                <b style="color:#70d6ff;">Tập 1:</b> { ${biSets[0].join(", ")} }<br>
                <b style="color:#ff9100;">Tập 2:</b> { ${biSets[1].join(", ")} }
            </p>`;
    }

    let biMessageHtml = info.bipartite_message 
        ? `<p style="font-size:13px; opacity:0.85;">Ghi chú: ${info.bipartite_message}</p>` 
        : "";

    if (!isBi && conflictEdge) {
        const u = conflictEdge.source || conflictEdge[0];
        const v = conflictEdge.target || conflictEdge[1];
        biMessageHtml += `
            <div style="margin-top:8px; padding:8px; background:rgba(255, 71, 4, 0.15); border-radius:4px; border-left: 3px solid #ff4704; text-align: left;">
                <p style="color:#ff4704; margin:0; font-weight:bold; font-size:13px;">⛔ Mâu thuẫn tại cạnh: (${u} - ${v})</p>
            </div>`;
    }

    const degrees = {};
    nodeIds.forEach(id => { degrees[id] = { in: 0, out: 0, total: 0 }; });
    edges.forEach(e => {
        const u = (typeof e.source === 'object') ? e.source.id : e.source;
        const v = (typeof e.target === 'object') ? e.target.id : e.target;
        if (degrees[u] && degrees[v]) {
            if (isDirected) { degrees[u].out++; degrees[v].in++; } 
            else { degrees[u].total++; degrees[v].total++; }
        }
    });

    let degreeRows = "";
    nodeIds.forEach(id => {
        const d = degrees[id];
        if (isDirected) degreeRows += `<tr><td>${id}</td><td>${d.in}</td><td>${d.out}</td></tr>`;
        else degreeRows += `<tr><td>${id}</td><td>${d.total}</td></tr>`;
    });
    
    const degreeHeader = isDirected 
        ? "<th>Đỉnh</th><th>Vào (In)</th><th>Ra (Out)</th>" 
        : "<th>Đỉnh</th><th>Bậc (Deg)</th>";
    const degreeTable = `<table class="info-table"><tr class="header-row">${degreeHeader}</tr>${degreeRows}</table>`;

    const n = nodeIds.length;
    const matrix = Array(n).fill(null).map(() => Array(n).fill(0));
    const indexMap = {};
    nodeIds.forEach((id, i) => indexMap[id] = i);
    edges.forEach(e => {
        const u = (typeof e.source === 'object') ? e.source.id : e.source;
        const v = (typeof e.target === 'object') ? e.target.id : e.target;
        const uIdx = indexMap[u];
        const vIdx = indexMap[v];
        if (uIdx !== undefined && vIdx !== undefined) {
            matrix[uIdx][vIdx] = 1;
            if (!isDirected) matrix[vIdx][uIdx] = 1;
        }
    });

    let matrixHeader = "<th></th>" + nodeIds.map(id => `<th>${id}</th>`).join("");
    let matrixRows = "";
    for (let i = 0; i < n; i++) {
        let rowCells = matrix[i].map(val => `<td style="${val===1 ? 'color:#00e28a; font-weight:bold;' : 'color:#555;'}">${val}</td>`).join("");
        matrixRows += `<tr><td class="header-col">${nodeIds[i]}</td>${rowCells}</tr>`;
    }
    const matrixTable = `<table class="info-table matrix-table"><tr class="header-row">${matrixHeader}</tr>${matrixRows}</table>`;

    let adjRows = "";
    const adjList = info.adj_list || {};
    for (const [node, neighbors] of Object.entries(adjList)) {
        adjRows += `<tr><td style="font-weight:bold; color:#ff9100;">${node}</td><td>[ ${neighbors.join(", ")} ]</td></tr>`;
    }
    const adjTable = `<table class="info-table"><tr class="header-row"><th>Đỉnh</th><th>Kề</th></tr>${adjRows}</table>`;

    let stepsRows = "";
    (info.dfs_steps || []).forEach((s, i) => {
        const stackStr = `[${s.stack.join(", ")}]`;
        stepsRows += `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                <td style="padding:4px;">${i + 1}</td>
                <td style="color:#ff9100;">${s.current_node || "-"}</td>
                <td style="font-family:monospace; font-size:13px; color:#aaa;">${stackStr}</td>
            </tr>`;
    });
    const stepsTable = `<table class="info-table"><tr class="header-row"><th>B</th><th>Xét</th><th>Stack</th></tr>${stepsRows}</table>`;

    box.innerHTML = `
        <style>
            .info-table { width: 100%; border-collapse: collapse; font-size: 14px; text-align: center; margin-bottom: 15px; }
            .info-table th, .info-table td { border: 1px solid rgba(255,255,255,0.1); padding: 6px 4px; }
            .header-row { background: rgba(0, 226, 138, 0.15); color: #00e28a; }
            .header-col { font-weight: bold; color: #70d6ff; background: rgba(255,255,255,0.05); }
            .matrix-table td { width: 25px; height: 25px; }
            h4 { margin: 15px 0 5px 0; color: #70d6ff; font-size: 16px; text-transform: uppercase; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 3px; display: inline-block; }
        </style>

        <p><b>Chế độ:</b> ${(info.mode || "").toUpperCase()}</p>

        <!-- KẾT QUẢ BIPARTITE -->
        <p>
            <b>Đồ thị hai phía?</b>
            <span style="color:${biColor}; font-weight:600; margin-left:4px;">${biText}</span>
        </p>
        ${biSetsHtml}
        ${biMessageHtml}
        
        <h4>1. Danh Sách Đỉnh</h4>
        <p style="background:rgba(255,255,255,0.1); padding:8px; border-radius:6px;">{ ${nodesStr} }</p>

        <h4>2. Bậc Của Đỉnh</h4>
        ${degreeTable}

        <h4>3. Ma Trận Kề</h4>
        <div style="overflow-x:auto;">${matrixTable}</div>

        <h4>4. Danh Sách Kề</h4>
        ${adjTable}

        <h4>5. Đường Đi DFS</h4>
        <div style="background: rgba(0, 226, 138, 0.1); padding: 10px; border-radius: 8px; border: 1px solid #00e28a; margin-bottom: 15px;">
            <span style="color: white; font-weight:bold; font-size: 16px;">${(info.dfs_path || []).join(" &rarr; ")}</span>
        </div>

        <h4>6. Chi Tiết Các Bước</h4>
        <div style="max-height: 300px; overflow-y: auto;">${stepsTable}</div>
    `;
}
