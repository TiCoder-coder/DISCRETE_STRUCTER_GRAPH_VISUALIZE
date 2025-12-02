from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
from collections import deque  # Thêm thư viện deque cho BFS trong kiểm tra Hai phía


# --- HÀM KIỂM TRA ĐỒ THỊ HAI PHÍA (BIPARTITE) ---
def is_bipartite(adj_list, nodes):
    """
    Kiểm tra đồ thị hai phía sử dụng thuật toán tô màu (Coloring) dựa trên BFS.
    Trả về (True/False, coloring_map)
    """
    if not nodes:
        return True, {}

    # Lưu trữ màu của mỗi đỉnh: -1 (chưa tô), 0 (màu 1), 1 (màu 2)
    color = {node: -1 for node in nodes}

    # Duyệt qua tất cả các thành phần liên thông
    for start_node in nodes:
        if color[start_node] == -1:
            queue = deque([start_node])
            color[start_node] = 0  # Bắt đầu tô màu đỉnh đầu tiên là 0

            while queue:
                u = queue.popleft()

                # Duyệt các đỉnh kề của u
                for v in adj_list.get(u, []):
                    if color[v] == -1:
                        # Nếu v chưa được tô màu, tô màu ngược với u
                        color[v] = 1 - color[u]
                        queue.append(v)

                    elif color[v] == color[u]:
                        # Nếu v và u cùng màu => KHÔNG phải đồ thị hai phía
                        return False, color

    # Nếu duyệt xong mà không có đỉnh nào cùng màu nối với nhau
    return True, color


# --------------------------------------------------------------------------


# 1. Hàm hiển thị trang HTML
def bfs_page(request):
    return render(request, 'graphs/algorithms_d3/bfs_dfs/bfs.html')


# 2. Hàm xử lý API chính
@csrf_exempt
def bfs_view(request):
    if request.method == 'POST':
        try:
            print("----- NEW REQUEST -----")

            try:
                data = json.loads(request.body)
            except json.JSONDecodeError:
                return JsonResponse({"error": "Invalid JSON format"}, status=400)

            # Lấy dữ liệu
            nodes = data.get('nodes', [])
            edges_raw = data.get('edges', [])
            start_node = data.get('startNode')
            graph_type = data.get('graphType', 'undirected')

            # --- KIỂM TRA DỮ LIỆU ĐẦU VÀO ---
            if not nodes or not start_node or start_node not in nodes:
                return JsonResponse({"error": "Dữ liệu đầu vào không hợp lệ!"}, status=400)

            # 1. Xây dựng danh sách kề
            adj_list = {node: [] for node in nodes}
            clean_edges = []

            # Xây dựng adj_list và clean_edges
            for edge in edges_raw:
                if isinstance(edge, str) and '-' in edge:
                    parts = edge.split('-')
                    if len(parts) >= 2:
                        u, v = parts[0].strip(), parts[1].strip()
                        if u in adj_list and v in adj_list:
                            if v not in adj_list[u]: adj_list[u].append(v)
                            clean_edges.append({"source": u, "target": v})

                            # Nếu là đồ thị vô hướng
                            if graph_type == 'undirected':
                                if u not in adj_list[v]: adj_list[v].append(u)

            # Sắp xếp danh sách kề
            for node in adj_list:
                adj_list[node].sort()

            # 2. KIỂM TRA ĐỒ THỊ HAI PHÍA (Bipartite)
            is_bipartite_result, coloring_map = is_bipartite(adj_list, nodes)

            # 3. THUẬT TOÁN BFS (Code BFS cũ của bạn, đã được rút gọn)
            queue = deque([start_node])  # Sử dụng deque cho hiệu suất tốt hơn
            visited = {start_node}
            path = []
            steps = []

            # Khởi tạo
            steps.append({
                "action": "INIT", "current_node": start_node, "visiting_neighbor": None,
                "queue": list(queue), "visited_list": list(visited)
            })

            while queue:
                u = queue.popleft()
                path.append(u)

                # POP
                steps.append({
                    "action": "POP", "current_node": u, "visiting_neighbor": None,
                    "queue": list(queue), "visited_list": list(visited)
                })

                for v in adj_list.get(u, []):
                    if v not in visited:
                        visited.add(v)
                        queue.append(v)

                        # PUSH
                        steps.append({
                            "action": "PUSH", "current_node": u, "visiting_neighbor": v,
                            "queue": list(queue), "visited_list": list(visited)
                        })

            # 4. Tạo Ma trận kề (Giữ nguyên)
            size = len(nodes)
            adj_matrix = [[0] * size for _ in range(size)]
            node_index = {node: i for i, node in enumerate(nodes)}

            for u, neighbors in adj_list.items():
                for v in neighbors:
                    if u in node_index and v in node_index:
                        adj_matrix[node_index[u]][node_index[v]] = 1

            # --- TRẢ VỀ KẾT QUẢ CUỐI CÙNG ---
            response_data = {
                "nodes": nodes,
                "edges": clean_edges,
                "analysis": {
                    "nodes": nodes,
                    "num_nodes": len(nodes),
                    "num_edges": len(clean_edges),
                    "adj_matrix": adj_matrix,
                    "adj_list": adj_list,
                    # --- THÊM KẾT QUẢ HAI PHÍA VÀO ĐÂY ---
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

