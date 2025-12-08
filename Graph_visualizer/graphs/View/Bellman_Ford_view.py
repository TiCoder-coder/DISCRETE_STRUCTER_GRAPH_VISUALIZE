import json
import networkx as nx
from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import pdfplumber
from django.conf import settings
import os
import re

def clean_dist_for_json(dist):
    new_dist = {}
    for k, v in dist.items():
        new_dist[k] = "∞" if v == float('inf') else v
    return new_dist

def reconstruct_path(predecessors, source, target):
    path = []
    curr = target
    count = 0
    while curr is not None and count < 100:
        path.append(curr)
        if curr == source: break
        curr = predecessors.get(curr)
        count += 1
    
    if path and path[-1] == source:
        return path[::-1]
    return []

def bellman_ford_page(request):
    return render(request, 'graphs/algorithms_d3/bellman_ford/bellman_ford.html')

@csrf_exempt
def bellman_ford_api(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            nodes = data.get('nodes', [])
            edges_str = data.get('edges', "")
            source = data.get('source', "")

            edges = []
            raw_edges = [e.strip() for e in edges_str.split(',') if e.strip()]
            
            for e in raw_edges:
                parts = e.split('-')
                if len(parts) >= 3:
                    u = parts[0].strip()
                    v = parts[1].strip()
                    w_str = "-".join(parts[2:]) 
                    if w_str == "" and len(parts) == 4: w_str = "-" + parts[3]
                    try:
                        w = int(w_str)
                        edges.append({'u': u, 'v': v, 'w': w})
                    except ValueError: continue

            result = run_bellman_ford_algorithm(nodes, edges, source)
            return JsonResponse(result)

        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    return JsonResponse({'error': 'Invalid method'}, status=405)

def run_bellman_ford_algorithm(nodes, edges, source):
    dist = {n: float('inf') for n in nodes}
    predecessors = {n: None for n in nodes}
    if source in dist: dist[source] = 0
    
    steps = []
    
    steps.append({
        "action": "init",
        "message": f"Khởi tạo: d[{source}] = 0, các đỉnh khác = ∞",
        "dist": clean_dist_for_json(dist),
        "highlight_edge": None,
        "updated_node": source
    })

    V = len(nodes)

    for i in range(V - 1):
        changed = False
        steps.append({"message": f"--- VÒNG LẶP {i + 1} ---"})
        
        for edge in edges:
            u, v, w = edge['u'], edge['v'], edge['w']
            
            steps.append({
                "message": f"Xét cạnh {u} → {v} (w={w})",
                "highlight_edge": {"u": u, "v": v},
                "action": "check"
            })
            
            if dist[u] != float('inf') and dist[u] + w < dist[v]:
                dist[v] = dist[u] + w
                predecessors[v] = u
                changed = True
                
                steps.append({
                    "message": f"⚡ Cập nhật d[{v}]: {dist[v] - w} + {w} = {dist[v]} (qua {u})",
                    "dist": clean_dist_for_json(dist),
                    "highlight_edge": {"u": u, "v": v},
                    "action": "relax",
                    "updated_node": v
                })
        
        if not changed:
            steps.append({"message": "Không có thay đổi nào trong vòng này. Thuật toán dừng sớm."})
            break

    steps.append({
        "action": "check_cycle_phase",
        "message": "Kiểm tra chu trình âm (Vòng thứ V)...",
        "dist": clean_dist_for_json(dist)
    })

    has_negative_cycle = False
    for edge in edges:
        u, v, w = edge['u'], edge['v'], edge['w']
        if dist[u] != float('inf') and dist[u] + w < dist[v]:
            has_negative_cycle = True
            steps.append({
                "action": "cycle_detected",
                "message": f"PHÁT HIỆN CHU TRÌNH ÂM tại cạnh {u} -> {v}!",
                "highlight_edge": {"u": u, "v": v}
            })
            break

    paths_result = {}
    
    if not has_negative_cycle:
        summary_msg = "Hoàn tất thuật toán. Đường đi ngắn nhất:"
        
        for target in nodes:
            if target == source: continue
            
            if dist[target] != float('inf'):
                p = reconstruct_path(predecessors, source, target)
                if p:
                    path_str = " ➝ ".join(p)
                    cost = dist[target]
                    
                    paths_result[target] = { "path": p, "cost": cost, "str": path_str }
                    
                    summary_msg += f"<br>🔹 <b>{target}:</b> {path_str} (Chi phí: {cost})"

        steps.append({
            "action": "complete",
            "message": summary_msg,
            "dist": clean_dist_for_json(dist),
            "paths": paths_result
        })

    return {
        "nodes": nodes,
        "edges": edges,
        "steps": steps,
        "has_negative_cycle": has_negative_cycle,
        "final_dist": clean_dist_for_json(dist),
        "paths": paths_result
    }

def get_bellman_ford_pdf(request):
    try:
        pdf_path = os.path.join(settings.BASE_DIR, 'graphs', 'static', 'graphs', 'docs', 'Bellman-Ford.pdf')
        if not os.path.exists(pdf_path):
            return JsonResponse({"html": f"<div style='color:red'>Not Found: {pdf_path}</div>"})

        text_content = ""
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                extracted = page.extract_text()
                if extracted: text_content += extracted + "\n"

        lines = text_content.split('\n')
        html_output = "<div class='pdf-content'>"
        for line in lines:
            line = line.strip()
            if not line: continue
            if re.match(r'^\d+\.', line) or (line.isupper() and len(line) < 60):
                html_output += f"<h4 style='color: #ffd700; margin-top: 15px;'>{line}</h4>"
            elif line.startswith('-') or line.startswith('•'):
                html_output += f"<li style='margin-left: 20px;'>{line[1:].strip()}</li>"
            else:
                html_output += f"<p>{line}</p>"
        html_output += "</div>"
        return JsonResponse({"html": html_output})

    except Exception as e:
        return JsonResponse({"html": f"<div style='color:red'>Error: {str(e)}</div>"})