import networkx as nx

class HierholzerAlgorithm:
    def __init__(self, graph, start_node=None, mode="auto"):
        self.G = graph.copy()
        self.start_node = start_node
        self.mode = mode

    def _get_start_node(self):
        G = self.G
        odd = [v for v in G.nodes if G.degree[v] % 2 == 1]

        if len(odd) not in (0, 2):
            raise ValueError("Đồ thị không phải Euler (số đỉnh bậc lẻ ≠ 0 và ≠ 2).")

        if self.start_node is not None:
            return self.start_node

        if self.mode == "path":
            if len(odd) != 2:
                raise ValueError("Không tồn tại đường đi Euler (Euler Path).")
            return odd[0]

        if self.mode == "circuit":
            if len(odd) != 0:
                raise ValueError("Không tồn tại chu trình Euler (Euler Circuit).")
            return list(G.nodes)[0]

        if len(odd) == 2:
            return odd[0]
        else:
            return list(G.nodes)[0]

    def _build_cycle(self, start, adj):
        cycle = [start]
        v = start

        while True:
            neighbors = adj.get(v, [])
            if not neighbors:
                break

            u = neighbors[0]

            adj[v] = [x for x in neighbors if x != u]
            adj[u] = [x for x in adj.get(u, []) if x != v]

            v = u
            cycle.append(v)

            if v == start:
                break

        return cycle

    def run(self):
        G = self.G
        start = self._get_start_node()

        adj = {v: list(G.neighbors(v)) for v in G.nodes}

        steps = []

        R = self._build_cycle(start, adj)
        steps.append({
            "label": "R1",
            "pivot": start,
            "new_cycle": R.copy(),
            "tour": R.copy(),
        })

        k = 1

        while True:
            pivot = None
            for v in R:
                if adj.get(v):
                    pivot = v
                    break

            if pivot is None:
                break

            Q = self._build_cycle(pivot, adj)
            k += 1

            pos = R.index(pivot)
            R = R[:pos] + Q + R[pos+1:]

            steps.append({
                "label": f"R{k}",
                "pivot": pivot,
                "new_cycle": Q.copy(),
                "tour": R.copy(),
            })

        return {
            "path": R,
            "steps": steps,
        }
