import networkx as nx
def is_euler_undirected(G):
    if not nx.is_connected(G):
        return False, "Đồ thị không liên thông"

    odd = [v for v in G.nodes if G.degree[v] % 2 == 1]

    if len(odd) == 0:
        return "circuit", "Chu trình Euler"
    elif len(odd) == 2:
        return "path", "Đường đi Euler"
    else:
        return False, "Không phải Euler"

def is_euler_directed(G):
    if not nx.is_weakly_connected(G):
        return False, "Đồ thị không liên thông"

    indeg = G.in_degree()
    outdeg = G.out_degree()

    plus1 = minus1 = 0

    for v in G.nodes:
        diff = outdeg[v] - indeg[v]
        if diff == 1:
            plus1 += 1
        elif diff == -1:
            minus1 += 1
        elif diff != 0:
            return False, "Không cân bằng bậc"

    if plus1 == 0 and minus1 == 0:
        return "circuit", "Chu trình Euler"
    if plus1 == 1 and minus1 == 1:
        return "path", "Đường đi Euler"

    return False, "Không thỏa Euler"

class FleuryAlgorithm:
    def __init__(self, graph, graphType, start_node=None, mode="auto"):
        self.G = graph.copy()
        self.start_node = start_node
        self.graphType = graphType

        self.mode = mode
        self.steps = []

    def is_bridge(self, u, v):        
        if self.G.degree[u] == 1:
            return False
        visited_before = len(list(nx.dfs_preorder_nodes(self.G, u)))
        G_temp = self.G.copy()
        G_temp.remove_edge(u, v)
        visited_after = len(list(nx.dfs_preorder_nodes(G_temp, u)))
        return visited_after < visited_before

    def get_start_node(self):
        if self.graphType == "directed":
            euler_type, msg = is_euler_directed(self.G)
        else:
            euler_type, msg = is_euler_undirected(self.G)

        if not euler_type:
            raise ValueError(msg)

        if self.start_node:
            return self.start_node

        odd_nodes = [v for v in self.G.nodes if self.G.degree[v] % 2 == 1]
        if self.graphType == "directed":
            indeg = self.G.in_degree()
            outdeg = self.G.out_degree()

            for v in self.G.nodes:
                if outdeg[v] == indeg[v] + 1:
                    return v
            
            return list(self.G.nodes)[0]
        if self.mode == "auto":
            if odd_nodes:
                return odd_nodes[0]
            else:
                return list(self.G.nodes)[0]

        if self.mode == "path":
            if len(odd_nodes) != 2:
                raise ValueError("Không tồn tại đường đi Euler (Euler Path). Đồ thị không có đúng 2 đỉnh bậc lẻ.")
            return odd_nodes[0]

        if self.mode == "circuit":
            if len(odd_nodes) != 0:
                raise ValueError("Không tồn tại chu trình Euler. Đồ thị vẫn còn đỉnh bậc lẻ.")
            return list(self.G.nodes)[0]
        


        return list(self.G.nodes)[0]


    def run(self):
        if self.graphType == "directed":
            euler_type, msg = is_euler_directed(self.G)
        else:
            euler_type, msg = is_euler_undirected(self.G)

        if not euler_type:
            raise ValueError(msg)

        G = self.G
        start = self.get_start_node()
        current = start

        euler_path = [current]
        self.steps.append({"step": 0, "current": current, "edge": None})

        step = 1

        while len(G.edges) > 0:
            neighbors = list(G.neighbors(current))

            if not neighbors:
                raise ValueError(f"Node {current} không còn cạnh nào để đi.")

            chosen = None

            for neighbor in neighbors:
                if len(neighbors) == 1:
                    chosen = (current, neighbor)
                    break

                if not self.is_bridge(current, neighbor):
                    chosen = (current, neighbor)
                    break

            if chosen is None:
                chosen = (current, neighbors[0])

            u, v = chosen
            G.remove_edge(u, v)

            euler_path.append(v)
            self.steps.append({"step": step, "current": v, "edge": [u, v]})

            current = v
            step += 1

        return {"path": euler_path, "steps": self.steps}