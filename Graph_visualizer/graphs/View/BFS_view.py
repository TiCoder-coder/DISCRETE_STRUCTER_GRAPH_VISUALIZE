from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
from collections import deque


def is_bipartite(adj_list, nodes):
    if not nodes:
        return True, {}

    color = {node: -1 for node in nodes}

    for start_node in nodes:
        if color[start_node] == -1:
            queue = deque([start_node])
            color[start_node] = 0

            while queue:
                u = queue.popleft()

                for v in adj_list.get(u, []):
                    if color[v] == -1:
                        color[v] = 1 - color[u]
                        queue.append(v)

                    elif color[v] == color[u]:
                        return False, color

    return True, color

def bfs_page(request):
    return render(request, 'graphs/algorithms_d3/bfs_dfs/bfs.html')


@csrf_exempt
def bfs_view(request):
    if request.method == 'POST':
        try:
            print("----- NEW REQUEST -----")

            try:
                data = json.loads(request.body)
            except json.JSONDecodeError:
                return JsonResponse({"error": "Invalid JSON format"}, status=400)

            nodes = data.get('nodes', [])
            edges_raw = data.get('edges', [])
            start_node = data.get('startNode')
            graph_type = data.get('graphType', 'undirected')

            if not nodes or not start_node or start_node not in nodes:
                return JsonResponse({"error": "Dữ liệu đầu vào không hợp lệ!"}, status=400)

            adj_list = {node: [] for node in nodes}
            clean_edges = []

            for edge in edges_raw:
                if isinstance(edge, str) and '-' in edge:
                    parts = edge.split('-')
                    if len(parts) >= 2:
                        u, v = parts[0].strip(), parts[1].strip()
                        if u in adj_list and v in adj_list:
                            if v not in adj_list[u]: adj_list[u].append(v)
                            clean_edges.append({"source": u, "target": v})

                            if graph_type == 'undirected':
                                if u not in adj_list[v]: adj_list[v].append(u)

            for node in adj_list:
                adj_list[node].sort()

            is_bipartite_result, coloring_map = is_bipartite(adj_list, nodes)

            queue = deque([start_node])
            visited = {start_node}
            path = []
            steps = []

            steps.append({
                "action": "INIT", "current_node": start_node, "visiting_neighbor": None,
                "queue": list(queue), "visited_list": list(visited)
            })

            while queue:
                u = queue.popleft()
                path.append(u)

                steps.append({
                    "action": "POP", "current_node": u, "visiting_neighbor": None,
                    "queue": list(queue), "visited_list": list(visited)
                })

                for v in adj_list.get(u, []):
                    if v not in visited:
                        visited.add(v)
                        queue.append(v)

                        steps.append({
                            "action": "PUSH", "current_node": u, "visiting_neighbor": v,
                            "queue": list(queue), "visited_list": list(visited)
                        })

            size = len(nodes)
            adj_matrix = [[0] * size for _ in range(size)]
            node_index = {node: i for i, node in enumerate(nodes)}

            for u, neighbors in adj_list.items():
                for v in neighbors:
                    if u in node_index and v in node_index:
                        adj_matrix[node_index[u]][node_index[v]] = 1

            response_data = {
                "nodes": nodes,
                "edges": clean_edges,
                "analysis": {
                    "nodes": nodes,
                    "num_nodes": len(nodes),
                    "num_edges": len(clean_edges),
                    "adj_matrix": adj_matrix,
                    "adj_list": adj_list,
                    "is_bipartite": is_bipartite_result,
                    "coloring": coloring_map
                },
                "result": {
                    "path": path,
                    "steps": steps
                }
            }
            print("DEBUG: Success! Sending response.")
            return JsonResponse(response_data)

        except Exception as e:
            print(f"CRITICAL ERROR: {str(e)}")
            return JsonResponse({"error": str(e)}, status=400)

    return JsonResponse({"error": "Only POST allowed"}, status=405)

