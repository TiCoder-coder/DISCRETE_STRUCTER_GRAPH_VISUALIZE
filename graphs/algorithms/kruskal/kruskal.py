from typing import List, Tuple

# Cạnh (edge)
Edge = Tuple[int, int, int]  # (u, v, weight)

def kruskal(n: int, edges: List[Edge]) -> Tuple[int, List[Edge]]:
    """
    Thuật toán Kruskal tìm cây khung nhỏ nhất (MST)
    Trả về: (tổng trọng số MST, danh sách các cạnh trong MST)
    Nếu đồ thị không liên thông → trả về -1
    """
    # Bước 1: Sắp xếp các cạnh theo trọng số tăng dần
    edges.sort(key=lambda e: e[2])
    
    # Bước 2: DSU (Disjoint Set Union)
    parent = list(range(n + 1))   # parent[i] = cha của i
    size = [1] * (n + 1)          # size[i] = kích thước tập hợp chứa i

    def find(x: int) -> int:
        if parent[x] != x:
            parent[x] = find(parent[x])   # path compression
        return parent[x]

    def union(x: int, y: int) -> bool:
        px, py = find(x), find(y)
        if px == py:
            return False                  # đã cùng tập hợp → tạo chu trình
        # union by size
        if size[px] < size[py]:
            px, py = py, px
        parent[py] = px
        size[px] += size[py]
        return True

    # Bước 3: Duyệt từng cạnh và thêm vào MST nếu không tạo chu trình
    mst_edges: List[Edge] = []
    total_weight = 0

    for u, v, w in edges:
        if len(mst_edges) == n - 1:      # đã đủ n-1 cạnh
            break
        if union(u, v):
            mst_edges.append((u, v, w))
            total_weight += w

    # Kiểm tra xem có tạo được cây khung không (đồ thị liên thông?)
    if len(mst_edges) != n - 1:
        return -1, []                     # không liên thông

    return total_weight, mst_edges


# ================== PHẦN NHẬP XUẤT (main) ==================
def main():
    # Nhập dữ liệu
    n, m = map(int, input().split())
    edges = []
    for _ in range(m):
        u, v, w = map(int, input().split())
        edges.append((u, v, w))

    # Chạy Kruskal
    total, mst = kruskal(n, edges)

    if total == -1:
        print("do thi khong lien thong")
    else:
        print(total)
        for u, v, w in mst:
            print(u, v, w)


if __name__ == "__main__":
    main()