let kruskalRunning = false;
let kruskalEdges = [];
let kruskalSelected = [];
let parent = {};

function find(u) {
    if (parent[u] !== u) parent[u] = find(parent[u]);
    return parent[u];
}

function union(u, v) {
    const pu = find(u), pv = find(v);
    if (pu !== pv) {
        parent[pu] = pv;
        return true;
    }
    return false;
}

function resetKruskal() {
    kruskalRunning = false;
    kruskalEdges = [];
    kruskalSelected = [];
    parent = {};
    cy.elements().removeClass('highlighted mst-edge faded');
    updateKruskalInfo("");
}

function runKruskalStep() {
    if (!kruskalRunning) {
        kruskalRunning = true;
        kruskalSelected = [];
        parent = {};
        cy.nodes().forEach(n => parent[n.id()] = n.id());
        cy.elements().removeClass('highlighted mst-edge faded');

        // Lấy tất cả cạnh và sắp xếp theo trọng số
        kruskalEdges = cy.edges().map(edge => ({
            edge: edge,
            u: edge.source().id(),
            v: edge.target().id(),
            w: parseInt(edge.data('weight') || 0)
        })).sort((a, b) => a.w - b.w);

        updateKruskalInfo("Bắt đầu thuật toán Kruskal - sắp xếp cạnh theo trọng số tăng dần");
    }

    if (kruskalEdges.length === 0) {
        updateKruskalInfo("Hoàn thành! Cây khung nhỏ nhất đã được xây dựng.");
        return;
    }

    const { edge, u, v, w } = kruskalEdges.shift();

    // Highlight các cạnh đang xét
    cy.edges().addClass('faded');
    edge.addClass('highlighted');

    setTimeout(() => {
        if (union(u, v)) {
            edge.addClass('mst-edge');
            kruskalSelected.push({ u, v, w });
            updateKruskalInfo(`
                Chọn cạnh <strong>${u} — ${v}</strong> (trọng số ${w})<br>
                Không tạo chu trình → Thêm vào cây khung<br>
                Tổng trọng số hiện tại: <strong>${kruskalSelected.reduce((a, b) => a + b.w, 0)}</strong>
            `);
        } else {
            updateKruskalInfo(`
                Bỏ qua cạnh <strong>${u} — ${v}</strong> (trọng số ${w})<br>
                Lý do: Tạo chu trình
            `);
        }

        cy.edges().removeClass('faded highlighted');
        displayKruskalResult();
    }, 800);
}

function runKruskalAll() {
    function step() {
        if (kruskalEdges.length > 0) {
            runKruskalStep();
            setTimeout(step, 1400);
        }
    }
    if (!kruskalRunning) runKruskalStep();
    setTimeout(step, 1400);
}

function displayKruskalResult() {
    const total = kruskalSelected.reduce((sum, e) => sum + e.w, 0);
    let html = `<h3>Cây khung nhỏ nhất (Kruskal)</h3><ul>`;
    kruskalSelected.forEach(e => {
        html += `<li>${e.u} — ${e.v} : ${e.w}</li>`;
    });
    html += `</ul><strong>Tổng trọng số = ${total}</strong>`;
    document.getElementById('algorithm-result').innerHTML = html;
}

function updateKruskalInfo(text) {
    document.getElementById('algorithm-info').innerHTML = `<p>${text}</p>`;
}