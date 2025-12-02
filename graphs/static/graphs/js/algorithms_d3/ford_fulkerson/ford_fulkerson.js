window.isDirected = true; // Ford-Fulkerson luôn là đồ thị có hướng
let mode = "ford-fulkerson"; // Chế độ mặc định

function isDirectedGraph() {
    return true; 
}

// --- CÁC HÀM HIỂN THỊ DỮ LIỆU BẢNG ---
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
        // Format hiển thị danh sách kề cho Max Flow
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

// --- HÀM CHÍNH: GỌI API VÀ XỬ LÝ DỮ LIỆU ---
function runVisualization() {
    const nodesInput = document.getElementById("nodes").value.trim();
    const edgesInput = document.getElementById("edges").value.trim();
    const startNodeInput = document.getElementById("startNode").value.trim();

    if (!nodesInput || !edgesInput) {
        alert("Vui lòng nhập đầy đủ nodes và edges!");
        return;
    }

    const nodes = nodesInput.split(",").map(n => n.trim());
    
    // Xử lý Source và Sink từ ô nhập startNode
    // Người dùng nhập "A, F" thì A là source, F là sink. Nếu nhập 1 cái thì mặc định sink là node cuối.
    let source = nodes[0];
    let sink = nodes[nodes.length - 1];
    
    if (startNodeInput.includes(",")) {
        const parts = startNodeInput.split(",");
        source = parts[0].trim();
        sink = parts[1].trim();
    } else if (startNodeInput) {
        source = startNodeInput;
        // Nếu không nhập sink, giữ nguyên sink là node cuối cùng của list
    }

    console.log(`Chạy Ford-Fulkerson: Source=${source}, Sink=${sink}`);

    // Gửi payload lên backend
    const payload = {
        nodes: nodes,
        edges: edgesInput, // Backend cần parse dạng "u-v-capacity"
        source: source,
        sink: sink,
        mode: "ford-fulkerson"
    };

    console.log("Sending payload:", payload);

    // Giả sử API endpoint là /api/graph/ford-fulkerson/
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

            // data.edges trả về từ server nên có thuộc tính 'capacity' và 'flow'
            drawGraph(data.nodes, data.edges); 
            updateInfo(data.analysis, data.result);
            animateFordFulkerson(data.nodes, data.edges, data.result);

        })
        .catch(err => {
            console.error("Fetch error:", err);
            alert("Lỗi kết nối API: " + err);
        });
}

// --- HÀM VẼ ĐỒ THỊ BẰNG D3.JS ---
function drawGraph(nodes, edges) {
    // Xóa SVG cũ
    const svg = d3.select("#graphArea");
    svg.selectAll("*").remove();

    // Định nghĩa mũi tên (marker)
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

    // Map dữ liệu edges để D3 hiểu object source/target
    const d3Edges = edges.map(e => ({
        source: e.u,
        target: e.v,
        capacity: e.capacity,
        flow: 0, // Khởi tạo flow ban đầu = 0
        id: `${e.u}-${e.v}`
    }));

    const d3Nodes = nodes.map(n => ({ id: n }));

    const simulation = d3.forceSimulation(d3Nodes)
        .force("link", d3.forceLink(d3Edges).id(d => d.id).distance(200)) // Khoảng cách xa hơn chút để hiển thị số
        .force("charge", d3.forceManyBody().strength(-500))
        .force("center", d3.forceCenter(width / 2, height / 2));

    // Vẽ đường nối (Link)
    const linkGroup = svg.append("g").attr("class", "links");
    const link = linkGroup.selectAll("line")
        .data(d3Edges)
        .enter()
        .append("line")
        .attr("id", d => `edge-${d.source.id || d.source}-${d.target.id || d.target}`)
        .attr("stroke", "#555")
        .attr("stroke-width", 2)
        .attr("marker-end", "url(#arrow)");

    // Vẽ nhãn trên cạnh (Flow / Capacity)
    // Dùng kỹ thuật vẽ text trên path hoặc đơn giản là text tại trung điểm
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

    // Vẽ Node
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

    // Vẽ nhãn tên Node
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

    // Simulation Tick
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

    // Các hàm drag để kéo thả node
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

// --- HÀM CẬP NHẬT THÔNG TIN VĂN BẢN ---
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

// --- HÀM ANIMATION (QUAN TRỌNG) ---
function animateFordFulkerson(nodes, edges, result) {
    const steps = result.steps;
    if (!steps || steps.length === 0) return;

    // Map để lưu trữ dòng chảy hiện tại trên mỗi cạnh để tiện cập nhật
    // Key: "u-v", Value: current_flow
    let currentFlowState = {}; 
    edges.forEach(e => {
        currentFlowState[`${e.u}-${e.v}`] = 0;
    });

    let i = 0;
    const delayTime = 1500; // Thời gian nghỉ giữa các bước

    function nextStep() {
        if (i >= steps.length) {
            // Kết thúc animation: Reset màu
            d3.selectAll("circle").attr("fill", "#ffcc00");
            d3.selectAll("line")
                .attr("stroke", "#555")
                .attr("stroke-width", 2);
            return;
        }

        const s = steps[i];

        // Reset highlight tạm thời
        d3.selectAll("circle").attr("fill", "#ffcc00");
        d3.selectAll("line").attr("stroke", "#555").attr("stroke-width", 2);

        if (s.action === "augment") {
            const path = s.path; // Mảng các node: [0, 1, 2, 5]
            const flowAdded = s.flow_added;

            // Highlight các Node trên đường đi
            path.forEach(nodeId => {
                d3.select(`#node-${nodeId}`).attr("fill", "#00ff88");
            });

            // Highlight Cạnh và Cập nhật Text Flow
            for (let k = 0; k < path.length - 1; k++) {
                let u = path[k];
                let v = path[k+1];
                let edgeId = `edge-${u}-${v}`;
                let labelId = `label-${u}-${v}`;
                
                // Highlight cạnh
                d3.select("#" + edgeId)
                    .transition().duration(500)
                    .attr("stroke", "#ff3d00")
                    .attr("stroke-width", 6);

                // Cập nhật Flow state
                let key = `${u}-${v}`;
                
                // Cần kiểm tra xem cạnh này là cạnh thuận hay cạnh nghịch trong đồ thị gốc
                // Trong animation đơn giản, ta giả sử chỉ hiện thị trên cạnh thuận
                if (currentFlowState.hasOwnProperty(key)) {
                    currentFlowState[key] += flowAdded;
                    // Lấy capacity gốc để hiển thị
                    let cap = d3.select("#" + labelId).text().split("/")[1].trim();
                    
                    d3.select("#" + labelId)
                        .text(`${currentFlowState[key]} / ${cap}`)
                        .attr("fill", "#ff3d00")
                        .attr("font-size", "18px");
                } else {
                    // Trường hợp flow đi ngược trên cạnh (nếu đồ thị có cạnh 2 chiều hoặc logic phức tạp hơn)
                    // Với form cơ bản này ta tập trung cạnh thuận
                    // Có thể check key ngược: `${v}-${u}` nếu cần trừ flow
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

    // Bắt đầu animation
    nextStep();
}