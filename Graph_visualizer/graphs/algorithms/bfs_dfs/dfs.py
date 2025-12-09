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
    def check_bipartite(self):
        G_check = self.G.to_undirected()
        
        colors = {}
        is_bipartite = True
        conflict_edge = None

        for node in G_check.nodes():
            if node not in colors:
                queue = [node]
                colors[node] = 0 
                
                while queue:
                    u = queue.pop(0)
                    current_color = colors[u]
                    
                    for v in G_check.neighbors(u):
                        if v not in colors:
                            colors[v] = 1 - current_color
                            queue.append(v)
                        elif colors[v] == current_color:
                            is_bipartite = False
                            conflict_edge = {"source": u, "target": v}
                            break
                    if not is_bipartite: break
            if not is_bipartite: break
            
        sets = {"0": [], "1": []}
        for n, c in colors.items():
            sets[str(c)].append(n)

        return {
            "is_bipartite": is_bipartite,
            "sets": sets,
            "conflict_edge": conflict_edge
        }
