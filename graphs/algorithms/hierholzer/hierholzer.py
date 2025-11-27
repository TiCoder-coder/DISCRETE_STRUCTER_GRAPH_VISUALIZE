import networkx as nx

class HierholzerAlgorithm:
    def __init__(self, graph, start_node=None, mode="auto"):
        self.G = graph.copy()
        self.start_node = start_node
        self.mode = mode

    # Chọn đỉnh bắt đầu (tự động / path / circuit)
    def _get_start_node(self):
        G = self.G
        odd = [v for v in G.nodes if G.degree[v] % 2 == 1]

        if len(odd) not in (0, 2):
            raise ValueError("Đồ thị không phải Euler (số đỉnh bậc lẻ ≠ 0 và ≠ 2).")

        # Nếu người dùng chỉ định sẵn
        if self.start_node is not None:
            return self.start_node

        # Chế độ PATH: bắt buộc có đúng 2 đỉnh bậc lẻ
        if self.mode == "path":
            if len(odd) != 2:
                raise ValueError("Không tồn tại đường đi Euler (Euler Path).")
            return odd[0]

        # Chế độ CIRCUIT: bắt buộc không có đỉnh bậc lẻ
        if self.mode == "circuit":
            if len(odd) != 0:
                raise ValueError("Không tồn tại chu trình Euler (Euler Circuit).")
            return list(G.nodes)[0]

        # AUTO
        if len(odd) == 2:
            return odd[0]
        else:
            return list(G.nodes)[0]

    # Xây 1 chu trình đơn Q bắt đầu từ đỉnh start trên danh sách kề adj (đã clone)
    def _build_cycle(self, start, adj):
        cycle = [start]
        v = start

        while True:
            neighbors = adj.get(v, [])
            if not neighbors:
                break

            # Lấy hàng xóm đầu tiên còn cạnh
            u = neighbors[0]

            # Xóa cạnh v-u ở cả hai phía
            adj[v] = [x for x in neighbors if x != u]
            adj[u] = [x for x in adj.get(u, []) if x != v]

            v = u
            cycle.append(v)

            # Chu trình đóng lại
            if v == start:
                break

        return cycle

    def run(self):
        G = self.G
        start = self._get_start_node()

        # Clone danh sách kề để thao tác cạnh
        adj = {v: list(G.neighbors(v)) for v in G.nodes}

        steps = []

        # R1 = chu trình đầu tiên
        R = self._build_cycle(start, adj)
        steps.append({
            "label": "R1",
            "pivot": start,
            "new_cycle": R.copy(),   # Q1 ở bước tiếp theo, ở đây new_cycle = R1
            "tour": R.copy(),
        })

        k = 1

        # Lặp: tìm đỉnh trên R còn cạnh để mở rộng
        while True:
            pivot = None
            for v in R:
                if adj.get(v):
                    pivot = v
                    break

            if pivot is None:
                break  # không còn cạnh -> xong

            Q = self._build_cycle(pivot, adj)   # Q_k
            k += 1

            # Ghép Q vào R tại vị trí pivot
            pos = R.index(pivot)
            R = R[:pos] + Q + R[pos+1:]

            steps.append({
                "label": f"R{k}",
                "pivot": pivot,
                "new_cycle": Q.copy(),  # Q_k
                "tour": R.copy(),       # R_k sau khi ghép
            })

        # R bây giờ là chu trình/đường đi Euler cuối cùng
        return {
            "path": R,
            "steps": steps,   # dùng cho hiển thị R_i, Q_i + animation
        }
