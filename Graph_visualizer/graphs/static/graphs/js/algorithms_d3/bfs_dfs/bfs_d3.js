function isDirectedGraph() {
    return (typeof window.getGraphType === "function") ? (window.getGraphType() === "directed") : false;
}

window.isDirected = false;

function renderAdjMatrix(matrix, nodes) {
    if (!matrix || !nodes || nodes.length === 0) return "<p style='color:orange; font-style:italic;'>Server chưa trả về dữ liệu Ma trận kề.</p>";

    let html = `
        <table style="width:100%; border-collapse: collapse; text-align:center; font-size:15px;">
            <tr>
                <th style="border:1px solid #888; padding:6px; background:#1d2b57;"></th>
    `;
    nodes.forEach(n => {
        html += `<th style="border:1px solid #888; padding:6px; background:#1d2b57;">${n}</th>`;
    });
    html += `</tr>`;

    matrix.forEach((row, i) => {
        html += `<tr><th style="border:1px solid #888; padding:6px; background:#1d2b57;">${nodes[i]}</th>`;
        row.forEach(val => {
            html += `<td style="border:1px solid #888; padding:6px;">${val}</td>`;
        });
        html += `</tr>`;
    });
    html += `</table>`;
    return html;
}

function renderAdjList(adjList) {
    if (!adjList || Object.keys(adjList).length === 0) return "<p style='color:orange; font-style:italic;'>Server chưa trả về Danh sách kề.</p>";

    let html = `
        <table style="width:100%; border-collapse:collapse; font-size:15px; margin-top:5px; text-align:left;">
            <tr>
                <th style="border:1px solid #888; padding:6px;">&nbsp;</th>
                <th style="border:1px solid #888; padding:6px;">Đỉnh kề</th>
            </tr>
    `;
    Object.keys(adjList).sort().forEach(node => {
        const neighbors = Array.isArray(adjList[node]) ? adjList[node].join(", ") : "";
        html += `
            <tr>
                <td style="border:1px solid #888; padding:6px;"><b>${node}</b></td>
                <td style="border:1px solid #888; padding:6px;">${neighbors}</td>
            </tr>
        `;
    });
    html += `</table>`;
    return html;
}

function runBipartiteCheck() {
    const nodesInput = document.getElementById("nodes").value.trim();
    const edgesInput = document.getElementById("edges").value.trim();
    const startNode = document.getElementById("startNode").value.trim() || "";

    if (!nodesInput) {
        alert("Vui lòng nhập danh sách Đỉnh!");
        return;
    }

    const nodes = nodesInput.split(",").map(n => n.trim()).filter(n => n !== "");
    const gType = (typeof window.getGraphType === "function") ? window.getGraphType() : "undirected";

    const payload = {
        graphType: gType,
        nodes: nodes,
        edges: edgesInput.split(",").map(e => e.trim()).filter(e => e !== ""),
        startNode: startNode
    };

    console.log("Đang gửi Payload kiểm tra Hai phía:", payload);
    document.getElementById("infoContent").innerHTML = "Đang kiểm tra đồ thị hai phía...";

    const API_URL = "http://127.0.0.1:8000/api/graph/bfs/";

    fetch(API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(errData => {
                throw new Error(errData.error || `Lỗi server: HTTP ${response.status}`);
            });
        }
        return response.json();
    })
    .then(data => {
        console.log("Server phản hồi kiểm tra Hai phía thành công:", data);

        if (typeof drawGraph === "function") {
            drawGraph(data.nodes, data.edges, data.analysis.coloring || {});
        }

        const analysis = data.analysis || {};

        if (typeof updateInfo === "function") {
            updateInfo({
                ...analysis,
                startNode: startNode,
                bfs_path: [],
                bfs_steps: []
            });
        }
    })
    .catch(error => {
        console.error("LỖI FETCH:", error);
        const infoBox = document.getElementById("infoContent");
        if(infoBox) {
            infoBox.innerHTML = `<p style="color:red; font-weight:bold;">LỖI KẾT NỐI/SERVER: ${error.message}</p>`;
        }
    });
}

