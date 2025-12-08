import math

def run_bellman_ford_algo(nodes, edges, source):

    dist = {node: float('inf') for node in nodes}
    dist[source] = 0
    
    steps = []

    steps.append({
        "action": "init",
        "message": f"Khởi tạo: Đỉnh nguồn {source} = 0, các đỉnh khác = ∞",
        "dist": dist.copy(),
        "highlight_edge": None
    })

    V = len(nodes)
    has_negative_cycle = False

    for i in range(V - 1):
        changed = False
        
        steps.append({
            "action": "iteration",
            "message": f"--- Bắt đầu vòng lặp thứ {i + 1} ---",
            "dist": dist.copy(),
            "highlight_edge": None
        })

        for edge in edges:
            u = edge['u']
            v = edge['v']
            w = edge['w']

            steps.append({
                "action": "check",
                "message": f"Kiểm tra cạnh {u} → {v} (w={w})",
                "dist": dist.copy(),
                "highlight_edge": {"u": u, "v": v}
            })

            if dist[u] != float('inf') and dist[u] + w < dist[v]:
                old_val = dist[v]
                dist[v] = dist[u] + w
                changed = True
                
                steps.append({
                    "action": "relax",
                    "message": f"Cập nhật {v}: {old_val} ➝ {dist[v]}",
                    "dist": dist.copy(),
                    "highlight_edge": {"u": u, "v": v},
                    "updated_node": v
                })

        if not changed:
            steps.append({
                "action": "info",
                "message": "Không có giá trị nào thay đổi trong vòng này. Dừng thuật toán sớm.",
                "dist": dist.copy(),
                "highlight_edge": None
            })
            break

    cycle_edge = None
    for edge in edges:
        u, v, w = edge['u'], edge['v'], edge['w']
        if dist[u] != float('inf') and dist[u] + w < dist[v]:
            has_negative_cycle = True
            cycle_edge = {"u": u, "v": v}
            
            steps.append({
                "action": "cycle_detected",
                "message": f"⚠️ PHÁT HIỆN CHU TRÌNH ÂM tại cạnh {u}→{v}!",
                "dist": dist.copy(),
                "highlight_edge": cycle_edge
            })
            break
            
    if not has_negative_cycle:
        steps.append({
            "action": "complete",
            "message": "Hoàn tất! Đã tìm thấy đường đi ngắn nhất.",
            "dist": dist.copy(),
            "highlight_edge": None
        })

    return {
        "steps": steps,
        "final_dist": dist,
        "has_negative_cycle": has_negative_cycle
    }