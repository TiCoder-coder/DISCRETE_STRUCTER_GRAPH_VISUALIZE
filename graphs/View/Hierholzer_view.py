from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
import networkx as nx
from django.shortcuts import render
from graphs.algorithms.hierholzer.hierholzer import HierholzerAlgorithm


@csrf_exempt
def hierholzer_api(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST only"})

    body = json.loads(request.body.decode("utf-8"))

    nodes = [n.strip() for n in body.get("nodes", [])]
    edges_raw = body.get("edges", [])
    start_node = body.get("startNode", None)
    mode = body.get("mode", "auto")

    edges = []
    for e in edges_raw:
        if "-" in e:
            u, v = e.split("-")
            edges.append({"source": u.strip(), "target": v.strip()})

    G = nx.Graph()
    for n in nodes:
        G.add_node(n)
    for e in edges:
        G.add_edge(e["source"], e["target"])

    try:
        algo = HierholzerAlgorithm(G, start_node=start_node, mode=mode)
        result = algo.run()
    except Exception as e:
        return JsonResponse({"error": str(e)})

    analysis = {
        "num_nodes": len(nodes),
        "num_edges": len(edges),
        "degree": {n: G.degree[n] for n in nodes},
        "adj_list": {n: list(G.neighbors(n)) for n in nodes},
        "adj_matrix": nx.to_numpy_array(G).tolist(),
    }

    return JsonResponse({
        "nodes": [{"id": n} for n in nodes],
        "edges": edges,
        "analysis": analysis,
        "result": result,
    })


def hierholzer_page(request):
    return render(request, "graphs/algorithms_d3/hierholzer/hierholzer.html")
