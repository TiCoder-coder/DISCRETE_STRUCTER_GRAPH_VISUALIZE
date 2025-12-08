from typing import List, Tuple, Dict

Edge = Tuple[int, int, int]


class KruskalAlgorithm:
    def __init__(self, G):
        self.G = G
        self.nodes = list(G.nodes())
        self.edges = []

        for u, v, data in G.edges(data=True):
            w = data.get("weight", 1)
            self.edges.append((u, v, w))

        self.steps: List[Dict] = []

    def find(self, parent, x):
        if parent[x] != x:
            parent[x] = self.find(parent, parent[x])
        return parent[x]

    def union(self, parent, size, x, y):
        px, py = self.find(parent, x), self.find(parent, y)
        if px == py:
            return False

        if size[px] < size[py]:
            px, py = py, px

        parent[py] = px
        size[px] += size[py]
        return True

    def run(self):
        edges = sorted(self.edges, key=lambda e: e[2])

        parent = {x: x for x in self.nodes}
        size = {x: 1 for x in self.nodes}

        mst_edges: List[Edge] = []
        total_weight = 0

        for (u, v, w) in edges:

            self.steps.append({
                "action": "consider",
                "edge": (u, v, w)
            })

            if self.union(parent, size, u, v):
                mst_edges.append((u, v, w))
                total_weight += w

                self.steps.append({
                    "action": "choose",
                    "edge": (u, v, w)
                })
            else:
                self.steps.append({
                    "action": "reject",
                    "edge": (u, v, w)
                })

        if len(mst_edges) != len(self.nodes) - 1:
            return {
                "mst_cost": -1,
                "mst_edges": [],
                "steps": self.steps,
                "message": "Đồ thị không liên thông"
            }

        return {
            "mst_cost": total_weight,
            "mst_edges": mst_edges,
            "steps": self.steps
        }