function runBFS() {
    const nodesInput = document.getElementById("nodes").value.trim();
    const edgesInput = document.getElementById("edges").value.trim();
    const startNode = document.getElementById("startNode").value.trim();

    if (!nodesInput || !startNode) {
        alert("Vui lòng nhập danh sách Đỉnh và Đỉnh bắt đầu!");
        return;
    }

    const nodes = nodesInput.split(",").map(n => n.trim()).filter(n => n !== "");
    const gType = (typeof window.getGraphType === "function") ? window.getGraphType() : "undirected";

    const payload = {
        graphType: gType,
        nodes: nodes,
        edges: edgesInput.split(",").map(e => e.trim()).filter(e => e !== ""),
        startNode: startNode
    };

    console.log("Đang gửi Payload:", payload);
    document.getElementById("infoContent").innerHTML = "Đang xử lý...";

    const API_URL = "http://127.0.0.1:8000/api/graph/bfs/";

    fetch(API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(errData => {
                throw new Error(errData.error || `Lỗi server: HTTP ${response.status}`);
            });
        }
        return response.json();
    })
    .then(data => {
        console.log("Server phản hồi thành công:", data);

        if (typeof drawGraph === "function") {
            drawGraph(data.nodes, data.edges, {});
        }

        const result = data.result || {};
        if (result.steps && typeof animateBFS === "function") {
            document.getElementById("infoContent").innerHTML = `
                <h3 style="color:#00e5ff; margin-bottom:5px;">QUÁ TRÌNH DUYỆT BFS</h3>
                <p><b>Đỉnh bắt đầu:</b> ${result.startNode}</p>
                <hr style="border-color:rgba(255,255,255,0.2);">
                <p><b>Chi tiết bước hiện tại (Log):</b></p>
                <div id="bfsLogAnimation" style="min-height:30px; font-size:16px; line-height:1.6; background:rgba(255,255,255,0.05); padding:10px; border-radius:8px;">
                    Đang khởi động...
                </div>
                <p style="color:#aaa; font-size:14px; margin-top:10px;">(Kết quả phân tích sẽ hiển thị sau khi animation kết thúc)</p>
            `;
            animateBFS(result);
        }

        const analysis = data.analysis || {};

        if (typeof updateInfo === "function") {
            setTimeout(() => {
                updateInfo({
                    ...analysis,
                    startNode: startNode,
                    bfs_path: result.path,
                    bfs_steps: result.steps
                });
            }, (result.steps.length * 1000) + 1000);
        }
    })
    .catch(error => {
        console.error("LỖI FETCH:", error);
        const infoBox = document.getElementById("infoContent");
        if(infoBox) {
            infoBox.innerHTML = `<p style="color:red; font-weight:bold;">LỖI KẾT NỐI/SERVER: ${error.message}</p>`;
        }
    });
}


window.nodeElements = null;

function drawGraph(nodes, edges, coloring = {}) {
    window.isDirected = (typeof window.getGraphType === "function" && window.getGraphType() === "directed");
    const svg = d3.select("#graphArea");
    svg.selectAll("*").remove();

    if (window.isDirected) {
        const defs = svg.append("defs");
        defs.append("marker")
            .attr("id", "arrow-fixed")
            .attr("markerUnits", "userSpaceOnUse")
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", 25)
            .attr("refY", 0)
            .attr("markerWidth", 12)
            .attr("markerHeight", 12)
            .attr("orient", "auto")
            .append("path")
            .attr("d", "M0,-5L10,0L0,5")
            .attr("fill", "#00ff88");
    }

    const svgEl = document.getElementById("graphArea");
    const width = svgEl ? (svgEl.clientWidth || 1000) : 1000;
    const height = svgEl ? (svgEl.clientHeight || 600) : 600;

    const d3Edges = edges.map(e => {
        if (typeof e === "string" && e.includes("-")) {
            const [s, t] = e.split("-"); return { source: s.trim(), target: t.trim() };
        }
        return { source: e.source, target: e.target };
    });

    const d3Nodes = nodes.map(n => {
        const node = (typeof n === 'object' ? n : { id: n });
        const colorVal = coloring[node.id];
        node.originalFill = "#1d2b57";
        if (colorVal === 0) node.originalFill = "#3498db";
        if (colorVal === 1) node.originalFill = "#9b59b6";
        return node;
    });

    const simulation = d3.forceSimulation(d3Nodes)
        .force("link", d3.forceLink(d3Edges).id(d => d.id).distance(150))
        .force("charge", d3.forceManyBody().strength(-500))
        .force("center", d3.forceCenter(width / 2, height / 2));

    const link = svg.append("g").selectAll("line").data(d3Edges).enter().append("line")
        .attr("class", "edge").attr("stroke", "#00ff88").attr("stroke-width", 3).attr("stroke-opacity", 0.6);

    if (window.isDirected) link.attr("marker-end", "url(#arrow-fixed)");

    const node = svg.append("g").selectAll("circle").data(d3Nodes).enter().append("circle")
        .attr("class", "node").attr("r", 20).attr("stroke", "#00ff88").attr("stroke-width", 2)
        .attr("fill", d => d.originalFill)
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

    window.nodeElements = node;

    const label = svg.append("g").selectAll("text").data(d3Nodes).enter().append("text")
        .text(d => d.id)
        .attr("text-anchor", "middle").attr("fill", "white")
        .attr("font-size", "16px").attr("font-weight", "bold").style("pointer-events", "none");

    function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x; d.fy = d.y;
    }
    function dragged(event, d) {
        d.fx = event.x; d.fy = event.y;
    }
    function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null; d.fy = null;
    }

    simulation.on("tick", () => {
        link.attr("x1", d => d.source.x).attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x).attr("y2", d => d.target.y);
        node.attr("cx", d => d.x).attr("cy", d => d.y);
        label.attr("x", d => d.x).attr("y", d => d.y + 6);
    });
}


