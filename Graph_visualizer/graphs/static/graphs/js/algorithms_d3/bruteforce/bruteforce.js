let bfSVG, bfLink, bfNode, bfLabel, bfWeightLabel, bfSimulation;
let isDirected = false;
const graphInfoBox = document.getElementById("graphInfoBox");

const nodesInput = document.getElementById("nodes");
const edgesInput = document.getElementById("edges");
const startNode = document.getElementById("startNode");
const endNode = document.getElementById("endNode");
const btnUndirected = document.getElementById("btnUndirected");
const btnDirected = document.getElementById("btnDirected");
const infoContent = document.getElementById("infoContent");
const totalWeight = document.getElementById("totalWeight");

btnUndirected.onclick = () => {
    isDirected = false;
    btnUndirected.classList.add("active");
    btnDirected.classList.remove("active");
};

btnDirected.onclick = () => {
    isDirected = true;
    btnDirected.classList.add("active");
    btnUndirected.classList.remove("active");
};

nodesInput.addEventListener("input", () => {
    const list = nodesInput.value.split(",").map(s => s.trim()).filter(Boolean);
    startNode.innerHTML = endNode.innerHTML = '<option value="">-- Chọn đỉnh --</option>';
    list.forEach(n => {
        startNode.add(new Option(n, n));
        endNode.add(new Option(n, n));
    });
});

function getNodeId(node) { 
    return typeof node === 'object' ? (node.id || node) : node; 
}

function highlightPath(path, color) {
    const baseWidth = 4;

    for (let j = 0; j < path.length - 1; j++) {
        const sourceId = path[j];
        const targetId = path[j + 1];
        const pathEdgeKey = [sourceId, targetId].sort().join('-');

        bfLink.filter(d => {
            const s = d.source.id || d.source;
            const t = d.target.id || d.target;

            if (isDirected) {
                return s === sourceId && t === targetId;
            } else {
                const key = [s, t].sort().join('-');
                return key === pathEdgeKey;
            }
        })
        .attr("stroke", color)
        .attr("stroke-width", baseWidth)
        .style("filter", `drop-shadow(0 0 4px ${color})`);
    }
}

function parseEdges(str) {
    if (!str.trim()) return [];
    return str.split(",").map(s => s.trim()).filter(Boolean).map((e, i) => {
        const p = e.split("-").map(x => x.trim());
        if (p.length !== 3) throw new Error(`Cạnh sai định dạng (dòng ${i+1}): ${e}`);
        const w = Number(p[2]);
        if (isNaN(w)) throw new Error(`Trọng số không hợp lệ: ${p[2]}`);
        return { source: p[0], target: p[1], weight: w };
    });
}

function initGraph() {
    bfSVG = d3.select("#graphArea");
    bfSVG.selectAll("*").remove();

    const defs = bfSVG.append("defs");

    defs.append("marker")
        .attr("id", "arrow")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 25)
        .attr("refY", 0)
        .attr("markerWidth", 3)
        .attr("markerHeight", 5)
        .attr("orient", "auto-start-reverse")
        .append("path")
        .attr("d", "M0,-5L10,0L0,5")
        .attr("fill", "#ffe100");
}

