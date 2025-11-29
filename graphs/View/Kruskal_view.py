from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
import json
import networkx as nx
import os
from django.conf import settings
import pdfplumber
from graphs.algorithms.kruskal.kruskal import KruskalAlgorithm

def parse_edges(edges_str):
    edges = []
    for item in edges_str.split(","):
        item = item.strip()
        if not item: continue
        parts = item.split("-")
        if len(parts) == 3:
            u, v, w = parts[0].strip(), parts[1].strip(), int(parts[2])
        elif len(parts) == 2:
            u, v, w = parts[0].strip(), parts[1].strip(), 1
        else:
            continue
        edges.append({"source": u, "target": v, "weight": w})
    return edges

@csrf_exempt
def kruskal_api(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST only"}, status=405)

    try:
        data = json.loads(request.body)
        raw_nodes = data.get("nodes", [])
        edges_str = data.get("edges", "")

        nodes = [n.strip() for n in raw_nodes if n.strip()]
        edges = parse_edges(edges_str)

        G = nx.Graph()
        G.add_nodes_from(nodes)
        for e in edges:
            G.add_edge(e["source"], e["target"], weight=e["weight"])

        algo = KruskalAlgorithm(G)
        result = algo.run()

        formatted_edges = [
            {"source": u, "target": v, "weight": w}
            for u, v, w in result.get("mst_edges", [])
        ]

        return JsonResponse({
            "mst_cost": result["mst_cost"],
            "mst_edges": formatted_edges,
            "steps": result["steps"],
            "message": result.get("message", "Thành công")
        })
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)

def kruskal_page(request):
    return render(request, "graphs/algorithms_d3/kruskal/kruskal.html")

@csrf_exempt
def get_pdf_text_kruskal(request):
    pdf_path = os.path.join(settings.BASE_DIR, "graphs", "static", "graphs", "docs", "Kruskal_Intro.pdf")
    if not os.path.exists(pdf_path):
        return JsonResponse({"html": "<p>Không tìm thấy file PDF</p>"})

    html = ""
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            text = page.extract_text() or ""
            html += f"<pre style='background:#111; color:#0f0; padding:20px; border-radius:8px; margin:20px 0;'>{text}</pre>"
    return JsonResponse({"html": html})