import networkx as nx


class DFSAlgorithm:
    def __init__(self, nodes, edges, start_node=None, end_node=None, mode="directed"):

        self.nodes = [str(n).strip() for n in nodes if str(n).strip() != ""]
        self.edges = edges
        self.start_node = start_node.strip() if start_node else None
        self.end_node = end_node.strip() if end_node else None
        self.mode = mode

        if mode == "directed":
            G = nx.DiGraph()
        else:
            G = nx.Graph()

        G.add_nodes_from(self.nodes)
        for e in edges:
            u = e.get("source")
            v = e.get("target")
            if u is not None and v is not None:
                G.add_edge(u, v)
        self.G = G

        if not self.nodes:
            self.start_node = None
            self.end_node = None
        else:
            if self.start_node not in self.nodes:
                self.start_node = self.nodes[0]
            if self.end_node is not None and self.end_node not in self.nodes:
                self.end_node = None


    def get_representations(self):
        nodes_order = self.nodes[:]
        adj_list = {}
        for n in nodes_order:
            neighbors = sorted(self.G.neighbors(n))
            adj_list[n] = neighbors

        idx = {n: i for i, n in enumerate(nodes_order)}
        n = len(nodes_order)
        adj_matrix = [[0] * n for _ in range(n)]
        for u, v in self.G.edges():
            i = idx[u]
            j = idx[v]
            adj_matrix[i][j] = 1
            if not self.G.is_directed():
                adj_matrix[j][i] = 1

        return {
            "adj_list": adj_list,
            "adj_matrix": adj_matrix,
        }

    def run_dfs(self):
        if self.start_node is None:
            return {"error": "Không có đỉnh bắt đầu để duyệt DFS."}

        adj = {}
        for n in self.nodes:
            neighbors = sorted(self.G.neighbors(n))
            adj[n] = neighbors

        stack = [self.start_node]
        visited = []
        visited_set = set()
        steps = []

        steps.append({
            "description": "Khởi tạo Stack",
            "current_node": None,
            "stack": list(stack),
            "visited": list(visited),
        })

        while stack:
            curr = stack.pop()

            if curr in visited_set:
                continue

            visited_set.add(curr)
            visited.append(curr)

            neighbors = adj.get(curr, [])
            added_neighbors = []
            for nb in reversed(neighbors):
                if nb not in visited_set:
                    stack.append(nb)
                    added_neighbors.append(nb)

            steps.append({
                "description": f"Thăm {curr}, thêm {added_neighbors} vào Stack",
                "current_node": curr,
                "stack": list(stack),
                "visited": list(visited),
                "neighbors": neighbors,
            })

        return {
            "path": visited,
            "steps": steps,
        }


    def get_shortest_path(self):
        if self.start_node is None or self.end_node is None:
            return {"error": "Cần nhập cả đỉnh bắt đầu và kết thúc để tìm đường đi ngắn nhất."}

        if self.start_node not in self.G.nodes or self.end_node not in self.G.nodes:
            return {"error": "Đỉnh bắt đầu hoặc kết thúc không tồn tại trong đồ thị."}

        try:
            path = nx.shortest_path(self.G, source=self.start_node, target=self.end_node)
        except nx.NetworkXNoPath:
            return {"error": f"Không tồn tại đường đi từ {self.start_node} đến {self.end_node}."}

        steps = []
        visited = []
        for i, node in enumerate(path):
            visited.append(node)
            steps.append({
                "description": f"Bước {i}: Đi tới {node}",
                "current_node": node,
                "stack": [],
                "visited": list(visited),
            })

        return {
            "path": path,
            "steps": steps,
        }

    def check_bipartite(self):
        if self.G.number_of_nodes() == 0:
            return {
                "error": "Đồ thị rỗng, không thể kiểm tra hai phía."
            }

        if self.G.is_directed():
            H = self.G.to_undirected()
        else:
            H = self.G

        is_bi = nx.is_bipartite(H)
        if not is_bi:
            return {
                "is_bipartite": False,
                "partition": [],
                "message": "Đồ thị chứa chu trình lẻ nên KHÔNG phải đồ thị hai phía.",
            }

        try:
            color = nx.algorithms.bipartite.color(H)
            set1 = [n for n, c in color.items() if c == 0]
            set2 = [n for n, c in color.items() if c == 1]
        except Exception:
            set1 = list(H.nodes())
            set2 = []

        return {
            "is_bipartite": True,
            "partition": [set1, set2],
            "message": "Đây là đồ thị HAI PHÍA (bipartite) – không tồn tại chu trình lẻ.",
        }
