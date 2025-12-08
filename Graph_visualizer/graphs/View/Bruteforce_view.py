from django.http import JsonResponse
from django.shortcuts import render        
from django.views.decorators.csrf import csrf_exempt
import json
import networkx as nx
import os
from django.conf import settings
import pdfplumber

from graphs.algorithms.bruteforce.bruteforce import BruteForceShortestPath

@csrf_exempt
def bruteforce_api(request):
    try:
        data = json.loads(request.body)

        nodes = data.get("nodes", [])
        raw_edges = data.get("edges", [])
        start = data.get("startNode")
        end = data.get("endNode")
        directed = data.get("directed", False)

        if not start or not end:
            return JsonResponse({"best_cost": -1, "message": "Chưa chọn đỉnh đầu/cuối"})

        G = nx.DiGraph() if directed else nx.Graph()

        if isinstance(raw_edges, list) and len(raw_edges) > 0 and isinstance(raw_edges[0], dict):
            for e in raw_edges:
                u = e.get("source") or e.get("from")
                v = e.get("target") or e.get("to")
                w = int(e.get("weight", 1))
                if u and v:
                    G.add_edge(u, v, weight=w)
                    if not directed:
                        G.add_edge(v, u, weight=w)
        else:
            edges_str = str(raw_edges).strip()
            if edges_str and edges_str not in ["[]", "", "null", "None"]:
                for item in edges_str.split(","):
                    item = item.strip()
                    if not item:
                        continue
                    parts = [p.strip() for p in item.split("-") if p.strip()]
                    if len(parts) < 2:
                        continue
                    u, v = parts[0], parts[1]
                    w = 1
                    if len(parts) >= 3 and parts[2].isdigit():
                        w = int(parts[2])
                    G.add_edge(u, v, weight=w)
                    if not directed:
                        G.add_edge(v, u, weight=w)

        for node in nodes:
            if node and node not in G:
                G.add_node(node)

        solver = BruteForceShortestPath(G, start, end, directed=directed)
        result = solver.run()

        analysis = build_graph_analysis(G, directed=directed)

        result_with_analysis = {
            **result,
            "analysis": analysis,
        }

        return JsonResponse(result_with_analysis)


    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse({
            "best_cost": -1,
            "best_path": [],
            "steps": [],
            "message": f"Lỗi server: {str(e)}"
        }, status=500)
    
def build_graph_analysis(G, directed=False):
    nodes = sorted(str(n) for n in G.nodes())

    degree = {n: int(G.degree(n)) for n in nodes}

    adj_list = {}
    for u in nodes:
        neighs = []
        for v in G.neighbors(u):
            w = G[u][v].get("weight", 1)
            neighs.append([str(v), int(w)])
        adj_list[u] = neighs

    n = len(nodes)
    idx = {nodes[i]: i for i in range(n)}
    adj_matrix = [[0 for _ in range(n)] for _ in range(n)]
    for u, v, data in G.edges(data=True):
        uu, vv = str(u), str(v)
        w = int(data.get("weight", 1))
        i, j = idx[uu], idx[vv]
        adj_matrix[i][j] = w

    edge_weights = {}
    for u, v, data in G.edges(data=True):
        w = int(data.get("weight", 1))
        edge_weights[f"{u}-{v}"] = w

    return {
        "nodes": nodes,
        "degree": degree,
        "adj_list": adj_list,
        "adj_matrix": adj_matrix,
        "edge_weights": edge_weights,
        "directed": directed,
    }


def bruteforce_page(request):
    return render(request, "graphs/algorithms_d3/bruteforce/bruteforce.html")


@csrf_exempt
def get_pdf_text_bruteforce(request):
    pdf_path = os.path.join(settings.BASE_DIR, "graphs", "static", "graphs", "docs", "Bruteforce_Intro.pdf")
    if not os.path.exists(pdf_path):
        return JsonResponse({"html": "<p>Không tìm thấy file PDF</p>"})

    html = ""
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            text = page.extract_text() or ""
            html += f"<pre style='background:#111; color:#0f0; padding:20px; border-radius:8px; margin:20px 0;'>{text}</pre>"
    return JsonResponse({"html": html})