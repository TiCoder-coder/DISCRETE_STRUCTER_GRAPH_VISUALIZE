let kruskalSVG, kruskalLink, kruskalNode, kruskalLabel, kruskalWeightLabel;
let kruskalSimulation;
let currentStep = 0;
let isKruskalRunning = false;

const kruskalStepLog = document.getElementById("stepLog");
const kruskalTotalEl = document.getElementById("totalWeight");
const kruskalSelectedList = document.getElementById("selectedEdges");

function initKruskalGraph(containerId = "graphArea") {
    kruskalSVG = d3.select(`#${containerId}`);
    kruskalSVG.selectAll("*").remove();

    const width = kruskalSVG.node().clientWidth;
    const height = kruskalSVG.node().clientHeight;

    const defs = kruskalSVG.append("defs");
    defs.append("marker")
        .attr("id", "kruskal-arrow")
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

function drawKruskalGraph(nodes, edges, isDirected = false) {
    const width = kruskalSVG.node().clientWidth;
    const height = kruskalSVG.node().clientHeight;

    const nodeData = nodes.map(id => ({ id }));

    kruskalSimulation = d3.forceSimulation(nodeData)
    .force("link", d3.forceLink(edges).id(d => d.id).distance(180).strength(1))
    .force("charge", d3.forceManyBody().strength(-1200)) 
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collision", d3.forceCollide().radius(80).strength(1))
    .velocityDecay(0.6)          
    .alpha(1)                    
    .alphaDecay(0.05)            
    .restart();                  

    kruskalLink = kruskalSVG.append("g")
        .selectAll("line")
        .data(edges)
        .enter().append("line")
        .attr("stroke", "#888")
        .attr("stroke-width", 4)
        .classed("kruskal-edge", true);

    if (isDirected) {
        kruskalLink.attr("marker-end", "url(#kruskal-arrow)");
    }

    kruskalNode = kruskalSVG.append("g")
        .selectAll("circle")
        .data(nodeData)
        .enter().append("circle")
        .attr("r", 28)
        .attr("fill", "#ffcc00")
        .style("cursor", "pointer");

    kruskalLabel = kruskalSVG.append("g")
        .selectAll("text")
        .data(nodeData)
        .enter().append("text")
        .text(d => d.id)
        .attr("font-size", 24)
        .attr("fill", "white")
        .attr("font-weight", "bold")
        .attr("text-anchor", "middle")
        .attr("dy", 8);

    kruskalWeightLabel = kruskalSVG.append("g")
        .selectAll("text.weight")
        .data(edges)
        .enter().append("text")
        .attr("class", "weight")
        .text(d => d.weight)
        .attr("font-size", 18)
        .attr("fill", "#ffff00")
        .attr("font-weight", "bold")
        .attr("text-anchor", "middle")
        .style("pointer-events", "none");

    kruskalSimulation.on("tick", () => {
        kruskalLink
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        kruskalNode
            .attr("cx", d => d.x)
            .attr("cy", d => d.y);

        kruskalLabel
            .attr("x", d => d.x)
            .attr("y", d => d.y);

        kruskalWeightLabel
            .attr("x", d => (d.source.x + d.target.x) / 2)
            .attr("y", d => (d.source.y + d.target.y) / 2 - 10);
    });
}

function resetKruskalState() {
    currentStep = 0;
    isKruskalRunning = false;
    kruskalStepLog.innerHTML = "Đang chờ chạy thuật toán...";
    kruskalTotalEl.textContent = "0";
    kruskalSelectedList.innerHTML = "";

    kruskalLink
        .attr("stroke", "#888")
        .attr("stroke-width", 4)
        .classed("edge-highlight edge-mst edge-rejected", false)
        .style("filter", "none")
        .style("opacity", 1);
}

function runKruskalFromBackend(steps, mstEdges, totalCost) {
    const logElement = document.getElementById("infoContent");
    if (!logElement) {
        console.error("Không tìm thấy #infoContent trong HTML!");
        return;
    }

    logElement.innerHTML = "<span style='color:#79d7ff; font-size:1.2em;'>Bắt đầu thuật toán Kruskal...</span><br><br>";

    let total = 0;
    let delay = 300;

    steps.forEach((step, index) => {
        setTimeout(() => {
            const [u, v, w] = step.edge;

            const link = kruskalLink.filter(d => 
                (d.source.id === u && d.target.id === v) || 
                (d.source.id === v && d.target.id === u)
            );

            if (link.empty()) {
                console.warn("Không tìm thấy cạnh:", u, v);
                return;
            }
            link.classed("edge-highlight edge-mst edge-rejected", false);

            if (step.action === "consider") {
                link.classed("edge-highlight", true)
                    .transition().duration(600)
                    .attr("stroke", "#ffff00")
                    .attr("stroke-width", 7)
                    .style("opacity", 1)
                    .style("filter", "none")            
                    .style("stroke-linecap", "round");

                logElement.innerHTML += `→ Đang xét cạnh <b>${u}—${v}</b> (trọng số = <b>${w}</b>)<br>`;
            }
            else if (step.action === "choose") {
                total += w;
                link.classed("edge-mst", true)
                    .transition().duration(600)
                    .attr("stroke", "#00ff88")
                    .attr("stroke-width", 7)
                    .style("opacity", 1)
                    .style("filter", "none")            
                    .style("stroke-linecap", "round");

                logElement.innerHTML += ` <span style="color:#00ff88; font-weight:bold">CHỌN</span> → Thêm vào MST<br>`;

                document.getElementById("totalWeight").textContent = total;
            }
            else if (step.action === "reject") {
                link.classed("edge-rejected", true)
                    .transition().duration(600)
                    .attr("stroke", "#ff3366")
                    .attr("stroke-width", 3)
                    .style("opacity", 0.4);

                logElement.innerHTML += ` <span style="color:#ff6688; font-weight:bold">BỎ</span> → Tạo chu trình<br>`;
            }

            if (index === steps.length - 1) {
                setTimeout(() => {
                    logElement.innerHTML += `<br><br><b style="color:#00ffff; font-size:1.6em;">
                        HOÀN THÀNH! Tổng trọng số MST = ${totalCost}</b>`;
                    document.getElementById("totalWeight").textContent = totalCost;
                }, 1000);
            }
        }, delay += 1500);
    });
}

function runKruskalAnimation(nodesInput, edgesInput) {
    const nodes = nodesInput.split(",").map(s => s.trim()).filter(Boolean);
    const edgesStr = edgesInput.trim();

    if (nodes.length === 0 || !edgesStr) {
        alert("Nhập đỉnh và cạnh đi bạn ơi!");
        return;
    }

    const edges = edgesStr.split(",").map(s => {
        const p = s.trim().split("-");
        if (p.length >= 2) {
            const u = p[0].trim();
            const v = p[1].trim();
            const w = p[2] ? parseInt(p[2]) : 1;
            return { source: u, target: v, weight: w };
        }
        return null;
    }).filter(Boolean);

    initKruskalGraph();
    drawKruskalGraph(nodes, edges);

    fetch("/api/graph/kruskal/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            nodes: nodes,
            edges: edgesStr
        })
    })
    .then(r => r.json())
    .then(data => {
        if (data.mst_cost === -1) {
            kruskalStepLog.innerHTML = "<span style='color:#ff4466'>ĐỒ THỊ KHÔNG LIÊN THÔNG!</span>";
            return;
        }

        runKruskalFromBackend(data.steps, data.mst_edges, data.mst_cost);
    })
    .catch(err => {
        console.error(err);
        kruskalStepLog.innerHTML = "Lỗi kết nối backend!";
    });
}

kruskalSimulation.on("tick", () => {
    kruskalLink
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

    kruskalNode
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);

    kruskalLabel
        .attr("x", d => d.x)
        .attr("y", d => d.y);

    kruskalWeightLabel
        .attr("x", d => (d.source.x + d.target.x) / 2)
        .attr("y", d => (d.source.y + d.target.y) / 2 - 10);

    if (kruskalSimulation.alpha() < 0.1) {
        kruskalSimulation.alphaTarget(0).restart();
    }
});