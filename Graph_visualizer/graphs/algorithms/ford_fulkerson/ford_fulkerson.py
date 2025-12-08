import networkx as nx

class FordFulkersonAlgorithm:
    def __init__(self, graph, source, sink):
        self.G = graph.copy()
        self.source = source
        self.sink = sink
        self.steps = []
        
        self.residual_G = nx.DiGraph()
        for u, v, data in self.G.edges(data=True):
            cap = data.get('capacity', 0)
            if self.residual_G.has_edge(u, v):
                self.residual_G[u][v]['capacity'] += cap
            else:
                self.residual_G.add_edge(u, v, capacity=cap)
            if not self.residual_G.has_edge(v, u):
                self.residual_G.add_edge(v, u, capacity=0)

    def bfs(self, parent):
        visited = {node: False for node in self.residual_G.nodes}
        queue = []
        queue.append(self.source)
        visited[self.source] = True
        parent[self.source] = -1
        
        while queue:
            u = queue.pop(0)
            for v in self.residual_G.neighbors(u):
                residual_cap = self.residual_G[u][v]['capacity']
                if not visited[v] and residual_cap > 0:
                    queue.append(v)
                    visited[v] = True
                    parent[v] = u
                    if v == self.sink:
                        return True
        return False

    def run(self):
        if self.source not in self.G.nodes or self.sink not in self.G.nodes:
            raise ValueError(f"Đỉnh nguồn '{self.source}' hoặc đích '{self.sink}' không tồn tại.")
        
        if self.source == self.sink:
            raise ValueError("Đỉnh nguồn và đỉnh đích không được trùng nhau.")

        parent = {}
        max_flow = 0
        step_count = 0
        
        self.steps.append({
            "step": 0,
            "action": "init",
            "message": "Khởi tạo đồ thị dư. Tất cả luồng = 0."
        })

        while self.bfs(parent):
            step_count += 1
            path_flow = float('inf')
            s = self.sink
            path_nodes = [self.sink]
            
            while s != self.source:
                p = parent[s]
                cap = self.residual_G[p][s]['capacity']
                path_flow = min(path_flow, cap)
                s = p
                path_nodes.append(s)
            
            path_nodes.reverse()

            v = self.sink
            while v != self.source:
                u = parent[v]
                self.residual_G[u][v]['capacity'] -= path_flow
                self.residual_G[v][u]['capacity'] += path_flow
                v = u

            max_flow += path_flow
            
            self.steps.append({
                "step": step_count,
                "action": "augment",
                "path": path_nodes,
                "flow_added": path_flow,
                "current_max_flow": max_flow,
                "message": f"Tìm thấy đường tăng luồng: {' -> '.join(map(str, path_nodes))} (Tăng {path_flow})"
            })

        return {"max_flow": max_flow, "steps": self.steps}