function animateBFS(result) {
    const steps = result.steps || result.bfs_steps || [];
    if (!steps.length || !window.nodeElements) return;

    const svg = d3.select("#graphArea");
    const nodes = window.nodeElements;
    const edges = svg.selectAll("line");
    let i = 0;

    nodes.transition().duration(0).attr("r", 20).attr("fill", d => d.originalFill);
    edges.attr("stroke", "#00ff88").attr("stroke-width", 3);

    function stepLoop() {
        if (i >= steps.length) {
            nodes.filter(d => result.path.includes(d.id))
                 .transition().duration(800).attr("fill", "#00e5ff").attr("r", 20);
            return;
        }
        const s = steps[i];
        const logContainer = document.querySelector('#bfsLogAnimation');

        let logMessage = `<b>B${i + 1}:</b> Tại <b>${s.current_node}</b>`;

        if (s.action === 'DEQUEUE') {
             logMessage = `<b>B${i + 1}:</b> Lấy <b>${s.current_node}</b> ra khỏi Queue`;
        } else if (s.visiting_neighbor) {
            logMessage += ` → Xét <b>${s.visiting_neighbor}</b>`;
        } else if (s.action === 'START') {
            logMessage = `<b>B${i + 1}:</b> Khởi tạo: Thêm <b>${s.current_node}</b> vào Queue`;
        }

        logMessage += ` | Queue: [${(s.queue || []).join(", ")}]`;


        if (logContainer) {
             logContainer.innerHTML = `<div>${logMessage}</div>`;
        }

        nodes.filter(d => s.visited_list.includes(d.id))
             .transition().duration(400).attr("fill", "#00e5ff").attr("r", 20);

        nodes.filter(d => d.id === s.current_node)
             .transition().duration(400).attr("fill", "#f7d206").attr("r", 25);

        edges.attr("stroke", "#00ff88").attr("stroke-width", 3);
        if (s.visiting_neighbor) {
            edges.filter(l => {
                const src = l.source.id || l.source;
                const tgt = l.target.id || l.target;
                return (src === s.current_node && tgt === s.visiting_neighbor) ||
                       (!window.isDirected && src === s.visiting_neighbor && tgt === s.current_node);
            }).transition().duration(300).attr("stroke", "#ff4704").attr("stroke-width", 6);
        }

        i++;
        setTimeout(stepLoop, 1000);
    }

    stepLoop();
}


