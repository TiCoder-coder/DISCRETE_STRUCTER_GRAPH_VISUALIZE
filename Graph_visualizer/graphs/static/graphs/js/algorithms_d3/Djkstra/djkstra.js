let selectedDijkstraType = "directed";

function setDijkstraGraphType(type) {
    selectedDijkstraType = type;
    console.log("Đã chọn kiểu:", type);
}

function runDijkstraFinal() {
    console.log("Run Dijkstra clicked");

    const nodes = document.getElementById("nodes").value
        .split(",")
        .map(x => x.trim())
        .filter(Boolean);

    const edges = document.getElementById("edges").value
        .split(",")
        .map(x => x.trim())
        .filter(Boolean);

    const startNode = document.getElementById("startNode").value.trim();
    const endNode = document.getElementById("endNode").value.trim();
    const graphType = window.getGraphType();

    if (!nodes.includes(startNode) || !nodes.includes(endNode)) {
        alert("Đỉnh bắt đầu hoặc kết thúc không hợp lệ!");
        return false;
    }

    fetch("/api/graph/dijkstra/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            graphType: graphType,
            nodes: nodes,
            edges: edges,
            startNode: startNode,
            endNode: endNode
        })
    })
    .then(res => res.json())
    .then(data => {
        console.log("Dijkstra API data:", data);

        if (data.error) {
            alert(data.error);
            return;
        }

        drawGraph(data.nodes, data.edges, data.result);
        animateDijkstra(data.result);

        updateInfo({
            ...data.analysis,
            dijkstra_path: data.result.path,
            dijkstra_steps: data.result.steps
        });
    })
    .catch(err => {
        console.error("Dijkstra fetch error:", err);
        alert("Lỗi gọi API Dijkstra (xem console).");
    });

    return false;
}

