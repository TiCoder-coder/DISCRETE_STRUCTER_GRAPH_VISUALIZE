import json
import networkx as nx
from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import pdfplumber
from Graph_visualizer import settings
from graphs.algorithms.ford_fulkerson.ford_fulkerson import FordFulkersonAlgorithm 
from django.conf import settings
import os
import re  

def ford_fulkerson_page(request):
    return render(request, 'graphs/algorithms_d3/ford_fulkerson/ford_fulkerson.html')

@csrf_exempt
def ford_fulkerson_api(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            nodes = data.get('nodes', [])
            edges_str = data.get('edges', "") 
            source = data.get('source')
            sink = data.get('sink')

            G = nx.DiGraph()
            G.add_nodes_from(nodes)

            if isinstance(edges_str, str):
                edge_list = [e.strip() for e in edges_str.split(',') if e.strip()]
            else:
                edge_list = edges_str

            formatted_edges = []
            for e in edge_list:
                parts = e.split('-')
                if len(parts) == 3:
                    u, v, w = parts[0].strip(), parts[1].strip(), parts[2].strip()
                    try:
                        capacity = int(w)
                    except ValueError:
                        capacity = 0
                    G.add_edge(u, v, capacity=capacity)
                    formatted_edges.append({"u": u, "v": v, "capacity": capacity})
                elif len(parts) == 2:
                    u, v = parts[0].strip(), parts[1].strip()
                    G.add_edge(u, v, capacity=1) 
                    formatted_edges.append({"u": u, "v": v, "capacity": 1})

            node_idx = {n: i for i, n in enumerate(nodes)}
            size = len(nodes)
            adj_matrix = [[0] * size for _ in range(size)]
            adj_list_export = {}

            for u in nodes:
                adj_list_export[u] = []
                if u in G:
                    for v in G.neighbors(u):
                        cap = G[u][v]['capacity']
                        if u in node_idx and v in node_idx:
                            adj_matrix[node_idx[u]][node_idx[v]] = cap
                        adj_list_export[u].append({"node": v, "capacity": cap})

            analysis = {
                "num_nodes": G.number_of_nodes(),
                "num_edges": G.number_of_edges(),
                "nodes": nodes,
                "adj_matrix": adj_matrix,
                "adj_list": adj_list_export
            }

            solver = FordFulkersonAlgorithm(G, source, sink)
            result = solver.run()

            return JsonResponse({
                "nodes": nodes,
                "edges": formatted_edges, 
                "analysis": analysis,
                "result": result
            })

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)

    return JsonResponse({"error": "Method not allowed"}, status=405)

def get_ford_fulkerson_pdf(request):
    try:
        pdf_path = os.path.join(settings.BASE_DIR, 'graphs', 'static', 'graphs', 'docs', 'Ford-Fulkerson.pdf')
        
        if not os.path.exists(pdf_path):
            return JsonResponse({"html": f"<h3 style='color:red'>Lỗi: Không tìm thấy file '{pdf_path}'</h3>"})

        text_content = ""
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                extracted = page.extract_text()
                if extracted: text_content += extracted + "\n"

        lines = text_content.split('\n')
        html_output = ""

        for line in lines:
            line = line.strip()
            if not line: continue
            
            if re.match(r'^\d+\.', line) or line.isupper():
                html_output += f"<h3>{line}</h3>"
            elif line.startswith('-') or line.startswith('•') or line.startswith(''):
                clean = line.replace('', '').strip()
                html_output += f"<p style='margin-left: 20px; color: #ddd;'>• {clean}</p>"
            else:
                html_output += f"<p>{line}</p>"

        return JsonResponse({"html": html_output})

    except Exception as e:
        return JsonResponse({"html": f"<h3 style='color:red'>Lỗi Backend: {str(e)}</h3>"})