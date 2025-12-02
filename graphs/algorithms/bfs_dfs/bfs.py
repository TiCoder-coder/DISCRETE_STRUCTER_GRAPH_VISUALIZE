import networkx as nx
from collections import deque


class BFSAlgorithm:
    def __init__(self, nodes_str, edges_str, is_directed=False):
        """Khởi tạo và chuyển đổi input String thành NetworkX Graph."""
        # Chuyển đổi chuỗi input thành list
        # Ví dụ nodes_str: "A, B, C" -> self.nodes: ['A', 'B', 'C']
        if isinstance(nodes_str, list):
            self.nodes = [n.strip() for n in nodes_str if n.strip()]
        else:
            self.nodes = [n.strip() for n in nodes_str.split(',') if n.strip()]

        # Khởi tạo đồ thị NetworkX
        if is_directed == "directed" or is_directed is True:
            self.G = nx.DiGraph()
            self.is_directed = True
        else:
            self.G = nx.Graph()
            self.is_directed = False

        self.G.add_nodes_from(self.nodes)

        # Xử lý cạnh (Edges)
        if edges_str:
            # Nếu edges_str là list (do json gửi lên) hay string đều xử lý được
            edge_list = edges_str if isinstance(edges_str, list) else edges_str.split(',')

            for edge in edge_list:
                # Chuẩn hóa dấu gạch ngang (chấp nhận cả A-B và A->B)
                clean_edge = edge.replace('->', '-').strip()
                if not clean_edge: continue

                parts = clean_edge.split('-')
                if len(parts) == 2:
                    u, v = parts[0].strip(), parts[1].strip()
                    if u in self.nodes and v in self.nodes:
                        self.G.add_edge(u, v)

        self.steps = []
        self.traversal_order = []

    def run(self, start_node):
        """Chạy thuật toán BFS và ghi lại từng bước xử lý."""
        # Kiểm tra đỉnh bắt đầu
        if start_node not in self.G:
            return {"status": "error", "message": f"Đỉnh {start_node} không tồn tại."}

        # Khởi tạo
        queue = deque([start_node])
        visited = set([start_node])
        self.traversal_order = [start_node]

        # Bước 0: Khởi tạo
        self.steps.append({
            "description": f"START: Đưa đỉnh {start_node} vào Queue",
            "queue": list(queue),
            "visited": list(visited),
            "current_node": None,
            "highlight_node": start_node,
            "highlight_edge": None
        })

        step_count = 1

        # VÒNG LẶP BFS
        while queue:
            # POP: Lấy đỉnh ra khỏi hàng đợi
            u = queue.popleft()

            self.steps.append({
                "step": step_count,
                "description": f"POP: Lấy {u} ra khỏi hàng đợi để xét",
                "queue": list(queue),
                "visited": list(visited),
                "current_node": u,
                "highlight_node": u,
                "highlight_edge": None
            })
            step_count += 1

            # Lấy và sắp xếp các đỉnh kề (để thứ tự duyệt ổn định: A->B trước A->C)
            neighbors = sorted(list(self.G.neighbors(u)))

            for v in neighbors:
                # Hiệu ứng: Đang xét cạnh (u, v)
                self.steps.append({
                    "description": f"Đang xét cạnh {u} -> {v}",
                    "queue": list(queue),
                    "visited": list(visited),
                    "current_node": u,
                    "highlight_node": None,
                    "highlight_edge": [u, v]
                })

                if v not in visited:
                    # PUSH: Thêm đỉnh chưa thăm vào hàng đợi
                    visited.add(v)
                    queue.append(v)
                    self.traversal_order.append(v)

                    self.steps.append({
                        "step": step_count,
                        "description": f"PUSH: Đỉnh {v} chưa thăm -> Thêm vào Queue",
                        "queue": list(queue),
                        "visited": list(visited),
                        "current_node": u,
                        "highlight_node": v,
                        "highlight_edge": [u, v]
                    })
                    step_count += 1

        # Kiểm tra tính liên thông
        connectivity_msg = self.check_connectivity(self.traversal_order)

        # KẾT QUẢ TRẢ VỀ CHO VIEW
        return {
            "status": "success",
            "traversal_order": self.traversal_order,  # Đã sửa key này để khớp với JS
            "steps": self.steps,
            "queue_history": [],  # Placeholder nếu cần
            "message": connectivity_msg
        }

    def check_connectivity(self, traversal_path):
        """Kiểm tra xem đã duyệt hết các đỉnh chưa."""
        total = len(self.G.nodes)
        count = len(traversal_path)
        is_connected = (count == total)

        if is_connected:
            return "Đã duyệt hết toàn bộ các đỉnh (Đồ thị liên thông)."
        else:
            return f"Không liên thông: Mới duyệt {count}/{total} đỉnh."