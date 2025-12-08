from collections import defaultdict
import heapq


def dijkstra(graph, start, end=None, directed=False):
    nodes = list(graph.keys())
    index_map = {node: i for i, node in enumerate(nodes)}
    n = len(nodes)

    adj_list = defaultdict(list)
    degree = {node: 0 for node in nodes}
    adj_matrix = [[float("inf")] * n for _ in range(n)]

    for u in graph:
        for v, w in graph[u]:
            adj_list[u].append((v, w))

            ui = index_map[u]
            vi = index_map[v]
            adj_matrix[ui][vi] = min(adj_matrix[ui][vi], w)
            degree[u] += 1

            if not directed:
                adj_list[v].append((u, w))
                adj_matrix[vi][ui] = min(adj_matrix[vi][ui], w)
                degree[v] += 1

    distance = {node: float("inf") for node in nodes}
    prev = {node: None for node in nodes}
    distance[start] = 0
    visited = set()
    heap = [(0, start)]
    steps = []

    while heap:
        dist_u, u = heapq.heappop(heap)
        if u in visited:
            continue

        visited.add(u)

        step_info = {
            "current": u,
            "marked": list(visited),
            "unmarked": [node for node in nodes if node not in visited],
            "distance": dict(distance),
        }
        steps.append(step_info)

        if end and u == end:
            break

        for v, weight in adj_list[u]:
            if v in visited:
                continue
            alt = distance[u] + weight
            if alt < distance[v]:
                distance[v] = alt
                prev[v] = u
                heapq.heappush(heap, (alt, v))

    path = []
    if end is not None:
        cur = end
        while cur is not None:
            path.append(cur)
            cur = prev[cur]
        path.reverse()

    return {
        "adjacency_list": dict(adj_list),
        "adjacency_matrix": adj_matrix,
        "degree": degree,
        "distance": distance,
        "path": path if end is not None else None,
        "steps": steps,
    }


if __name__ == "__main__":
    graph_input = {
        "1": [("2", 7), ("3", 12)],
        "2": [("4", 9), ("5", 16)],
        "3": [("5", 19)],
        "4": [("6", 17)],
        "5": [("6", 2)],
        "6": [],
    }

    result = dijkstra(graph_input, "1", "6", directed=True)
    print(result)
