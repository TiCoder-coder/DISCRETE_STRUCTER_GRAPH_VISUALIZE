let primSVG, primLink, primNode, primLabel, primWeightLabel;
let primSimulation;

function initPrimGraph(containerId = "graphArea") {
    primSVG = d3.select(`#${containerId}`);
    primSVG.selectAll("*").remove();

    const width  = primSVG.node().clientWidth;
    const height = primSVG.node().clientHeight;

    const defs = primSVG.append("defs");
    defs.append("marker")
        .attr("id", "prim-arrow")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 28)
        .attr("refY", 0)
        .attr("markerWidth", 8)
        .attr("markerHeight", 8)
        .attr("orient", "auto-start-reverse")
        .append("path")
        .attr("d", "M0,-5L10,0L0,5")
        .attr("fill", "#ffe100");
}

function drawPrimGraph(nodes, edges, isDirected = false) {
    const width  = primSVG.node().clientWidth;
    const height = primSVG.node().clientHeight;

    const nodeData = nodes.map(id => ({ id }));

    primSimulation = d3.forceSimulation(nodeData)
        .force("link", d3.forceLink(edges).id(d => d.id).distance(220))
        .force("charge", d3.forceManyBody().strength(-750))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collision", d3.forceCollide().radius(60));

    primLink = primSVG.append("g")
        .selectAll("line")
        .data(edges)
        .enter().append("line")
        .attr("stroke", "#888")
        .attr("stroke-width", 4)
        .classed("prim-edge", true);

    if (isDirected) primLink.attr("marker-end", "url(#prim-arrow)");

    primNode = primSVG.append("g")
        .selectAll("circle")
        .data(nodeData)
        .enter().append("circle")
        .attr("r", 30)
        .attr("fill", "#666");

    primLabel = primSVG.append("g")
        .selectAll("text")
        .data(nodeData)
        .enter().append("text")
        .text(d => d.id)
        .attr("font-size", 26)
        .attr("fill", "white")
        .attr("font-weight", "bold")
        .attr("text-anchor", "middle")
        .attr("dy", 9);

    primWeightLabel = primSVG.append("g")
        .selectAll("text.weight")
        .data(edges)
        .enter().append("text")
        .attr("class", "weight")
        .text(d => d.weight)
        .attr("font-size", 19)
        .attr("fill", "#ffff00")
        .attr("font-weight", "bold")
        .attr("text-anchor", "middle")
        .style("pointer-events", "none");

    primSimulation.on("tick", () => {
        primLink.attr("x1", d => d.source.x).attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x).attr("y2", d => d.target.y);
        primNode.attr("cx", d => d.x).attr("cy", d => d.y);
        primLabel.attr("x", d => d.x).attr("y", d => d.y);
        primWeightLabel.attr("x", d => (d.source.x + d.target.x) / 2)
                       .attr("y", d => (d.source.y + d.target.y) / 2 - 10);
    });
}

function runPrimFromBackend(steps, totalCost, startNode) {
    const logBox = document.getElementById("infoContent");
    const totalDisplay = document.getElementById("totalWeight");
    if (!logBox || !totalDisplay) return;

    primLink.attr("stroke", "#888").attr("stroke-width", 4).style("filter", "none");
    primNode.attr("fill", "#666666ff");
    primNode.filter(d => d.id === startNode)
        .attr("fill", "#00ff88")
        .style("filter", "drop-shadow(0 0 30px #00ff88)");

    logBox.innerHTML = `<span style='color:#79d7ff; font-size:1.3em;'>Bắt đầu thuật toán Prim từ đỉnh <b>${startNode}</b>...</span><br><br>`;

    let currentTotal = 0;
    const visited = new Set([startNode]);

    steps.forEach((step, i) => {
        setTimeout(() => {
            const [u, v, w] = step.edge;
            const link = primLink.filter(d =>
                (d.source.id === u && d.target.id === v) ||
                (d.source.id === v && d.target.id === u)
            );

            if (step.action === "choose") {
                const newNode = step.new_node || (visited.has(u) ? v : u);
                visited.add(newNode);

                link.transition().duration(900)
                    .attr("stroke", "#00ff88")
                    .attr("stroke-width",7)
                    .style("filter", "drop-shadow(0 0 10px #00ff88)");

                primNode.filter(d => d.id === newNode)
                    .transition().duration(900)
                    .attr("fill", "#00ff88")
                    .style("filter", "drop-shadow(0 0 10px #00ff88)");

                currentTotal += w;
                totalDisplay.textContent = currentTotal;

                logBox.innerHTML += ` <span style="color:#00ff88; font-weight:bold">CHỌN</span> cạnh <b>${u}—${v}</b> (w=${w}) → Thêm đỉnh <b>${newNode}</b><br>`;
            }
            else if (step.action === "consider") {
                link.transition().duration(600)
                    .attr("stroke", "#ffff00")
                    .attr("stroke-width", 7)
                    .style("filter", "drop-shadow(0 0 10px yellow)")
                    .transition().duration(800)
                    .attr("stroke", "#888")
                    .attr("stroke-width", 3)
                    .style("filter", "none");

                logBox.innerHTML += `→ Đang xét cạnh <b>${u}—${v}</b> (w=${w})<br>`;
            }

            if (i === steps.length - 1) {
                setTimeout(() => {
                    logBox.innerHTML += `<br><br><b style="color:#00ffff; font-size:2em;">
                        HOÀN THÀNH! Tổng trọng số MST = ${totalCost}</b>`;
                    totalDisplay.textContent = totalCost;
                }, 1200);
            }
        }, 800 + i * 1400);
    });
}

function runPrimAnimation(nodesInput, edgesInput, startNodeId) {
    const nodes = nodesInput.split(",").map(s => s.trim()).filter(Boolean);
    const edgesStr = edgesInput.trim();

    if (nodes.length === 0 || !edgesStr || !startNodeId) {
        alert("Nhập đủ dữ liệu đi anh ơi!");
        return;
    }

    const edges = edgesStr.split(",").map(s => {
        const p = s.trim().split("-");
        if (p.length >= 2) {
            return { source: p[0].trim(), target: p[1].trim(), weight: p[2] ? parseInt(p[2]) : 1 };
        }
        return null;
    }).filter(Boolean);

    initPrimGraph();
    drawPrimGraph(nodes, edges);

    fetch("/api/graph/prim/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodes, edges: edgesStr, startNode: startNodeId })
    })
    .then(r => r.json())
    .then(data => {
        if (data.mst_cost === -1) {
            document.getElementById("infoContent").innerHTML = "<span style='color:#ff4466'>ĐỒ THỊ KHÔNG LIÊN THÔNG!</span>";
            return;
        }

        runPrimFromBackend(data.steps, data.mst_cost, startNodeId);
        document.getElementById("totalWeight").textContent = data.mst_cost;
    })
    .catch(err => {
        console.error(err);
        document.getElementById("infoContent").innerHTML = "Lỗi backend!";
    });
}