function drawGraph(nodes, rawEdges) {
    const width = bfSVG.node().clientWidth;
    const height = bfSVG.node().clientHeight;

    const nodeData = nodes.map(id => ({ id }));

    let links = rawEdges;
    if (!isDirected) {
        const set = new Set();
        links = [];
        rawEdges.forEach(e => {
            const k1 = `${e.source}-${e.target}`;
            const k2 = `${e.target}-${e.source}`;
            if (!set.has(k1)) {
                set.add(k1);
                set.add(k2);
                links.push({ source: e.source, target: e.target, weight: e.weight });
                if (e.source !== e.target) {
                    links.push({ source: e.target, target: e.source, weight: e.weight });
                }
            }
        });
    }

    bfSimulation = d3.forceSimulation(nodeData)
        .force("link", d3.forceLink(links).id(d => d.id).distance(220))
        .force("charge", d3.forceManyBody().strength(-900))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collision", d3.forceCollide().radius(70));

    bfLink = bfSVG.append("g").selectAll("line")
        .data(links)
        .enter()
        .append("line")
        .attr("stroke", "#888")
        .attr("stroke-width", 4)
        .attr("marker-end", d => isDirected ? "url(#arrow)" : null);

    bfNode = bfSVG.append("g").selectAll("circle")
        .data(nodeData)
        .enter()
        .append("circle")
        .attr("r", 25)
        .attr("fill", "#666");

    bfLabel = bfSVG.append("g").selectAll("text")
        .data(nodeData)
        .enter()
        .append("text")
        .text(d => d.id)
        .attr("font-size", 28)
        .attr("fill", "white")
        .attr("font-weight", "bold")
        .attr("text-anchor", "middle")
        .attr("dy", 10);

    bfWeightLabel = bfSVG.append("g").selectAll("text")
        .data(links.filter(d => isDirected || getNodeId(d.source) < getNodeId(d.target)))
        .enter()
        .append("text")
        .text(d => d.weight)
        .attr("font-size", 20)
        .attr("fill", "#ffff00")
        .attr("text-anchor", "middle")
        .attr("font-weight", "bold");

    bfSimulation.on("tick", () => {
        const nodeRadius = 25;

        bfLink
            .attr("x1", d => {
                const dx = d.target.x - d.source.x;
                const dy = d.target.y - d.source.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                return d.source.x + dx / dist * nodeRadius;
            })
            .attr("y1", d => {
                const dx = d.target.x - d.source.x;
                const dy = d.target.y - d.source.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                return d.source.y + dy / dist * nodeRadius;
            })
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        bfNode.attr("cx", d => d.x).attr("cy", d => d.y);
        bfLabel.attr("x", d => d.x).attr("y", d => d.y);

        bfWeightLabel
            .attr("x", d => (d.source.x + d.target.x) / 2)
            .attr("y", d => (d.source.y + d.target.y) / 2 - 10);
    });
}