function updateInfo(info) {
    const box = document.getElementById("infoContent");

    const path = Array.isArray(info.bfs_path) ? info.bfs_path : [];
    const steps = Array.isArray(info.bfs_steps) ? info.bfs_steps : [];
    const distance = info.distance || {};

    const isBipartiteCheckOnly = path.length === 0 && steps.length === 0 && info.is_bipartite !== undefined;

    const numNodes = info.num_nodes || (info.nodes ? info.nodes.length : 0);
    const numEdges = info.num_edges || 0;

    let levelsTableHtml = "";
    if (Object.keys(distance).length > 0) {
        const levels = {};
        Object.keys(distance).forEach(node => {
            const dist = distance[node];
            if (dist !== null && dist !== -1 && dist !== undefined) {
                if (!levels[dist]) levels[dist] = [];
                levels[dist].push(node);
            }
        });

        const sortedLevels = Object.keys(levels).sort((a, b) => parseInt(a) - parseInt(b));

        if (sortedLevels.length > 0) {
            levelsTableHtml = `
                <table style="width:100%; border-collapse: collapse; text-align:center; font-size:15px; margin-top:10px;">
                    <tr>
                        <th style="border:1px solid #888; padding:6px; background:#1d2b57;">BẬC</th>
                        <th style="border:1px solid #888; padding:6px; background:#1d2b57;">CÁC ĐỈNH</th>
                    </tr>
            `;
            sortedLevels.forEach(level => {
                levelsTableHtml += `
                    <tr>
                        <td style="border:1px solid #888; padding:6px;"><b>${level}</b></td>
                        <td style="border:1px solid #888; padding:6px;">${levels[level].sort().join(', ')}</td>
                    </tr>
                `;
            });
            levelsTableHtml += `</table>`;
        }
    }

    let stepsRows = "";
    (steps || []).forEach((s, i) => {
        const queueStr = `[${(s.queue || []).join(", ")}]`;
        const visitedStr = `[${(s.visited_list || []).join(", ")}]`;

        let currentNode = s.current_node || "-";
        if (s.action === 'DEQUEUE' || s.action === 'START') {
            currentNode = `<span style="color:#ff9100; font-weight:bold;">${s.current_node}</span>`;
        } else if (s.visiting_neighbor) {
            currentNode = s.current_node;
        }

        stepsRows += `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
                <td style="padding:8px;">${i}</td>
                <td style="padding:8px;">${currentNode}</td>
                <td style="padding:8px; color:#00aaff; font-weight:bold;">${queueStr}</td>
                <td style="padding:8px; color:#00e28a;">${visitedStr}</td>
            </tr>
        `;
    });

    const stepsTable = `
        <table style="width:100%; border-collapse:collapse; font-size:14px; text-align:center;">
            <tr style="background:rgba(255,255,255,0.1); color:#70d6ff;">
                <th>B</th>
                <th>Đỉnh xét</th>
                <th>Queue</th>
                <th>Đã duyệt</th>
            </tr>
            ${stepsRows}
        </table>
    `;

    const isBipartite = info.is_bipartite;
    const coloring = info.coloring || {};

    let bipartiteStatus = "";
    if (isBipartite === true) {
        bipartiteStatus = `<span style="color:lightgreen; font-weight:bold;">CÓ</span>`;
    } else if (isBipartite === false) {
        bipartiteStatus = `<span style="color:red; font-weight:bold;">KHÔNG</span>`;
    } else {
        bipartiteStatus = `<span style="color:orange;">(Chưa kiểm tra)</span>`;
    }

    const set1 = Object.keys(coloring).filter(k => coloring[k] === 0).sort().join(', ') || 'N/A';
    const set2 = Object.keys(coloring).filter(k => coloring[k] === 1).sort().join(', ') || 'N/A';

    const mainTitle = isBipartiteCheckOnly ?
                      `<h3 style="color:#f39c12; margin-bottom:5px;">KẾT QUẢ KIỂM TRA HAI PHÍA</h3>` :
                      `<h3 style="color:#00e5ff; margin-bottom:5px;">KẾT QUẢ PHÂN TÍCH BFS</h3>`;


    box.innerHTML = `
        ${mainTitle}
        <p><b>Đỉnh bắt đầu:</b> ${info.startNode || (isBipartiteCheckOnly ? '(Không áp dụng)' : 'N/A')}</p>
        <p><b>Số đỉnh:</b> ${numNodes} | <b>Số cạnh:</b> ${numEdges}</p>

        <hr style="border-color:rgba(255,255,255,0.2);">

        ${!isBipartiteCheckOnly ? `
            <div style="background:rgba(0,0,0,0.3); padding:10px; border-radius:8px; margin: 10px 0;">
                <p style="color:#f7d206; font-size:18px; margin:0;">
                    <b>Thứ tự duyệt BFS:</b><br> ${path.length > 0 ? path.join(" &rarr; ") : "Chưa có kết quả"}
                </p>
            </div>

            <p class="neon-title" style="margin-top: 15px;">THÔNG TIN BẬC (LEVEL)</p>
            ${levelsTableHtml}
            <hr style="border-color:rgba(255,255,255,0.2);">

            <p class="neon-title">CHI TIẾT TỪNG BƯỚC (TRACE)</p>
            <div style="max-height: 300px; overflow-y: auto;">
                ${stepsTable}
            </div>
            <hr style="border-color:rgba(255,255,255,0.2);">
        ` : ''}


        <p><b>Đồ thị Hai phía (Bipartite):</b> ${bipartiteStatus}</p>
        ${isBipartite === true ? `
            <div style="font-size:14px; margin-left:15px;">
                <p style="color:#3498db; margin:5px 0;"><b>Tập đỉnh 1 (Màu Xanh):</b> ${set1}</p>
                <p style="color:#9b59b6; margin:5px 0;"><b>Tập đỉnh 2 (Màu Tím):</b> ${set2}</p>
            </div>
        ` : ''}
        <hr style="border-color:rgba(255,255,255,0.2);">

        <p><b>Ma trận kề:</b></p> ${renderAdjMatrix(info.adj_matrix, info.nodes)}
        <br>
        <p><b>Danh sách kề:</b></p> ${renderAdjList(info.adj_list)}
    `;

}