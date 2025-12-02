import networkx as nx

class DFSAlgorithm:
    def __init__(self, graph, start_node=None, mode="directed"):
        # Clone đồ thị để không ảnh hưởng dữ liệu gốc
        self.G = graph.copy()
        self.start_node = start_node
        self.mode = mode # 'directed' hoặc 'undirected'

    def run(self):
        G = self.G
        nodes = list(G.nodes())
        
        # Kiểm tra start_node
        if self.start_node not in nodes:
            if not nodes:
                return {"error": "Đồ thị rỗng."}
            self.start_node = nodes[0] # Mặc định lấy đỉnh đầu nếu input sai

        # Chuyển đổi sang danh sách kề (Adjacency List)
        # Sắp xếp danh sách kề để thứ tự duyệt nhất quán (ưu tiên ABC...)
        adj = {}
        for n in G.nodes():
            neighbors = list(G.neighbors(n))
            neighbors.sort(reverse=True) # Sort ngược vì Stack là LIFO (Vào sau ra trước)
            adj[n] = neighbors

        # Khởi tạo
        stack = [self.start_node]
        visited = []     # Danh sách các đỉnh đã duyệt xong (theo thứ tự)
        visited_set = set()
        steps = []       # Lưu các bước để JS vẽ

        # Bước 0: Trạng thái ban đầu
        steps.append({
            "description": "Khởi tạo Stack",
            "current_node": None,
            "stack": list(stack),
            "visited": list(visited),
            "highlight_edges": []
        })

        while stack:
            # Lấy đỉnh từ đỉnh Stack (nhưng chưa pop ngay để animation hiển thị đang xét)
            curr = stack.pop()

            if curr in visited_set:
                # Nếu đã thăm rồi thì bỏ qua (hoặc ghi log là đã thăm)
                continue

            # Đánh dấu đã thăm
            visited_set.add(curr)
            visited.append(curr)

            # Lấy hàng xóm
            neighbors = adj.get(curr, [])
            
            # Đẩy hàng xóm vào stack
            # Lưu ý: neighbors đã được sort reverse ở trên
            added_neighbors = []
            for n in neighbors:
                if n not in visited_set:
                    stack.append(n)
                    added_neighbors.append(n)
            
            # Ghi lại bước này
            # Tìm cạnh nối từ cha đến curr (để tô màu đường đi)
            # Trong DFS thuần túy, việc xác định "cạnh vừa đi" hơi trừu tượng nếu không đệ quy,
            # nhưng ta có thể giả lập để vẽ đẹp hơn.
            
            steps.append({
                "description": f"Thăm {curr}, thêm {added_neighbors} vào Stack",
                "current_node": curr,
                "stack": list(stack), # Snapshot stack hiện tại
                "visited": list(visited),
                "neighbors": neighbors
            })

        return {
            "path": visited, # Kết quả cuối cùng: Thứ tự duyệt
            "steps": steps   # Dữ liệu cho Animation
        }