from django.http import JsonResponse
from django.shortcuts import render, redirect
from django.views.decorators.csrf import csrf_exempt
import json
import networkx as nx
import os
from django.conf import settings
import pdfplumber

from graphs.algorithms.fleury.fleury import FleuryAlgorithm


@csrf_exempt
def get_graph_data(request, algorithm):
    if request.method != 'POST':
        return JsonResponse({"error": "POST only"}, status=405)

    body = json.loads(request.body.decode('utf-8'))

    nodes = body.get("nodes", [])
    edges_raw = body.get("edges", [])
    start_node = body.get("startNode", None)
    mode = body.get("mode", "auto")


    edges = []

    if isinstance(edges_raw, list):
        for e in edges_raw:
            if isinstance(e, str) and "-" in e:
                u, v = e.split("-")
                edges.append({"source": u.strip(), "target": v.strip()})

    elif isinstance(edges_raw, str):
        for p in edges_raw.split(","):
            if "-" in p:
                u, v = p.split("-")
                edges.append({"source": u.strip(), "target": v.strip()})

    graph_type = body.get("graphType", "undirected")

    if graph_type == "directed":
        G = nx.DiGraph()
    else:
        G = nx.Graph()

    for n in nodes:
        G.add_node(n.strip())

    for e in edges:
        u = e["source"]
        v = e["target"]
        G.add_edge(u, v)

    if graph_type == "directed":
        from graphs.algorithms.fleury.fleury import is_euler_directed
        euler_type, euler_message = is_euler_directed(G)
    else:
        from graphs.algorithms.fleury.fleury import is_euler_undirected
        euler_type, euler_message = is_euler_undirected(G)

    if not euler_type:
        return JsonResponse({
            "error": euler_message
        }, status=400)
    if algorithm == "fleury":
        algo = FleuryAlgorithm(G, graph_type, start_node=start_node, mode=mode)

        result = algo.run()

        analysis = {
            "num_nodes": len(nodes),
            "num_edges": len(edges),
            "degree": {n: G.degree[n] for n in nodes},
            "adj_list": {n: list(G.neighbors(n)) for n in nodes},
            "adj_matrix": nx.to_numpy_array(G).tolist(),
            "mode": mode,
            "euler_type": euler_type,
            "euler_message": euler_message,
            "fleury_path": result["path"],
            "fleury_steps": result["steps"],
            "nodes": nodes,

        }


        return JsonResponse({
            "nodes": [{"id": n} for n in nodes],
            "edges": edges,
            "result": result,
            "analysis": analysis,
        })

    return JsonResponse({"error": "Algorithm not supported"}, status=400)

def fleury_page(request):
    return render(request, "graphs/algorithms_d3/fleury/fleury.html")


def home_redirect(request):
    return redirect('fleury_page')

@csrf_exempt
def get_pdf_text(request):
    pdf_path = os.path.join(
        settings.BASE_DIR,
        "graphs", "static", "graphs", "docs", "Fleury_Intro.pdf"
    )

    if not os.path.exists(pdf_path):
        return JsonResponse({"html": "<p>Không tìm thấy PDF.</p>"})

    try:
        html_output = ""

        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                text = page.extract_text(layout=True)
                if text:
                    html_output += (
                        "<pre style='white-space: pre-line; font-size:17px; line-height:1.7;'>"
                        + text +
                        "</pre><br>"
                    )

        return JsonResponse({"html": html_output})

    except Exception as e:
        return JsonResponse({"html": f"<p>Lỗi đọc PDF: {e}</p>"})
