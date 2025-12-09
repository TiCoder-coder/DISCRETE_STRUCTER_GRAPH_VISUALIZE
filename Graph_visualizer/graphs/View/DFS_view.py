from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import render
from django.conf import settings
import json
import os
import networkx as nx
import pdfplumber
from graphs.algorithms.bfs_dfs.dfs import DFSAlgorithm

def dfs_visualize_view(request):
    return render(request, "graphs/algorithms_d3/bfs_dfs/dfs.html")

@csrf_exempt
def get_dfs_data(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST only"})

    try:
        body = json.loads(request.body.decode("utf-8"))

        nodes = [n.strip() for n in body.get("nodes", []) if n.strip()]
        edges_raw = body.get("edges", [])
        start_node = body.get("startNode", None)
        end_node = body.get("endNode", None)
        mode = body.get("mode", "directed")
        action = body.get("action", "DFS")

        edges = []
        for e in edges_raw:
            if isinstance(e, str) and "-" in e:
                u, v = e.split("-")
                edges.append({"source": u.strip(), "target": v.strip()})
            elif isinstance(e, dict):
                edges.append(e)

        algo = DFSAlgorithm(nodes, edges, start_node, end_node, mode)

        reps = algo.get_representations()
        analysis = {
            "num_nodes": len(nodes),
            "num_edges": len(edges),
            "mode": mode,
            "adj_list": reps["adj_list"],
            "adj_matrix": reps["adj_matrix"],
        }

        if action == "DFS":
            result = algo.run_dfs()
        elif action == "BIPARTITE":
            result = algo.check_bipartite()
        else:
            result = {"error": f"Action không hợp lệ: {action}"}

        if "error" in result:
            return JsonResponse({"error": result["error"]})

        return JsonResponse({
            "nodes": [{"id": n} for n in nodes],
            "edges": edges,
            "analysis": analysis,
            "result": result,
            "action": action,
        })

    except Exception as e:
        return JsonResponse({"error": str(e)})
def get_dfs_pdf(request):
    pdf_path = os.path.join(
        settings.BASE_DIR, "graphs", "static", "graphs", "docs", "dfs.pdf"
    )

    if not os.path.exists(pdf_path):
        return JsonResponse({"html": "<p>Chưa có tài liệu giới thiệu (dfs.pdf).</p>"})

    try:
        html_output = ""
        
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                text = page.extract_text(layout=True)
                if text:
                    html_output += (
                        "<pre style='white-space: pre-wrap; font-family: inherit; font-size: 16px; line-height: 1.6;'>"
                        + text +
                        "</pre><br>"
                    )

        return JsonResponse({"html": html_output})

    except Exception as e:
        return JsonResponse({"html": f"<p>Lỗi đọc PDF: {str(e)}</p>"})
