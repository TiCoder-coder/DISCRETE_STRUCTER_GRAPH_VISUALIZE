from typing import List, Tuple
import sys

# Cạnh: (u, v, weight)
Edge = Tuple[int, int, int]

def prim(n: int, adj: List[List[Tuple[int, int]]], start: int = 1) -> Tuple[int, List[Edge]]:
    """
    Thuật toán Prim tìm MST bắt đầu từ đỉnh start
    Trả về: (tổng trọng số, danh sách cạnh trong MST)
    """
    used = [False] * (n + 1)        # used[i] = True nếu i đã vào MST
    used[start] = True
    
    mst_edges: List[Edge] = []
    total_weight = 0

    # Lặp n-1 lần để thêm n-1 cạnh
    while len(mst_edges) < n - 1:
        min_w = sys.maxsize
        x, y = -1, -1  # hai đầu cạnh nhỏ nhất hiện tại

        # Duyệt tất cả đỉnh đã trong MST
        for i in range(1, n + 1):
            if not used[i]:
                continue
            # Duyệt các đỉnh kề của i
            for j, w in adj[i]:
                if not used[j] and w < min_w:
                    min_w = w
                    x, y = j, i   # lưu lại: y (đã trong MST) → x (chưa)

        if min_w == sys.maxsize:
            # Không tìm được cạnh nào → đồ thị không liên thông
            return -1, []

        # Thêm cạnh (y → x) vào MST
        mst_edges.append((y, x, min_w))
        total_weight += min_w
        used[x] = True

    return total_weight, mst_edges


# ==================== PHẦN NHẬP XUẤT ====================
def main():
    n, m = map(int, input().split())
    
    # adj[i] = [(đỉnh kề, trọng số), ...]
    adj = [[] for _ in range(n + 1)]
    
    for _ in range(m):
        x, y, w = map(int, input().split())
        adj[x].append((y, w))
        adj[y].append((x, w))

    total, mst = prim(n, adj, start=1)

    if total == -1:
        print("do thi khong lien thong")
    else:
        print(total)
        for u, v, w in mst:
            print(u, v, w)


if __name__ == "__main__":
    main()