function runAnimation(steps, bestCost, bestPath) {
    infoContent.innerHTML = `<span style="color:#79d7ff;font-size:1.4em;font-weight:bold;">Bắt đầu vét cạn tất cả các đường đi...</span><br><br>`;
    totalWeight.textContent = bestCost ?? "...";

    bfLink.attr("stroke", "#888").attr("stroke-width", 4).style("filter", "none");
    bfNode.attr("fill", "#666").attr("r", 25);

    const safeBestPath = Array.isArray(bestPath) ? bestPath : [];
    const safeSteps = Array.isArray(steps) ? steps.filter(s => s && Array.isArray(s.path) && s.path.length >= 2) : [];

    let i = 0;
    let currentBestCost = Infinity;

    const FINAL_COLOR = "#00ff62";
    const DUYET_COLOR = "#ffff00";

    function next() {
        if (i >= safeSteps.length) {
            bfLink.attr("stroke", "#888").attr("stroke-width", 4).style("filter", "none");
            bfNode.attr("fill", "#666").attr("r", 25);

            if (safeBestPath.length >= 2) {
                highlightPath(safeBestPath, FINAL_COLOR);
                bfNode.filter(d => safeBestPath.includes(d.id))
                      .attr("fill", FINAL_COLOR)
                      .attr("r", 25);
            }

            const finalText = safeBestPath.length >= 2 
                ? `${safeBestPath.join(" → ")} = ${bestCost}` 
                : "KHÔNG TÌM THẤY ĐƯỜNG ĐI";

            infoContent.innerHTML += `<br><span style="color:#00ff9d; font-size:1.6em; font-weight:bold;">
                HOÀN TẤT! Đường ngắn nhất: <span style="color:${FINAL_COLOR};">${finalText}</span>
            </span>`;

            if (safeSteps.length === 0) {
                infoContent.innerHTML += `<br><span style="color:#ff6666;">(Không có đường đi hợp lệ nào được duyệt)</span>`;
            }
            return;
        }

        const step = safeSteps[i];
        if (!step) { i++; next(); return; }

        const path = step.path;
        const cost = step.cost ?? "?";

        bfNode.attr("r", 25).attr("fill", "#666");
        bfLink.attr("stroke", "#888").attr("stroke-width", 4).style("filter", "none");

        const currentNode = path[path.length - 1];
        const previousNode = path[path.length - 2];

        let edgeWeight = 0;
        for (const link of bfLink.data()) {
            const s = link.source.id || link.source;
            const t = link.target.id || link.target;
            if (s === previousNode && t === currentNode) {
                edgeWeight = link.weight;
                break;
            }
        }

        const previousCost = (cost !== '?' && cost >= edgeWeight) ? (cost - edgeWeight) : 0;

        let statusText = "Đang thử";
        if (cost !== "?" && cost < currentBestCost) {
            currentBestCost = cost;
            statusText = "NGẮN HƠN MỚI";
        } else if (cost !== "?" && cost >= currentBestCost) {
            statusText = "Dài hơn / Bằng";
        } else if (cost === "?") {
            statusText = "Đường đi không hợp lệ";
        }

        highlightPath([previousNode, currentNode], DUYET_COLOR);

        bfNode.filter(d => d.id === currentNode)
            .attr("fill", "#ff0000")
            .attr("r", 30);

        bfNode.filter(d => d.id === previousNode)
            .attr("fill", FINAL_COLOR)
            .attr("r", 28);

        infoContent.innerHTML += `
            <div style="margin-bottom: 8px;">
                <h4 style="color:#00ff9d;">Bước ${i + 1}: Xét đường đi hoàn chỉnh</h4>
                <p style="margin: 5px 0;">
                    Cạnh cuối cùng: <b style="color:#ffff00;">${previousNode} → ${currentNode}</b> (Trọng số: ${edgeWeight})<br>
                    Cost trước đó: <b style="color:${FINAL_COLOR};">${previousCost}</b> → Cost tích lũy: <b style="color:#ff6666;">${cost}</b><br>
                    Đường đi hiện tại: [${path.join(' → ')}]
                </p>
                <p style="font-weight:bold; color: ${statusText === "NGẮN HƠN MỚI" ? FINAL_COLOR : '#79d7ff'}; margin: 5px 0;">
                    Trạng thái: ${statusText} (Tốt nhất hiện tại: ${currentBestCost === Infinity ? '∞' : currentBestCost})
                </p>
            </div>
            <hr style="border-color:#333;">
        `;
        infoContent.scrollTop = infoContent.scrollHeight;

        highlightPath(path, DUYET_COLOR);

        setTimeout(() => {
            i++;
            next();
        }, 1200);
    }

    if (safeSteps.length === 0) {
        infoContent.innerHTML += `<span style="color:#ff6666; font-size:1.3em;">
            Không có đường đi hợp lệ nào để thử!<br>
            (Kiểm tra lại: có cạnh nào từ đỉnh bắt đầu không?)
        </span>`;
        totalWeight.textContent = "∞";
    } else {
        next();
    }
}
function renderGraphInfo(analysis) {
    if (!graphInfoBox) return;
    if (!analysis) {
        graphInfoBox.innerHTML = "Không có dữ liệu đồ thị.";
        return;
    }

    const nodes      = analysis.nodes || [];
    const degree     = analysis.degree || {};
    const adjList    = analysis.adj_list || {};
    const adjMatrix  = analysis.adj_matrix || [];
    const edgeW      = analysis.edge_weights || {};

    let html = "";

    html += '<div class="info-section-title">1. Bậc các đỉnh</div>';
    html += '<table class="info-table"><thead><tr><th>Đỉnh</th><th>Bậc</th></tr></thead><tbody>';
    Object.keys(degree).sort().forEach(n => {
        html += `<tr><td>${n}</td><td>${degree[n]}</td></tr>`;
    });
    html += '</tbody></table>';

    html += '<div class="info-section-title">2. Danh sách kề</div>';
    html += '<table class="info-table"><thead><tr><th>Đỉnh</th><th>Các đỉnh kề (đỉnh, trọng số)</th></tr></thead><tbody>';
    Object.keys(adjList).sort().forEach(u => {
        const arr = adjList[u] || [];
        const text = arr.map(([v, w]) => `${v} (${w})`).join(", ");
        html += `<tr><td>${u}</td><td class="text-left">${text}</td></tr>`;
    });
    html += '</tbody></table>';

    if (nodes.length && adjMatrix.length) {
        html += '<div class="info-section-title">3. Ma trận kề</div>';
        html += '<table class="info-table"><thead><tr><th></th>';
        nodes.forEach(n => html += `<th>${n}</th>`);
        html += '</tr></thead><tbody>';

        adjMatrix.forEach((row, i) => {
            html += `<tr><td>${nodes[i]}</td>`;
            row.forEach(val => {
                html += `<td>${val}</td>`;
            });
            html += '</tr>';
        });

        html += '</tbody></table>';
    }

    html += '<div class="info-section-title">4. Trọng số các cạnh</div>';
    html += '<table class="info-table"><thead><tr><th>Cạnh</th><th>Trọng số</th></tr></thead><tbody>';
    Object.keys(edgeW).sort().forEach(e => {
        html += `<tr><td>${e}</td><td>${edgeW[e]}</td></tr>`;
    });
    html += '</tbody></table>';

    graphInfoBox.innerHTML = html;
}

