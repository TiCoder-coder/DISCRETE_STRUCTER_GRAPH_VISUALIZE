import json
from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt

from graphs.algorithms.Djkstra.Djkstra import dijkstra
import pdfplumber
import os
from collections import defaultdict
from django.conf import settings
def dijkstra_page(request):
    return render(request, "graphs/algorithms_d3/Djkstra/djkstra.html")

@csrf_exempt
def get_pdf_text_dijkstra(request):
    # Đường dẫn tương đối từ BASE_DIR để deploy vẫn chạy
    pdf_path = os.path.join(
        settings.BASE_DIR,
        "graphs", "static", "graphs", "docs", "Djkstra.pdf"
    )

    if not os.path.exists(pdf_path):
        return JsonResponse({"html": "<p>Không tìm thấy file PDF Dijkstra.</p>"})

    try:
        html_output = ""
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                text = page.extract_text(layout=True) or ""
                html_output += (
                    "<pre style='white-space: pre-line; font-size:17px; "
                    "line-height:1.7; font-size:17px;'>"
                    + text +
                    "</pre><br>"
                )

        return JsonResponse({"html": html_output})
    except Exception as e:
        return JsonResponse(
            {"html": f"<p>Lỗi đọc PDF Dijkstra: {e}</p>"},
            status=500
        )

def _parse_weighted_edges(raw_edges):
    parsed = []

    for e in raw_edges:
        if not e:
            continue
        s = e.strip()
        if not s:
            continue

        weight = 1.0
        uv_part = s

        if ":" in s:
            uv_part, w_part = s.split(":", 1)
            uv_part = uv_part.strip()
            try:
                weight = float(w_part.strip())
            except ValueError:
                weight = 1.0

        if "-" not in uv_part:
            continue

        u, v = [x.strip() for x in uv_part.split("-", 1)]
        if not u or not v:
            continue

        parsed.append((u, v, weight))

    return parsed


@csrf_exempt
def dijkstra_api(request):
    if request.method != "POST":
        return JsonResponse({"error": "Chỉ hỗ trợ phương thức POST"}, status=405)

    try:
        payload = json.loads(request.body.decode("utf-8"))
    except json.JSONDecodeError:
        return JsonResponse({"error": "JSON không hợp lệ"}, status=400)

    graph_type = (payload.get("graphType") or "directed").strip()
    nodes = [n.strip() for n in (payload.get("nodes") or []) if n.strip()]
    raw_edges = payload.get("edges") or []
    start = (payload.get("startNode") or "").strip()
    end = (payload.get("endNode") or "").strip()

    if not nodes:
        return JsonResponse({"error": "Danh sách đỉnh đang trống"}, status=400)

    if start not in nodes or end not in nodes:
        return JsonResponse(
            {"error": "Đỉnh bắt đầu hoặc đỉnh kết thúc không hợp lệ!"},
            status=400,
        )

    parsed_edges = _parse_weighted_edges(raw_edges)
    directed = (graph_type == "directed")

    graph = {n: [] for n in nodes}
    for u, v, w in parsed_edges:
        if u not in graph:
            graph[u] = []
        graph[u].append((v, w))

    try:
        result = dijkstra(graph, start, end=end, directed=directed)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)

    raw_matrix = result.get("adjacency_matrix", [])
    adj_matrix = []
    for row in raw_matrix:
        new_row = []
        for val in row:
            if val == float("inf"):
                new_row.append("∞")
            else:
                new_row.append(val)
        adj_matrix.append(new_row)

    raw_steps = result.get("steps", [])
    steps = []

    for s in raw_steps:
        raw_dist = s.get("distance", {}) or {}

        dist = {
            node: ("∞" if val == float("inf") else val)
            for node, val in raw_dist.items()
        }

        steps.append({
            "current":  s.get("current"),
            "marked":   s.get("marked", []),
            "unmarked": s.get("unmarked", []),
            "distance": dist,
        })

    dist_table = [s["distance"] for s in steps]

    marked_status = [
        {
            "step": i + 1,
            "current": s["current"],
            "marked": s["marked"],
            "unmarked": s["unmarked"],
        }
        for i, s in enumerate(steps)
    ]


    edge_weights = {f"{u}-{v}": w for (u, v, w) in parsed_edges}

    analysis = {
        "graphType": graph_type,
        "num_nodes": len(nodes),
        "num_edges": len(parsed_edges),
        "degree": result.get("degree", {}),
        "adj_list": result.get("adjacency_list", {}),
        "adj_matrix": adj_matrix,
        "edge_weights": edge_weights,
        "dist_table": dist_table,
        "marked_status": marked_status,
    }

    response = {
        "nodes": [{"id": n} for n in nodes],
        "edges": [
            {"source": u, "target": v, "weight": w}
            for (u, v, w) in parsed_edges
        ],
        "result": {
            "path": result.get("path") or [],
            "steps": steps,
        },
        "analysis": analysis,
    }

    return JsonResponse(response)
