let selectedMode = "directed"; // Mặc định

// --- 1. CÁC HÀM RENDER BẢNG (Giữ nguyên form của bạn) ---
function renderAdjMatrix(matrix, nodes) {
    let html = `<table class="matrix-table">`;
    html += `<tr><th class="top-left"></th>`;
    nodes.forEach(n => { html += `<th class="matrix-header">${n}</th>`; });
    html += `</tr>`;
    matrix.forEach((row, i) => {
        html += `<tr><th class="matrix-row-header">${nodes[i]}</th>`;
        row.forEach(val => { html += `<td>${val}</td>`; });
        html += `</tr>`;
    });
    html += `</table>`;
    return html;
}

function renderAdjList(adjList) {
    let html = `
        <table class="adj-table">
            <tr>
                <th style="background:#1d2b57; width:30%;">Đỉnh</th>
                <th style="background:#1d2b57;">Đỉnh kề</th>
            </tr>
    `;
    Object.keys(adjList).forEach(node => {
        const neighbors = adjList[node].join(", ");
        html += `<tr><td>${node}</td><td>${neighbors}</td></tr>`;
    });
    html += `</table>`;
    return html;
}

function setMode(m) {
    selectedMode = m;
    // Cập nhật giao diện nút bấm nếu cần
    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active-mode'));
    document.getElementById(`btn-${m}`).classList.add('active-mode');
}

// --- 2. HÀM CHẠY CHÍNH (Gửi request) ---
function runDFS() {
    const nodesVal = document.getElementById("nodes").value;
    const startNode = document.getElementById("startNode").value.trim();

    if (!startNode) {
        alert("Vui lòng nhập đỉnh bắt đầu!");
        return;
    }

    fetch("/api/graph/dfs/", { // Đảm bảo URL này khớp với urls.py
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            nodes: nodesVal.split(","),
            edges: document.getElementById("edges").value.split(","),
            startNode: startNode,
            mode: selectedMode
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.error) {
            alert(data.error);
            return;
        }

        // Vẽ đồ thị tĩnh trước
        drawGraph(data.nodes, data.edges);
        
        // Chạy Animation
        animateDFS(data.result);

        // Cập nhật thông tin bên phải
        updateInfo({
            mode: selectedMode,
            ...data.analysis,
            dfs_path: data.result.path,
            dfs_steps: data.result.steps
        });
    })
    .catch(err => console.error(err));
}

// --- 3. VẼ ĐỒ THỊ (Dùng D3.js - Giống hệt Hierholzer) ---
function drawGraph(nodes, edges) {
    const svg = d3.select("#graphArea");
    svg.selectAll("*").remove(); // Xóa cũ

    const width = document.getElementById("graphArea").clientWidth;
    const height = document.getElementById("graphArea").clientHeight;

    // Chuẩn hóa edges cho D3
    const d3Edges = edges.map(e => {
        if (typeof e === "string" && e.includes("-")) {
            const [s, t] = e.split("-");
            return { source: s.trim(), target: t.trim(), id: `${s.trim()}-${t.trim()}` };
        }
        return { ...e, id: `${e.source}-${e.target}` };
    });

    // Mô phỏng lực
    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(d3Edges).id(d => d.id).distance(150))
        .force("charge", d3.forceManyBody().strength(-500))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("x", d3.forceX(width / 2).strength(0.05))
        .force("y", d3.forceY(height / 2).strength(0.05));

    // Mũi tên cho đồ thị có hướng
    svg.append("defs").selectAll("marker")
        .data(["end"])
        .enter().append("marker")
        .attr("id", "arrow")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 28) // Đẩy mũi tên ra khỏi node
        .attr("refY", 0)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-5L10,0L0,5")
        .attr("fill", "#00ff88");

    const link = svg.append("g")
        .selectAll("line")
        .data(d3Edges)
        .enter().append("line")
        .attr("stroke", "#00ff88")
        .attr("stroke-width", 2)
        .attr("marker-end", selectedMode === "directed" ? "url(#arrow)" : null);

    const node = svg.append("g")
        .selectAll("circle")
        .data(nodes)
        .enter().append("circle")
        .attr("r", 20)
        .attr("class", "node")
        .attr("fill", "#555") // Màu mặc định chưa thăm
        .attr("stroke", "#fff")
        .attr("stroke-width", 2);

    const label = svg.append("g")
        .selectAll("text")
        .data(nodes)
        .enter().append("text")
        .text(d => d.id)
        .attr("fill", "#ffffff")
        .attr("font-size", "18px")
        .attr("dy", 5)
        .attr("text-anchor", "middle");

    simulation.on("tick", () => {
        link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        node.attr("cx", d => d.x).attr("cy", d => d.y);
        label.attr("x", d => d.x).attr("y", d => d.y);
    });
}

