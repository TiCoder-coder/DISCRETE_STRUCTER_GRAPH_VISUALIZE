from typing import List, Dict, Any
import sys


class PrimAlgorithm:
    def __init__(self, G, start_node=None):
        self.G = G
        self.nodes = list(G.nodes())
        self.start = start_node if start_node is not None else self.nodes[0]
        self.steps: List[Dict[str, Any]] = []

        self.adj = {u: [] for u in self.nodes}
        for u, v, data in G.edges(data=True):
            w = data.get("weight", 1)
            self.adj[u].append((v, w))
            self.adj[v].append((u, w))

    def run(self):
        if self.start not in self.nodes:
            return {"mst_cost": -1, "steps": [], "message": "Đỉnh bắt đầu không tồn tại"}

        used = {node: False for node in self.nodes}
        used[self.start] = True
        total_weight = 0
        mst_edges = []

        for _ in range(len(self.nodes) - 1):
            min_w = sys.maxsize
            best_u = None
            best_v = None

            for u in self.nodes:
                if not used[u]:
                    continue

                for v, w in self.adj[u]:
                    if used[v]:
                        continue  

                    self.steps.append({
                        "action": "consider",
                        "edge": [u, v, w]
                    })

                    if w < min_w:
                        min_w = w
                        best_u = u
                        best_v = v

            if min_w == sys.maxsize:
                return {
                    "mst_cost": -1,
                    "steps": self.steps,
                    "message": "Đồ thị không liên thông"
                }

            mst_edges.append((best_u, best_v, min_w))
            total_weight += min_w
            used[best_v] = True

            self.steps.append({
                "action": "choose",
                "edge": [best_u, best_v, min_w],
                "new_node": best_v
            })

        return {
            "mst_cost": total_weight,
            "steps": self.steps,
            "mst_edges": mst_edges
        }