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

    try {
        // ====== BẢNG DANH SÁCH KỀ ======
        const adjList = info.adj_list || {};
        let adjRows = "";
        for (const [node, neighbors] of Object.entries(adjList)) {
            adjRows += `
                <tr>
                    <td>${node}</td>
                    <td>${(neighbors || []).join(", ")}</td>
                </tr>
            `;
        }

        const adjListTable = `
            <table border="1" cellspacing="0" cellpadding="6"
                   style="width:100%; color:white; border-collapse:collapse;">
                <tr style="background:#1a237e;">
                    <th>Đỉnh</th>
                    <th>Đỉnh kề</th>
                </tr>
                ${adjRows}
            </table>
        `;

        // ====== BẢNG MA TRẬN KỀ ======
        const nodes = Object.keys(adjList);
        const adjMatrix = info.adj_matrix || [];

        let headerRow =
            `<tr><th></th>${nodes.map(n => `<th>${n}</th>`).join("")}</tr>`;
        let matrixRows = "";

        nodes.forEach((rowNode, i) => {
            const row = adjMatrix[i] || [];
            matrixRows += `<tr><th>${rowNode}</th>` +
                row.map(v => `<td>${v}</td>`).join("") +
                `</tr>`;
        });

        const matrixTable = `
            <table border="1" cellspacing="0" cellpadding="6"
                   style="width:100%; color:white; border-collapse:collapse;">
                ${headerRow}
                ${matrixRows}
            </table>
        `;

        // ====== CHU TRÌNH CUỐI CÙNG ======
        const finalPath = info.hierholzer_path || [];

        // ====== R_i, Q_i THEO SLIDE ======
        const steps = info.hierholzer_steps || [];
        const lines = [];

        for (let i = 0; i < steps.length; i++) {
            const s = steps[i];

            // R_i (tour hiện tại sau khi ghép)
            const RiLabel = s.label || `R${i + 1}`;
            const Ri = s.tour || [];
            lines.push(`${RiLabel} = ${Ri.join(", ")}`);

            // Q_i lấy ở bước kế tiếp (giống cách slide ghi)
            if (i + 1 < steps.length) {
                const next = steps[i + 1];
                const Qi = next.new_cycle || [];
                const pivot = next.pivot || "";
                const QiLabel = `Q${i + 1}`;
                lines.push(`${QiLabel} (từ đỉnh ${pivot}) = ${Qi.join(", ")}`);
            }
            lines.push(""); // dòng trống ngăn cách
        }

        const expansionsText = lines.join("\n");

        // ====== GHI LÊN INFO PANEL ======
        box.innerHTML = `
            <p><b>Mode:</b> ${(info.mode || "auto").toUpperCase()}</p>

            <p><b>Số đỉnh:</b> ${info.num_nodes}</p>
            <p><b>Số cạnh:</b> ${info.num_edges}</p>

            <hr>

            <p><b>Bậc từng đỉnh:</b></p>
            <pre>${JSON.stringify(info.degree || {}, null, 2)}</pre>

            <p><b>Danh sách kề:</b></p>
            ${adjListTable}

            <p><b>Ma trận kề:</b></p>
            ${matrixTable}

            <hr>

            <p><b>Các chu trình mở rộng R<sub>i</sub>, Q<sub>i</sub>:</b></p>
            <pre>${expansionsText}</pre>

            <p><b>Chu trình Hierholzer cuối cùng:</b></p>
            <pre>${JSON.stringify(finalPath, null, 2)}</pre>
            <hr>


            <p><b>✔ Có đường đi Euler?</b>
                <span style="color:${info.is_eulerian_path ? 'lightgreen' : 'red'};">
                    ${info.is_eulerian_path}
                </span>
            </p>

            <p><b>✔ Có chu trình Euler?</b>
                <span style="color:${info.is_eulerian_circuit ? 'lightgreen' : 'red'};">
                    ${info.is_eulerian_circuit}
                </span>
            </p>
        `;
    } catch (e) {
        console.error("updateInfo error:", e);
        box.textContent = "Lỗi hiển thị thông tin: " + e.message;
    }
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

        // Q1 tương ứng với bước R2, Q2 với bước R3, ...
        if (idx > 0) {
            const Q_label = `Q${idx}`;
            const Q_str = (s.new_cycle || []).join(", ");
            lines.push(`${Q_label} (từ đỉnh ${s.pivot}) = ${Q_str}`);
        }

        lines.push(""); // dòng trống ngăn cách
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