function runBruteforceMain() {
    try {
        const nodes = nodesInput.value.split(",").map(s => s.trim()).filter(Boolean);
        if (nodes.length < 2) throw "Cần ít nhất 2 đỉnh!";

        let edges;
        try {
            edges = parseEdges(edgesInput.value);
        } catch (err) {
            edges = edgesInput.value.trim();
        }

        const start = startNode.value.trim();
        const end = endNode.value.trim();
        if (!start || !end) throw "Chọn đỉnh bắt đầu và kết thúc!";

        initGraph();
        drawGraph(nodes, edges);

        fetch("/api/graph/bruteforce/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                nodes,
                edges: nodesInput.value.includes("-")
                    ? edgesInput.value.trim()
                    : edges.map(e => ({
                        source: typeof e.source === "object" ? e.source.id : e.source,
                        target: typeof e.target === "object" ? e.target.id : e.target,
                        weight: e.weight || 1
                    })),
                startNode: start,
                endNode: end,
                directed: isDirected
            })
        })
        .then(r => r.ok ? r.json() : Promise.reject("Lỗi server"))
        .then(data => {
            if (!data || typeof data !== "object") {
                throw new Error("Dữ liệu trả về không hợp lệ");
            }

            if (data.analysis) {
                renderGraphInfo(data.analysis);
            } else {
                renderGraphInfo(null);
            }

            if (!data.best_path || data.best_cost === -1 || data.best_cost === null) {
                infoContent.innerHTML = "<span style='color:#ff4466; font-size:1.5em;'>KHÔNG TÌM THẤY ĐƯỜNG ĐI!</span>";
                totalWeight.textContent = "∞";
                return;
            }

            totalWeight.textContent = data.best_cost;
            runAnimation(data.steps || [], data.best_cost, data.best_path || []);
        })

        .catch(err => {
            infoContent.innerHTML = `<span style="color:red; font-size:1.5em;">LỖI: ${err.message || err}</span>`;
        });

    } catch (err) {
        infoContent.innerHTML = `<span style="color:red; font-size:1.5em;">${err}</span>`;
    }
}