function drawGraph(nodes, edges, result) {
    const svg = d3.select("#graphArea");
    svg.selectAll("*").remove();

    const width  = svg.node().clientWidth;
    const height = svg.node().clientHeight;
    const nodeRadius = 22;

    const path = result.path || [];
    const startId = path.length ? path[0] : null;
    const endId   = path.length ? path[path.length - 1] : null;
    const graphType = window.getGraphType();

    const defs = svg.append("defs");
    defs.append("marker")
        .attr("id", "arrowhead")
        .attr("viewBox", "-10 -5 10 10")
        .attr("refX", 0)
        .attr("refY", 0)
        .attr("markerWidth", 8)
        .attr("markerHeight", 8)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M-10,-5 L0,0 L-10,5")
        .attr("fill", "#00ffcc");
    const weights = edges.map(e => e.weight ?? 1);

    let linkDistance;
    if (weights.length) {
        const minW = Math.min(...weights);
        const maxW = Math.max(...weights);

        const MIN_DIST = 120;
        const MAX_DIST = 260;

        if (minW === maxW) {
            linkDistance = () => 200;
        } else {
            const distScale = d3.scaleLinear()
                .domain([minW, maxW])
                .range([MIN_DIST, MAX_DIST]);

            linkDistance = w => distScale(w ?? minW);
        }
    } else {
        linkDistance = () => 200;
    }

    const simulation = d3.forceSimulation(nodes)
        .force("link",
            d3.forceLink(edges)
                .id(d => d.id)
                .distance(d => linkDistance(d.weight))
                .strength(0.4)
        )
        .force("charge", d3.forceManyBody().strength(-700))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collision", d3.forceCollide().radius(45));


    const link = svg.append("g")
        .attr("class", "edges")
        .selectAll("line")
        .data(edges)
        .enter().append("line")
        .attr("class", "edge")
        .attr("marker-end", d =>
            graphType === "directed" ? "url(#arrowhead)" : null
        );

    const edgeLabel = svg.append("g")
        .attr("class", "edge-labels")
        .selectAll("text")
        .data(edges)
        .enter().append("text")
        .attr("class", "edge-label")
        .attr("font-size", 18)
        .attr("font-weight", "700")
        .attr("fill", "#ffffff")
        .attr("stroke", "#000000")
        .attr("stroke-width", 3)
        .attr("paint-order", "stroke")
        .text(d => d.weight != null ? d.weight : "");


    const node = svg.append("g")
        .attr("class", "nodes")
        .selectAll("circle")
        .data(nodes)
        .enter().append("circle")
        .attr("r", 22)
        .attr("class", d => {
            let cls = "node";
            if (d.id === startId) cls += " start-node";
            if (d.id === endId)   cls += " end-node";
            return cls;
        });

    node.append("title")
        .text(d => `Đỉnh ${d.id}`);

    const label = svg.append("g")
        .attr("class", "node-labels")
        .selectAll("text")
        .data(nodes)
        .enter().append("text")
        .text(d => d.id)
        .attr("text-anchor", "middle")
        .attr("dy", 5)
        .attr("fill", "#fff")
        .attr("font-size", "16px");

    simulation.on("tick", () => {
        link
            .attr("x1", d => {
                const dx = d.target.x - d.source.x;
                const dy = d.target.y - d.source.y;
                const len = Math.sqrt(dx * dx + dy * dy) || 1;
                const r = 24;
                const offsetSource = (graphType === "directed") ? 0 : r;
                return d.source.x + dx * offsetSource / len;
            })
            .attr("y1", d => {
                const dx = d.target.x - d.source.x;
                const dy = d.target.y - d.source.y;
                const len = Math.sqrt(dx * dx + dy * dy) || 1;
                const r = 24;
                const offsetSource = (graphType === "directed") ? 0 : r;
                return d.source.y + dy * offsetSource / len;
            })
            .attr("x2", d => {
                const dx = d.target.x - d.source.x;
                const dy = d.target.y - d.source.y;
                const len = Math.sqrt(dx * dx + dy * dy) || 1;
                const r = 24;
                return d.target.x - dx * r / len;
            })
            .attr("y2", d => {
                const dx = d.target.x - d.source.x;
                const dy = d.target.y - d.source.y;
                const len = Math.sqrt(dx * dx + dy * dy) || 1;
                const r = 24;
                return d.target.y - dy * r / len;
            });

        edgeLabel
            .attr("x", d => (d.source.x + d.target.x) / 2)
            .attr("y", d => (d.source.y + d.target.y) / 2 - 4);

        node
            .attr("cx", d => d.x)
            .attr("cy", d => d.y);

        label
            .attr("x", d => d.x)
            .attr("y", d => d.y);
    });


}


function animateDijkstra(result) {
    const steps = result.steps || [];
    if (!steps.length) return;

    const svg = d3.select("#graphArea");
    const nodesSel = svg.selectAll("circle");
    const linksSel = svg.selectAll("line");

    const path = result.path || [];

    const pathEdges = new Set();
    for (let i = 0; i + 1 < path.length; i++) {
        pathEdges.add(`${path[i]}-${path[i + 1]}`);
    }

    const STEP_DELAY = 1000;
    let stepIndex = 0;

    function highlightStep() {
        const s = steps[stepIndex];
        if (!s) return;

        nodesSel.transition().duration(300).attr("fill", d => {
            if (s.marked.includes(d.id)) return "#00e676";
            if (d.id === s.current) return "#ff3d00";
            return "#ffd700";
        });

        stepIndex++;
        if (stepIndex < steps.length) {
            setTimeout(highlightStep, STEP_DELAY);
                } else {
            const path = result.path || [];
            if (!path.length) return;

            const startNode = path[0];
            const endNode   = path[path.length - 1];

            nodesSel.transition().duration(500)
                .attr("fill", d => {
                    if (d.id === startNode) return "#00e676";
                    if (d.id === endNode)   return "#ff5252";
                    return path.includes(d.id) ? "#00bcd4" : "#ffd700";
                })
                .attr("stroke", d => path.includes(d.id) ? "#ffffff" : "none")
                .attr("stroke-width", d => path.includes(d.id) ? 3 : 0);

            linksSel.transition().duration(500)
                .style("stroke", l => {
                    const a = typeof l.source === "object" ? l.source.id : l.source;
                    const b = typeof l.target === "object" ? l.target.id : l.target;
                    const key1 = `${a}-${b}`;
                    const key2 = `${b}-${a}`;
                    return (pathEdges.has(key1) || pathEdges.has(key2))
                        ? "#ff9800"
                        : "#00ffcc";
                })
                .style("stroke-width", l => {
                    const a = typeof l.source === "object" ? l.source.id : l.source;
                    const b = typeof l.target === "object" ? l.target.id : l.target;
                    const key1 = `${a}-${b}`;
                    const key2 = `${b}-${a}`;
                    return (pathEdges.has(key1) || pathEdges.has(key2)) ? 6 : 3;
                })
                .classed("shortest-edge", l => {
                    const a = typeof l.source === "object" ? l.source.id : l.source;
                    const b = typeof l.target === "object" ? l.target.id : l.target;
                    const key1 = `${a}-${b}`;
                    const key2 = `${b}-${a}`;
                    return (pathEdges.has(key1) || pathEdges.has(key2));
                })
                .raise();
        }


    }

    highlightStep();
}

