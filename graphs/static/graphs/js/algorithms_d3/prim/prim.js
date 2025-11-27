let primRunning = false;
let primEdges = [];
let primVisited = new Set();

function resetPrim() {
    primRunning = false;
    primEdges = [];
    primVisited.clear();
    cy.elements().removeClass('highlighted visited mst-edge mst-node');
    updatePrimInfo("");
}

function runPrimStep() {
    if (!primRunning) {
        primRunning = true;
        primVisited.clear();
        primEdges = [];
        cy.elements().removeClass('highlighted visited mst-edge mst-node');
        const startNode = cy.nodes().first();
        primVisited.add(startNode.id());
        startNode.addClass('mst-node');
        updatePrimInfo(`Bắt đầu từ đỉnh <strong>${startNode.id()}</strong>`);
    }

    const availableEdges = cy.edges().filter(edge => {
        const src = edge.source().id();
        const dst = edge.target().id();
        return primVisited.has(src) !== primVisited.has(dst); // một trong, một ngoài
    });

    if (availableEdges.length === 0) {
        updatePrimInfo("Hoàn thành! Cây khung nhỏ nhất đã được xây dựng.");
        return;
    }

    // Tìm cạnh nhỏ nhất
    let minEdge = availableEdges[0];
    let minWeight = parseInt(minEdge.data('weight') || 0);

    availableEdges.forEach(edge => {
        const w = parseInt(edge.data('weight') || 0);
        if (w < minWeight) {
            minWeight = w;
            minEdge = edge;
        }
    });

    // Highlight cạnh đang xét
    cy.edges().addClass('faded');
    availableEdges.addClass('highlighted');

    setTimeout(() => {
        const u = minEdge.source().id();
        const v = minEdge.target().id();
        const newNode = primVisited.has(u) ? v : u;

        minEdge.addClass('mst-edge');
        cy.getElementById(newNode).addClass('mst-node');
        primVisited.add(newEdge);
        primEdges.push({ u, v, weight: minWeight });

        cy.edges().removeClass('faded highlighted');

        updatePrimInfo(`
            Chọn cạnh <strong>${u} — ${v}</strong> (trọng số ${minWeight})<br>
            Đỉnh mới thêm vào cây: <strong>${newNode}</strong><br>
            Tổng trọng số hiện tại: <strong>${primEdges.reduce((a, b) => a + b.weight, 0)}</strong>
        `);

        displayPrimResult();
    }, 600);
}

function runPrimAll() {
    function step() {
        if (primRunning && cy.edges().filter(e => 
            primVisited.has(e.source().id()) !== primVisited.has(e.target().id())
        ).length > 0) {
            runPrimStep();
            setTimeout(step, 1200);
        }
    }
    if (!primRunning) runPrimStep();
    setTimeout(step, 1200);
}

function displayPrimResult() {
    const total = primEdges.reduce((sum, e) => sum + e.weight, 0);
    let html = `<h3>Cây khung nhỏ nhất (Prim)</h3><ul>`;
    primEdges.forEach(e => {
        html += `<li>${e.u} — ${e.v} : ${e.weight}</li>`;
    });
    html += `</ul><strong>Tổng trọng số = ${total}</strong>`;
    document.getElementById('algorithm-result').innerHTML = html;
}

function updatePrimInfo(text) {
    document.getElementById('algorithm-info').innerHTML = `<p>${text}</p>`;
}