// --- 4. ANIMATION (Logic DFS) ---
function animateDFS(result) {
    if (!result || !result.steps) return;

    const steps = result.steps;
    const svg = d3.select("#graphArea");
    const nodes = svg.selectAll("circle");
    
    // Tốc độ animation
    const STEP_DELAY = 1200; 

    let stepIndex = 0;

    function showStep() {
        if (stepIndex >= steps.length) return;

        const s = steps[stepIndex];
        
        // 1. Tô màu các Nodes
        nodes.transition().duration(500)
            .attr("fill", d => {
                if (d.id === s.current_node) return "#ff9100"; // Đỉnh đang xét (Màu Cam)
                if (s.visited.includes(d.id)) return "#00e28a"; // Đã thăm (Màu Xanh Neon)
                return "#555"; // Chưa thăm
            })
            .attr("stroke", d => {
                if (d.id === s.current_node) return "#fff";
                return "#fff";
            })
            .attr("r", d => d.id === s.current_node ? 30 : 20); // Phóng to đỉnh đang xét

        // Cập nhật thông tin text dưới đồ thị (nếu cần)
        // document.getElementById("statusText").innerText = s.description;

        stepIndex++;
        setTimeout(showStep, STEP_DELAY);
    }

    showStep();
}

// --- 5. UPDATE INFO PANEL ---
function updateInfo(info) {
    const box = document.getElementById("infoContent");
    if (!box) return;

    // Danh sách kề & Ma trận (Code tái sử dụng hàm render ở trên)
    const adjListTable = renderAdjList(info.adj_list || {});
    const matrixTable = renderAdjMatrix(info.adj_matrix || [], Object.keys(info.adj_list || {}));

    // Tạo bảng chi tiết các bước (Trace Table)
    let stepsRows = "";
    (info.dfs_steps || []).forEach((s, i) => {
        // Stack hiển thị dạng: [A, B, C] -> Đỉnh Stack bên phải
        const stackStr = `[${s.stack.join(", ")}]`; 
        const visitedStr = `[${s.visited.join(", ")}]`;
        
        stepsRows += `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
                <td style="padding:8px;">${i}</td>
                <td style="padding:8px; color:#ff9100; font-weight:bold;">${s.current_node || "-"}</td>
                <td style="padding:8px;">${stackStr}</td>
                <td style="padding:8px; color:#00e28a;">${visitedStr}</td>
            </tr>
        `;
    });

    const stepsTable = `
        <table style="width:100%; border-collapse:collapse; font-size:14px; text-align:center;">
            <tr style="background:rgba(255,255,255,0.1); color:#70d6ff;">
                <th>B</th>
                <th>Đỉnh xét</th>
                <th>Stack</th>
                <th>Đã duyệt</th>
            </tr>
            ${stepsRows}
        </table>
    `;

    box.innerHTML = `
        <p><b>Mode:</b> ${info.mode.toUpperCase()}</p>
        <p><b>Số đỉnh:</b> ${info.num_nodes} | <b>Số cạnh:</b> ${info.num_edges}</p>
        <hr>
        
        <p><b>Kết quả duyệt (DFS Path):</b></p>
        <div style="
            background: rgba(0,226,138,0.2); 
            padding: 10px; 
            border-radius: 8px; 
            color: #00e28a; 
            font-weight: bold; 
            text-align: center;
            font-size: 18px;
            border: 1px solid #00e28a;
        ">
            ${(info.dfs_path || []).join(" ➝ ")}
        </div>
        
        <br>
        <p><b>Chi tiết từng bước (Trace):</b></p>
        <div style="max-height: 400px; overflow-y: auto;">
            ${stepsTable}
        </div>

        <hr>
        <p><b>Danh sách kề:</b></p>
        ${adjListTable}

        <p><b>Ma trận kề:</b></p>
        <div style="overflow-x:auto;">
            ${matrixTable}
        </div>
    `;
}