function updateInfo(info) {
    const box = document.getElementById("infoContent");
    if (!info) {
        box.textContent = "Không có dữ liệu...";
        return;
    }

    function renderDistTable(distTable) {
        if (!distTable || !distTable.length) return "<p>Không có dữ liệu.</p>";

        const allNodes = new Set();
        distTable.forEach(row => {
            Object.keys(row).forEach(k => allNodes.add(k));
        });
        const nodes = Array.from(allNodes).sort();

        let html = `<table class="info-table"><thead><tr><th>Bước</th>`;
        nodes.forEach(n => html += `<th>${n}</th>`);
        html += `</tr></thead><tbody>`;

        distTable.forEach((row, i) => {
            html += `<tr><td>${i + 1}</td>`;
            nodes.forEach(n => {
                const val = (row[n] !== undefined) ? row[n] : "∞";
                html += `<td>${val}</td>`;
            });
            html += `</tr>`;
        });

        html += `</tbody></table>`;
        return html;
    }

    function renderMarkedTable(markedStatus) {
        if (!markedStatus || !markedStatus.length) return "<p>Không có dữ liệu.</p>";

        let html = `<table class="info-table">
            <thead>
                <tr>
                    <th>Bước</th>
                    <th>Current</th>
                    <th>Đã đánh dấu</th>
                    <th>Chưa đánh dấu</th>
                </tr>
            </thead>
            <tbody>`;

        markedStatus.forEach((s, idx) => {
            html += `<tr>
                <td>${s.step || idx + 1}</td>
                <td>${s.current}</td>
                <td class="text-left">${(s.marked || []).join(", ")}</td>
                <td class="text-left">${(s.unmarked || []).join(", ")}</td>
            </tr>`;
        });

        html += `</tbody></table>`;
        return html;
    }

    function renderDegreeTable(degree) {
        if (!degree) return "<p>Không có dữ liệu.</p>";
        const nodes = Object.keys(degree).sort();

        let html = `<table class="info-table">
            <thead><tr><th>Đỉnh</th><th>Bậc</th></tr></thead><tbody>`;

        nodes.forEach(n => {
            html += `<tr><td>${n}</td><td>${degree[n]}</td></tr>`;
        });

        html += `</tbody></table>`;
        return html;
    }

    function renderAdjList(adjList) {
        if (!adjList) return "<p>Không có dữ liệu.</p>";
        const nodes = Object.keys(adjList).sort();

        let html = `<table class="info-table">
            <thead><tr><th>Đỉnh</th><th>Các đỉnh kề (đỉnh, trọng số)</th></tr></thead><tbody>`;

        nodes.forEach(n => {
            const neigh = (adjList[n] || [])
                .map(([v, w]) => `${v} (${w})`)
                .join(", ");
            html += `<tr><td>${n}</td><td class="text-left">${neigh}</td></tr>`;
        });

        html += `</tbody></table>`;
        return html;
    }

    function renderAdjMatrix(matrix, degree) {
        if (!matrix || !matrix.length) return "<p>Không có dữ liệu.</p>";
        let nodes = degree ? Object.keys(degree).sort() : matrix.map((_, i) => i);

        let html = `<table class="info-table">
            <thead>
                <tr><th></th>`;
        nodes.forEach(n => html += `<th>${n}</th>`);
        html += `</tr></thead><tbody>`;

        matrix.forEach((row, i) => {
            const rowName = nodes[i] || i;
            html += `<tr><td>${rowName}</td>`;
            row.forEach(val => {
                html += `<td>${val}</td>`;
            });
            html += `</tr>`;
        });

        html += `</tbody></table>`;
        return html;
    }

    function renderEdgeWeight(edgeWeights) {
        if (!edgeWeights) return "<p>Không có dữ liệu.</p>";
        const edges = Object.keys(edgeWeights).sort();

        let html = `<table class="info-table">
            <thead><tr><th>Cạnh</th><th>Trọng số</th></tr></thead><tbody>`;

        edges.forEach(e => {
            html += `<tr><td>${e}</td><td>${edgeWeights[e]}</td></tr>`;
        });

        html += `</tbody></table>`;
        return html;
    }

    function renderStepTable(steps) {
        if (!steps || !steps.length) return "<p>Không có dữ liệu.</p>";

        let html = `<table class="info-table">
            <thead>
                <tr>
                    <th>Bước</th>
                    <th>Current</th>
                    <th>Đã đánh dấu</th>
                    <th>Chưa đánh dấu</th>
                    <th>Khoảng cách</th>
                </tr>
            </thead><tbody>`;

        steps.forEach((s, idx) => {
            const distStr = s.distance
                ? Object.entries(s.distance)
                    .map(([k,v]) => `${k}: ${v}`)
                    .join(", ")
                : "";
            html += `<tr>
                <td>${idx + 1}</td>
                <td>${s.current}</td>
                <td class="text-left">${(s.marked || []).join(", ")}</td>
                <td class="text-left">${(s.unmarked || []).join(", ")}</td>
                <td class="text-left">${distStr}</td>
            </tr>`;
        });

        html += `</tbody></table>`;
        return html;
    }

    let html = `<p><b>Thông tin thuật toán Dijkstra</b></p>`;

    if (info.dijkstra_path && info.dijkstra_path.length) {
        html += `<div class="path-chip">
                    Đường đi ngắn nhất:
                    <span>${info.dijkstra_path.join(" → ")}</span>
                 </div>`;
    }

    html += `<div class="info-section-title">1. Bảng khoảng cách theo từng bước</div>`;
    html += renderDistTable(info.dist_table);

    html += `<div class="info-section-title">2. Trạng thái đánh dấu (Marked / Unmarked)</div>`;
    html += renderMarkedTable(info.marked_status);

    html += `<div class="info-section-title">3. Bậc các đỉnh</div>`;
    html += renderDegreeTable(info.degree);

    html += `<div class="info-section-title">4. Danh sách kề</div>`;
    html += renderAdjList(info.adj_list);

    html += `<div class="info-section-title">5. Ma trận kề</div>`;
    html += renderAdjMatrix(info.adj_matrix, info.degree);

    html += `<div class="info-section-title">6. Trọng số các cạnh</div>`;
    html += renderEdgeWeight(info.edge_weights);

    html += `<div class="info-section-title">7. Các bước thực hiện (steps)</div>`;
    html += renderStepTable(info.dijkstra_steps);

    box.innerHTML = html;
}
function loadPdfText() {
    const box = document.getElementById("pdfTextBox");
    if (!box) return;

    box.innerHTML = "Đang tải nội dung PDF...";

    fetch("/api/pdf-text/dijkstra/")
        .then(res => res.json())
        .then(data => {
            box.innerHTML = data.html || "Không có nội dung.";
        })
        .catch(err => {
            console.error(err);
            box.innerHTML = "Lỗi tải nội dung PDF.";
        });
}
