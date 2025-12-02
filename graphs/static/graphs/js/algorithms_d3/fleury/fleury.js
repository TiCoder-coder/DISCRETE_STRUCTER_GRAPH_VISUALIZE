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
            updateInfo(data.analysis);

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


function updateInfo(info) {
    const box = document.getElementById("infoContent");

    box.innerHTML = `
        <p><b>Mode:</b> ${info.mode.toUpperCase()}</p>

        <p><b>Số đỉnh:</b> ${info.num_nodes}</p>
        <p><b>Số cạnh:</b> ${info.num_edges}</p>

        <hr>

        <p><b>Bậc từng đỉnh:</b></p>
        <pre>${JSON.stringify(info.degree, null, 2)}</pre>

        <p><b>Danh sách kề:</b></p>
        ${renderAdjList(info.adj_list)}


        <p><b>Ma trận kề:</b></p>
        ${renderAdjMatrix(info.adj_matrix, info.nodes)}

        <hr>

        <p><b>Đường đi Euler (Fleury):</b></p>
        <pre>${JSON.stringify(info.fleury_path, null, 2)}</pre>

        <p><b>Các bước thuật toán:</b></p>
        <pre>${JSON.stringify(info.fleury_steps, null, 2)}</pre>

        <hr>

        <p><b>Có đường đi Euler?</b> 
            <span style="color:${info.is_eulerian_path ? 'lightgreen' : 'red'};">
                ${info.is_eulerian_path}
            </span>
        </p>

        <p><b>Có chu trình Euler?</b> 
            <span style="color:${info.is_eulerian_circuit ? 'lightgreen' : 'red'};">
                ${info.is_eulerian_circuit}
            </span>
        </p>
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

    const svg = d3.select("#graphArea");
    const nodes = svg.selectAll("circle");
    const edges = svg.selectAll("line");

    let i = 0;

    function highlight() {

        const s = steps[i];
        if (!s) return;

        nodes.attr("fill", d =>
            d.id === s.current ? "#f5d210ff" : "#dd7411ff"
        );

        edges.each(function (e) {
            const link = d3.select(this);

            const src = typeof e.source === "object" ? e.source.id : e.source;
            const tgt = typeof e.target === "object" ? e.target.id : e.target;

            const isCurrent =
                (src === s.edge?.[0] && tgt === s.edge?.[1]) ||
                (src === s.edge?.[1] && tgt === s.edge?.[0]);

            link
                .attr("stroke", isCurrent ? "#ff3d00" : "#666")
                .attr("stroke-width", isCurrent ? 7 : 2)
                .style("filter", isCurrent ? "drop-shadow(0 0 12px #ff3d00)" : "none");
        });

        i++;
        if (i < steps.length) {
            setTimeout(highlight, 900);
        } else {
            edges.transition()
                .duration(600)
                .attr("stroke", "#ffcc00")
                .attr("stroke-width", 4)
                .style("filter", "none")


            nodes.transition()
                .duration(600)
                .attr("fill", "#ffcc00");

        }

    }

    highlight();
}