from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import render
from django.conf import settings
import json
import os
import networkx as nx
import pdfplumber

# Import class thuật toán DFS
# Đảm bảo đường dẫn này đúng với nơi bạn lưu file dfs.py
from graphs.algorithms.bfs_dfs.dfs import DFSAlgorithm

# 1. View render trang HTML
def dfs_visualize_view(request):
    return render(request, "graphs/algorithms_d3/bfs_dfs/dfs.html")

# 2. API xử lý thuật toán DFS
@csrf_exempt
def get_dfs_data(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST only"})

    try:
        body = json.loads(request.body.decode("utf-8"))

        # Lấy dữ liệu từ request
        nodes = [n.strip() for n in body.get("nodes", [])]
        edges_raw = body.get("edges", [])
        start_node = body.get("startNode", None)
        mode = body.get("mode", "directed") # DFS mặc định có hướng

        # Xử lý cạnh
        edges = []
        for e in edges_raw:
            if "-" in e:
                u, v = e.split("-")
                edges.append({"source": u.strip(), "target": v.strip()})
            elif isinstance(e, dict): # Phòng trường hợp gửi object
                edges.append(e)

        # Tạo đồ thị NetworkX
        if mode == "directed":
            G = nx.DiGraph()
        else:
            G = nx.Graph()

        G.add_nodes_from(nodes)
        for e in edges:
            if e["source"] in nodes and e["target"] in nodes:
                G.add_edge(e["source"], e["target"])

        # Chạy thuật toán DFS
        algo = DFSAlgorithm(G, start_node=start_node, mode=mode)
        result = algo.run()
        
        if "error" in result:
             return JsonResponse({"error": result["error"]})

        # Tạo dữ liệu phân tích (Analysis)
        # Tạo ma trận kề bằng list comprehension (không cần scipy)
        adj_matrix = [[1 if G.has_edge(u, v) else 0 for v in nodes] for u in nodes]
        
        analysis = {
            "num_nodes": len(nodes),
            "num_edges": len(edges),
            # Với có hướng thì tính bậc vào/ra, vô hướng tính bậc thường
            "degree": {n: G.degree[n] for n in nodes}, 
            "adj_list": {n: list(G.neighbors(n)) for n in nodes},
            "adj_matrix": adj_matrix,
            "mode": mode
        }

        return JsonResponse({
            "nodes": [{"id": n} for n in nodes],
            "edges": edges,
            "analysis": analysis,
            "result": result,
        })

    except Exception as e:
        return JsonResponse({"error": str(e)})
def get_dfs_pdf(request):
    # Đường dẫn đến file dfs.pdf
    pdf_path = os.path.join(
        settings.BASE_DIR, "graphs", "static", "graphs", "docs", "dfs.pdf"
    )

    # Kiểm tra file có tồn tại không
    if not os.path.exists(pdf_path):
        return JsonResponse({"html": "<p>Chưa có tài liệu giới thiệu (dfs.pdf).</p>"})

    try:
        html_output = ""
        
        # Dùng pdfplumber để đọc
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                # layout=True giúp giữ định dạng văn bản tốt hơn
                text = page.extract_text(layout=True)
                if text:
                    # Bọc trong thẻ <pre> để hiển thị đúng xuống dòng/cách dòng
                    html_output += (
                        "<pre style='white-space: pre-wrap; font-family: inherit; font-size: 16px; line-height: 1.6;'>"
                        + text +
                        "</pre><br>"
                    )

        return JsonResponse({"html": html_output})

    except Exception as e:
        return JsonResponse({"html": f"<p>Lỗi đọc PDF: {str(e)}</p>"})