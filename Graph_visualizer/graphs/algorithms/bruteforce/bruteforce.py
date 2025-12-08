from typing import List, Dict, Any
import itertools
import sys


class BruteForceShortestPath:
    def __init__(self, G, start_node, end_node, directed=False):
        self.G = G
        self.nodes = list(G.nodes())
        self.start = start_node
        self.end = end_node
        self.directed = directed
        self.steps: List[Dict[str, Any]] = [] 
        self.adj = {u: [] for u in self.nodes}

        for u, v, data in G.edges(data=True):
            w = data.get("weight", 1)
            self.adj[u].append((v, w))
            if not self.directed:
                self.adj[v].append((u, w))

    def path_cost(self, path):
        """Tính chi phí của 1 đường đi. KHÔNG ghi lại steps tại đây."""
        cost = 0

        for i in range(len(path) - 1):
            u, v = path[i], path[i + 1]
            weight = None
            for nxt, w in self.adj[u]:
                if nxt == v:
                    weight = w
                    break
            if weight is None:
                return None

            cost += weight

        return cost

    def run(self):
        if self.start not in self.nodes or self.end not in self.nodes:
            return {
                "best_cost": -1,
                "best_path": [],
                "steps": [],
                "message": "Đỉnh bắt đầu hoặc kết thúc không tồn tại"
            }

        if self.start == self.end:
            return {
                "best_cost": 0,
                "best_path": [self.start],
                "steps": [{"path": [self.start], "cost": 0}],
                "message": "Đỉnh bắt đầu và kết thúc trùng nhau"
            }

        best_cost = float('inf')
        best_path = None
    
        final_steps: List[Dict[str, Any]] = []

        other_nodes = [n for n in self.nodes if n not in (self.start, self.end)]

        for r in range(len(other_nodes) + 1):
            for perm in itertools.permutations(other_nodes, r):
                path = [self.start] + list(perm) + [self.end]
                
                cost = self.path_cost(path)

                if cost is not None:

                    final_steps.append({
                        "path": list(path),
                        "cost": cost
                    })
                    
                    if cost < best_cost:
                        best_cost = cost
                        best_path = path


        if best_path is None:
            return {
                "best_cost": -1,
                "best_path": [],
                "steps": final_steps, 
                "message": "Không tồn tại đường đi hợp lệ"
            }

        return {
            "best_cost": best_cost,
            "best_path": best_path,
            "steps": final_steps 
        }